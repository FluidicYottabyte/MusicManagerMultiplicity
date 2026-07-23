export interface SongArtistRef {
  id: string;
  name: string;
}

export interface SongAlbumRef {
  id: string;
  name: string;
}

export interface SongView {
  id: string;
  title: string;
  artists: SongArtistRef[];
  album: SongAlbumRef | null;
  coverUrl: string;
}
