import Fluent

struct CreateSongArtists: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("song_artists")
            .id()
            .field("song_id", .uuid, .required, .references("songs", "id", onDelete: .cascade))
            .field("artist_id", .uuid, .required, .references("artists", "id", onDelete: .cascade))
            .unique(on: "song_id", "artist_id")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("song_artists").delete()
    }
}
