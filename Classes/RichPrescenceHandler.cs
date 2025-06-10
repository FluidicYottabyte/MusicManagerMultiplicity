using DiscordRPC;
using DiscordRPC.Logging;
using System.Diagnostics;

namespace MusicManagerMultiplicity.Classes
{
    class RichPrescenceHandler
    {
        private DiscordRpcClient client;

        public RichPrescenceHandler()
        {
            InitializeDiscord();
        }

        private void InitializeDiscord()
        {
            client = new DiscordRpcClient("1381904661879066635");

            // Optional: Log to console
            client.Logger = new ConsoleLogger() { Level = LogLevel.Warning };

            client.Initialize();

            client.SetPresence(new RichPresence()
            {
                Details = "Using Music Manager",
                State = "No music playing",
                Assets = new Assets()
                {
                    LargeImageKey = "playingicon",  // Must match an uploaded asset name
                    LargeImageText = "Music Manager"
                },
                Timestamps = Timestamps.Now
            });
        }

        public void SetPlayingInfo(Song song)
        {
            if (song == null)
            {
                client.SetPresence(new RichPresence()
                {
                    Details = "Using Music Manager",
                    State = "No music playing",
                    Assets = new Assets()
                    {
                        LargeImageKey = "playingicon",  // Must match an uploaded asset name
                        LargeImageText = "Music Manager"
                    },
                    Timestamps = Timestamps.Now
                });

                return;
            }

            string SongName = song.Name;

            if (SongName == null || SongName == "")
            {
                SongName = "Nothing";
            }

            string ArtistName = song.ArtistListString;

            if (ArtistName == null || ArtistName == "")
            {
                ArtistName = "Nobody :(";
            }

            Trace.WriteLine("Rich Prescence called");
            client.SetPresence(new RichPresence()
            {
                Details = "Listening to "+SongName,
                State = "by "+ArtistName,
                Assets = new Assets()
                {
                    LargeImageKey = "playingicon",  // Must match an uploaded asset name
                    LargeImageText = "Music Manager"
                }
            });
        }

        public void StopSong()
        {
            //impliment later
        }

        public void Destroy()
        {
            client.Dispose(); // Important: cleanup
        }
    }

}
