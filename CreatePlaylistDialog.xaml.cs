using MusicManagerMultiplicity.Classes;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using TagLib.Ape;

namespace MusicManagerMultiplicity
{
    /// <summary>
    /// Interaction logic for Window1.xaml
    /// </summary>
    public partial class CreatePlaylistDialog : Window
    {
        public ObservableCollection<Song> Songs { get; set; }
        private ObservableCollection<Song> SearchResults { get; set; }
        public SongLibrary MainSongLibrary;
        public PlaylistLibrary MasterPlaylistLibrary;

        public SearchSongs LibrarySearchModule = new SearchSongs();

        public ObservableCollection<SongItem> SongsToAdd = new ObservableCollection<SongItem>();

        private Playlist EditingPlaylist {get;set;}
        public CreatePlaylistDialog(SongLibrary _MainSongLibrary, PlaylistLibrary _MasterPlaylistLibrary, Playlist _EditingPlaylist = null)
        {
            MasterPlaylistLibrary = _MasterPlaylistLibrary;
            MainSongLibrary = _MainSongLibrary;

            InitializeComponent();

            Songs = new ObservableCollection<Song>(MainSongLibrary.AllSongs);

            LibrarySearchBox.ItemsSource = Songs;
            PlaylistSongsToAddBox.ItemsSource = SongsToAdd;

            if (_EditingPlaylist != null)
            {
                EditingPlaylist = _EditingPlaylist;
                
                foreach (Song songitem in EditingPlaylist.PlaylistSongs)
                {
                    SongsToAdd.Add(new SongItem { Song = songitem });

                }

                PlaylistNameBox.Text = EditingPlaylist.Name;
            }

        }

        private void AddSelectedSong(object sender, RoutedEventArgs e)
        {
            if (sender == null) { return; }

            Trace.WriteLine("Attempting to add song to playlist, sender is not null");

            //if (((Button)sender).Tag == null) { return; }

            if (MainSongLibrary == null) { return; }

            Trace.WriteLine("Tag is valid and song library is passed");

            if (sender is Button btn)
            {
                Song context = (Song)btn.DataContext;
                Trace.WriteLine(context?.GetType().ToString() ?? "null");
                Trace.WriteLine(context.ToString());

                if (context == null) { return; }

                Trace.WriteLine("Context is not null, adding to songs");

                SongsToAdd.Add(new SongItem { Song = context});
            }

            //if (sender is Button btn && btn.DataContext is Song item)
            //{
              //  SongsToAdd.Add(item);
            //}

            return;

            
        }

        private void CreatePlaylist(object sender, RoutedEventArgs e)
        {
            Trace.WriteLine("Creating Playlist!");

            List<Song> CreatePlaylistReturn = new List<Song>();

            SongsToAdd.ForEach(
                e => CreatePlaylistReturn.Add(MainSongLibrary.FindSongByID(e.Song.SongID)));

            if (CreatePlaylistReturn.Count == 0)
            {
                string messageBoxText = "Cannot create a playlist with no songs";
                string caption = "Error creating playlist";
                MessageBoxButton button = MessageBoxButton.OK;
                MessageBoxImage icon = MessageBoxImage.Warning;
                MessageBoxResult result;

                result = MessageBox.Show(messageBoxText, caption, button, icon, MessageBoxResult.Yes);

                return;
            }

            if (PlaylistNameBox.Text == "")
            {
                string messageBoxText = "Your playlist has an empty name, would you like to continue with creating it?";
                string caption = "Error creating playlist";
                MessageBoxButton button = MessageBoxButton.YesNo;
                MessageBoxImage icon = MessageBoxImage.Warning;
                MessageBoxResult result;

                result = MessageBox.Show(messageBoxText, caption, button, icon, MessageBoxResult.Yes);

                if (result == MessageBoxResult.No)
                {
                    return;
                }
            }

            if (EditingPlaylist != null)
            {
                EditingPlaylist.Name = PlaylistNameBox.Text;
                EditingPlaylist.SetAllSongs(CreatePlaylistReturn);

                MainWindow mainWindow1 = Application.Current.Windows.OfType<MainWindow>().FirstOrDefault();
                if (mainWindow1 != null)
                    mainWindow1.ReloadPlaylists();

                Close();

                return;
            }

            

            Playlist ReturnPlaylist = new Playlist(
                CreatePlaylistReturn, 
                PlaylistNameBox.Text,
                null,
                false
                );

            MasterPlaylistLibrary.AllPlaylists.Add(ReturnPlaylist);

            MainWindow mainWindow = Application.Current.Windows.OfType<MainWindow>().FirstOrDefault();
            if (mainWindow != null)
                mainWindow.ReloadPlaylists();

            Close();
        }

        private void CancelPlaylistCollection(object sender, RoutedEventArgs e)
        {
            Close();
        }

        private void RemoveSelectedSong(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn)
            {
                SongItem context = (SongItem)btn.DataContext;
                Trace.WriteLine(context?.GetType().ToString() ?? "null");
                Trace.WriteLine(context.ToString());

                if (context == null) { return; }

                Trace.WriteLine("Context is not null, removing from songs");

                SongsToAdd.Remove(context);
            }
        }

        private void UpdateSearch(object sender, TextChangedEventArgs e)
        {
            if (sender == null) { return; }

            string newText = SearchBox.Text;

            if (newText == "")
            {
                LibrarySearchBox.ItemsSource = Songs;

                return;
            }

            List<Song> SearchResults = LibrarySearchModule.SearchSongsArtistsAndAlbums(newText, MainSongLibrary);

            if (SearchResults == null)
            {
                LibrarySearchBox.ItemsSource = new ObservableCollection<Song>(new List<Song>());

                return;
            }

            LibrarySearchBox.ItemsSource = new ObservableCollection<Song>(SearchResults);
        }
    }
}
