import Fluent

struct CreatePlaylists: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("playlists")
            .id()
            .field("name", .string, .required)
            .field("owner_id", .uuid, .required, .references("users", "id", onDelete: .cascade))
            .field("image_enabled", .bool, .required, .sql(.default(false)))
            .field("cover_image_path", .string)
            .field("created_at", .datetime)
            .field("updated_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("playlists").delete()
    }
}
