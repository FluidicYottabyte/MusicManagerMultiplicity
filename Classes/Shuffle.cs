using System;
using System.Collections.Generic;
using System.Diagnostics;
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
            var first = list.First();
            var last = list.Last();

            var result = new List<T>(list); // Create a copy to avoid modifying original list

            int n = list.Count;
            while (n > 1)
            {
                n--;
                int k = rng.Next(n + 1);
                T value = result[k];
                result[k] = result[n];
                result[n] = value;
            }

            if (result.First().Equals(last) || result.Last().Equals(first)) //If the first or last result is the same as before, just flip them idk
            {
                var tempLast = result.Last();

                result[^1] = result.First();

                result[0] = tempLast;
            }

            foreach (T pbj in result)
            {
                Trace.WriteLine(pbj.ToString());
            }

            return result;
        }
    }
}
