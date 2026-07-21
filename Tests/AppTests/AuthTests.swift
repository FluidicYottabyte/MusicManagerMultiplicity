import XCTVapor

@testable import App

final class AuthTests: XCTestCase {
    func testLibraryRedirectsWhenUnauthenticated() async throws {
        try await withApp { app in
            try await app.test(.GET, "library") { res in
                XCTAssertEqual(res.status, .seeOther)
                XCTAssertEqual(res.headers.first(name: .location), "/login")
            }
        }
    }

    func testLoginRejectsRequestsWithoutValidCSRFToken() async throws {
        try await withApp { app in
            try await app.test(
                .POST, "login",
                beforeRequest: { req in
                    try req.content.encode(
                        ["username": "nobody", "password": "whatever", "csrf_token": "bogus"], as: .urlEncoded)
                }
            ) { res in
                XCTAssertEqual(res.status, .forbidden)
            }
        }
    }

    func testLoginSucceedsWithCorrectCredentials() async throws {
        try await withApp { app in
            let password = "correcthorsebatterystaple"
            let hash = try Bcrypt.hash(password)
            let user = User(username: "friend", passwordHash: hash, isAdmin: false)
            try await user.save(on: app.db)

            var sessionCookieValue: String?
            var csrfToken: String?
            try await app.test(.GET, "login") { res in
                XCTAssertEqual(res.status, .ok)
                sessionCookieValue = res.headers.setCookie?["musicmanager-session"]?.string
                csrfToken = extractCSRFToken(from: res.body.string)
            }
            guard let sessionCookieValue, let csrfToken else {
                return XCTFail("Could not obtain session/CSRF token from /login")
            }

            try await app.test(
                .POST, "login",
                beforeRequest: { req in
                    req.headers.cookie = ["musicmanager-session": .init(string: sessionCookieValue)]
                    try req.content.encode(
                        ["username": "friend", "password": password, "csrf_token": csrfToken], as: .urlEncoded)
                }
            ) { res in
                XCTAssertEqual(res.status, .seeOther)
                XCTAssertEqual(res.headers.first(name: .location), "/library")
            }
        }
    }

    func testNoRegistrationRouteExists() async throws {
        try await withApp { app in
            try await app.test(.GET, "register") { res in
                XCTAssertEqual(res.status, .notFound)
            }
            try await app.test(.GET, "signup") { res in
                XCTAssertEqual(res.status, .notFound)
            }
        }
    }
}
