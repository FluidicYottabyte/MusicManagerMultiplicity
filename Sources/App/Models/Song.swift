import Fluent
import Vapor

final class Song: Model, Content, @unchecked Sendable {
    static let schema = "songs"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "title")
    var title: String

    @OptionalParent(key: "album_id")
    var album: Album?

    /// Display-only — never used to construct filesystem paths.
    @Field(key: "original_filename")
    var originalFilename: String

    /// Server-generated (`<uuid>.m4a`) — the only filename ever used on disk.
    @Field(key: "stored_filename")
    var storedFilename: String

    @OptionalField(key: "duration_seconds")
    var durationSeconds: Double?

    @OptionalField(key: "cover_image_path")
    var coverImagePath: String?

    @OptionalField(key: "file_size_bytes")
    var fileSizeBytes: Int64?

    @Parent(key: "uploaded_by_id")
    var uploadedBy: User

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    @Siblings(through: SongArtist.self, from: \.$song, to: \.$artist)
    var artists: [Artist]

    init() {}

    init(
        id: UUID? = nil,
        title: String,
        albumID: Album.IDValue? = nil,
        originalFilename: String,
        storedFilename: String,
        durationSeconds: Double? = nil,
        coverImagePath: String? = nil,
        fileSizeBytes: Int64? = nil,
        uploadedByID: User.IDValue
    ) {
        self.id = id
        self.title = title
        self.$album.id = albumID
        self.originalFilename = originalFilename
        self.storedFilename = storedFilename
        self.durationSeconds = durationSeconds
        self.coverImagePath = coverImagePath
        self.fileSizeBytes = fileSizeBytes
        self.$uploadedBy.id = uploadedByID
    }
}
