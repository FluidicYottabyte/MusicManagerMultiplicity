import Vapor

struct PlaylistForm: Content {
    var name: String
    var imageEnabled: Bool?
    var coverImage: File?
    var csrf_token: String
}

/// Submitted from the playlist detail page when adding/removing a song.
struct PlaylistSongForm: Content {
    var songID: UUID
    var csrf_token: String
}
