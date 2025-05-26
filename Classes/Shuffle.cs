using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MusicManagerMultiplicity.Classes
{
    internal static class Shuffle
    {
        private static Random rng = new Random();

        public static IList<T> ShuffleObject<T>(this IList<T> list)
        {

            var n = list.Count;
            var result = new List<T>(list); // Create a copy to avoid modifying original list

            for (int i = n - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1); // 0 <= j <= i
                (result[i], result[j]) = (result[j], result[i]);
            }

            return result;
        }
    }
}
