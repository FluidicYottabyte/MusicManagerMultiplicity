import Fluent
import Vapor

struct AuthController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("login", use: loginPage)
        routes.post("login", use: login)
        routes.post("logout", use: logout)
    }

    struct LoginContext: Encodable {
        let base: BaseFields
        let errorMessage: String?
    }

    func loginPage(req: Request) async throws -> Response {
        // Already logged in? Skip straight to the library.
        if req.auth.has(User.self) {
            return req.redirect(to: "/library")
        }
        let context = LoginContext(
            base: BaseFields.make(req: req, user: nil),
            errorMessage: req.query[String.self, at: "error"]
        )
        let view = try await req.view.render("login", context)
        return try await view.encodeResponse(for: req)
    }

    func login(req: Request) async throws -> Response {
        let form = try req.content.decode(LoginRequest.self)
        guard
            let user = try await User.query(on: req.db)
                .filter(\.$username == form.username)
                .first(),
            (try? user.verify(password: form.password)) == true
        else {
            return req.redirect(to: "/login?error=Invalid+username+or+password")
        }
        req.auth.login(user)
        return req.redirect(to: "/library")
    }

    func logout(req: Request) async throws -> Response {
        req.auth.logout(User.self)
        req.session.destroy()
        return req.redirect(to: "/login")
    }
}
