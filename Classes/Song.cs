using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Media.Imaging;
using System.ComponentModel;
using System.Xml.Linq;

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
        public BitmapFrame SongCover { get; set; }

        public Guid SongID { get; private set; }

        public string StringSongID { get; set; }

        private DataExractor extractor = new DataExractor();

        // Constructor requiring only name and file location
        public Song(string name, string fileLocation)
        {
            Name = name;
            FileLocation = fileLocation;
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

            BitmapFrame returnedImage = extractor.GetAlbumArt(FileLocation);

            if (returnedImage != null)
            {
                SongCover = returnedImage;
            } else
            {
                //Default song cover
            }

            Trace.WriteLine("Finished parsing all song data for song: "+Name);
        }

        public override string ToString()
        {
            return Name;
        }
    }

}
