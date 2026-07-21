/**
 * Pure index math for reordering a playlist by one step, extracted so it's
 * testable without touching the database. Returns the pair of indices whose
 * sortOrder should be swapped, or null if the move is out of bounds.
 */
export function swapIndices(count: number, index: number, direction: -1 | 1): [number, number] | null {
  if (index < 0 || index >= count) return null;
  const target = index + direction;
  if (target < 0 || target >= count) return null;
  return [index, target];
}
