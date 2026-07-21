import Fluent
import Foundation
import Vapor

/// Everything here sits behind `AdminOnlyMiddleware`. This — plus the
/// one-time `admin-create` CLI command — is the *only* way a `User` row can
/// ever be created; there is no public registration route anywhere.
struct AdminController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("admin", "users", use: index)
        routes.get("admin", "users", "new", use: newPage)
        routes.post("admin", "users", use: create)
        routes.post("admin", "users", ":userID", "delete", use: delete)
    }

    struct AdminUserItem: Encodable {
        let id: UUID
        let username: String
        let isAdmin: Bool
        let createdAt: Date?
    }

    struct AdminUsersContext: Encodable {
        let base: BaseFields
        let users: [AdminUserItem]
        let errorMessage: String?
    }

    func index(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let users = try await User.query(on: req.db).sort(\.$username).all()
        let items = try users.map {
            AdminUserItem(id: try $0.requireID(), username: $0.username, isAdmin: $0.isAdmin, createdAt: $0.createdAt)
        }
        let context = AdminUsersContext(
            base: BaseFields.make(req: req, user: user),
            users: items,
            errorMessage: req.query[String.self, at: "error"]
        )
        return try await req.view.render("admin/users", context)
    }

    struct NewUserContext: Encodable {
        let base: BaseFields
        let errorMessage: String?
    }

    func newPage(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let context = NewUserContext(
            base: BaseFields.make(req: req, user: user),
            errorMessage: req.query[String.self, at: "error"]
        )
        return try await req.view.render("admin/newUser", context)
    }

    func create(req: Request) async throws -> Response {
        let form = try req.content.decode(NewUserForm.self)
        let username = form.username.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !username.isEmpty, form.password.count >= 8 else {
            return req.redirect(
                to: "/admin/users/new?error=Username+required+and+password+must+be+at+least+8+characters")
        }
        let existing = try await User.query(on: req.db).filter(\.$username == username).first()
        guard existing == nil else {
            return req.redirect(to: "/admin/users/new?error=Username+already+taken")
        }
        let hash = try Bcrypt.hash(form.password)
        let newUser = User(username: username, passwordHash: hash, isAdmin: form.isAdmin ?? false)
        try await newUser.save(on: req.db)
        return req.redirect(to: "/admin/users")
    }

    func delete(req: Request) async throws -> Response {
        let currentUser = try req.auth.require(User.self)
        guard let userID = req.parameters.get("userID", as: UUID.self) else {
            throw Abort(.badRequest)
        }
        guard userID != currentUser.id else {
            return req.redirect(to: "/admin/users?error=Cannot+delete+your+own+account")
        }
        guard let target = try await User.find(userID, on: req.db) else {
            throw Abort(.notFound)
        }
        try await target.delete(on: req.db)
        return req.redirect(to: "/admin/users")
    }
}
