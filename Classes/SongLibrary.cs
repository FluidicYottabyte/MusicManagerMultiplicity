using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Diagnostics;
using System.Collections.ObjectModel;
using System.Windows.Controls;
using System.Windows.Threading;
using System.Drawing;
using System.Windows.Media.Imaging;

namespace MusicManagerMultiplicity.Classes
{
    public class SongLibrary
    {
        public List<Song> AllSongs = new List<Song>();
        private string SongJsonFolder;
        private string SongFileFolder;

        private DataExractor extractor = new DataExractor();

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
            //Directory.CreateDirectory(SongFileFolder); // Creates folder if it doesn't exist
            SongJsonFolder = Path.Combine(appDataFolder, "SongClasses");

            if (!Directory.Exists(SongJsonFolder))
            {
                Directory.CreateDirectory(SongJsonFolder);
            }

            Trace.WriteLine("local app data found at: " + localAppData);
            Trace.WriteLine("music manager specific app data folder found at: " + appDataFolder);
            Trace.WriteLine("Song folder is located at: " + SongJsonFolder);

            string[] files =
                Directory.GetFiles(SongJsonFolder);

            //On creation of library, decode all json song objects

            Trace.WriteLine("There are currently "+files.Length.ToString()+" files found");

            foreach (string file in files)
            {
                if (!File.Exists(file)) { continue; } //Make sure the file exists!

                if (file.Length < 5) { continue; } //Make sure we can actually slice it (otherwise it will throw an error)

                if (file.Substring(file.Length - 5).ToLower() == ".json") //Is this file a json file?
                {
                    Song LoadedFile = JsonHelper.LoadSongFromJson(file);

                    if (LoadedFile == null) { continue; } //Self explanatory, if you can't understand this why the fuck are you looking at this code

                    AllSongs.Add(LoadedFile);
                }
            }

            Trace.WriteLine("Loaded songs, beginning sort");

            AllSongs.OrderBy(item => item.Name).ToList();
            //Impliment background task to do the loading, and sort the list alphabetically in order to allow a more efficient sort
        }

        public void AddSongtoLibrary(Song songtoadd)
        {
            int index = AllSongs.BinarySearch(songtoadd, new SongNameComparer());

            if (index < 0)
                index = ~index; // BinarySearch returns bitwise complement if not found

            AllSongs.Insert(index, songtoadd);

            Trace.WriteLine(songtoadd.Name + " Added to song library at index " + index);
        }

        public List<Song> BinarySearchMultiple(string name)
        {
            Trace.WriteLine("Now searching for songs starting with " + name);

            foreach (var song in AllSongs)
                Trace.WriteLine(song.Name);

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

        public List<Song> PrefixSearch(string prefix)
        {
            var results = AllSongs
                .Where(song => song.Name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                .ToList();

            return results;
        }

        public Song FindSongByID(Guid id)
        {

            for (int i = 0; i < AllSongs.Count; i++)
            {
                if (AllSongs[i].SongID == id)
                {
                    return AllSongs[i];
                }
            }

            return null;
        
        }

        public Song FindSongByStringID(string id)
        {

            for (int i = 0; i < AllSongs.Count; i++)
            {
                if (AllSongs[i].StringSongID == id)
                {
                    return AllSongs[i];
                }
            }

            return null;

        }

        public async Task CheckSongsForUpdates(Dispatcher Dispatcher)
        {
            LoadingWindow loadingWindow = new LoadingWindow();

            ProgressBar progressBar = loadingWindow.progressBar;

            loadingWindow.Show();
            progressBar.Minimum = 0;
            progressBar.Maximum = AllSongs.Count;
            progressBar.Value = 0;

            loadingWindow.StatusText.Text = "Checking image discrepancies...";

            await Task.Run(() =>
            {
                

                for (int i = 0; i < AllSongs.Count; i++)
                {

                    Song song = AllSongs[i];

                    Bitmap returnedImage;

                    if (song.SongCoverPath == null)
                    {
                        Trace.WriteLine("Album art path doesn't exist");

                        BitmapFrame holdImage = extractor.GetAlbumArt(song.FileLocation);

                        Bitmap Special = null;


                        using (MemoryStream ms = new MemoryStream())
                        {
                            // Choose the desired encoder (e.g., PNG for lossless)
                            BitmapEncoder encoder = new PngBitmapEncoder();
                            encoder.Frames.Add(holdImage);
                            encoder.Save(ms);

                            ms.Seek(0, SeekOrigin.Begin);
                            Special = new Bitmap(ms);
                        }

                        returnedImage = Special;
                    }
                    else
                    {
                        returnedImage = new Bitmap(song.SongCoverPath);
                    }




                    if (returnedImage != null)
                    {


                        returnedImage = Song.StretchToSquare(returnedImage);

                        BitmapFrame convertedImage = Song.ConvertBitmapToBitmapFrame(returnedImage);


                        string results = song.SaveSongBitmapAsCover(convertedImage);

                        if (results == null)
                        {
                            song.SongCoverPath = null;
                        }
                        else
                        {
                            song.SongCoverPath = results;
                            song.LoadCoverImageFromPath();
                        }

                        Dispatcher.Invoke(() =>
                    {
                        progressBar.Value = i + 1;
                    });
                    }
                }
            });

            loadingWindow.Close();


            //Iterate through the songs folder, and compare the song classes filepaths to the current set of songs in the folder,
            //creating new ones as needed, and deleting those that are nonexistent
            //This will be run at the beginning of each startup
        }

        public void SaveSongs()
        {
            Trace.WriteLine("Saving songs");

            foreach (Song sng in AllSongs)     
            {
                Trace.WriteLine("Attempting save for " + sng.Name);

                


                JsonHelper.SaveSongToJson(sng);

                Trace.WriteLine("Saved song "+ sng.Name);
            }
        }
    }



    public class SongNameComparer : IComparer<Song>
    {
        public int Compare(Song x, Song y)
        {
            return string.Compare(x?.Name, y?.Name, StringComparison.OrdinalIgnoreCase);
        }
    }

}
