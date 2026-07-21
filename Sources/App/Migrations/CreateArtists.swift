import Fluent

struct CreateArtists: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("artists")
            .id()
            .field("name", .string, .required)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("artists").delete()
    }
}
