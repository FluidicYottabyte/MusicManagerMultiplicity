﻿using MusicManagerMultiplicity.Classes;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Media;
using System.Reflection;
using System.Security.Policy;
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
using System.ComponentModel;

namespace MusicManagerMultiplicity
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window, INotifyPropertyChanged
    {

        public ObservableCollection<PlaylistItem> Playlists { get; set; }

        private PlayerManager playerManager;
        private SongLibrary songLibrary = new SongLibrary();
        private PlaylistLibrary playlistLibrary;

        private RichPrescenceHandler discordHandler;
        

        private ArtistListManager artistManager = new ArtistListManager();
        private AlbumListManager albumManager = new AlbumListManager();

        private static string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        private static string appDataFolder = System.IO.Path.Combine(localAppData, "MusicManagerMultiplicity");


        private string playingSongText = "No song playing...";
        private string playingSongArtists = "";
        private string songProgressNumbers = "0:00 / 0:00";

        public string PlayingSongText
        {
            get => playingSongText;
            set
            {
                if (playingSongText != value)
                {
                    playingSongText = value;
                    OnPropertyChanged(nameof(PlayingSongText));
                }
            }
        }

        public string PlayingSongArtists
        {
            get => playingSongArtists;
            set
            {
                if (playingSongArtists != value)
                {
                    playingSongArtists = value;
                    OnPropertyChanged(nameof(PlayingSongArtists));
                }
            }
        }

        public string SongProgressNumbers
        {
            get => songProgressNumbers;
            set
            {
                if (songProgressNumbers != value)
                {
                    songProgressNumbers = value;
                    OnPropertyChanged(nameof(SongProgressNumbers));
                }
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public MainWindow()
        {
            artistManager.regenerateArtistList(songLibrary); //Don't leave this forever, import the artist list once you create the json encode/decode for it
            albumManager.regenerateAlbumList(songLibrary); //This too, these will both cause lag on each startup with larger libraries

            playlistLibrary = new PlaylistLibrary(songLibrary);

            InitializeComponent();
            discordHandler = new RichPrescenceHandler();

            this.DataContext = this;

            playerManager = new PlayerManager(System.Windows.Application.Current.Dispatcher, SongProgressNumbers, discordHandler);

            Playlists = new ObservableCollection<PlaylistItem>();

            PlaylistListBox.ItemsSource = Playlists;

            playlistLibrary.CreatePlaylistUI(Playlists);

            playerManager.SetSlider(ProgressSlider);

            playerManager.CurrentSongChanged += song => LoadNewSongInfo(song);

            playerManager.ShuffleStatusChanged += value => SetShuffleButtonColor(value);

            playerManager.TimeProgressChanged += value => UpdateTime(value);

            if (File.Exists("/Assets/default.png")) //Finish implementing the default image loading
            {
                Uri uri = new Uri("/Assets/default.png", UriKind.RelativeOrAbsolute);
                AlbumArt.Source = BitmapFrame.Create(uri);
            }

            //Playlists.Add(new PlaylistItem { ImageSource = "playlist1.jpg", PlaylistName = "Rock Classics", PlayButtonName = "btnPlayRock" });
            //Playlists.Add(new PlaylistItem { ImageSource = "playlist2.jpg", PlaylistName = "Pop Hits", PlayButtonName = "btnPlayPop" });
        }

        public void ReloadPlaylists()
        {
            playlistLibrary.CreatePlaylistUI(Playlists);
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
                string playlistId = button.Tag.ToString();

                if (playlistId != null) 
                {
                    Trace.WriteLine("Playing selected playlist");

                    Playlist foundPlaylist = playlistLibrary.FindPlaylistByStringID(playlistId);

                    if (foundPlaylist == null) { return; }

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
            if (sender is Button btn)
            {
                PlaylistItem context = (PlaylistItem)btn.DataContext;

                if (playlistLibrary == null) { return; }

                CreatePlaylistDialog playlistEdit = new CreatePlaylistDialog(songLibrary, playlistLibrary, context.Playlist);
                bool? result = playlistEdit.ShowDialog(); // This blocks until window is closed
                playerManager.CheckCurrentPlaylistEdited(context.Playlist);
            }
        }

        private void CreateNewPlaylist(object sender, RoutedEventArgs e)
        {
            if (playlistLibrary == null) { return; }

            CreatePlaylistDialog playlistEdit = new CreatePlaylistDialog(songLibrary, playlistLibrary);
            playlistEdit.Show();
        }

        private void AddNewSong(object sender, RoutedEventArgs e)
        {
            AddSong addSongWindow = new AddSong(artistManager, albumManager, songLibrary);
            addSongWindow.Show();
        }

        private void LoadNewSongInfo(Song song)
        {
            Trace.WriteLine("Updating song info");

            if (song == null)
            {
                PlayingSongText = "No song playing...";

                PlayingSongText = "";

                if (File.Exists("/Assets/default.png")) //Finish implementing the default image loading
                {
                    Uri uri = new Uri("/Assets/default.png", UriKind.RelativeOrAbsolute);
                    AlbumArt.Source = BitmapFrame.Create(uri);
                }

                return;
            }

            PlayingSongText = song.Name;

            PlayingSongArtists = "By " + song.ArtistListString;

            var bitmap = new BitmapImage();
            bitmap.BeginInit();
            bitmap.CacheOption = BitmapCacheOption.OnDemand; // Avoid full memory load
            bitmap.UriSource = song.SongCoverImage;
            bitmap.EndInit();
            AlbumArt.Source = bitmap;

            Trace.WriteLine("Album art image path is null? " + (song.SongCoverImage == null).ToString());

            Trace.WriteLine("Album art image width is: "+AlbumArt.Width.ToString());
        }

        private void SetShuffleButtonColor(bool shuffled)
        {
            Trace.WriteLine("Shuffle value passed as "+shuffled.ToString());

            if (shuffled == true)
            {
                ShuffleButton.Background = (Brush)this.FindResource("SpecialButtonColor");
            }
            else
            {
                ShuffleButton.Background = (Brush)this.FindResource("MainForeground");
            }
        }

        private void SongPositionChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            playerManager.Slider_ValueChanged(sender, e);
        }

        protected override void OnClosed(EventArgs e)
        {
            base.OnClosed(e);

            playerManager.OnClosed();

            songLibrary.SaveSongs();
            playlistLibrary.SavePlaylists();
            artistManager.SaveArtists();

            discordHandler.Destroy();
        }

        private void Slider_DragStarted(object sender, System.Windows.Controls.Primitives.DragStartedEventArgs e)
        {
            playerManager.Slider_DragStarted(sender, e);
        }

        private void Slider_DragCompleted(object sender, System.Windows.Controls.Primitives.DragCompletedEventArgs e)
        {
            playerManager.Slider_DragCompleted(sender, e);
        }

        private void UpdateTime(string timeUpdateString)
        {
            SongProgressNumbers = timeUpdateString;
        }

        private void VolumePositionChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            Trace.WriteLine("Changing volume");

            if (sender == null) { return; }

            if (playerManager == null) { return; }

            if (VolumeSlider == null) { return; }

            Trace.WriteLine("Okay to change volume to: " + VolumeSlider.Value);



            playerManager.ChangeVolume((VolumeSlider.Value));
        }

        private void OpenUserSettings(object sender, RoutedEventArgs e)
        {
            Settings settings = new Settings(songLibrary);
            settings.Show();
        }
    }
}