using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace MusicManagerMultiplicity.Classes
{
    internal class Album
    {
        private string AlbumName;
        private Artist AlbumArtist; //In the future, consider implimenting a list of artists, in case there are more than one artists.

        private List<Song> AlbumSongs = new List<Song>();

        private Image AlbumCover;
    }
}
