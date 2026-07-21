import Fluent
import Vapor

/// Guards playlist edit/update/delete routes: only the playlist's creator or
/// an admin may pass. Viewing a playlist is unrestricted among authenticated
/// users (playlists are shared/visible to everyone).
struct PlaylistOwnerOrAdminMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        guard let user = request.auth.get(User.self) else {
            throw Abort(.unauthorized)
        }
        guard let playlistID = request.parameters.get("playlistID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        guard let playlist = try await Playlist.find(playlistID, on: request.db) else {
            throw Abort(.notFound)
        }
        guard playlist.$owner.id == user.id || user.isAdmin else {
            throw Abort(.forbidden, reason: "Only the playlist's creator or an admin can modify it.")
        }
        return try await next.respond(to: request)
    }
}
