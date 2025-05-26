using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Security.Policy;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace MusicManagerMultiplicity.Classes
{
    public class Artist
    {
        public string ArtistName;

        private List<Album> Albums = new List<Album>();
        private List<Song> Singles = new List<Song>();

        public Guid ArtistID { get; private set; }

        public Artist(string name)
        {
            ArtistName = name;
            ArtistID = Guid.NewGuid();
        }

        public Artist() { }


        public override string ToString()
        {
            return ArtistName;
        }

    }

}
