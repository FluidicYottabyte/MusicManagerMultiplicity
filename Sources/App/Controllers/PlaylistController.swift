import Fluent
import Foundation
import Vapor

struct PlaylistController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("playlists", use: index)
        routes.get("playlists", "new", use: newPage)
        routes.on(.POST, "playlists", body: .collect(maxSize: "10mb"), use: create)
        routes.get("playlists", ":playlistID", use: show)

        let owner = routes.grouped(PlaylistOwnerOrAdminMiddleware())
        owner.get("playlists", ":playlistID", "edit", use: editPage)
        owner.on(.POST, "playlists", ":playlistID", body: .collect(maxSize: "10mb"), use: update)
        owner.post("playlists", ":playlistID", "delete", use: delete)
        owner.post("playlists", ":playlistID", "songs", use: addSong)
        owner.post("playlists", ":playlistID", "songs", ":songID", "remove", use: removeSong)
        owner.post("playlists", ":playlistID", "songs", ":songID", "move-up", use: moveUp)
        owner.post("playlists", ":playlistID", "songs", ":songID", "move-down", use: moveDown)
    }

    // MARK: - List

    struct PlaylistListItem: Encodable {
        let id: UUID
        let name: String
        let ownerUsername: String
        let coverURL: String
        let songCount: Int
        let canEdit: Bool
    }

    struct PlaylistListContext: Encodable {
        let base: BaseFields
        let playlists: [PlaylistListItem]
        let isEmpty: Bool
    }

    func index(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let playlists = try await Playlist.query(on: req.db).with(\.$owner).sort(\.$name).all()
        var items: [PlaylistListItem] = []
        for playlist in playlists {
            let id = try playlist.requireID()
            let songCount = try await PlaylistSong.query(on: req.db).filter(\.$playlist.$id == id).count()
            items.append(
                PlaylistListItem(
                    id: id,
                    name: playlist.name,
                    ownerUsername: playlist.owner.username,
                    coverURL: coverURL(for: playlist),
                    songCount: songCount,
                    canEdit: playlist.$owner.id == user.id || user.isAdmin
                )
            )
        }
        let context = PlaylistListContext(
            base: BaseFields.make(req: req, user: user), playlists: items, isEmpty: items.isEmpty)
        return try await req.view.render("playlists/list", context)
    }

    // MARK: - Detail (view, open to any authenticated user)

    struct PlaylistDetailContext: Encodable {
        let base: BaseFields
        let playlistID: UUID
        let name: String
        let ownerUsername: String
        let coverURL: String
        let canEdit: Bool
        let songs: [LibraryController.SongView]
        let isEmpty: Bool
        let songsJSON: String
    }

    func show(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let playlist = try await Playlist.query(on: req.db).filter(\.$id == playlistID).with(\.$owner).first()
        else {
            throw Abort(.notFound)
        }

        let songViews = try await loadSongViews(playlistID: playlistID, on: req.db)
        let songsJSONData = try JSONEncoder().encode(songViews)
        let songsJSON = String(data: songsJSONData, encoding: .utf8) ?? "[]"

        let context = PlaylistDetailContext(
            base: BaseFields.make(req: req, user: user),
            playlistID: playlistID,
            name: playlist.name,
            ownerUsername: playlist.owner.username,
            coverURL: coverURL(for: playlist),
            canEdit: playlist.$owner.id == user.id || user.isAdmin,
            songs: songViews,
            isEmpty: songViews.isEmpty,
            songsJSON: songsJSON
        )
        return try await req.view.render("playlists/detail", context)
    }

    // MARK: - Create / Edit form (shared template)

    struct PlaylistFormContext: Encodable {
        let base: BaseFields
        let isEdit: Bool
        let playlistID: UUID?
        let name: String
        let imageEnabled: Bool
        let errorMessage: String?
        let songs: [LibraryController.SongView]?
        let hasSongs: Bool
        let availableSongs: [LibraryController.SongView]?
        let hasAvailableSongs: Bool
    }

    func newPage(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let context = PlaylistFormContext(
            base: BaseFields.make(req: req, user: user),
            isEdit: false,
            playlistID: nil,
            name: "",
            imageEnabled: false,
            errorMessage: req.query[String.self, at: "error"],
            songs: nil,
            hasSongs: false,
            availableSongs: nil,
            hasAvailableSongs: false
        )
        return try await req.view.render("playlists/form", context)
    }

    func create(req: Request) async throws -> Response {
        let user = try req.auth.require(User.self)
        let form = try req.content.decode(PlaylistForm.self)
        let name = form.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else {
            return req.redirect(to: "/playlists/new?error=Name+is+required")
        }

        let playlist = Playlist(name: name, ownerID: try user.requireID(), imageEnabled: form.imageEnabled ?? false)
        try await playlist.save(on: req.db)

        if playlist.imageEnabled, let file = form.coverImage, file.data.readableBytes > 0 {
            try await saveCoverImage(file: file, playlist: playlist, req: req)
            try await playlist.save(on: req.db)
        }

        return req.redirect(to: "/playlists/\(try playlist.requireID().uuidString)")
    }

    func editPage(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let playlist = try await Playlist.find(playlistID, on: req.db)
        else {
            throw Abort(.notFound)
        }

        let songViews = try await loadSongViews(playlistID: playlistID, on: req.db)
        let includedIDs = Set(songViews.map(\.id))

        let allSongs = try await Song.query(on: req.db).with(\.$artists).with(\.$album).sort(\.$title).all()
        let availableSongs = try allSongs
            .filter { try !includedIDs.contains($0.requireID()) }
            .map { song -> LibraryController.SongView in
                let id = try song.requireID()
                return LibraryController.SongView(
                    id: id,
                    title: song.title,
                    artistNames: song.artists.map(\.name).joined(separator: ", "),
                    albumName: song.album?.name,
                    coverURL: song.coverImagePath != nil ? "/covers/\(id.uuidString)" : "/images/default-cover.png"
                )
            }

        let context = PlaylistFormContext(
            base: BaseFields.make(req: req, user: user),
            isEdit: true,
            playlistID: playlistID,
            name: playlist.name,
            imageEnabled: playlist.imageEnabled,
            errorMessage: req.query[String.self, at: "error"],
            songs: songViews,
            hasSongs: !songViews.isEmpty,
            availableSongs: availableSongs,
            hasAvailableSongs: !availableSongs.isEmpty
        )
        return try await req.view.render("playlists/form", context)
    }

    func update(req: Request) async throws -> Response {
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let playlist = try await Playlist.find(playlistID, on: req.db)
        else {
            throw Abort(.notFound)
        }
        let form = try req.content.decode(PlaylistForm.self)
        let name = form.name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else {
            return req.redirect(to: "/playlists/\(playlistID.uuidString)/edit?error=Name+is+required")
        }
        playlist.name = name
        playlist.imageEnabled = form.imageEnabled ?? false
        if playlist.imageEnabled, let file = form.coverImage, file.data.readableBytes > 0 {
            try await saveCoverImage(file: file, playlist: playlist, req: req)
        }
        try await playlist.save(on: req.db)
        return req.redirect(to: "/playlists/\(playlistID.uuidString)")
    }

    func delete(req: Request) async throws -> Response {
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let playlist = try await Playlist.find(playlistID, on: req.db)
        else {
            throw Abort(.notFound)
        }
        try await playlist.delete(on: req.db)
        return req.redirect(to: "/playlists")
    }

    // MARK: - Song membership

    func addSong(req: Request) async throws -> Response {
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        let form = try req.content.decode(PlaylistSongForm.self)
        let alreadyPresent =
            try await PlaylistSong.query(on: req.db)
            .filter(\.$playlist.$id == playlistID)
            .filter(\.$song.$id == form.songID)
            .first() != nil
        if !alreadyPresent {
            let existingCount = try await PlaylistSong.query(on: req.db).filter(\.$playlist.$id == playlistID).count()
            let entry = PlaylistSong(playlistID: playlistID, songID: form.songID, sortOrder: existingCount)
            try await entry.save(on: req.db)
        }
        return req.redirect(to: "/playlists/\(playlistID.uuidString)/edit")
    }

    func removeSong(req: Request) async throws -> Response {
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let songID = req.parameters.get("songID", as: UUID.self)
        else {
            throw Abort(.badRequest)
        }
        try await PlaylistSong.query(on: req.db)
            .filter(\.$playlist.$id == playlistID)
            .filter(\.$song.$id == songID)
            .delete()
        return req.redirect(to: "/playlists/\(playlistID.uuidString)/edit")
    }

    func moveUp(req: Request) async throws -> Response {
        try await move(req: req, direction: -1)
    }

    func moveDown(req: Request) async throws -> Response {
        try await move(req: req, direction: 1)
    }

    private func move(req: Request, direction: Int) async throws -> Response {
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let songID = req.parameters.get("songID", as: UUID.self)
        else {
            throw Abort(.badRequest)
        }
        let entries = try await PlaylistSong.query(on: req.db)
            .filter(\.$playlist.$id == playlistID)
            .sort(\.$sortOrder)
            .all()
        if let index = entries.firstIndex(where: { $0.$song.id == songID }),
            let (i, j) = PlaylistOrdering.swapIndices(count: entries.count, index: index, direction: direction)
        {
            let a = entries[i]
            let b = entries[j]
            let tmp = a.sortOrder
            a.sortOrder = b.sortOrder
            b.sortOrder = tmp
            try await a.save(on: req.db)
            try await b.save(on: req.db)
        }
        return req.redirect(to: "/playlists/\(playlistID.uuidString)/edit")
    }

    // MARK: - Helpers

    private func loadSongViews(playlistID: UUID, on db: Database) async throws -> [LibraryController.SongView] {
        let playlistSongs = try await PlaylistSong.query(on: db)
            .filter(\.$playlist.$id == playlistID)
            .sort(\.$sortOrder)
            .with(\.$song) { $0.with(\.$artists).with(\.$album) }
            .all()

        return try playlistSongs.map { entry -> LibraryController.SongView in
            let song = entry.song
            let id = try song.requireID()
            return LibraryController.SongView(
                id: id,
                title: song.title,
                artistNames: song.artists.map(\.name).joined(separator: ", "),
                albumName: song.album?.name,
                coverURL: song.coverImagePath != nil ? "/covers/\(id.uuidString)" : "/images/default-cover.png"
            )
        }
    }

    private func coverURL(for playlist: Playlist) -> String {
        guard playlist.imageEnabled, playlist.coverImagePath != nil, let id = playlist.id else {
            return "/images/default-cover.png"
        }
        return "/playlist-covers/\(id.uuidString)"
    }

    private func saveCoverImage(file: File, playlist: Playlist, req: Request) async throws {
        try StoragePaths.ensureDirectoriesExist(req.application)
        let ext = (file.filename as NSString).pathExtension.lowercased()
        let allowedImageExtensions: Set<String> = ["png", "jpg", "jpeg", "gif"]
        guard allowedImageExtensions.contains(ext) else {
            throw Abort(.badRequest, reason: "Unsupported image type.")
        }
        let filename = UUID().uuidString + "." + ext
        let path = StoragePaths.playlistCoverDirectory(req.application) + filename
        try await req.fileio.writeFile(file.data, at: path).get()
        playlist.coverImagePath = filename
    }
}
