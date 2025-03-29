using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Media;
using static System.Net.Mime.MediaTypeNames;

namespace MusicManagerMultiplicity.Classes
{
    internal class PlayerManager : INotifyPropertyChanged
    {
        private MediaPlayer mediaPlayer = new MediaPlayer();

        private Playlist CurrentPlaylist;

        private Song _currentsong;

        private Song CurrentSong
        {
            get => _currentsong;
            set
            {
                if (_currentsong != value)
                {
                    _currentsong = value;
                    OnPropertyChanged(CurrentSong.Name);
                }
            }
        }


        public event PropertyChangedEventHandler? PropertyChanged;

        private Playlist ShuffledPlaylist;

        private bool Paused = false;
        private bool Shuffled = false;
        private int Index = 0;

        internal PlayerManager()
        {
            mediaPlayer.MediaEnded += SongEnded;
        }

        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public void SetPlaylist(Playlist NewPlaylist)
        {
            CurrentPlaylist = NewPlaylist;
            Index = 0;
            Paused = false;
        }

        public void ShufflePlaylist()
        {

            if (CurrentPlaylist == null)
            {
                return;
            }

            Shuffled = true;
            ShuffledPlaylist = (Playlist)Shuffle.ShuffleObject(CurrentPlaylist.Songs);
            Index = ShuffledPlaylist.Songs.FindIndex(song => song == CurrentSong);
        }

        public void UnshufflePlaylist()
        {
            if (CurrentSong == null)
            {
                return;
            }
            Index = CurrentPlaylist.Songs.FindIndex(song => song == CurrentSong);
            Shuffled = false;
        }

        public void SongEnded(object sender, EventArgs e)
        {
            if (CurrentSong != null && CurrentPlaylist == null)
            {
                mediaPlayer.Open(new Uri(CurrentSong.FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();
            }
            else if (CurrentSong != null && CurrentPlaylist != null) 
            {
                if (Index <= (CurrentPlaylist.Songs.Count - 1))
                {
                    Index += 1;
                }
                else
                {
                    Index = 0;
                }

                mediaPlayer.Open(new Uri(CurrentPlaylist.Songs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();

                CurrentSong = CurrentPlaylist.Songs[Index];
            }
        }

        public void Play()
        {
            if (CurrentPlaylist == null && CurrentSong == null)
            {
                return;
            }

            if (Paused)
            {
                mediaPlayer.Play();
                Paused = false;
            }

            if (CurrentSong == null && CurrentPlaylist != null)
            {
                Index = 0;

                mediaPlayer.Open(new Uri(CurrentPlaylist.Songs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();

                CurrentSong = CurrentPlaylist.Songs[Index];
            }
            else if (CurrentSong != null && CurrentPlaylist == null)
            {
                mediaPlayer.Open(new Uri(CurrentSong.FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();
            }
        }

        public void Pause()
        {
            if (mediaPlayer.CanPause)
            {
                mediaPlayer.Pause();
                Paused = true;
            }
        }

        public void Next()
        {
            SongEnded(this, EventArgs.Empty);
        }

        public void Last()
        {
            if (CurrentSong != null && CurrentPlaylist == null)
            {
                mediaPlayer.Open(new Uri(CurrentSong.FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();
            }
            else if (CurrentSong != null && CurrentPlaylist != null)
            {
                if (Index >= 0)
                {
                    Index -= 1;
                }
                else
                {
                    Index = (CurrentPlaylist.Songs.Count -1);
                }

                mediaPlayer.Open(new Uri(CurrentPlaylist.Songs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();

                CurrentSong = CurrentPlaylist.Songs[Index];
            }
        }
    }
}
