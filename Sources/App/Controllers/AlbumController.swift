import Fluent
import Vapor

struct AlbumController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("albums", use: index)
        routes.get("albums", ":albumID", use: show)
    }

    struct AlbumListItem: Encodable {
        let id: UUID
        let name: String
        let coverURL: String
    }

    struct AlbumListContext: Encodable {
        let base: BaseFields
        let albums: [AlbumListItem]
        let isEmpty: Bool
    }

    func index(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let albums = try await Album.query(on: req.db).with(\.$songs).sort(\.$name).all()
        let items = try albums.map { album in
            AlbumListItem(id: try album.requireID(), name: album.name, coverURL: Self.coverURL(for: album))
        }
        let context = AlbumListContext(
            base: BaseFields.make(req: req, user: user), albums: items, isEmpty: items.isEmpty)
        return try await req.view.render("albums/list", context)
    }

    struct AlbumDetailContext: Encodable {
        let base: BaseFields
        let albumName: String
        let artistNames: String
        let songs: [LibraryController.SongView]
        let songsJSON: String
    }

    func show(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        guard let albumID = req.parameters.get("albumID", as: UUID.self),
            let album = try await Album.query(on: req.db)
                .filter(\.$id == albumID)
                .with(\.$artists)
                .with(\.$songs) { $0.with(\.$artists) }
                .first()
        else {
            throw Abort(.notFound)
        }

        let songViews = try album.songs.sorted { $0.title < $1.title }.map { song -> LibraryController.SongView in
            let id = try song.requireID()
            return LibraryController.SongView(
                id: id,
                title: song.title,
                artistNames: song.artists.map(\.name).joined(separator: ", "),
                albumName: album.name,
                coverURL: song.coverImagePath != nil ? "/covers/\(id.uuidString)" : "/images/default-cover.png"
            )
        }

        let songsJSONData = try JSONEncoder().encode(songViews)
        let songsJSON = String(data: songsJSONData, encoding: .utf8) ?? "[]"

        let context = AlbumDetailContext(
            base: BaseFields.make(req: req, user: user),
            albumName: album.name,
            artistNames: album.artists.map(\.name).joined(separator: ", "),
            songs: songViews,
            songsJSON: songsJSON
        )
        return try await req.view.render("albums/detail", context)
    }

    /// Albums have no cover image of their own — shown as the first track's
    /// cover (if any), falling back to the default placeholder.
    static func coverURL(for album: Album) -> String {
        if let first = album.songs.first, first.coverImagePath != nil, let id = try? first.requireID() {
            return "/covers/\(id.uuidString)"
        }
        return "/images/default-cover.png"
    }
}
