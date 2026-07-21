import Fluent
import Foundation
import Vapor

/// `./App admin-create` — the only way to bootstrap the very first user.
/// Interactive and masked (never accepts a `--password` flag) so the
/// password never lands in shell history or `ps` output.
struct CreateAdminCommand: AsyncCommand {
    struct Signature: CommandSignature {}

    var help: String { "Creates the first admin user (interactive, masked password prompt)." }

    func run(using context: CommandContext, signature: Signature) async throws {
        let username = context.console.ask("Username:").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !username.isEmpty else {
            context.console.error("Username cannot be empty.")
            return
        }

        let existing = try await User.query(on: context.application.db)
            .filter(\.$username == username)
            .first()
        guard existing == nil else {
            context.console.error("A user named '\(username)' already exists.")
            return
        }

        let password = context.console.ask("Password:", isSecure: true)
        guard password.count >= 8 else {
            context.console.error("Password must be at least 8 characters.")
            return
        }
        let confirmPassword = context.console.ask("Confirm password:", isSecure: true)
        guard password == confirmPassword else {
            context.console.error("Passwords did not match.")
            return
        }

        let hash = try Bcrypt.hash(password)
        let user = User(username: username, passwordHash: hash, isAdmin: true)
        try await user.save(on: context.application.db)
        context.console.print("Admin user '\(username)' created.")
    }
}
