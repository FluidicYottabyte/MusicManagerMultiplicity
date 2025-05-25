using MusicManagerMultiplicity.Classes;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Media;
using System.Reflection;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Resources;
using System.Windows.Shapes;
using TagLib.Id3v2;
using static System.Net.Mime.MediaTypeNames;

namespace MusicManagerMultiplicity
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {

        public ObservableCollection<PlaylistItem> Playlists { get; set; }

        private PlayerManager playerManager = new PlayerManager();
        private PlaylistLibrary playlistLibrary = new PlaylistLibrary();
        private SongLibrary songLibrary = new SongLibrary();

        private ArtistListManager artistManager = new ArtistListManager();
        private AlbumListManager albumManager = new AlbumListManager();

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = System.IO.Path.Combine(localAppData, "MusicManagerMultiplicity");

        public MainWindow()
        {
            artistManager.regenerateArtistList(songLibrary); //Don't leave this forever, import the artist list once you create the json encode/decode for it
            albumManager.regenerateAlbumList(songLibrary); //This too, these will both cause lag on each startup with larger libraries

            InitializeComponent();

            DataContext = playerManager;

            Playlists = new ObservableCollection<PlaylistItem>();

            PlaylistListBox.ItemsSource = Playlists;

            playlistLibrary.CreatePlaylistUI(Playlists);

            if (File.Exists("/Assets/default.png")) //Finish implementing the default image loading
            {
                Uri uri = new Uri("/Assets/default.png", UriKind.RelativeOrAbsolute);
                AlbumArt.Source = BitmapFrame.Create(uri);
            }

            //Playlists.Add(new PlaylistItem { ImageSource = "playlist1.jpg", PlaylistName = "Rock Classics", PlayButtonName = "btnPlayRock" });
            //Playlists.Add(new PlaylistItem { ImageSource = "playlist2.jpg", PlaylistName = "Pop Hits", PlayButtonName = "btnPlayPop" });
        }

        private void PlayCurrentSong(object sender, RoutedEventArgs e)
        {
            playerManager.Play();
        }

        private void PauseCurrentSong(object sender, RoutedEventArgs e)
        {
            playerManager.Pause();
        }

        private void PlaySelectedPlaylist(object sender, RoutedEventArgs e)
        {
            if (sender == null) { return; }

            if (((Button)sender).Tag == null) { return; }

            if (sender is Button button && button.Tag != null)
            {
                if (int.TryParse(button.Tag.ToString(), out int playlistId)) 
                {
                    Playlist foundPlaylist = playlistLibrary.FindPlaylistByID(playlistId);

                    if (foundPlaylist != null) { return; }

                    playerManager.SetPlaylist(foundPlaylist);
                    playerManager.Play();
                }
                
            }
            
        }

        private void GoToLastSong(object sender, RoutedEventArgs e)
        {
            playerManager.Last();
        }

        private void GoToNextSong(object sender, RoutedEventArgs e)
        {
            playerManager.Next();
        }

        private void ShufflePlaylist(object sender, RoutedEventArgs e)
        {
            playerManager.ShufflePlaylist();
        }

        private void EditSelectedPlaylist(object sender, RoutedEventArgs e)
        {
            throw new NotImplementedException();
        }

        private void CreateNewPlaylist(object sender, RoutedEventArgs e)
        {
            if (playlistLibrary == null) { return; }

            CreatePlaylistDialog playlistEdit = new CreatePlaylistDialog(songLibrary);
            playlistEdit.Show();
        }

        private void AddNewSong(object sender, RoutedEventArgs e)
        {
            AddSong addSongWindow = new AddSong(artistManager, albumManager, songLibrary);
            addSongWindow.Show();
        }
    }
}