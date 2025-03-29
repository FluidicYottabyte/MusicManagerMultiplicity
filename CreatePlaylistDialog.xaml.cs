using MusicManagerMultiplicity.Classes;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
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
        public ObservableCollection<SongItem> Songs { get; set; }
        public SongLibrary MainSongLibrary;

        public List<Song> SongsToAdd = new List<Song>();

        public CreatePlaylistDialog(SongLibrary _MainSongLibrary)
        {

            MainSongLibrary = _MainSongLibrary;

            InitializeComponent();

            Songs = new ObservableCollection<SongItem>();

            LibrarySearchBox.ItemsSource = Songs;

            MainSongLibrary.CreateSongUI(Songs);
        }

        private void AddSelectedSong(object sender, RoutedEventArgs e)
        {
            if (sender == null) { return; }

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
    }
}
