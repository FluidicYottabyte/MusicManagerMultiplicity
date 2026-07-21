/// Pure index arithmetic for the playlist Up/Down reorder buttons, kept
/// separate from `PlaylistController` so it's unit-testable without a
/// database or HTTP round-trip.
enum PlaylistOrdering {
    /// Given `count` entries (already sorted by position) and a 0-based
    /// `index` to move by `direction` (-1 = up, +1 = down), returns the pair
    /// of positions whose sort order should be swapped, or nil if the move
    /// would go out of bounds.
    static func swapIndices(count: Int, index: Int, direction: Int) -> (Int, Int)? {
        let swapIndex = index + direction
        guard (0..<count).contains(index), (0..<count).contains(swapIndex) else {
            return nil
        }
        return (index, swapIndex)
    }
}
