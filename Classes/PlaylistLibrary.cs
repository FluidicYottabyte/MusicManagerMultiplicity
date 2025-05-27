using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MusicManagerMultiplicity.Classes
{
    public class PlaylistLibrary
    {
        public List<Playlist> AllPlaylists = new List<Playlist>();
        private string PlaylistJsonFolder;

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        public PlaylistLibrary(SongLibrary songLibary)
        {
            //Make sure there is such a directory for the app
            if (!Directory.Exists(appDataFolder))
            {
                Directory.CreateDirectory(appDataFolder);
            }

            PlaylistJsonFolder = Path.Combine(appDataFolder, "Playlists" );

            if (!Directory.Exists(PlaylistJsonFolder))
            {
                Directory.CreateDirectory(PlaylistJsonFolder);
            }

            //Trace.WriteLine("local app data found at: "+localAppData);
            Trace.WriteLine("music manager specific app data folder found at: "+appDataFolder);
            Trace.WriteLine("Playlist folder is located at: "+PlaylistJsonFolder);

            string[] files =
                Directory.GetFiles(PlaylistJsonFolder);

            //On creation of library, decode all json playlist objects

            foreach (string file in files)
            {
                if (!File.Exists(file)) { continue; } //Make sure the file exists!

                if (file.Length < 5) { continue; } //Make sure we can actually slice it (otherwise it will throw an error)

                if (file.Substring(file.Length - 5).ToLower() == ".json") //Is this file a json file?
                {
                    Playlist LoadedFile = JsonHelper.LoadPlaylistFromJson(file);

                    

                    if (LoadedFile == null) { continue; } //Self explanitory, if you can't understand this why the fuck are you looking at this code

                    List<Song> fixedList = new List<Song>();

                    Trace.WriteLine("Fixing song list...");

                    foreach (Song song in LoadedFile.PlaylistSongs)
                    {
                        Song newsong = songLibary.FindSongByStringID(song.StringSongID);

                        fixedList.Add(newsong);

                        Trace.WriteLine("Found and replaced song: " + newsong.Name);
                    }

                    if (fixedList != null)
                    {
                        LoadedFile.SetAllSongs(fixedList);
                    }

                    AllPlaylists.Add(LoadedFile);
                }
            }
        }

        public void CreatePlaylistUI(ObservableCollection<PlaylistItem> ListBox)
        {
            ListBox.Clear();

            foreach (Playlist list in AllPlaylists) 
            {
                if (list == null) { return; }

                if (list.ImageEnabled)
                {
                    ListBox.Add(new PlaylistItem { ImageSource = list.ImageFilepath, PlaylistName = list.Name, PlayButtonName = list.playlistID.ToString(), Playlist = list });
                }
                else
                {
                    ListBox.Add(new PlaylistItem { ImageSource = "", PlaylistName = list.Name, PlayButtonName = list.playlistID.ToString(), Playlist = list });
                }
                
            }

        }

        public string GetLast(string source, int numberOfChars)
        {
            if (numberOfChars >= source.Length)
                return source;
            return source.Substring(source.Length - numberOfChars);
        }

        public Playlist FindPlaylistByID(Guid id)
        {
            foreach (Playlist list in AllPlaylists)
            {
                if (list.playlistID == id)
                {
                    return list;
                }
            }

            return null;
        }

        public Playlist FindPlaylistByStringID(string id)
        {
            foreach (Playlist list in AllPlaylists)
            {
                if (list.playlistID.ToString() == id)
                {
                    return list;
                }
            }

            return null;
        }

        public void SavePlaylists()
        {
            foreach (Playlist plist in AllPlaylists)
            {
                JsonHelper.SavePlaylistToJson(plist);
            }
        }

    }
}
