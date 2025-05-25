using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MusicManagerMultiplicity.Classes
{
    public class AlbumListManager
    {
        public List<Album> UserAlbums = new List<Album>();

        public void regenerateAlbumList(SongLibrary songlist)
        {
            for (int i = 0; i < songlist.AllSongs.Count; i++)
            {
                if (!UserAlbums.Contains(songlist.AllSongs[i].Album))
                {
                    UserAlbums.Add(songlist.AllSongs[i].Album);
                }
            }
        }

        public List<string> getArtistListAsStrings()
        {
            List<String> returnList = new List<String>();

            for (int i = 1; i < UserAlbums.Count; i++)
            {
                returnList.Add(UserAlbums[i].ToString());
            }

            return returnList;
        }

        public Album locateAlbumByName(string nameSearch)
        {
            foreach (var item in UserAlbums)
            {
                if (item.AlbumName == nameSearch)
                {
                    return item;
                }
            }

            return null;
        }
    }
} 
