import Vapor

/// Fields every authenticated page's Leaf context embeds for the shared
/// chrome in `base.leaf` (nav, theme palette, CSRF-protected forms).
struct BaseFields: Encodable {
    let palette: Theme.Palette
    let csrfToken: String
    let currentUser: UserPublic?

    static func make(req: Request, user: User?) -> BaseFields {
        BaseFields(
            palette: Theme.palette(for: user),
            csrfToken: CSRF.token(for: req),
            currentUser: user.map(UserPublic.init)
        )
    }
}
