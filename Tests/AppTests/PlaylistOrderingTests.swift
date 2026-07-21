import XCTest

@testable import App

final class PlaylistOrderingTests: XCTestCase {
    func testMoveUpSwapsWithPrevious() {
        let result = PlaylistOrdering.swapIndices(count: 3, index: 1, direction: -1)
        XCTAssertEqual(result?.0, 1)
        XCTAssertEqual(result?.1, 0)
    }

    func testMoveDownSwapsWithNext() {
        let result = PlaylistOrdering.swapIndices(count: 3, index: 1, direction: 1)
        XCTAssertEqual(result?.0, 1)
        XCTAssertEqual(result?.1, 2)
    }

    func testMoveUpAtTopIsNoOp() {
        XCTAssertNil(PlaylistOrdering.swapIndices(count: 3, index: 0, direction: -1))
    }

    func testMoveDownAtBottomIsNoOp() {
        XCTAssertNil(PlaylistOrdering.swapIndices(count: 3, index: 2, direction: 1))
    }

    func testSingleEntryPlaylistNeverMoves() {
        XCTAssertNil(PlaylistOrdering.swapIndices(count: 1, index: 0, direction: -1))
        XCTAssertNil(PlaylistOrdering.swapIndices(count: 1, index: 0, direction: 1))
    }
}
