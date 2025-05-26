using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Threading;
using TagLib.Matroska;
using static System.Net.Mime.MediaTypeNames;

namespace MusicManagerMultiplicity.Classes
{
    internal class PlayerManager : INotifyPropertyChanged
    {
        private MediaPlayer mediaPlayer = new MediaPlayer();

        private Playlist CurrentPlaylist;

        private Song _currentsong;

        private Slider slider = null;

        public Song CurrentSong
        {
            get => _currentsong;
            set
            {
                if (_currentsong != value)
                {
                    _currentsong = value;

                    // Notify property change (pass the property name, not the song name)
                    OnPropertyChanged(nameof(CurrentSong));

                    // 🔔 Call external method here
                    OnCurrentSongChanged(_currentsong);
                }
            }
        }

        public event Action<Song> CurrentSongChanged;

        private void OnCurrentSongChanged(Song newSong)
        {
            CurrentSongChanged?.Invoke(newSong);
        }

        public event Action<bool> ShuffleStatusChanged;

        private void OnShuffleChanged(bool shuffles)
        {
            ShuffleStatusChanged?.Invoke(shuffles);
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        private bool Paused = false;
        private bool _shuffled = false;
        public bool Shuffled
        {
            get => _shuffled;
            set
            {
                if (_shuffled != value)
                {
                    _shuffled = value;

                    // 🔔 Call external method here
                    OnShuffleChanged(_shuffled);
                }
            }
        }

        public Dispatcher Dispatcher;

        private int Index = 0;

        private DispatcherTimer timer;

        private bool isDragging = false;
        private bool wasPlaying = false;

        private string _timeProgress;

        public string TimeProgress
        {
            get => _timeProgress;
            set
            {
                if (_timeProgress != value)
                {
                    _timeProgress = value;

                    // 🔔 Call external method here
                    OnTimeProgressChanged(TimeProgress);
                }
            }
        }

        public event Action<string> TimeProgressChanged;

        private void OnTimeProgressChanged(string shuffles)
        {
            TimeProgressChanged?.Invoke(shuffles);
        }

        private double originalVolume;

        internal PlayerManager(Dispatcher ApplicationDispatcher, string TimeProgressItem)
        {
            this.Dispatcher = ApplicationDispatcher;

            TimeProgress = TimeProgressItem;

            mediaPlayer.MediaOpened += SongStarted;

            mediaPlayer.MediaEnded += SongEnded;
            timer = new DispatcherTimer(TimeSpan.FromMilliseconds(100), DispatcherPriority.Input, TimerTick, this.Dispatcher);
        }

        public void SetSlider(Slider sliderset)
        {
            slider = sliderset;
        }

        private void TimerTick(object sender, EventArgs e)
        {
            if (!isDragging)
            {
                double currentPosition = mediaPlayer.Position.TotalSeconds;

                slider.Value = currentPosition;
            }

            double seconds = mediaPlayer.Position.TotalSeconds;

            if (seconds == 0 || mediaPlayer.NaturalDuration.HasTimeSpan == false)
            {
                TimeProgress = "0:00 / 0:00";
                return;
            }

            int secondsPlace = (int)(Math.Round(seconds) % 60);
            string secondsNumberString = secondsPlace.ToString();

            if (secondsPlace < 10)
            {
                secondsNumberString = "0" + secondsPlace.ToString();
            }

            string Text0 = Math.Floor(seconds / 60).ToString()+":"+secondsNumberString + " / ";

            string Text = mediaPlayer.NaturalDuration.TimeSpan.ToString(@"mm\:ss");

            TimeProgress = Text0 + Text;
        }

        public void Slider_ValueChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
        {
            if (isDragging)
            {
                //mediaPlayer.Position = TimeSpan.FromSeconds(slider.Value);
            }
        }

        public async void Slider_DragStarted(object sender, System.Windows.Controls.Primitives.DragStartedEventArgs e)
        {
            isDragging = true;
            wasPlaying = mediaPlayer.CanPause;
            originalVolume = mediaPlayer.Volume;
            mediaPlayer.Pause();

            for (int i = 0; i < 10; i++) // Max 10 checks (~500ms)
            {
                await Task.Delay(5);

                mediaPlayer.Volume = originalVolume - (originalVolume / 10) * i;
            }

            mediaPlayer.Volume = 0;
        }

        public async void Slider_DragCompleted(object sender, System.Windows.Controls.Primitives.DragCompletedEventArgs e)
        {
            isDragging = false;
            var targetTime = TimeSpan.FromSeconds(slider.Value);
            mediaPlayer.Position = targetTime;

            // Wait until the media player reaches the new position
            for (int i = 0; i < 10; i++) // Max 10 checks (~500ms)
            {
                await Task.Delay(50);

                if (Math.Abs((mediaPlayer.Position - targetTime).TotalSeconds) < 0.05)
                    break;
            }
            mediaPlayer.Volume = originalVolume;

            if (wasPlaying)
                mediaPlayer.Play();
        }

        public void OnClosed()
        {
            timer.Stop();

            // Unsubscribe ALL handlers from timer events
            // to avoid the event handler leak
            timer.Tick -= TimerTick;
        }

        private void SongStarted(object sender, EventArgs e)
        {
            // Check if the media has a valid duration
            if (mediaPlayer.NaturalDuration.HasTimeSpan)
            {
                // Set the maximum value of the slider to the total duration of the media
                slider.Maximum = mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds;

                // Initialize the slider.
                // The ProgressBar is automatically updated 
                // as it is bound to the Slider.
                slider.Value = 0;

                // Start the timer after media is opened
                timer.Start();
            }
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
            Shuffled = false;
            CurrentSong = null;
        }

        public void ShufflePlaylist(bool reshuffle = false)
        {

            if (CurrentPlaylist == null)
            {
                return;
            }

            if (Shuffled == true && reshuffle == false)
            {
                UnshufflePlaylist();
                return;
            }

            Shuffled = true;
            CurrentPlaylist.ShuffledSongs = (List<Song>)Shuffle.ShuffleObject(CurrentPlaylist.PlaylistSongs);
            Index = CurrentPlaylist.ShuffledSongs.FindIndex(song => song == CurrentSong);


            mediaPlayer.Open(new Uri(CurrentPlaylist.ShuffledSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
            CurrentSong = CurrentPlaylist.ShuffledSongs[Index];
            mediaPlayer.Play();

        }

        public void UnshufflePlaylist()
        {
            if (CurrentSong == null)
            {
                return;
            }
            Index = CurrentPlaylist.PlaylistSongs.FindIndex(song => song == CurrentSong);
            Shuffled = false;
        }

        public void SongEnded(object sender, EventArgs e)
        {
            timer.Stop();
            if (CurrentSong != null && CurrentPlaylist == null)
            {
                mediaPlayer.Open(new Uri(CurrentSong.FileLocation, UriKind.RelativeOrAbsolute));
                mediaPlayer.Play();
            }
            else if (CurrentSong != null && CurrentPlaylist != null) 
            {
                if (Index <= (CurrentPlaylist.PlaylistSongs.Count - 2))
                {
                    Index += 1;
                }
                else
                {
                    Index = 0;
                    if (Shuffled == true)
                    {
                        ShufflePlaylist(true); //Reshuffle playlist when the playlist loops

                    }
                }

                if (Shuffled)
                {
                    mediaPlayer.Open(new Uri(CurrentPlaylist.ShuffledSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                    CurrentSong = CurrentPlaylist.ShuffledSongs[Index];
                }
                else
                {
                    mediaPlayer.Open(new Uri(CurrentPlaylist.PlaylistSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                    CurrentSong = CurrentPlaylist.PlaylistSongs[Index];
                }
                mediaPlayer.Play();

                
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

                if (Shuffled)
                {
                    mediaPlayer.Open(new Uri(CurrentPlaylist.ShuffledSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                    CurrentSong = CurrentPlaylist.ShuffledSongs[Index];
                }
                else
                {
                    mediaPlayer.Open(new Uri(CurrentPlaylist.PlaylistSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                    CurrentSong = CurrentPlaylist.PlaylistSongs[Index];
                }
                
                mediaPlayer.Play();

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
                if (Index > 0)
                {
                    Index -= 1;
                }
                else
                {
                    Index = (CurrentPlaylist.PlaylistSongs.Count -1);
                }

                if (Shuffled)
                {
                    mediaPlayer.Open(new Uri(CurrentPlaylist.ShuffledSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                    CurrentSong = CurrentPlaylist.ShuffledSongs[Index];
                }
                else
                {
                    mediaPlayer.Open(new Uri(CurrentPlaylist.PlaylistSongs[Index].FileLocation, UriKind.RelativeOrAbsolute));
                    CurrentSong = CurrentPlaylist.PlaylistSongs[Index];
                }
                mediaPlayer.Play();

            }
        }
    }
}
