using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MusicManagerMultiplicity.Classes
{
    public class PlaylistItem
    {
        public string ImageSource { get; set; }  // Image path
        public string PlaylistName { get; set; } // Display text
        public string PlayButtonName { get; set; } // Button name
        public int CoverWidth { get; set; }
        public Playlist Playlist { get; set; }

        public PlaylistItem(string imageSource, string playlistName, string playButtonName, Playlist playlist)
        {
            ImageSource = imageSource;
            PlaylistName = playlistName;
            PlayButtonName = playButtonName;
            
            Playlist = playlist;

            if (playlist.ImageEnabled)
            {
                CoverWidth = 50;
            } else
            {
                CoverWidth = 0;
            }
            
        }

        public PlaylistItem()
        {


        }
    }
}
