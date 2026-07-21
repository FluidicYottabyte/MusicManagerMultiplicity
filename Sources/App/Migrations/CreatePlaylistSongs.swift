import Fluent

struct CreatePlaylistSongs: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("playlist_songs")
            .id()
            .field("playlist_id", .uuid, .required, .references("playlists", "id", onDelete: .cascade))
            .field("song_id", .uuid, .required, .references("songs", "id", onDelete: .cascade))
            .field("sort_order", .int, .required)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("playlist_songs").delete()
    }
}
