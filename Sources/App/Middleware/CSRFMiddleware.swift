import Foundation
import Vapor

/// Session-token CSRF protection for Leaf-rendered forms. GET handlers call
/// `CSRF.token(for:)` and pass it into the view context as a hidden field;
/// this middleware verifies it on every state-changing request.
enum CSRF {
    private static let sessionKey = "csrf_token"

    static func token(for req: Request) -> String {
        if let existing = req.session.data[sessionKey] {
            return existing
        }
        var bytes = [UInt8](repeating: 0, count: 32)
        for i in bytes.indices {
            bytes[i] = UInt8.random(in: 0...255)
        }
        let token = Data(bytes).base64EncodedString()
        req.session.data[sessionKey] = token
        return token
    }

    static func verify(_ req: Request) throws {
        guard let sessionToken = req.session.data[sessionKey] else {
            throw Abort(.forbidden, reason: "Missing CSRF session token.")
        }
        guard let submitted = try? req.content.get(String.self, at: "csrf_token"),
            constantTimeEquals(submitted, sessionToken)
        else {
            throw Abort(.forbidden, reason: "Invalid CSRF token.")
        }
    }

    private static func constantTimeEquals(_ a: String, _ b: String) -> Bool {
        guard a.utf8.count == b.utf8.count else { return false }
        var result: UInt8 = 0
        for (x, y) in zip(a.utf8, b.utf8) {
            result |= x ^ y
        }
        return result == 0
    }
}

struct CSRFMiddleware: AsyncMiddleware {
    private static let unsafeMethods: Set<HTTPMethod> = [.POST, .PUT, .PATCH, .DELETE]

    func respond(to request: Request, chainingTo next: AsyncResponder) async throws -> Response {
        if Self.unsafeMethods.contains(request.method) {
            try CSRF.verify(request)
        }
        return try await next.respond(to: request)
    }
}
