/// Default palette, taken directly from the original WPF app's `App.xaml`
/// resource dictionary (`MainBackground`, `AccentBackground`,
/// `MainForeground`, `AccentForeground`, `AccentTertiary`).
enum Theme {
    static let defaultBackground = "#ffeca7"
    static let defaultAccent = "#e49364"
    static let defaultForeground = "#db434c"
    static let defaultAccentForeground = "#c70039"

    struct Palette: Encodable {
        let background: String
        let accent: String
        let foreground: String
        let accentForeground: String
    }

    static func palette(for user: User?) -> Palette {
        Palette(
            background: user?.themeBackground ?? defaultBackground,
            accent: user?.themeAccent ?? defaultAccent,
            foreground: user?.themeForeground ?? defaultForeground,
            accentForeground: user?.themeAccentForeground ?? defaultAccentForeground
        )
    }
}
