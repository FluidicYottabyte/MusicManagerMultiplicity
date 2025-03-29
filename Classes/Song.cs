using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;

namespace MusicManagerMultiplicity.Classes
{
    public class Song()
    {
        public string FileLocation {  get; set; }

        public string Name { get; set; }
        private Artist Artist { get; set; }
        private Album Album { get; set; }
        public string SongCoverFilepath { get; set; }

        public int songID { get; set; }


    }
}
