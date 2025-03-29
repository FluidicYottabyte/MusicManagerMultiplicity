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
            IList<T> list2 = list;
            int n = list2.Count;
            while (n > 1)
            {
                n--;
                int k = rng.Next(n + 1);
                T value = list2[k];
                list2[k] = list2[n];
                list2[n] = value;
            }
            return list2;
        }
    }
}
