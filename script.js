const BOARD_SIZE = 8;
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

let board;
let currentPlayer;
let gameOver;

const boardEl = document.getElementById("board");
const turnEl = document.getElementById("turn");
const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const modeEl = document.getElementById("mode");
const newGameBtn = document.getElementById("new-game");

function opponent(player) {
  return player === "B" ? "W" : "B";
}

function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function initGame() {
  board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("."));
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = "W";
  board[mid][mid] = "W";
  board[mid - 1][mid] = "B";
  board[mid][mid - 1] = "B";
  currentPlayer = "B";
  gameOver = false;
  messageEl.textContent = "";
  render();
}

function flipsForMove(row, col, player) {
  if (!inBounds(row, col) || board[row][col] !== ".") return [];

  const enemy = opponent(player);
  const flips = [];

  for (const [dr, dc] of DIRECTIONS) {
    let r = row + dr;
    let c = col + dc;
    const path = [];

    while (inBounds(r, c) && board[r][c] === enemy) {
      path.push([r, c]);
      r += dr;
      c += dc;
    }

    if (path.length && inBounds(r, c) && board[r][c] === player) {
      flips.push(...path);
    }
  }

  return flips;
}

function legalMoves(player) {
  const moves = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (flipsForMove(r, c, player).length) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function applyMove(row, col, player) {
  const flips = flipsForMove(row, col, player);
  if (!flips.length) return false;
  board[row][col] = player;
  for (const [r, c] of flips) board[r][c] = player;
  return true;
}

function score() {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === "B") black++;
      if (cell === "W") white++;
    }
  }
  return { black, white };
}

function isGameOver() {
  return legalMoves("B").length === 0 && legalMoves("W").length === 0;
}

function pickComputerMove(player) {
  const moves = legalMoves(player);
  return moves.reduce((best, move) => {
    const flips = flipsForMove(move[0], move[1], player).length;
    if (!best || flips > best.flips) return { move, flips };
    return best;
  }, null)?.move;
}

function advanceTurn() {
  const next = opponent(currentPlayer);
  if (legalMoves(next).length) {
    currentPlayer = next;
    return;
  }

  if (legalMoves(currentPlayer).length) {
    messageEl.textContent = `${next === "B" ? "Black" : "White"} has no legal moves and must pass.`;
    return;
  }

  gameOver = true;
}

function maybeComputerMove() {
  if (gameOver) return;
  const againstComputer = modeEl.value === "hvc";
  if (!(againstComputer && currentPlayer === "W")) return;

  setTimeout(() => {
    const move = pickComputerMove("W");
    if (move) {
      applyMove(move[0], move[1], "W");
      messageEl.textContent = `Computer played ${move[0] + 1}, ${move[1] + 1}.`;
    }
    advanceTurn();
    render();
  }, 350);
}

function render() {
  const legal = legalMoves(currentPlayer);
  boardEl.innerHTML = "";

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = document.createElement("button");
      cell.className = "cell";
      cell.type = "button";
      cell.setAttribute("aria-label", `Row ${r + 1} Column ${c + 1}`);

      const playable = legal.some(([lr, lc]) => lr === r && lc === c);
      if (!gameOver && playable) {
        cell.classList.add("playable");
      }

      const piece = board[r][c];
      if (piece !== ".") {
        const disc = document.createElement("div");
        disc.className = `disc ${piece === "B" ? "black" : "white"}`;
        cell.appendChild(disc);
      }

      cell.addEventListener("click", () => {
        if (gameOver) return;
        const isHumanTurn = modeEl.value === "hvh" || currentPlayer === "B";
        if (!isHumanTurn) return;

        const didMove = applyMove(r, c, currentPlayer);
        if (!didMove) return;

        messageEl.textContent = "";
        if (isGameOver()) {
          gameOver = true;
        } else {
          advanceTurn();
        }
        render();
      });

      boardEl.appendChild(cell);
    }
  }

  const { black, white } = score();
  scoreEl.textContent = `Score — Black: ${black} | White: ${white}`;

  if (gameOver) {
    if (black > white) {
      turnEl.textContent = "Game over: Black wins!";
    } else if (white > black) {
      turnEl.textContent = "Game over: White wins!";
    } else {
      turnEl.textContent = "Game over: It's a tie!";
    }
  } else {
    turnEl.textContent = `Current turn: ${currentPlayer === "B" ? "Black" : "White"}`;
  }

  maybeComputerMove();
}

newGameBtn.addEventListener("click", initGame);
modeEl.addEventListener("change", initGame);

initGame();
