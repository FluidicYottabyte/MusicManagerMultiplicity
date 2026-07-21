import Fluent
import Vapor

final class User: Model, Content, @unchecked Sendable {
    static let schema = "users"

    @ID(key: .id)
    var id: UUID?

    @Field(key: "username")
    var username: String

    @Field(key: "password_hash")
    var passwordHash: String

    @Field(key: "is_admin")
    var isAdmin: Bool

    @Timestamp(key: "created_at", on: .create)
    var createdAt: Date?

    @OptionalField(key: "theme_background")
    var themeBackground: String?

    @OptionalField(key: "theme_accent")
    var themeAccent: String?

    @OptionalField(key: "theme_foreground")
    var themeForeground: String?

    @OptionalField(key: "theme_accent_foreground")
    var themeAccentForeground: String?

    init() {}

    init(id: UUID? = nil, username: String, passwordHash: String, isAdmin: Bool = false) {
        self.id = id
        self.username = username
        self.passwordHash = passwordHash
        self.isAdmin = isAdmin
    }
}

extension User: ModelAuthenticatable {
    static let usernameKey = \User.$username
    static let passwordHashKey = \User.$passwordHash

    func verify(password: String) throws -> Bool {
        try Bcrypt.verify(password, created: self.passwordHash)
    }
}

extension User: ModelSessionAuthenticatable {}

/// Public-facing representation that never leaks `passwordHash`.
struct UserPublic: Content {
    let id: UUID
    let username: String
    let isAdmin: Bool
    let createdAt: Date?

    init(_ user: User) {
        self.id = user.id!
        self.username = user.username
        self.isAdmin = user.isAdmin
        self.createdAt = user.createdAt
    }
}
