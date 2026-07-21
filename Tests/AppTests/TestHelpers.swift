import XCTVapor

@testable import App

func withApp(_ test: (Application) async throws -> Void) async throws {
    let app = try await Application.make(.testing)
    do {
        try await configure(app)
        try await app.autoMigrate()
        try await test(app)
        try? await app.autoRevert()
        try await app.asyncShutdown()
    } catch {
        try? await app.autoRevert()
        try? await app.asyncShutdown()
        throw error
    }
}

func extractCSRFToken(from html: String) -> String? {
    guard let range = html.range(of: "name=\"csrf_token\" value=\"") else { return nil }
    let afterMarker = html[range.upperBound...]
    guard let endRange = afterMarker.range(of: "\"") else { return nil }
    return String(afterMarker[..<endRange.lowerBound])
}
