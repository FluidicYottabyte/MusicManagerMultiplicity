"use client";

import { usePlayer } from "@/components/PlayerProvider";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const { current, isPlaying, shuffleEnabled, volume, currentTime, duration, togglePlay, next, prev, seekTo, setVolume, toggleShuffle } =
    usePlayer();

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div id="player-bar" className="win-raised">
      <img
        id="now-playing-cover"
        src={current?.coverUrl ?? "/images/default-cover.png"}
        alt=""
      />
      <div className="now-playing-text">
        {current ? `${current.title} — ${current.artists.map((a) => a.name).join(", ")}` : "Nothing playing"}
      </div>
      <div className="transport">
        <button type="button" className="win-button small" onClick={prev} disabled={!current} aria-label="Previous">
          |&lt;
        </button>
        <button type="button" className="win-button small" onClick={togglePlay} disabled={!current} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? "II" : ">"}
        </button>
        <button type="button" className="win-button small" onClick={next} disabled={!current} aria-label="Next">
          &gt;|
        </button>
        <button
          type="button"
          className={`win-button small${shuffleEnabled ? " special" : ""}`}
          onClick={toggleShuffle}
          aria-label="Shuffle"
          title="Shuffle"
        >
          ⇄
        </button>
      </div>
      <span>{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={1000}
        value={Math.round(progress * 1000)}
        onChange={(e) => seekTo(Number(e.target.value) / 1000)}
        disabled={!current}
      />
      <span>{formatTime(duration)}</span>
      <div className="volume-group">
        <span>Vol</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
        />
      </div>
    </div>
  );
}
