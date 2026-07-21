import Vapor

struct UploadForm: Content {
    var file: File
    /// Optional overrides — if blank, values probed via ffprobe are used.
    var title: String?
    var artistNames: String?
    var albumName: String?
    var csrf_token: String
}
