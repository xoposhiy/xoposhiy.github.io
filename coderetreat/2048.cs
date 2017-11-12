using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using NUnit.Framework;
using Shouldly;

namespace exercises.slides.Game2048Task
{
	// Moves with swaps
	public class Game2048_v1
	{
		private Random random;
		private readonly int[,] field;

		public Game2048_v1(Random random, int[,] field)
		{
			this.random = random;
			this.field = field;
		}

		public void ResetGame()
		{
			Array.Clear(field, 0, field.Length);
			PutRandomValue(2);
			PutRandomValue(2);
		}

		public void Move(int dx, int dy)
		{
			var xs = Enumerable.Range(0, field.GetLength(0)).ToList();
			var ys = Enumerable.Range(0, field.GetLength(1)).ToList();
			if (dx > 0) xs.Reverse();
			if (dy > 0) ys.Reverse();
			foreach (int x in xs)
				foreach (int y in ys)
					if (field[x, y] != 0) MoveValue(x, y, dx, dy);
		}

		public override string ToString()
		{
			return string.Join(
				"\n",
				Enumerable.Range(0, field.GetLength(1))
					.Select(
						y => string.Concat(
							Enumerable.Range(0, field.GetLength(0))
							.Select(x => field[x, y].ToString("##0"))))
			);
		}

		private void MoveValue(int x, int y, int dx, int dy)
		{
			while (InRange(x + dx, y + dy) && field[x + dx, y + dy] == 0)
			{
				Swap(x, y, x + dx, y + dy);
				x = x + dx;
				y = y + dy;
			}
		}

		private bool InRange(int x, int lowInclusive, int highExclusive)
		{
			return lowInclusive <= x && x < highExclusive;
		}
		private bool InRange(int x, int y)
		{
			return InRange(x, 0, field.GetLength(0)) && InRange(y, 0, field.GetLength(1));
		}

		private void Swap(int x1, int y1, int x2, int y2)
		{
			var t = field[x1, y1];
			field[x1, y1] = field[x2, y2];
			field[x2, y2] = t;
		}

		private bool PutRandomValue(int value)
		{
			if (field.Cast<int>().All(v => v > 0)) return false;
			int x, y;
			do
			{
				x = random.Next(field.GetLength(0));
				y = random.Next(field.GetLength(1));
			} while (field[y, x] != 0);
			field[y, x] = value;
			return true;
		}
	}


	// 13:17 — 13:45 Divide to rows and columns 
	public class Game2048_v2
	{
		private int[,] field;

		public Game2048_v2(int[,] field)
		{
			this.field = field;
		}

		public int this[int x, int y] => field[x, y];

		public override string ToString()
		{
			return string.Join(
				"\n",
				Enumerable.Range(0, field.GetLength(1))
					.Select(
						y => string.Concat(
							Enumerable.Range(0, field.GetLength(0))
								.Select(x => $"{field[x, y]}".PadLeft(3))))
			);
		}

		public void MoveHorizontally(bool toLeft)
		{
			var newRows = field.Rows().Select(r => MoveRowLeft(r.Reversed(!toLeft)).Reversed(!toLeft)).ToList();
			field = newRows.To2DArray();
		}
		public void MoveVertically(bool toUp)
		{
			var newRows = field.Cols().Select(r => MoveRowLeft(r.Reversed(!toUp)).Reversed(!toUp)).ToList();
			field = newRows.To2DArray(false);
		}

		private List<int> MoveRowLeft(IList<int> row)
		{
			var nonZero = row.Where(x => x > 0).ToList();
			var values = Compact(nonZero, 0).ToList();
			values.AddRange(Enumerable.Repeat(0, row.Count - values.Count));
			return values;
		}

		private IEnumerable<int> Compact(IList<int> values, int index)
		{
			if (index > values.Count-1) return new int[] { };
			if (index == values.Count-1) return new[] { values[index] };
			int equalsCount = values[index] == values[index + 1] ? 2 : 1;
			return new[] { equalsCount * values[index] }.Concat(Compact(values, index+equalsCount));
		}
	}

	public static class Ext
	{
		public static List<T> Reversed<T>(this List<T> row, bool reverse = true)
		{
			if (reverse) row.Reverse();
			return row;
		}
		public static IEnumerable<List<T>> Rows<T>(this T[,] field)
		{
			return Enumerable.Range(0, field.GetLength(1))
				.Select(y =>
					Enumerable.Range(0, field.GetLength(0))
						.Select(x => field[x, y])
						.ToList());
		}
		public static IEnumerable<(int x, int y)> Indices<T>(this T[,] field)
		{
			return
				from x in Enumerable.Range(0, field.GetLength(0))
				from y in Enumerable.Range(0, field.GetLength(1))
				select (x, y);
		}

		public static T[,] To2DArray<T>(this IList<List<T>> rows, bool yx = true)
		{
			var res = new T[rows.Count, rows[0].Count];
			res.Indices().ToList()
				.ForEach(xy => res[xy.x, xy.y] = yx ? rows[xy.y][xy.x] : rows[xy.x][xy.y]);
			return res;
		}

		public static IEnumerable<List<T>> Cols<T>(this T[,] field)
		{
			return Enumerable.Range(0, field.GetLength(0))
				.Select(x =>
					Enumerable.Range(0, field.GetLength(1))
						.Select(y => field[x, y])
						.ToList());
		}
	}

	//1:23 — 1:56 AnimateRow
	public static class Game2048
	{
		public static Move[] MoveRow(this int[] row)
		{
			return row.Select((v, i) => GetMove(i, row)).ToArray();
		}

		private static Move GetMove(int position, int[] row)
		{
			if (row[position] == 0) return null;
			Move move = GetLeftMove(row, row[position], position);
			if (move.TileAction != TileAction.JustMove) return move;
			int next = row.Skip(position+1).FirstOrDefault(v => v != 0);
			return new Move(move.NewPosition, next == row[position] ? TileAction.MoveAndDouble : TileAction.JustMove);

		}

		private static Move GetLeftMove(int[] row, int value, int position)
		{
			if (position == 0) return new Move(0, TileAction.JustMove);
			if (row[position - 1] == 0) return GetLeftMove(row, value, position - 1);
			var nearTileMove = GetLeftMove(row, row[position - 1], position - 1);
			if (nearTileMove.TileAction == TileAction.JustMove && row[position - 1] == value)
				return new Move(nearTileMove.NewPosition, TileAction.MoveAndDisappear);
			else
				return new Move(nearTileMove.NewPosition + 1, TileAction.JustMove);

		}
	}

	public class Move
	{
		public Move(int newPosition, TileAction tileAction)
		{
			NewPosition = newPosition;
			TileAction = tileAction;
		}

		public readonly int NewPosition;
		public readonly TileAction TileAction;

		protected bool Equals(Move other)
		{
			return NewPosition == other.NewPosition && TileAction == other.TileAction;
		}

		public override bool Equals(object obj)
		{
			if (ReferenceEquals(null, obj)) return false;
			if (ReferenceEquals(this, obj)) return true;
			if (obj.GetType() != this.GetType()) return false;
			return Equals((Move) obj);
		}

		public override int GetHashCode()
		{
			unchecked
			{
				return (NewPosition * 397) ^ (int) TileAction;
			}
		}

		public static bool operator ==(Move left, Move right)
		{
			return Equals(left, right);
		}

		public static bool operator !=(Move left, Move right)
		{
			return !Equals(left, right);
		}

		public override string ToString()
		{
			return $"{nameof(NewPosition)}: {NewPosition}, {nameof(TileAction)}: {TileAction}";
		}
	}

	public enum TileAction
	{
		JustMove,
		MoveAndDisappear,
		MoveAndDouble
	}

	[TestFixture]
	public class Game_Should
	{
		[Test]
		public static void DontMoveFullNotCompactableRow()
		{
			var row = new[] { 4, 2 };
			var moves = row.MoveRow();
			moves.ShouldBe(new[]
			{
				new Move(0, TileAction.JustMove),
				new Move(1, TileAction.JustMove)
			});
		}

		[Test]
		public static void DontMoveZeroes()
		{
			var row = new[] { 0, 0 };
			var moves = row.MoveRow();
			moves.ShouldBe(new Move[]
			{
				null, null
			});
		}

		[Test]
		public static void MoveSingleTile()
		{
			var row = new[] { 0, 2 };
			var moves = row.MoveRow();
			moves.ShouldBe(new Move[]
			{
				null,
				new Move(0, TileAction.JustMove)
			});
		}
		[Test]
		public static void Double()
		{
			var row = new[] { 2, 2 };
			var moves = row.MoveRow();
			moves.ShouldBe(new Move[]
			{
				new Move(0, TileAction.MoveAndDouble),
				new Move(0, TileAction.MoveAndDisappear)
			});
		}

		[Test]
		public static void DoubleFromRightSide()
		{
			var row = new[] { 2, 2, 2 };
			var moves = row.MoveRow();
			moves.ShouldBe(new Move[]
			{
				new Move(0, TileAction.MoveAndDouble),
				new Move(0, TileAction.MoveAndDisappear),
				new Move(1, TileAction.JustMove)
			});
		}

		[Test]
		public static void MoveAndDouble()
		{
			var row = new[] { 8, 0, 2, 0, 2, 8 };
			var moves = row.MoveRow();
			moves.ShouldBe(new Move[]
			{
				new Move(0, TileAction.JustMove),
				null,
				new Move(1, TileAction.MoveAndDouble),
				null,
				new Move(1, TileAction.MoveAndDisappear),
				new Move(2, TileAction.JustMove)
			});
		}
	}

}
