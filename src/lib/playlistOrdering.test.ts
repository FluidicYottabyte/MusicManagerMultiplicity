import { describe, expect, it } from "vitest";

import { swapIndices } from "./playlistOrdering";

describe("swapIndices", () => {
  it("swaps with the previous index when moving up", () => {
    expect(swapIndices(5, 2, -1)).toEqual([2, 1]);
  });

  it("swaps with the next index when moving down", () => {
    expect(swapIndices(5, 2, 1)).toEqual([2, 3]);
  });

  it("returns null when moving the first item up", () => {
    expect(swapIndices(5, 0, -1)).toBeNull();
  });

  it("returns null when moving the last item down", () => {
    expect(swapIndices(5, 4, 1)).toBeNull();
  });

  it("returns null for an out-of-range index", () => {
    expect(swapIndices(5, 10, 1)).toBeNull();
    expect(swapIndices(5, -1, -1)).toBeNull();
  });

  it("returns null for a single-item list", () => {
    expect(swapIndices(1, 0, -1)).toBeNull();
    expect(swapIndices(1, 0, 1)).toBeNull();
  });
});
