using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace MusicManagerMultiplicity.Classes
{
    public class Album
    {
        public string AlbumName { get; set; }
        public List<Artist> AlbumArtists = new List<Artist>(); //In the future, consider implimenting a list of artists, in case there are more than one artists.

        public List<Song> AlbumSongs = new List<Song>();

        [JsonIgnore]
        private Image AlbumCover;

        public Album(string name)
        {
            AlbumName = name;
        }

        public Album() { }

    }
}
