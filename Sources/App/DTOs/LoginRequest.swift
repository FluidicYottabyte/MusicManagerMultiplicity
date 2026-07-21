import Vapor

struct LoginRequest: Content {
    var username: String
    var password: String
    var csrf_token: String
}
