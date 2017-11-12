	public static class TextJustifier
	{
		public static string SplitToLines2(string[] words, int width)
		{
			if (words.Length == 0) return "";
			var para = new StringBuilder(words[0]);
			SplitToLines2(para, words[0].Length, words, width, 1);
			return para.ToString();
		}

		public static void SplitToLines2(StringBuilder para, int lastLineLen, string[] words, int width, int wordIndex)
		{
			if (wordIndex >= words.Length) return;
			string word = words[wordIndex];
			bool lineIsFull = lastLineLen + word.Length + 1 > width;
			para.Append(lineIsFull ? "\n" : " ").Append(word);
			lastLineLen = lineIsFull ? word.Length : lastLineLen + 1 + word.Length;
			SplitToLines2(para, lastLineLen, words, width, wordIndex + 1);
		}

		public static string SplitToLines3(string[] words, int width)
		{
			var para = new StringBuilder(words[0]);
			int lastLineLen = words[0].Length;
			foreach (string word in words)
			{
				bool lineIsFull = lastLineLen + word.Length + 1 > width;
				para.Append(lineIsFull ? "\n" : " ").Append(word);
				lastLineLen = lineIsFull ? word.Length : lastLineLen + 1 + word.Length;
			}
			return para.ToString();
		}

		public static IEnumerable<string> SplitToLines(string[] words, int width)
		{
			if (words.Length == 0) yield break;
			var line = new StringBuilder();
			foreach (string word in words)
			{
				if (line.Length > 0 && line.Length + word.Length > width)
				{
					yield return line.ToString().TrimEnd();
					line.Clear();
				}
				line.Append(word + " ");
			}
			yield return line.ToString().TrimEnd();
		}

		public static string CenterTextLine(string text, int width)
		{
			return text.PadEquallyBothSides(width);
		}
	}

	// 19:25
	public static class StringExtensions
	{
		public static string PadEquallyBothSides(this string text, int width, char paddingChar = ' ')
		{
			var leftPadding = Math.Max(0, width - text.Length) / 2;
			return
				new string(' ', leftPadding)
				+ text
				+ new string(' ', Math.Max(0, width - text.Length - leftPadding));
		}
	}

	[TestFixture]
	public class TextJustify_Should
	{
		[TestCase("", 2, "  ")]
		[TestCase("a", 2, "a ")]
		[TestCase("a", 3, " a ")]
		[TestCase("ab", 4, " ab ")]
		[TestCase("ab", 5, " ab  ")]
		[TestCase("ab", 2, "ab")]
		[TestCase("ab", 1, "ab")]
		public void CenterSingleLine(string input, int width, string output)
		{
			TextJustifier.CenterTextLine(input, width).ShouldBe(output);
		}
	}
