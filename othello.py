#!/usr/bin/env python3
"""Terminal Othello/Reversi game.

Run:
    python othello.py
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional, Tuple

BOARD_SIZE = 8
DIRECTIONS = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1),
]


@dataclass
class Move:
    row: int
    col: int


class OthelloGame:
    def __init__(self) -> None:
        self.board: List[List[str]] = [["." for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        mid = BOARD_SIZE // 2
        self.board[mid - 1][mid - 1] = "W"
        self.board[mid][mid] = "W"
        self.board[mid - 1][mid] = "B"
        self.board[mid][mid - 1] = "B"
        self.current_player = "B"

    @staticmethod
    def opponent(player: str) -> str:
        return "W" if player == "B" else "B"

    @staticmethod
    def in_bounds(row: int, col: int) -> bool:
        return 0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE

    def flips_for_move(self, row: int, col: int, player: str) -> List[Tuple[int, int]]:
        if not self.in_bounds(row, col) or self.board[row][col] != ".":
            return []

        flips: List[Tuple[int, int]] = []
        enemy = self.opponent(player)

        for dr, dc in DIRECTIONS:
            path: List[Tuple[int, int]] = []
            r, c = row + dr, col + dc
            while self.in_bounds(r, c) and self.board[r][c] == enemy:
                path.append((r, c))
                r += dr
                c += dc
            if path and self.in_bounds(r, c) and self.board[r][c] == player:
                flips.extend(path)

        return flips

    def legal_moves(self, player: str) -> List[Move]:
        moves: List[Move] = []
        for r in range(BOARD_SIZE):
            for c in range(BOARD_SIZE):
                if self.flips_for_move(r, c, player):
                    moves.append(Move(r, c))
        return moves

    def apply_move(self, move: Move, player: str) -> bool:
        flips = self.flips_for_move(move.row, move.col, player)
        if not flips:
            return False
        self.board[move.row][move.col] = player
        for r, c in flips:
            self.board[r][c] = player
        return True

    def has_any_moves(self, player: str) -> bool:
        return bool(self.legal_moves(player))

    def is_game_over(self) -> bool:
        return not self.has_any_moves("B") and not self.has_any_moves("W")

    def score(self) -> Tuple[int, int]:
        black = sum(cell == "B" for row in self.board for cell in row)
        white = sum(cell == "W" for row in self.board for cell in row)
        return black, white

    def display(self) -> None:
        print("\n   " + " ".join(str(c + 1) for c in range(BOARD_SIZE)))
        for r in range(BOARD_SIZE):
            print(f"{r + 1:2} " + " ".join(self.board[r]))
        black, white = self.score()
        print(f"\nScore - Black (B): {black} | White (W): {white}")


def parse_move(raw: str) -> Optional[Move]:
    parts = raw.replace(",", " ").split()
    if len(parts) != 2:
        return None
    try:
        row = int(parts[0]) - 1
        col = int(parts[1]) - 1
    except ValueError:
        return None
    return Move(row, col)


def choose_mode() -> str:
    while True:
        print("Choose mode:")
        print("1) Human vs Human")
        print("2) Human vs Computer (computer plays White)")
        choice = input("Enter 1 or 2: ").strip()
        if choice in {"1", "2"}:
            return choice
        print("Invalid choice. Please enter 1 or 2.\n")


def pick_computer_move(game: OthelloGame, player: str) -> Move:
    moves = game.legal_moves(player)
    # Greedy strategy: pick move that flips the most pieces.
    return max(moves, key=lambda m: len(game.flips_for_move(m.row, m.col, player)))


def run_game() -> None:
    mode = choose_mode()
    game = OthelloGame()

    while not game.is_game_over():
        player = game.current_player
        legal = game.legal_moves(player)
        game.display()

        if not legal:
            print(f"\nPlayer {player} has no legal moves and must pass.")
            game.current_player = game.opponent(player)
            continue

        print(f"\nCurrent player: {player}")
        if mode == "2" and player == "W":
            move = pick_computer_move(game, player)
            print(f"Computer chooses: {move.row + 1} {move.col + 1}")
            game.apply_move(move, player)
        else:
            while True:
                raw = input("Enter move as 'row col' (1-8), or q to quit: ").strip()
                if raw.lower() in {"q", "quit", "exit"}:
                    print("Game ended by user.")
                    return
                move = parse_move(raw)
                if move is None or not game.apply_move(move, player):
                    print("Invalid move. Try again.")
                    continue
                break

        game.current_player = game.opponent(player)

    game.display()
    black, white = game.score()
    print("\nGame over!")
    if black > white:
        print("Black wins!")
    elif white > black:
        print("White wins!")
    else:
        print("It's a tie!")


if __name__ == "__main__":
    run_game()
