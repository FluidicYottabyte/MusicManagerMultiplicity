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
    internal class PlaylistLibrary
    {
        public List<Playlist> AllPlaylists = new List<Playlist>();
        private string PlaylistJsonFolder;

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        internal PlaylistLibrary()
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

            Trace.WriteLine("local app data found at: "+localAppData);
            Trace.WriteLine("music manager specific app data folder found at: "+appDataFolder);
            Trace.WriteLine("Playlist folder is located at: "+PlaylistJsonFolder);

            string[] files =
                Directory.GetFiles(PlaylistJsonFolder, "*ProfileHandler.cs", SearchOption.TopDirectoryOnly);

            //On creation of library, decode all json playlist objects

            for (int i = 0; files != null && i < files.Length; i++)
            {
                if (!File.Exists(files[i])) { continue; } //Make sure the file exists!

                if (files[i].Length < 5) { continue; } //Make sure we can actually slice it (otherwise it will throw an error)

                if (files[i].Substring(files[i].Length - 5).ToLower() == ".json") //Is this file a json file?
                {
                    Playlist LoadedFile = JsonHelper.LoadPlaylistFromJson(files[i]);

                    if (LoadedFile == null) { continue; } //Self explanitory, if you can't understand this why the fuck are you looking at this code

                    AllPlaylists.Add(LoadedFile);
                }
            }
        }

        public void CreatePlaylistUI(ObservableCollection<PlaylistItem> ListBox)
        {
            for (int i = 0; i < AllPlaylists.Count; i++) 
            {
                if (AllPlaylists[i] == null) { return; }

                if (AllPlaylists[i].ImageEnabled)
                {
                    ListBox.Add(new PlaylistItem { ImageSource = AllPlaylists[i].ImageFilepath, PlaylistName = AllPlaylists[i].Name, PlayButtonName = AllPlaylists[i].playlistID.ToString() });
                }
                else
                {
                    ListBox.Add(new PlaylistItem { ImageSource = "", PlaylistName = AllPlaylists[i].Name, PlayButtonName = AllPlaylists[i].playlistID.ToString() });
                }
                
            }

        }

        public string GetLast(string source, int numberOfChars)
        {
            if (numberOfChars >= source.Length)
                return source;
            return source.Substring(source.Length - numberOfChars);
        }

        public Playlist FindPlaylistByID(int id)
        {
            for (int i = 0; i < AllPlaylists.Count; i++)
            {
                if (AllPlaylists[i].playlistID == id)
                {
                    return AllPlaylists[i];
                }
            }

            return null;
        }

    }
}
