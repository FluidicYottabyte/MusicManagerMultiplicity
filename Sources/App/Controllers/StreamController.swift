import Fluent
import Foundation
import Vapor

/// Range-aware streaming for audio + cover images. `req.fileio.streamFile`
/// natively honors the request's `Range` header, which is what lets the
/// browser's `<audio>` element seek without downloading the whole file.
struct StreamController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("stream", ":songID", use: stream)
        routes.get("covers", ":songID", use: cover)
        routes.get("playlist-covers", ":playlistID", use: playlistCover)
    }

    func stream(req: Request) async throws -> Response {
        _ = try req.auth.require(User.self)
        guard let songID = req.parameters.get("songID", as: UUID.self),
            let song = try await Song.find(songID, on: req.db)
        else {
            throw Abort(.notFound)
        }
        let path = try StoragePaths.resolve(
            filename: song.storedFilename,
            in: StoragePaths.audioDirectory(req.application)
        )
        guard FileManager.default.fileExists(atPath: path) else {
            throw Abort(.notFound)
        }
        return req.fileio.streamFile(at: path, mediaType: HTTPMediaType(type: "audio", subType: "mp4"))
    }

    func cover(req: Request) async throws -> Response {
        _ = try req.auth.require(User.self)
        guard let songID = req.parameters.get("songID", as: UUID.self),
            let song = try await Song.find(songID, on: req.db),
            let coverImagePath = song.coverImagePath
        else {
            return req.redirect(to: "/images/default-cover.png")
        }
        let path = try StoragePaths.resolve(filename: coverImagePath, in: StoragePaths.coverDirectory(req.application))
        guard FileManager.default.fileExists(atPath: path) else {
            return req.redirect(to: "/images/default-cover.png")
        }
        return req.fileio.streamFile(at: path)
    }

    func playlistCover(req: Request) async throws -> Response {
        _ = try req.auth.require(User.self)
        guard let playlistID = req.parameters.get("playlistID", as: UUID.self),
            let playlist = try await Playlist.find(playlistID, on: req.db),
            playlist.imageEnabled,
            let coverImagePath = playlist.coverImagePath
        else {
            return req.redirect(to: "/images/default-cover.png")
        }
        let path = try StoragePaths.resolve(
            filename: coverImagePath,
            in: StoragePaths.playlistCoverDirectory(req.application)
        )
        guard FileManager.default.fileExists(atPath: path) else {
            return req.redirect(to: "/images/default-cover.png")
        }
        return req.fileio.streamFile(at: path)
    }
}
