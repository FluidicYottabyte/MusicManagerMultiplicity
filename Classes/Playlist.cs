using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace MusicManagerMultiplicity.Classes
{
    public class Playlist //Playlist objects are ordered lists of songs.
    {
        public List<Song> PlaylistSongs { get; set; }

        public List<Song> ShuffledSongs = new List<Song>();
        public string Name { get; set; }
        public string? ImageFilepath { get; set; } //store as filepath to reduce space
        public bool ImageEnabled { get; set; }
        public Guid playlistID { get; private set; } //Use playlist ID in case playlists have two of the same name. This should be passed to ListBox button as Name.

        public Playlist(List<Song> playlistSongs, string name, string? imageFilepath, bool imageEnabled)
        {
            PlaylistSongs = playlistSongs;
            Name = name;
            ImageFilepath = imageFilepath;
            ImageEnabled = imageEnabled;
            playlistID = Guid.NewGuid();
        }

        public void SetName(string name) 
        {
            Name = name;
        }

        public void SetImageFile(string imageFilepath)
        {
            ImageFilepath = imageFilepath;
        }

        public void AddSong(Song song)
        {
            PlaylistSongs.Add(song);
        }

        public void RemoveSong(Song song)
        {
            PlaylistSongs.Remove(song);
        }

        public void SetAllSongs(List<Song> songs)
        {
            PlaylistSongs = songs;
        }

        public void SetImageEnabled(bool enabled) 
        {
            ImageEnabled = enabled;
        }
    }
}
