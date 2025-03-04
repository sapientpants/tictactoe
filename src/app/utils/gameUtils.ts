// Helper function to calculate winner
export function calculateWinner(squares: (string | null)[]): string | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  
  return null;
}

// AI difficulty levels
export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  IMPOSSIBLE = 'impossible'
}

// Function to get AI move based on difficulty
export function getAIMove(
  squares: (string | null)[],
  difficulty: AIDifficulty,
  aiPlayer: string = 'O'
): number {
  const humanPlayer = aiPlayer === 'O' ? 'X' : 'O';
  
  // Get available moves
  const availableMoves = squares
    .map((square, index) => (square === null ? index : null))
    .filter((index): index is number => index !== null);
  
  if (availableMoves.length === 0) return -1;
  
  switch (difficulty) {
    case AIDifficulty.EASY:
      // Random move
      return getRandomMove(availableMoves);
      
    case AIDifficulty.MEDIUM:
      // 50% chance of making a smart move, 50% random
      if (Math.random() < 0.5) {
        return getSmartMove(squares, availableMoves, aiPlayer, humanPlayer) ?? getRandomMove(availableMoves);
      }
      return getRandomMove(availableMoves);
      
    case AIDifficulty.HARD:
      // 80% chance of making a smart move, 20% random
      if (Math.random() < 0.8) {
        return getSmartMove(squares, availableMoves, aiPlayer, humanPlayer) ?? getRandomMove(availableMoves);
      }
      return getRandomMove(availableMoves);
      
    case AIDifficulty.IMPOSSIBLE:
      // Always make the best move using minimax algorithm
      return getBestMove(squares, aiPlayer, humanPlayer);
      
    default:
      return getRandomMove(availableMoves);
  }
}

// Helper function to get a random move
function getRandomMove(availableMoves: number[]): number {
  const randomIndex = Math.floor(Math.random() * availableMoves.length);
  return availableMoves[randomIndex];
}

// Helper function to get a smart move (win or block)
function getSmartMove(
  squares: (string | null)[],
  availableMoves: number[],
  aiPlayer: string,
  humanPlayer: string
): number | null {
  // Try to win
  const winMove = findWinningMove(squares, availableMoves, aiPlayer);
  if (winMove !== null) return winMove;
  
  // Try to block opponent
  const blockMove = findWinningMove(squares, availableMoves, humanPlayer);
  if (blockMove !== null) return blockMove;
  
  // Take center if available
  if (availableMoves.includes(4)) return 4;
  
  // Take corners if available
  const corners = [0, 2, 6, 8].filter(corner => availableMoves.includes(corner));
  if (corners.length > 0) return getRandomMove(corners);
  
  return null;
}

// Helper function to find a winning move
function findWinningMove(
  squares: (string | null)[],
  availableMoves: number[],
  player: string
): number | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  
  for (const line of lines) {
    const [a, b, c] = line;
    // Check if two squares in a line are filled by the player and one is empty
    const playerSquares = line.filter(index => squares[index] === player);
    if (playerSquares.length === 2) {
      const emptyIndex = line.find(index => squares[index] === null);
      if (emptyIndex !== undefined && availableMoves.includes(emptyIndex)) {
        return emptyIndex;
      }
    }
  }
  
  return null;
}

// Minimax algorithm for perfect AI
function getBestMove(
  squares: (string | null)[],
  aiPlayer: string,
  humanPlayer: string
): number {
  // Get available moves
  const availableMoves = squares
    .map((square, index) => (square === null ? index : null))
    .filter((index): index is number => index !== null);
  
  if (availableMoves.length === 0) return -1;
  
  // If only one move is available, take it
  if (availableMoves.length === 1) return availableMoves[0];
  
  // If it's the first move, choose randomly from corners or center
  if (availableMoves.length === 9) {
    const firstMoves = [0, 2, 4, 6, 8];
    return firstMoves[Math.floor(Math.random() * firstMoves.length)];
  }
  
  let bestScore = -Infinity;
  let bestMove = -1;
  
  for (const move of availableMoves) {
    // Make the move
    squares[move] = aiPlayer;
    
    // Calculate score from this move
    const score = minimax(squares, 0, false, aiPlayer, humanPlayer, -Infinity, Infinity);
    
    // Undo the move
    squares[move] = null;
    
    // Update best score and move
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

// Minimax helper function
function minimax(
  squares: (string | null)[],
  depth: number,
  isMaximizing: boolean,
  aiPlayer: string,
  humanPlayer: string,
  alpha: number,
  beta: number
): number {
  // Check terminal states
  const winner = calculateWinner(squares);
  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (!squares.includes(null)) return 0;
  
  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        squares[i] = aiPlayer;
        const score = minimax(squares, depth + 1, false, aiPlayer, humanPlayer, alpha, beta);
        squares[i] = null;
        bestScore = Math.max(score, bestScore);
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < squares.length; i++) {
      if (squares[i] === null) {
        squares[i] = humanPlayer;
        const score = minimax(squares, depth + 1, true, aiPlayer, humanPlayer, alpha, beta);
        squares[i] = null;
        bestScore = Math.min(score, bestScore);
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
    }
    return bestScore;
  }
}