import Fluent
import Vapor

/// Find-or-create for Artist/Album by case-insensitive, trimmed name so
/// "Beatles" and " beatles " resolve to the same row as "Beatles".
enum ArtistAlbumResolver {
    static func resolveArtist(named rawName: String, on db: Database) async throws -> Artist {
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        if let existing = try await Artist.query(on: db).all()
            .first(where: { $0.name.caseInsensitiveCompare(name) == .orderedSame })
        {
            return existing
        }
        let artist = Artist(name: name)
        try await artist.save(on: db)
        return artist
    }

    /// Parses a comma-separated artist-name field from the upload/edit form,
    /// resolving (and creating as needed) each named artist.
    static func resolveArtists(fromCommaSeparated raw: String, on db: Database) async throws -> [Artist] {
        let names = raw.split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        var artists: [Artist] = []
        for name in names {
            artists.append(try await resolveArtist(named: name, on: db))
        }
        return artists
    }

    static func resolveAlbum(named rawName: String?, on db: Database) async throws -> Album? {
        guard let rawName, !rawName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            return nil
        }
        let name = rawName.trimmingCharacters(in: .whitespacesAndNewlines)
        if let existing = try await Album.query(on: db).all()
            .first(where: { $0.name.caseInsensitiveCompare(name) == .orderedSame })
        {
            return existing
        }
        let album = Album(name: name)
        try await album.save(on: db)
        return album
    }
}
