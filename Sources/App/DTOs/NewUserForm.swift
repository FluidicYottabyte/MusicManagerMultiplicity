import Vapor

struct NewUserForm: Content {
    var username: String
    var password: String
    var isAdmin: Bool?
    var csrf_token: String
}
