import Fluent
import Vapor

final class Playlist: Model, Content, @unchecked Sendable {
    static let schema = "playlists"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

    @Parent(key: "owner_id")
    var owner: User

    @Field(key: "image_enabled")
    var imageEnabled: Bool

    @OptionalField(key: "cover_image_path")
    var coverImagePath: String?

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    @Timestamp(key: "updated_at", on: .update)
    var updatedAt: Date?

    init() {}

    init(
        id: UUID? = nil,
        name: String,
        ownerID: User.IDValue,
        imageEnabled: Bool = false,
        coverImagePath: String? = nil
    ) {
        self.id = id
        self.name = name
        self.$owner.id = ownerID
        self.imageEnabled = imageEnabled
        self.coverImagePath = coverImagePath
    }
}
