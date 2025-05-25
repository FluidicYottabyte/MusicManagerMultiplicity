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

        public List<Song> SongsToAdd = new List<Song>();

        public CreatePlaylistDialog(SongLibrary _MainSongLibrary)
        {

            MainSongLibrary = _MainSongLibrary;

            InitializeComponent();

            Songs = new ObservableCollection<Song>(MainSongLibrary.AllSongs);

            LibrarySearchBox.ItemsSource = Songs;

        }

        private void AddSelectedSong(object sender, RoutedEventArgs e)
        {
            if (sender == null) { return; }

            Trace.WriteLine("Attempting to add song to playlist, sender is not null");

            if (((Button)sender).Tag == null) { return; }

            if (MainSongLibrary == null) { return; }

            if (sender is Button button && button.Tag != null)
            {
                if (int.TryParse(button.Tag.ToString(), out int songid))
                {
                    Song foundSong = MainSongLibrary.FindSongByID(songid);

                    if (foundSong != null) { return; }

                    SongsToAdd.Add(foundSong);
                }

            }
        }

        private void CreatePlaylist(object sender, RoutedEventArgs e)
        {

        }

        private void CancelPlaylistCollection(object sender, RoutedEventArgs e)
        {

        }
    }
}
