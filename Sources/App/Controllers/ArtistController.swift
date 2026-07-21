import Fluent
import Vapor

struct ArtistController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("artists", use: index)
        routes.get("artists", ":artistID", use: show)
    }

    struct ArtistListItem: Encodable {
        let id: UUID
        let name: String
        let songCount: Int
    }

    struct ArtistListContext: Encodable {
        let base: BaseFields
        let artists: [ArtistListItem]
        let isEmpty: Bool
    }

    func index(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let artists = try await Artist.query(on: req.db).with(\.$songs).sort(\.$name).all()
        let items = try artists.map { artist in
            ArtistListItem(id: try artist.requireID(), name: artist.name, songCount: artist.songs.count)
        }
        let context = ArtistListContext(
            base: BaseFields.make(req: req, user: user), artists: items, isEmpty: items.isEmpty)
        return try await req.view.render("artists/list", context)
    }

    struct ArtistAlbumItem: Encodable {
        let id: UUID
        let name: String
    }

    struct ArtistDetailContext: Encodable {
        let base: BaseFields
        let artistName: String
        let songs: [LibraryController.SongView]
        let songsJSON: String
        let albums: [ArtistAlbumItem]
        let hasAlbums: Bool
    }

    func show(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        guard let artistID = req.parameters.get("artistID", as: UUID.self),
            let artist = try await Artist.query(on: req.db)
                .filter(\.$id == artistID)
                .with(\.$songs) { $0.with(\.$artists).with(\.$album) }
                .with(\.$albums)
                .first()
        else {
            throw Abort(.notFound)
        }

        let songViews = try artist.songs.sorted { $0.title < $1.title }.map { song -> LibraryController.SongView in
            let id = try song.requireID()
            return LibraryController.SongView(
                id: id,
                title: song.title,
                artistNames: song.artists.map(\.name).joined(separator: ", "),
                albumName: song.album?.name,
                coverURL: song.coverImagePath != nil ? "/covers/\(id.uuidString)" : "/images/default-cover.png"
            )
        }

        let albumItems = try artist.albums.sorted { $0.name < $1.name }.map { album in
            ArtistAlbumItem(id: try album.requireID(), name: album.name)
        }

        let songsJSONData = try JSONEncoder().encode(songViews)
        let songsJSON = String(data: songsJSONData, encoding: .utf8) ?? "[]"

        let context = ArtistDetailContext(
            base: BaseFields.make(req: req, user: user),
            artistName: artist.name,
            songs: songViews,
            songsJSON: songsJSON,
            albums: albumItems,
            hasAlbums: !albumItems.isEmpty
        )
        return try await req.view.render("artists/detail", context)
    }
}
