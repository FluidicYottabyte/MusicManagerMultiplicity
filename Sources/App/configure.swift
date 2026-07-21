import Fluent
import FluentSQLiteDriver
import Leaf
import Vapor

public func configure(_ app: Application) async throws {
    app.http.server.configuration.hostname = Environment.get("SERVER_HOSTNAME") ?? "127.0.0.1"
    app.http.server.configuration.port = Environment.get("SERVER_PORT").flatMap(Int.init) ?? 8080

    try StoragePaths.ensureDirectoriesExist(app)

    // Static assets (css/js/images) — first, so they never touch sessions/auth.
    app.middleware.use(FileMiddleware(publicDirectory: app.directory.publicDirectory))

    if app.environment == .testing {
        app.databases.use(.sqlite(.memory), as: .sqlite)
    } else {
        app.databases.use(.sqlite(.file(StoragePaths.root(app) + "db.sqlite")), as: .sqlite)
    }

    app.migrations.add(CreateUsers())
    app.migrations.add(CreateArtists())
    app.migrations.add(CreateAlbums())
    app.migrations.add(CreateAlbumArtists())
    app.migrations.add(CreateSongs())
    app.migrations.add(CreateSongArtists())
    app.migrations.add(CreatePlaylists())
    app.migrations.add(CreatePlaylistSongs())

    app.views.use(.leaf)

    // Small trusted friend group: default in-memory session driver is an
    // accepted tradeoff (a process restart logs everyone out).
    app.sessions.use(.memory)
    app.sessions.configuration.cookieName = "musicmanager-session"
    app.sessions.configuration.cookieFactory = { sessionID in
        .init(
            string: sessionID.string,
            isSecure: app.environment == .production,
            isHTTPOnly: true,
            sameSite: .lax
        )
    }
    app.middleware.use(app.sessions.middleware)
    app.middleware.use(User.sessionAuthenticator())
    app.middleware.use(CSRFMiddleware())

    // Uploads can be much larger than Vapor's tiny default body-size limit.
    app.routes.defaultMaxBodySize = "200mb"

    app.commands.use(CreateAdminCommand(), as: "admin-create")

    try routes(app)
}
