import Fluent
import Vapor

final class Artist: Model, Content, @unchecked Sendable {
    static let schema = "artists"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "name")
    var name: String

    @Siblings(through: SongArtist.self, from: \.$artist, to: \.$song)
    var songs: [Song]

    @Siblings(through: AlbumArtist.self, from: \.$artist, to: \.$album)
    var albums: [Album]

    init() {}

    init(id: UUID? = nil, name: String) {
        self.id = id
        self.name = name
    }
}
