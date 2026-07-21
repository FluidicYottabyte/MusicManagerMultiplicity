import Fluent

struct CreateSongs: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("songs")
            .id()
            .field("title", .string, .required)
            .field("album_id", .uuid, .references("albums", "id", onDelete: .setNull))
            .field("original_filename", .string, .required)
            .field("stored_filename", .string, .required)
            .field("duration_seconds", .double)
            .field("cover_image_path", .string)
            .field("file_size_bytes", .int64)
            .field("uploaded_by_id", .uuid, .required, .references("users", "id", onDelete: .cascade))
            .field("created_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("songs").delete()
    }
}
