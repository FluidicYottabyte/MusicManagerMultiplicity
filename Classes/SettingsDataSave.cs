using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace MusicManagerMultiplicity.Classes
{

    class SettingsDataSave
    {
        public int Volume { get; set; } = 50;

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        private string utilityFolder;
            

        public SettingsDataSave()
        {
            //Make sure there is such a directory for the app
            if (!Directory.Exists(appDataFolder))
            {
                Directory.CreateDirectory(appDataFolder);
            }

            utilityFolder = Path.Combine(appDataFolder, "Utility");

            if (!Directory.Exists(utilityFolder))
            {
                Directory.CreateDirectory(utilityFolder);
            }

        }

        public void SetVolume(int VolumeToSet)
        {
            Trace.WriteLine("Setting volume in class as: "+VolumeToSet.ToString());

            Volume = VolumeToSet;
        }

        public int ReadVolume()
        {
            return Volume;
        }
    }
}
