using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Diagnostics;
using System.Collections.ObjectModel;

namespace MusicManagerMultiplicity.Classes
{
    public class SongLibrary
    {
        public List<Song> AllSongs = new List<Song>();
        private string SongJsonFolder;
        private string SongFileFolder;

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        internal SongLibrary()
        {
            //Make sure there is such a directory for the app
            if (!Directory.Exists(appDataFolder))
            {
                Directory.CreateDirectory(appDataFolder);
            }

            SongFileFolder = Path.Combine(appDataFolder, "Songs");
            SongJsonFolder = Path.Combine(appDataFolder, "SongClasses");

            if (!Directory.Exists(SongJsonFolder))
            {
                Directory.CreateDirectory(SongJsonFolder);
            }

            Trace.WriteLine("local app data found at: " + localAppData);
            Trace.WriteLine("music manager specific app data folder found at: " + appDataFolder);
            Trace.WriteLine("Song folder is located at: " + SongJsonFolder);

            string[] files =
                Directory.GetFiles(SongJsonFolder, "*ProfileHandler.cs", SearchOption.TopDirectoryOnly);

            //On creation of library, decode all json playlist objects

            for (int i = 0; files != null && i < files.Length; i++)
            {
                if (!File.Exists(files[i])) { continue; } //Make sure the file exists!

                if (files[i].Length < 5) { continue; } //Make sure we can actually slice it (otherwise it will throw an error)

                if (files[i].Substring(files[i].Length - 5).ToLower() == ".json") //Is this file a json file?
                {
                    Song LoadedFile = JsonHelper.LoadSongFromJson(files[i]);

                    if (LoadedFile == null) { continue; } //Self explanitory, if you can't understand this why the fuck are you looking at this code

                    AllSongs.Add(LoadedFile);
                }
            }

            Trace.WriteLine("Loaded songs, beginning sort");

            AllSongs.OrderBy(item => item.Name).ToList();
            //Impliment background task to do the loading, and sort the list alphabetically in order to allow a more efficient sort
        }

        public List<Song> BinarySearchMultiple(string name)
        {
            List<Song> results = new List<Song>();
            int left = 0, right = AllSongs.Count - 1;

            while (left <= right)
            {
                int mid = left + (right - left) / 2;
                int comparison = string.Compare(AllSongs[mid].Name, name, StringComparison.OrdinalIgnoreCase);

                if (comparison == 0)
                {
                    // Collect all matching AllSongs
                    int start = mid, end = mid;

                    // Move left to find duplicates
                    while (start > 0 && string.Equals(AllSongs[start - 1].Name, name, StringComparison.OrdinalIgnoreCase))
                        start--;

                    // Move right to find duplicates
                    while (end < AllSongs.Count - 1 && string.Equals(AllSongs[end + 1].Name, name, StringComparison.OrdinalIgnoreCase))
                        end++;

                    // Add all matching elements
                    for (int i = start; i <= end; i++)
                        results.Add(AllSongs[i]);

                    return results; // Return immediately since all matches are found
                }

                if (comparison < 0)
                    left = mid + 1; // Search right half
                else
                    right = mid - 1; // Search left half
            }

            return results; // Return empty list if no matches
        }

        public void CreateSongUI(ObservableCollection<SongItem> ListBox)
        {

            if (AllSongs == null) { return; }

            for (int i = 0; i < AllSongs.Count; i++)
            {

                if (AllSongs[i] == null) { continue; }

                if (AllSongs[i].Name == null) { continue; }

                if (AllSongs[i].SongCoverFilepath == null)
                {
                    ListBox.Add(new SongItem { ImageSource = "", SongName = AllSongs[i].Name, AddButtonName = AllSongs[i].songID.ToString() });
                }
                else
                {
                    ListBox.Add(new SongItem { ImageSource = AllSongs[i].SongCoverFilepath, SongName = AllSongs[i].Name, AddButtonName = AllSongs[i].songID.ToString() });
                }

            }

        }

        public Song FindSongByID(int id)
        {

            for (int i = 0; i < AllSongs.Count; i++)
            {
                if (AllSongs[i].songID == id)
                {
                    return AllSongs[i];
                }
            }

            return null;
        
        }

        public void CheckSongsForUpdates()
        {
            throw new NotImplementedException(); 
            //Iterate through the songs folder, and compare the song classes filepaths to the current set of songs in the folder,
            //creating new ones as needed, and deleting those that are nonexistent
            //This will be run at the beginning of each startup
        }
    }
}
