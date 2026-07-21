import Fluent
import Vapor

/// Pivot with an explicit sort order — Fluent siblings alone don't preserve insertion order.
final class PlaylistSong: Model, Content, @unchecked Sendable {
    static let schema = "playlist_songs"

    @ID(key: .id)
    var id: UUID?

    @Parent(key: "playlist_id")
    var playlist: Playlist

    @Parent(key: "song_id")
    var song: Song

    @Field(key: "sort_order")
    var sortOrder: Int

    init() {}

    init(id: UUID? = nil, playlistID: Playlist.IDValue, songID: Song.IDValue, sortOrder: Int) {
        self.id = id
        self.$playlist.id = playlistID
        self.$song.id = songID
        self.sortOrder = sortOrder
    }
}
