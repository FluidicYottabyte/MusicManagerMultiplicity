import Fluent

struct CreateAlbums: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("albums")
            .id()
            .field("name", .string, .required)
            .field("cover_image_path", .string)
            .field("created_at", .datetime)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("albums").delete()
    }
}
