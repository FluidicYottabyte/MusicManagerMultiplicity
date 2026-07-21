import Fluent
import Foundation
import Vapor

/// Per-user theme color overrides. Defaults (falls back to `Theme.default*`)
/// live on the `User` model as nullable fields.
struct SettingsController: RouteCollection {
    func boot(routes: RoutesBuilder) throws {
        routes.get("settings", use: settingsPage)
        routes.post("settings", use: updateSettings)
    }

    struct SettingsContext: Encodable {
        let base: BaseFields
        let message: String?
    }

    func settingsPage(req: Request) async throws -> View {
        let user = try req.auth.require(User.self)
        let context = SettingsContext(
            base: BaseFields.make(req: req, user: user),
            message: req.query[String.self, at: "message"]
        )
        return try await req.view.render("settings", context)
    }

    func updateSettings(req: Request) async throws -> Response {
        let user = try req.auth.require(User.self)
        let form = try req.content.decode(SettingsForm.self)

        if form.reset == true {
            user.themeBackground = nil
            user.themeAccent = nil
            user.themeForeground = nil
            user.themeAccentForeground = nil
        } else {
            user.themeBackground = validHex(form.themeBackground) ?? user.themeBackground
            user.themeAccent = validHex(form.themeAccent) ?? user.themeAccent
            user.themeForeground = validHex(form.themeForeground) ?? user.themeForeground
            user.themeAccentForeground = validHex(form.themeAccentForeground) ?? user.themeAccentForeground
        }
        try await user.save(on: req.db)
        return req.redirect(to: "/settings?message=Saved")
    }

    private func validHex(_ value: String?) -> String? {
        guard let value, value.range(of: "^#[0-9a-fA-F]{6}$", options: .regularExpression) != nil else {
            return nil
        }
        return value
    }
}
