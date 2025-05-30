using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using System.ComponentModel;
using System.Xml.Linq;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Text.Json.Serialization;
using System.Windows.Media;
using TagLib.Id3v2;
using System.Drawing.Imaging;

namespace MusicManagerMultiplicity.Classes
{
    public class Song : IComparable<Song>, INotifyPropertyChanged
    {
        private static int _idCounter = 0;

        public string FileLocation { get; set; }

        private string name;
        public string Name
        {
            get => name;
            set
            {
                if (name != value)
                {
                    name = value;
                    OnPropertyChanged(nameof(Name));
                }
            }
        }
        public List<Artist> Artist = new List<Artist>();
        public Album Album { get; set; }


        private Uri songCoverImage;
        
        public Uri SongCoverImage => songCoverImage;

        private string songCoverPath;
        public string SongCoverPath { get => songCoverPath; set
            {
                if (songCoverPath != value)
                {
                    songCoverPath = value;
                    if (value != null)
                    {
                        LoadCoverImageFromPath();
                    }
                }
            }
        }


        public Guid SongID { get; private set; }

        public string StringSongID { get; set; }

        public string ArtistListString { get; set; }

        [JsonIgnore]
        private DataExractor extractor = new DataExractor();

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        // Constructor requiring only name and file location
        public Song(string name, string fileLocation)
        {
            Name = name;
            FileLocation = fileLocation;
            SongID = Guid.NewGuid();

            StringSongID = SongID.ToString();



        }

        public Song()
        {
            SongID = Guid.NewGuid();
            StringSongID = SongID.ToString();


        }


        public Song(string fileLocation)
        {
            FileLocation = fileLocation;
            SongID = Guid.NewGuid();

            StringSongID = SongID.ToString();

        }


        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        private void GenerateArtistString()
        {
            ArtistListString = "";


            foreach (Artist artist in Artist)
            {
                ArtistListString += artist.ArtistName + ", ";
            }

            Trace.WriteLine("Artist string before editing is: " + ArtistListString);

            //Remove extra comma and space

            if (ArtistListString.Length < 2)
            {
                return;
            }
            ArtistListString = ArtistListString.Substring(0, ArtistListString.Length - 2);
        }

        public int CompareTo(Song other)
        {
            return string.Compare(this.Name, other.Name, StringComparison.OrdinalIgnoreCase);
        }

        public void ParseRelevantData(AlbumListManager albumCheck, ArtistListManager artistCheck)
        {
            //Attempt to locate title first

            string titleResult = extractor.GetTitle(FileLocation);

            if (titleResult != null)
            {
                Name = titleResult;
            } else
            {
                Name = Path.GetFileNameWithoutExtension(FileLocation);
            }

            //Attempt to locate album second

            string albumResult = extractor.GetAlbum(FileLocation);

            if (albumResult != null)
            {
                Album existingAlbum = albumCheck.locateAlbumByName(albumResult);

                if (existingAlbum != null)
                {
                    Album = existingAlbum;
                } else
                {
                    Album newAlbumDeclaration = new Album(albumResult);

                    Album = newAlbumDeclaration;
                    albumCheck.UserAlbums.Add(newAlbumDeclaration);
                }
            }

            //Next try to locate any artists

            string[] artistResults = extractor.GetArtists(FileLocation);

            if (artistResults != null)
            {
                foreach (var artistItem in artistResults) //Artist result returns as a list, because a song can be from multiple artists
                {
                    Artist existingArtist = artistCheck.locateArtistByName(artistItem);

                    if (existingArtist != null) //If the artist already exists within the users list of artists, just add that object to the song artist list
                    {
                        Artist.Add(existingArtist);
                    }
                    else //If it doesn't exist, create new artist, add it to song artist list AND the list of artists
                    {
                        Artist newArtistDeclaration = new Artist(artistItem);

                        Artist.Add(newArtistDeclaration);
                        artistCheck.UserArtists.Add(newArtistDeclaration);

                        Trace.WriteLine("Added new artist: " + artistItem);
                        Trace.WriteLine("Current artists are:");
                        
                        foreach (var artist in artistCheck.UserArtists)
                        {
                            Trace.WriteLine(artist);
                        }
                    }
                }
                
            }

            //Finally, find the album art.

            if (SongCoverImage != null && Directory.Exists(SongCoverImage.AbsolutePath))
            {
                Trace.WriteLine("Image is fine, already exists, no extra work needed");
            }
            else
            {
                if (SongCoverPath != null)
                {

                    Trace.WriteLine("Songvoerpath exists, load image");
                    LoadCoverImageFromPath();

                }
                else
                {

                    Trace.WriteLine("Cover image does not exist. Load it!");

                    BitmapFrame returnedImage = extractor.GetAlbumArt(FileLocation);

                    

                    if (returnedImage != null)
                    {
                        Bitmap Special = null;


                        using (MemoryStream ms = new MemoryStream())
                        {
                            // Choose the desired encoder (e.g., PNG for lossless)
                            BitmapEncoder encoder = new PngBitmapEncoder();
                            encoder.Frames.Add(returnedImage);
                            encoder.Save(ms);

                            ms.Seek(0, SeekOrigin.Begin);
                            Special = new Bitmap(ms);
                        }

                        Special = StretchToSquare(Special);

                        returnedImage = ConvertBitmapToBitmapFrame(Special);


                        string results = SaveSongBitmapAsCover(returnedImage);

                        if (results == null)
                        {
                            SongCoverPath = null;
                        }
                        else
                        {
                            SongCoverPath = results;
                            LoadCoverImageFromPath();
                        }

                    }
                    else
                    {
                        //Default song cover
                    }
                }
            }

            

            Trace.WriteLine("Finished parsing all song data for song: "+Name);

            GenerateArtistString();
        }

        public override string ToString()
        {
            return Name;
        }

        public string SaveSongBitmapAsCover(BitmapFrame bitmap)
        {
            string CoverPath = Path.Combine(appDataFolder, "Images");

            return JsonHelper.SaveCoverIfUnique(bitmap,CoverPath);
        }

        public static BitmapFrame ConvertBitmapToBitmapFrame(Bitmap bitmap)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                // Save bitmap to memory stream in PNG format
                bitmap.Save(ms, ImageFormat.Png);
                ms.Seek(0, SeekOrigin.Begin);

                // Decode the PNG stream to create a BitmapFrame
                return BitmapFrame.Create(ms, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);
            }
        }

        public void LoadCoverImageFromPath()
        {
            if (!string.IsNullOrEmpty(SongCoverPath) && File.Exists(SongCoverPath))
            {

                songCoverImage = new Uri(songCoverPath, UriKind.Absolute);

                return;

                //Possible bloat, keep around just in case

                BitmapImage image = new BitmapImage();
                image.BeginInit();
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.UriSource = new Uri(SongCoverPath, UriKind.Absolute);
                image.EndInit();
                image.Freeze();

                Bitmap bmp = BitmapImageToBitmap(image);
                Bitmap squared = StretchToSquare(bmp); // or CropToSquare, StretchToSquare
                image = BitmapToBitmapImage(squared);

                

                //Trace.WriteLine("Image is null? "+(image == null).ToString());
                //OnPropertyChanged(nameof(SongCoverImage)); // Raise property changed if needed
            }
        }

        public static Bitmap BitmapImageToBitmap(BitmapImage bitmapImage)
        {
            using var outStream = new MemoryStream();
            var encoder = new BmpBitmapEncoder();
            encoder.Frames.Add(BitmapFrame.Create(bitmapImage));
            encoder.Save(outStream);
            using var bmp = new Bitmap(outStream);
            return new Bitmap(bmp);
        }

        public static Bitmap StretchToSquare(Bitmap original)
        {
            int size = Math.Max(original.Width, original.Height);
            var stretched = new Bitmap(size, size);

            using (Graphics g = Graphics.FromImage(stretched))
            {
                g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                g.DrawImage(original, 0, 0, size, size); // stretch
            }

            return stretched;
        }


        public static BitmapImage BitmapToBitmapImage(Bitmap bitmap)
        {
            using var memory = new MemoryStream();
            bitmap.Save(memory, System.Drawing.Imaging.ImageFormat.Png);
            memory.Position = 0;

            var bitmapImage = new BitmapImage();
            bitmapImage.BeginInit();
            bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
            bitmapImage.StreamSource = memory;
            bitmapImage.EndInit();
            bitmapImage.Freeze();

            return bitmapImage;
        }


        public string GetSongCoverFromPath()
        {
            if (SongCoverPath != null)
            {
                return SongCoverPath;
            }
            else return null;
        }

        public static void SaveCoverToFile(BitmapFrame image, string imagePath)
        {
            BitmapEncoder encoder = new PngBitmapEncoder();
            encoder.Frames.Add(image);

            using FileStream stream = new FileStream(imagePath, FileMode.Create);
            encoder.Save(stream);
        }

    }

}
