using DiscordRPC;
using DiscordRPC.Logging;

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
                Details = "Using My WPF App",
                State = "Just vibing",
                Assets = new Assets()
                {
                    //LargeImageKey = "logo",  // Must match an uploaded asset name
                    //LargeImageText = "My WPF App"
                },
                Timestamps = Timestamps.Now
            });
        }

        public void Destroy()
        {
            client.Dispose(); // Important: cleanup
        }
    }

}
