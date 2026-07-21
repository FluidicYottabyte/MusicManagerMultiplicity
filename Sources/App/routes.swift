import Vapor

func routes(_ app: Application) throws {
    // Plain redirect — the real gate is /library's own auth requirement.
    app.get { req -> Response in
        req.redirect(to: "/library")
    }

    // Login/logout are intentionally NOT behind redirectMiddleware.
    // There is deliberately no /register or /signup route anywhere in this
    // file — accounts can only be created via `./App admin-create` (the
    // first admin) or POST /admin/users (every admin-gated user after that).
    try app.register(collection: AuthController())

    let protectedRoutes = app.grouped(User.redirectMiddleware(path: "/login"))
    try protectedRoutes.register(collection: LibraryController())
    try protectedRoutes.register(collection: UploadController())
    try protectedRoutes.register(collection: SettingsController())
    try protectedRoutes.register(collection: StreamController())
    try protectedRoutes.register(collection: ArtistController())
    try protectedRoutes.register(collection: AlbumController())
    try protectedRoutes.register(collection: PlaylistController())

    let adminRoutes = protectedRoutes.grouped(AdminOnlyMiddleware())
    try adminRoutes.register(collection: AdminController())
}
