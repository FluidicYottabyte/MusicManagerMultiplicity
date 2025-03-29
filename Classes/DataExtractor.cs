using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TagLib;

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
    }
}
