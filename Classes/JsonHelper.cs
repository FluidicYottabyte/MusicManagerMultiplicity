using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Runtime;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace MusicManagerMultiplicity.Classes
{

    /// <summary>
    /// The JsonHelper class is designed to encode and decode classes, mainly playlists, into Json files for easier storage.
    /// </summary>
    internal class JsonHelper
    {
        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        public JsonHelper()
        {
            //Make sure there is such a directory for the app
            if (!Directory.Exists(appDataFolder))
            {
                Directory.CreateDirectory(appDataFolder);
            }
        }


        public static void SavePlaylistToJson(Playlist playlistToConvert)
        {

            string filePath = Path.Combine(appDataFolder, "/Playlists/" + playlistToConvert.Name + ".json");

            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(playlistToConvert, options);
            File.WriteAllText(filePath, json);
        }

        public static Playlist LoadPlaylistFromJson(string filePath)
        {
            if (!File.Exists(filePath))
                return null;

            string json = File.ReadAllText(filePath);
            return JsonSerializer.Deserialize<Playlist>(json);
        }


        //Provide necessary classes for songs 
        public static void SaveSongToJson(Playlist playlistToConvert)
        {

            string filePath = Path.Combine(appDataFolder, "/Songs/" + playlistToConvert.Name + ".json");

            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(playlistToConvert, options);
            File.WriteAllText(filePath, json);
        }

        public static Song LoadSongFromJson(string filePath)
        {
            if (!File.Exists(filePath))
                return null;

            string json = File.ReadAllText(filePath);
            return JsonSerializer.Deserialize<Song>(json);
        }
    }
}
