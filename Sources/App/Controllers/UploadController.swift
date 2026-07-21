import Fluent
import Foundation
import Vapor

struct UploadController: RouteCollection {
    static let allowedExtensions: Set<String> = ["mp3", "m4a", "aac", "flac", "wav", "ogg", "aiff", "aif"]

    func boot(routes: RoutesBuilder) throws {
        routes.get("upload", use: uploadPage)
        routes.on(.POST, "upload", body: .collect(maxSize: "200mb"), use: upload)
    }

    struct UploadContext: Encodable {
        let base: BaseFields
        let errorMessage: String?
    }

    func uploadPage(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let context = UploadContext(
            base: BaseFields.make(req: req, user: user),
            errorMessage: req.query[String.self, at: "error"]
        )
        return try await req.view.render("upload", context)
    }

    func upload(req: Request) async throws -> Response {
        let user = try req.auth.require(User.self)
        let form = try req.content.decode(UploadForm.self)

        let originalFilename = form.file.filename
        let ext = (originalFilename as NSString).pathExtension.lowercased()
        guard !ext.isEmpty, Self.allowedExtensions.contains(ext) else {
            return req.redirect(to: "/upload?error=Unsupported+file+type")
        }

        try StoragePaths.ensureDirectoriesExist(req.application)

        let tmpInputPath = StoragePaths.tmpDirectory(req.application) + UUID().uuidString + "." + ext
        try await req.fileio.writeFile(form.file.data, at: tmpInputPath).get()
        defer {
            try? FileManager.default.removeItem(atPath: tmpInputPath)
        }

        let metadata = await MetadataExtractor.probe(inputPath: tmpInputPath)
        guard metadata.hasAudioStream else {
            return req.redirect(to: "/upload?error=File+does+not+contain+a+valid+audio+stream")
        }

        let songID = UUID()
        let storedFilename = songID.uuidString + ".m4a"
        let outputPath = StoragePaths.audioDirectory(req.application) + storedFilename

        do {
            try await TranscodeService.transcodeToAAC(inputPath: tmpInputPath, outputPath: outputPath)
        } catch {
            req.logger.error("Transcode failed: \(error)")
            return req.redirect(to: "/upload?error=Transcoding+failed")
        }

        var coverImagePath: String?
        let coverFilename = songID.uuidString + ".jpg"
        let coverOutputPath = StoragePaths.coverDirectory(req.application) + coverFilename
        if await TranscodeService.extractCoverArt(inputPath: tmpInputPath, outputPath: coverOutputPath) {
            coverImagePath = coverFilename
        }

        let title = nonEmpty(form.title) ?? metadata.title ?? (originalFilename as NSString).deletingPathExtension
        let artistNamesRaw = nonEmpty(form.artistNames) ?? metadata.artist
        let albumNameRaw = nonEmpty(form.albumName) ?? metadata.album

        let album = try await ArtistAlbumResolver.resolveAlbum(named: albumNameRaw, on: req.db)
        var artists: [Artist] = []
        if let artistNamesRaw {
            artists = try await ArtistAlbumResolver.resolveArtists(fromCommaSeparated: artistNamesRaw, on: req.db)
        }

        var fileSize: Int64?
        if let attrs = try? FileManager.default.attributesOfItem(atPath: outputPath),
            let size = attrs[.size] as? Int64
        {
            fileSize = size
        }

        let song = Song(
            id: songID,
            title: title,
            albumID: album?.id,
            originalFilename: originalFilename,
            storedFilename: storedFilename,
            durationSeconds: metadata.durationSeconds,
            coverImagePath: coverImagePath,
            fileSizeBytes: fileSize,
            uploadedByID: try user.requireID()
        )
        try await song.save(on: req.db)
        for artist in artists {
            try await song.$artists.attach(artist, on: req.db)
            if let album {
                try await attachIfMissing(artist: artist, album: album, on: req.db)
            }
        }

        return req.redirect(to: "/library")
    }

    /// `attach` on a siblings relation errors on a duplicate pivot row, which
    /// would happen the second time a song by the same artist is added to the
    /// same album — check first instead of catching the constraint error.
    private func attachIfMissing(artist: Artist, album: Album, on db: Database) async throws {
        let artistID = try artist.requireID()
        let albumID = try album.requireID()
        let alreadyLinked =
            try await AlbumArtist.query(on: db)
            .filter(\.$album.$id == albumID)
            .filter(\.$artist.$id == artistID)
            .first() != nil
        guard !alreadyLinked else { return }
        try await album.$artists.attach(artist, on: db)
    }

    private func nonEmpty(_ value: String?) -> String? {
        guard let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines), !trimmed.isEmpty else {
            return nil
        }
        return trimmed
    }
}
