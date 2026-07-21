import Vapor

struct AdminOnlyMiddleware: AsyncMiddleware {
    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        guard let user = request.auth.get(User.self), user.isAdmin else {
            throw Abort(.forbidden, reason: "Admin access required.")
        }
        return try await next.respond(to: request)
    }
}
