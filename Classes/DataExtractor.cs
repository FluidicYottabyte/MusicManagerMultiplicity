using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Controls;
using TagLib;
using System.Windows.Media.Imaging;

namespace MusicManagerMultiplicity.Classes
{
    public class DataExractor
    {
        public string GetTitle(string filePath)
        {
            try
            {
                var file = TagLib.File.Create(filePath);

                return file.Tag.Title;

            }
            catch (Exception ex)
            {
                Trace.WriteLine($"Error reading metadata: {ex.Message}");
                return null;
            }
        }

        public string[] GetArtists(string filePath)
        {
            try
            {
                var file = TagLib.File.Create(filePath);

                return file.Tag.Performers;

            }
            catch (Exception ex)
            {
                Trace.WriteLine($"Error reading metadata: {ex.Message}");
                return null;
            }
        }

        public string GetAlbum(string filePath)
        {
            try
            {
                var file = TagLib.File.Create(filePath);

                return file.Tag.Album;

            }
            catch (Exception ex)
            {
                Trace.WriteLine($"Error reading metadata: {ex.Message}");
                return null;
            }
        }

        public BitmapFrame GetAlbumArt(string filepath)
        {
            var file = TagLib.File.Create(filepath);
            var pictures = file.Tag.Pictures;

            if (pictures.Length > 0)
            {
                var bin = pictures[0].Data.Data;

                using (var ms = new MemoryStream(bin))
                {
                    BitmapFrame frame = BitmapFrame.Create(ms, BitmapCreateOptions.PreservePixelFormat, BitmapCacheOption.OnLoad);

                    ms.Position = 0;


                    frame.Freeze();

                    return (frame);
                }
            }
            else
            {
                Console.WriteLine("No album art found in file.");

                string assemblyName = System.Reflection.Assembly.GetExecutingAssembly().GetName().Name;
                var uri = new Uri($"pack://application:,,,/{assemblyName};component/Assets/default.png", UriKind.Absolute);


                BitmapFrame newFrame = BitmapFrame.Create(uri);

                return newFrame;
            }
        }
    }
}
