import Fluent

struct CreateAlbumArtists: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("album_artists")
            .id()
            .field("album_id", .uuid, .required, .references("albums", "id", onDelete: .cascade))
            .field("artist_id", .uuid, .required, .references("artists", "id", onDelete: .cascade))
            .unique(on: "album_id", "artist_id")
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("album_artists").delete()
    }
}
