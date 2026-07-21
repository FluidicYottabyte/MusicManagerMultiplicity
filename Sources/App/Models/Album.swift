import Fluent
import Vapor

final class Album: Model, Content, @unchecked Sendable {
    static let schema = "albums"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

    @OptionalField(key: "cover_image_path")
    var coverImagePath: String?

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    @Siblings(through: AlbumArtist.self, from: \.$album, to: \.$artist)
    var artists: [Artist]

    @Children(for: \.$album)
    var songs: [Song]

    init() {}

    init(id: UUID? = nil, name: String, coverImagePath: String? = nil) {
        self.id = id
        self.name = name
        self.coverImagePath = coverImagePath
    }
}
