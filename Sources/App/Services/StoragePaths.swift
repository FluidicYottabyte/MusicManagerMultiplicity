import Vapor

/// Centralizes every on-disk storage path so no controller ever hand-builds one.
/// Filenames stored in the database are always server-generated UUIDs (see
/// `TranscodeService`), so the traversal guard here is defense-in-depth, not
/// the primary defense.
enum StoragePaths {
    static func root(_ app: Application) -> String {
        app.directory.workingDirectory + "storage/"
    }

    static func audioDirectory(_ app: Application) -> String {
        root(app) + "audio/"
    }

    static func coverDirectory(_ app: Application) -> String {
        root(app) + "covers/"
    }

    static func playlistCoverDirectory(_ app: Application) -> String {
        root(app) + "covers/playlists/"
    }

    static func tmpDirectory(_ app: Application) -> String {
        root(app) + "tmp/"
    }

    static func ensureDirectoriesExist(_ app: Application) throws {
        let fm = FileManager.default
        for dir in [audioDirectory(app), coverDirectory(app), playlistCoverDirectory(app), tmpDirectory(app)] {
            if !fm.fileExists(atPath: dir) {
                try fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
            }
        }
    }

    /// Resolves a server-generated filename against `directory` and asserts the
    /// result is still inside that directory (rejects any smuggled `..`/`/`).
    static func resolve(filename: String, in directory: String) throws -> String {
        guard !filename.contains(".."), !filename.contains("/"), !filename.contains("\\") else {
            throw Abort(.badRequest, reason: "Invalid filename.")
        }
        let full = directory + filename
        let standardizedDir = URL(fileURLWithPath: directory).standardizedFileURL.path
        let standardizedFull = URL(fileURLWithPath: full).standardizedFileURL.path
        guard standardizedFull.hasPrefix(standardizedDir) else {
            throw Abort(.badRequest, reason: "Invalid filename.")
        }
        return full
    }
}
