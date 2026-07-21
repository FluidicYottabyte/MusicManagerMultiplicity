import Fluent
import Vapor

/// Pivot enabling multi-artist albums (e.g. compilations).
final class AlbumArtist: Model, Content, @unchecked Sendable {
    static let schema = "album_artists"

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "album_id")
    var album: Album

    @Parent(key: "artist_id")
    var artist: Artist

    init() {}

    init(id: UUID? = nil, albumID: Album.IDValue, artistID: Artist.IDValue) {
        self.id = id
        self.$album.id = albumID
        self.$artist.id = artistID
    }
}
