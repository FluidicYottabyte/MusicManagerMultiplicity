using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Runtime;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using System.Diagnostics;

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
            string PlaylistFolder = Path.Combine(appDataFolder, "Playlists");

            if (!Directory.Exists(PlaylistFolder))
            {
                Directory.CreateDirectory(PlaylistFolder);
            }

            string PlaylistName = playlistToConvert.Name + "_" + playlistToConvert.playlistID.ToString();

            string safeName = string.Join("_", PlaylistName.Split(Path.GetInvalidFileNameChars()));

            string filePath = Path.Combine(PlaylistFolder, safeName + ".json");


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


        //Provide necessary methods for songs 
        public static void SaveSongToJson(Song songToConvert)
        {

            string folderPath = Path.Combine(appDataFolder, "SongClasses");
            string CoverPath = Path.Combine(appDataFolder, "Images");
            Directory.CreateDirectory(folderPath); // Creates folder if it doesn't exist
            Directory.CreateDirectory(CoverPath); // Creates folder if it doesn't exist

            string safeName = string.Join("_", songToConvert.Name.Split(Path.GetInvalidFileNameChars()));
            string filePath = Path.Combine(folderPath, safeName + ".json");


            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true, IncludeFields = true};

                if (songToConvert.SongCover != null)
                {
                    Trace.WriteLine("Songcover exists, attempting save");

                    string coverPath = SaveCoverIfUnique(songToConvert.SongCover, CoverPath);
                    songToConvert.SongCoverPath = coverPath;

                    songToConvert.SongCover = null;
                }

                string json = JsonSerializer.Serialize(songToConvert, options);


                File.WriteAllText(filePath, json);

                
            }
            catch (JsonException ex)
            {
                Console.WriteLine("Serialization error: " + ex.Message);
            }
        }

        public static Song LoadSongFromJson(string filePath)
        {
            if (!File.Exists(filePath))
                return null;

            string json = File.ReadAllText(filePath);
            Song createdSong = JsonSerializer.Deserialize<Song>(json);

            if (File.Exists(createdSong.SongCoverPath))
            {
                //using FileStream stream = new FileStream(createdSong.SongCoverPath, FileMode.Open, FileAccess.Read);
                
                //BitmapFrame returnedFrame = BitmapFrame.Create(stream, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);
                

                //createdSong.SongCover = returnedFrame;
            }

            return createdSong;

        }

        //Provide necessary methods for artists 
        public static void SaveArtistToJson(Artist artistToConvert)
        {

            string filePath = Path.Combine(appDataFolder, "/Artists/" + artistToConvert.ArtistName + ".json");

            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(artistToConvert, options);
            File.WriteAllText(filePath, json);
        }

        public static Artist LoadArtistFromJson(string filePath)
        {
            if (!File.Exists(filePath))
                return null;

            string json = File.ReadAllText(filePath);
            return JsonSerializer.Deserialize<Artist>(json);
        }

        public static string GetImageHash(BitmapFrame image)
        {
            using MemoryStream ms = new MemoryStream();
            BitmapEncoder encoder = new PngBitmapEncoder();
            encoder.Frames.Add(image);
            encoder.Save(ms);

            using var sha = System.Security.Cryptography.SHA256.Create();
            byte[] hashBytes = sha.ComputeHash(ms.ToArray());
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower(); // filename-friendly
        }

        public static string SaveCoverIfUnique(BitmapFrame image, string coversFolder)
        {
            string hash = GetImageHash(image);
            string imagePath = Path.Combine(coversFolder, hash + ".png");

            if (!Directory.Exists(coversFolder))
            {
                Directory.CreateDirectory(coversFolder);
            }

            if (!File.Exists(imagePath))
            {
                BitmapEncoder encoder = new PngBitmapEncoder();
                encoder.Frames.Add(image);

                using FileStream stream = new FileStream(imagePath, FileMode.Create);
                encoder.Save(stream);
            }

            return imagePath; // store this in your song JSON
        }


    }
}
