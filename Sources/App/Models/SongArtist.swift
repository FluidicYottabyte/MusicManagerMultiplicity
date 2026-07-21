import Fluent
import Vapor

/// Pivot enabling multi-artist songs.
final class SongArtist: Model, Content, @unchecked Sendable {
    static let schema = "song_artists"

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "song_id")
    var song: Song

    @Parent(key: "artist_id")
    var artist: Artist

    init() {}

    init(id: UUID? = nil, songID: Song.IDValue, artistID: Artist.IDValue) {
        self.id = id
        self.$song.id = songID
        self.$artist.id = artistID
    }
}
