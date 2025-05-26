using MusicManagerMultiplicity.Classes;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.IO;

namespace MusicManagerMultiplicity
{
    /// <summary>
    /// Interaction logic for AddSong.xaml
    /// </summary>
    public partial class AddSong : Window
    {
        private ObservableCollection<Song> SongsToLoad = new ObservableCollection<Song>();

        public ObservableCollection<ArtistItem> Artists { get; set; }

        private Song currentSong;

        ArtistListManager ArtistLibrary;

        AlbumListManager AlbumList;

        SongLibrary SongLibraryManager;

        private bool IsSongSelected = false;

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = Path.Combine(localAppData, "MusicManagerMultiplicity");

        private string SongFileFolder = Path.Combine(appDataFolder, "Songs");

        public AddSong(ArtistListManager _ArtistLibrary, AlbumListManager _AlbumList, SongLibrary _SongLibraryManager)
        {
            InitializeComponent();

            ArtistLibrary = _ArtistLibrary;
            AlbumList = _AlbumList;
            SongLibraryManager = _SongLibraryManager;

            Artists = new ObservableCollection<ArtistItem>();

            ArtistBox.ItemsSource = Artists;

            SongLoadList.ItemsSource = SongsToLoad;

            ArtistSearchBox.IsEditable = true;

            ArtistSearchBox.IsTextSearchEnabled = false;

            ArtistSearchBox.ItemsSource = ArtistLibrary.getArtistListAsStrings();

            if (!Directory.Exists(SongFileFolder))
            {
                Directory.CreateDirectory(SongFileFolder); // Creates folder if it doesn't exist

            }
        }

        private void ImagePanel_Drop(object sender, DragEventArgs e)
        {

            if (e.Data.GetDataPresent(DataFormats.FileDrop))
            {
                // Note that you can have more than one file.
                string[] files = (string[])e.Data.GetData(DataFormats.FileDrop);

                // Assuming you have one file that you care about, pass it off to whatever
                // handling code you have defined.
                // HandleFileOpen(files[0]);
                bool FiletypeErrorRaised = false;



                foreach (var file in files)
                {
                    Trace.WriteLine(file);

                    var strings = new List<string> { 
                        "MP3", "WAV", "OGG", "FLAC",
                        "AIFF"
                    }; //supported file formats
                   
                    bool contains = strings.Contains(file.Split(".").Last().ToUpper(), StringComparer.OrdinalIgnoreCase);

                    if (!contains)
                    {
                        if (FiletypeErrorRaised == true) { continue; }

                        string messageBoxText = "One or more files are of a filetype not recognized. These files have been skipped. First instance of unsupported filetype is: "+Path.GetFileName(file);
                        string caption = "Error adding songs";
                        MessageBoxButton button = MessageBoxButton.OK;
                        MessageBoxImage icon = MessageBoxImage.Warning;
                        MessageBoxResult result;

                        result = MessageBox.Show(messageBoxText, caption, button, icon, MessageBoxResult.Yes);

                        FiletypeErrorRaised = true;

                        continue;
                    }


                    

                    File.Copy(file, SongFileFolder+"/"+Path.GetFileName(file), overwrite: true);

                    string newfile = SongFileFolder + "/" + Path.GetFileName(file);

                    Song tempSong = new Song(newfile);
                    tempSong.ParseRelevantData(AlbumList, ArtistLibrary);

                    AddSongToLoad(tempSong); //Make sure this works because it kinda makes everything
                }

                Trace.WriteLine("AddSong.xaml.cs thinks main artists are:");

                foreach (var artist in ArtistLibrary.UserArtists)
                {
                    Trace.WriteLine(artist);
                }

                ArtistSearchBox.ItemsSource = ArtistLibrary.getArtistListAsStrings();

            }
        }

        private void DeleteCurrentSong(object sender, RoutedEventArgs e)
        {
            if (currentSong == null) { return; }

            SongsToLoad.Remove(currentSong);

            // Clear searchbox
            Artists.Clear();
            ArtistSearchBox.ItemsSource = new List<String>();

            string assemblyName = System.Reflection.Assembly.GetExecutingAssembly().GetName().Name;
            var uri = new Uri($"pack://application:,,,/{assemblyName};component/Assets/default.png", UriKind.Absolute);
            AlbumArt.Source = BitmapFrame.Create(uri);

            AlbumSearchBox.Text = "";
            AlbumSearchBox.ItemsSource = new List<String>();

            SongNameBox.Text = "";
            ArtistSearchBox.Text = "";
        }

        private void LoadSongArtists(ArtistListManager librarySearch)
        {
            bool reloadList = false;

            foreach (var song in SongsToLoad) 
            {
                foreach (var artist in song.Artist)
                {
                    Artist attemptedArtist = ArtistLibrary.locateArtistByID(artist.ArtistID.ToString());

                    if (attemptedArtist == null)
                    {
                        librarySearch.UserArtists.Add(artist);
                        reloadList = true;
                    }
                }

                
            }

            if (reloadList) //if a new artist was added to the library, reload the artist searchbox to show it
            {
                ArtistSearchBox.ItemsSource = ArtistLibrary.getArtistListAsStrings();
                Trace.WriteLine("RELOAD ARTIST DROPDOWN");
            }
        }
            

        private void ListSelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (e == null) { return; }

            //impliment saving song info when song selection changed here

            if (!(e.AddedItems.Count > 0)) { return; }

            var newSelectedItem = e.AddedItems[0] as Song; //This line is suspect, if everything breaks look here

            if (newSelectedItem == null)
            {
                Trace.WriteLine("Item received but item is not a song/ is null");
            }

            //Likely have to convert it to a song because I doubt the above works

            Song foundSongInList = newSelectedItem;

            if (foundSongInList == null) { return; }

            if (currentSong != null)
            {
                if (foundSongInList == currentSong) { return; }
            }

            currentSong = foundSongInList;

            SongNameBox.Text = foundSongInList.Name;

            Artists.Clear();

            bool reloadList = false;

            if (foundSongInList.Artist != null)
            {
                foreach (var artist in foundSongInList.Artist)
                {
                    Artists.Add(new ArtistItem { ArtistName = artist.ArtistName, DeleteButtonName = artist.ArtistID.ToString() });

                    Artist attemptedArtist = ArtistLibrary.locateArtistByID(artist.ArtistID.ToString());

                    if (attemptedArtist == null)
                    {
                        ArtistLibrary.UserArtists.Add(artist);
                        reloadList = true;
                    }
                }
            }

            if (reloadList) //if a new artist was added to the library, reload the artist searchbox to show it
            {
                ArtistSearchBox.ItemsSource = ArtistLibrary.getArtistListAsStrings();
            }


            if (foundSongInList.SongCover != null)
            {
                AlbumArt.Source = foundSongInList.SongCover;
            }
            else
            {
                //Default image here
            }


        }

        public void SortSongs()
        {
            var sorted = new List<Song>(SongsToLoad);
            sorted.Sort();
            SongsToLoad.Clear();
            foreach (var song in sorted)
                SongsToLoad.Add(song);
        }

        public void AddSongToLoad(Song newSong)
        {
            int index = FindInsertIndex(newSong);
            SongsToLoad.Insert(index, newSong);

            Trace.WriteLine(newSong.Name + " has been added to the list");
        }

        private int FindInsertIndex(Song newSong)
        {
            int low = 0, high = SongsToLoad.Count - 1;
            while (low <= high)
            {
                int mid = (low + high) / 2;
                int comparison = newSong.CompareTo(SongsToLoad[mid]);
                if (comparison == 0)
                    return mid; // or adjust for duplicate handling
                if (comparison < 0)
                    high = mid - 1;
                else
                    low = mid + 1;
            }
            return low;
        }

        public Song FindSongByName(string name)
        {
            int low = 0, high = SongsToLoad.Count - 1;
            while (low <= high)
            {
                int mid = (low + high) / 2;
                int comparison = string.Compare(name, SongsToLoad[mid].Name, StringComparison.OrdinalIgnoreCase);
                if (comparison == 0)
                    return SongsToLoad[mid];
                if (comparison < 0)
                    high = mid - 1;
                else
                    low = mid + 1;
            }
            return null;
        }

        private void AddArtist(object sender, RoutedEventArgs e)
        {
            string ArtistSearch = ArtistSearchBox.Text;

            if (ArtistSearch == "") 
            {
                string messageBoxText = "Empty artist string!";
                string caption = "Warning Adding Artist";
                MessageBoxButton button = MessageBoxButton.OK;
                MessageBoxImage icon = MessageBoxImage.Warning;
                MessageBoxResult result;

                result = MessageBox.Show(messageBoxText, caption, button, icon, MessageBoxResult.Yes);

                return;
            }

            foreach (var artist in Artists)
            {
                if (artist.ArtistName.ToLower() == ArtistSearch.ToLower()) //Check if artist already is within list
                {

                    //If it is in the list, give user ability to add it again because this is a free country. #MURICA
                    string messageBoxText = "There is already an artist under this name!";
                    string caption = "Warning Adding Artist";
                    MessageBoxButton button = MessageBoxButton.OK;
                    MessageBoxImage icon = MessageBoxImage.Warning;
                    MessageBoxResult result;

                    result = MessageBox.Show(messageBoxText, caption, button, icon, MessageBoxResult.Yes);

                    return;
                }
            }

            Artist newArtistItem = new Artist(ArtistSearch);

            if (ArtistLibrary.locateArtistByName(newArtistItem.ArtistName) == null) 
            {
                ArtistLibrary.UserArtists.Add(newArtistItem);
            }
            else
            {
                newArtistItem = ArtistLibrary.locateArtistByName(newArtistItem.ArtistName);
            }



                Artists.Add(new ArtistItem { ArtistName = newArtistItem.ArtistName, DeleteButtonName = newArtistItem.ArtistID.ToString() });

            ArtistSearchBox.ItemsSource = ArtistLibrary.getArtistListAsStrings();

        }

        private void DeleteArtist(object sender, RoutedEventArgs e)
        {
            Trace.WriteLine("Attempting to delete artist");

            if (sender == null) { return; }

            if (((Button)sender).Tag == null) { return; }

            Trace.WriteLine("Sender is not null");

            if (sender is Button button && button.Tag != null)
            {
                Trace.WriteLine("Sender is a button");

                string artistId = button.Tag.ToString();

                Trace.WriteLine("Button tag is:" + artistId);

                if (artistId != null)
                {
                    Trace.WriteLine("Parsed artist ID");

                    Artist foundArtist = ArtistLibrary.locateArtistByID(artistId);

                    if (foundArtist == null) { return; }

                    Trace.WriteLine("Artist found");

                    foreach (var artist in Artists)
                    {
                        if (artist.DeleteButtonName == artistId) //Check if artist already is within list
                        {
                            Trace.WriteLine("Deleted artist");
                            Artists.Remove(artist);
                            return;
                        }
                    }


                }

            }
        }

        private void UpdateName(object sender, TextChangedEventArgs args)
        {
            if (sender == null) { return; }

            string newText = SongNameBox.Text;

            currentSong.Name = newText;

        }

        private void CloseAddSongWindow(object sender, RoutedEventArgs e)
        {
            SongsToLoad.ForEach(x => SongLibraryManager.AddSongtoLibrary(x));
            Close();
        }

        private void CancelAllSongCreation(object sender, RoutedEventArgs e)
        {
            Close();
        }
    }
}
