"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { SongView } from "@/types/song";

interface PlayerContextValue {
  queue: SongView[];
  currentIndex: number;
  current: SongView | null;
  isPlaying: boolean;
  shuffleEnabled: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  playQueue: (songs: SongView[], startIndex: number, options?: { forceShuffle?: boolean }) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (fraction: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

/** Fisher-Yates shuffle that avoids putting the currently-playing song back in the first slot. */
function shuffleSongs(songs: SongView[], avoidFirstId: string | null): SongView[] {
  const arr = [...songs];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  if (avoidFirstId && arr.length > 1 && arr[0]?.id === avoidFirstId) {
    const swapWith = 1 + Math.floor(Math.random() * (arr.length - 1));
    [arr[0], arr[swapWith]] = [arr[swapWith]!, arr[0]!];
  }
  return arr;
}

/** For "super shuffle" playlists: play the clicked song first, then shuffle everything after it. */
function shuffleWithAnchor(songs: SongView[], anchorId: string): SongView[] {
  const anchor = songs.find((s) => s.id === anchorId);
  const rest = songs.filter((s) => s.id !== anchorId);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return anchor ? [anchor, ...rest] : rest;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [baseQueue, setBaseQueue] = useState<SongView[]>([]);
  const [queue, setQueue] = useState<SongView[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const current = currentIndex >= 0 ? (queue[currentIndex] ?? null) : null;

  useEffect(() => {
    const saved = window.localStorage.getItem("musicmanager-volume");
    if (saved !== null) {
      const parsed = Number.parseFloat(saved);
      if (Number.isFinite(parsed)) setVolumeState(parsed);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    window.localStorage.setItem("musicmanager-volume", String(volume));
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = `/api/stream/${current.id}`;
    audio.volume = volume;
    setCurrentTime(0);
    setDuration(0);
    if (isPlaying) {
      void audio.play();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const playQueue = useCallback(
    (songs: SongView[], startIndex: number, options?: { forceShuffle?: boolean }) => {
      setBaseQueue(songs);
      const startId = songs[startIndex]?.id ?? null;

      if (options?.forceShuffle && startId) {
        const activeQueue = shuffleWithAnchor(songs, startId);
        setQueue(activeQueue);
        setCurrentIndex(0);
        setIsPlaying(true);
        return;
      }

      const activeQueue = shuffleEnabled ? shuffleSongs(songs, startId) : songs;
      setQueue(activeQueue);
      const newIndex = shuffleEnabled ? activeQueue.findIndex((s) => s.id === startId) : startIndex;
      setCurrentIndex(newIndex);
      setIsPlaying(true);
    },
    [shuffleEnabled]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }, [current, isPlaying]);

  const advance = useCallback(
    (direction: 1 | -1) => {
      if (queue.length === 0) return;
      setCurrentIndex((i) => {
        const next = i + direction;
        if (next < 0) return queue.length - 1;
        if (next >= queue.length) return 0;
        return next;
      });
      setIsPlaying(true);
    },
    [queue.length]
  );

  const next = useCallback(() => advance(1), [advance]);
  const prev = useCallback(() => advance(-1), [advance]);

  const seekTo = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = fraction * audio.duration;
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.min(1, Math.max(0, v)));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((enabled) => {
      const nowEnabled = !enabled;
      const currentId = current?.id ?? null;
      if (baseQueue.length > 0) {
        const newQueue = nowEnabled ? shuffleSongs(baseQueue, currentId) : baseQueue;
        setQueue(newQueue);
        setCurrentIndex(currentId ? newQueue.findIndex((s) => s.id === currentId) : -1);
      }
      return nowEnabled;
    });
  }, [baseQueue, current]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      currentIndex,
      current,
      isPlaying,
      shuffleEnabled,
      volume,
      currentTime,
      duration,
      playQueue,
      togglePlay,
      next,
      prev,
      seekTo,
      setVolume,
      toggleShuffle,
    }),
    [queue, currentIndex, current, isPlaying, shuffleEnabled, volume, currentTime, duration, playQueue, togglePlay, next, prev, seekTo, setVolume, toggleShuffle]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={next}
        style={{ display: "none" }}
      />
    </PlayerContext.Provider>
  );
}
