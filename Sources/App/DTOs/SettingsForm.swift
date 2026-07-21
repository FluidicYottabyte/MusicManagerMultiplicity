import Vapor

struct SettingsForm: Content {
    var themeBackground: String?
    var themeAccent: String?
    var themeForeground: String?
    var themeAccentForeground: String?
    var reset: Bool?
    var csrf_token: String
}
