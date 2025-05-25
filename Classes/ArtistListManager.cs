using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TagLib.Ape;

namespace MusicManagerMultiplicity.Classes
{
    public class ArtistListManager
    {
        public List<Artist> UserArtists = new List<Artist>();

        public void regenerateArtistList(SongLibrary songlist)
        {
            foreach (var item in songlist.AllSongs)
            {
                foreach (var artist in item.Artist)
                {
                    if (!UserArtists.Contains(artist))
                    {
                        UserArtists.Add(artist);
                    }
                }
                
            }
        }

        public List<string> getArtistListAsStrings()
        {
            List<String> returnList = new List<String>();

            foreach (var artist in UserArtists)
            {
                returnList.Add(artist.ToString());
            }

            return returnList;
        }

        public Artist locateArtistByName(string nameSearch)
        {
            foreach (var item in UserArtists)
            {
                if (item.ArtistName == nameSearch)
                {
                    return item;
                }
            }

            return null;
        }

        public Artist locateArtistByID(string guidIDString)
        {
            Guid IdSearch = Guid.Parse(guidIDString);

            foreach (var item in UserArtists)
            {
                if (item.ArtistID == IdSearch)
                {
                    return item;
                }
            }

            return null;
        }
    }
}
