using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace MusicManagerMultiplicity.Classes
{
    internal class Playlist() //Playlist objects are ordered lists of songs.
    {
        public List<Song> Songs { get; set; }
        public string Name { get; set; }
        public string ImageFilepath { get; set; } //store as filepath to reduce space
        public bool ImageEnabled { get; set; }
        public int playlistID { get; set; } //Use playlist ID in case playlists have two of the same name. This should be passed to ListBox button as Name.

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
            Songs.Add(song);
        }

        public void RemoveSong(Song song)
        {
            Songs.Remove(song);
        }

        public void SetAllSongs(List<Song> songs)
        {
            Songs = songs;
        }

        public void SetImageEnabled(bool enabled) 
        {
            ImageEnabled = enabled;
        }
    }
}
