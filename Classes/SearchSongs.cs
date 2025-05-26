using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MusicManagerMultiplicity.Classes
{
    public class SearchSongs
    {
        public List<Song> SearchSongsArtistsAndAlbums(string SearchTerm, SongLibrary LibraryofSongs)
        {
            List<Song> ResultsByName = LibraryofSongs.PrefixSearch(SearchTerm);

            Trace.WriteLine("WARNING! YOU ARE USING THE SEARCH BY NAME ONLY VERSION OF LIBRARY SEARCH. FINISH THIS CODE YOU LAZY SHIT");

            Trace.WriteLine(ResultsByName.Count);

            return ResultsByName;
        }
    }
}
