using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MusicManagerMultiplicity.Classes
{
    internal class Artist
    {
        private string ArtistName;

        private List<Album> Albums = new List<Album>();
        private List<Song> Singles = new List<Song>();

    }
}
