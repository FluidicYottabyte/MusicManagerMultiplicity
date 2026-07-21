import Fluent
import Vapor

struct LibraryController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("library", use: index)
    }

    struct SongView: Encodable {
        let id: UUID
        let title: String
        let artistNames: String
        let albumName: String?
        let coverURL: String
    }

    struct LibraryContext: Encodable {
        let base: BaseFields
        let songs: [SongView]
        let isEmpty: Bool
        let query: String
        let songsJSON: String
    }

    func index(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let query = (req.query[String.self, at: "q"] ?? "").trimmingCharacters(in: .whitespacesAndNewlines)

        let allSongs = try await Song.query(on: req.db)
            .with(\.$artists)
            .with(\.$album)
            .sort(\.$title)
            .all()

        let filtered: [Song]
        if query.isEmpty {
            filtered = allSongs
        } else {
            let needle = query.lowercased()
            filtered = allSongs.filter { song in
                song.title.lowercased().contains(needle)
                    || song.album?.name.lowercased().contains(needle) == true
                    || song.artists.contains { $0.name.lowercased().contains(needle) }
            }
        }

        let songViews = try filtered.map { song -> SongView in
            let id = try song.requireID()
            return SongView(
                id: id,
                title: song.title,
                artistNames: song.artists.map(\.name).joined(separator: ", "),
                albumName: song.album?.name,
                coverURL: song.coverImagePath != nil ? "/covers/\(id.uuidString)" : "/images/default-cover.png"
            )
        }

        let songsJSONData = try JSONEncoder().encode(songViews)
        let songsJSON = String(data: songsJSONData, encoding: .utf8) ?? "[]"

        let context = LibraryContext(
            base: BaseFields.make(req: req, user: user),
            songs: songViews,
            isEmpty: songViews.isEmpty,
            query: query,
            songsJSON: songsJSON
        )
        return try await req.view.render("library", context)
    }
}
