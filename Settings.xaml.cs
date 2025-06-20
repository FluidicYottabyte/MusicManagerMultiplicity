﻿using MusicManagerMultiplicity.Classes;
using System;
using System.Collections.Generic;
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
    /// Interaction logic for Settings.xaml
    /// </summary>
    public partial class Settings : Window
    {

        public SongLibrary Library;
        public Settings(SongLibrary _Library)
        {
            Library = _Library;

            InitializeComponent();
        }

        private async void ReloadSongs(object sender, RoutedEventArgs e)
        {
            await Library.CheckSongsForUpdates(Dispatcher);
        }
    }
}
