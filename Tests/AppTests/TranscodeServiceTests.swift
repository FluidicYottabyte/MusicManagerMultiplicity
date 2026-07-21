import Foundation
import XCTest

@testable import App

final class TranscodeServiceTests: XCTestCase {
    private func ffmpegAvailable() -> Bool {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        process.arguments = ["which", "ffmpeg"]
        process.standardOutput = Pipe()
        process.standardError = Pipe()
        try? process.run()
        process.waitUntilExit()
        return process.terminationStatus == 0
    }

    func testTranscodeProducesPlayableFile() async throws {
        try XCTSkipUnless(ffmpegAvailable(), "ffmpeg not installed in this environment")

        // A tiny synthetic silent WAV, generated in-process so this test has
        // no external fixture dependency.
        let tmpDir = FileManager.default.temporaryDirectory
        let inputPath = tmpDir.appendingPathComponent(UUID().uuidString + ".wav").path
        let outputPath = tmpDir.appendingPathComponent(UUID().uuidString + ".m4a").path
        defer {
            try? FileManager.default.removeItem(atPath: inputPath)
            try? FileManager.default.removeItem(atPath: outputPath)
        }
        try writeSilentWav(to: inputPath)

        try await TranscodeService.transcodeToAAC(inputPath: inputPath, outputPath: outputPath)

        XCTAssertTrue(FileManager.default.fileExists(atPath: outputPath))
        let metadata = await MetadataExtractor.probe(inputPath: outputPath)
        XCTAssertTrue(metadata.hasAudioStream)
    }

    /// Writes a minimal valid 8kHz mono PCM WAV of `seconds` duration.
    private func writeSilentWav(to path: String, seconds: Int = 1) throws {
        let sampleRate: UInt32 = 8000
        let numSamples = Int(sampleRate) * seconds
        var data = Data()

        func appendLE(_ value: UInt32) { withUnsafeBytes(of: value.littleEndian) { data.append(contentsOf: $0) } }
        func appendLE16(_ value: UInt16) { withUnsafeBytes(of: value.littleEndian) { data.append(contentsOf: $0) } }

        let byteRate = sampleRate * 2
        let dataSize = UInt32(numSamples * 2)

        data.append(contentsOf: Array("RIFF".utf8))
        appendLE(36 + dataSize)
        data.append(contentsOf: Array("WAVE".utf8))
        data.append(contentsOf: Array("fmt ".utf8))
        appendLE(16)
        appendLE16(1)  // PCM
        appendLE16(1)  // mono
        appendLE(sampleRate)
        appendLE(byteRate)
        appendLE16(2)  // block align
        appendLE16(16)  // bits per sample
        data.append(contentsOf: Array("data".utf8))
        appendLE(dataSize)
        data.append(Data(repeating: 0, count: Int(dataSize)))

        try data.write(to: URL(fileURLWithPath: path))
    }
}
