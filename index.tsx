import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const TILE_COUNT = 4;
const BEST_SCORE_KEY = 'bestScore2048';

const getTileStyle = (value) => {
  const power = Math.log2(value);
  const background = `var(--color-${value > 2048 ? 'super' : value}, #3c3a32)`;
  const color = `var(--text-${value > 2048 ? 'super' : value}, #f9f6f2)`;
  const fontSize = value > 1000 ? '36px' : value > 100 ? '40px' : '48px';
  return { background, color, fontSize };
};

const Tile = ({ value, x, y }) => {
  if (!value) return null;
  const style = {
    ...getTileStyle(value),
    transform: `translate(calc(${x} * (var(--tile-size) + var(--grid-gap))), calc(${y} * (var(--tile-size) + var(--grid-gap))))`,
  };
  return <div className="tile" style={style}>{value}</div>;
};

const GameBoard = ({ board }) => {
  return (
    <div className="game-board">
      {Array.from({ length: TILE_COUNT * TILE_COUNT }).map((_, i) => (
        <div key={i} className="grid-cell" />
      ))}
      {board.map((tile) => (
        <Tile key={tile.id} value={tile.value} x={tile.x} y={tile.y} />
      ))}
    </div>
  );
};

const GameOverlay = ({ onRestart, isWin }) => (
    <div className="game-overlay">
        <h2>{isWin ? 'You Win!' : 'Game Over!'}</h2>
        <button className="new-game-button" onClick={onRestart}>Try Again</button>
    </div>
);


const App = () => {
  const [board, setBoard] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0'));
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const createInitialBoard = () => {
    let newBoard = Array.from({ length: TILE_COUNT }, () =>
      Array(TILE_COUNT).fill(0)
    );
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    return transformToTileObjects(newBoard);
  };
  
  const startGame = useCallback(() => {
    setBoard(createInitialBoard());
    setScore(0);
    setIsGameOver(false);
    setIsWin(false);
  }, []);

  const transformToTileObjects = (grid) => {
    const tiles = [];
    let idCounter = 1;
    for (let r = 0; r < TILE_COUNT; r++) {
      for (let c = 0; c < TILE_COUNT; c++) {
        if (grid[r][c] !== 0) {
          tiles.push({ value: grid[r][c].value || grid[r][c], x: c, y: r, id: idCounter++ });
        }
      }
    }
    return tiles;
  };
  
  const getGrid = () => {
    const grid = Array.from({ length: TILE_COUNT }, () =>
      Array(TILE_COUNT).fill(0)
    );
    board.forEach(tile => {
      grid[tile.y][tile.x] = tile.value;
    });
    return grid;
  };

  const addRandomTile = (grid) => {
    const emptyCells = [];
    for (let r = 0; r < TILE_COUNT; r++) {
      for (let c = 0; c < TILE_COUNT; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
    return grid;
  };

  const move = useCallback((direction) => {
    if (isGameOver && !isWin) return;
    
    let currentGrid = getGrid();
    let scoreToAdd = 0;
    let moved = false;
    
    const rotate = (grid) => {
      const newGrid = Array.from({ length: TILE_COUNT }, () => Array(TILE_COUNT).fill(0));
      for (let r = 0; r < TILE_COUNT; r++) {
        for (let c = 0; c < TILE_COUNT; c++) {
          newGrid[r][c] = grid[TILE_COUNT - 1 - c][r];
        }
      }
      return newGrid;
    };
    
    // Rotate board to always handle move left
    const rotations = { 'up': 1, 'right': 2, 'down': 3, 'left': 0 };
    for (let i = 0; i < rotations[direction]; i++) {
        currentGrid = rotate(currentGrid);
    }

    for (let r = 0; r < TILE_COUNT; r++) {
      const row = currentGrid[r].filter(cell => cell !== 0);
      const newRow = [];
      for (let i = 0; i < row.length; i++) {
        if (i + 1 < row.length && row[i] === row[i + 1]) {
          const newValue = row[i] * 2;
          newRow.push(newValue);
          scoreToAdd += newValue;
          if (newValue === 2048) setIsWin(true);
          i++; // Skip next tile
        } else {
          newRow.push(row[i]);
        }
      }
      
      const paddedRow = newRow.concat(Array(TILE_COUNT - newRow.length).fill(0));
      if (currentGrid[r].join(',') !== paddedRow.join(',')) {
        moved = true;
      }
      currentGrid[r] = paddedRow;
    }

    // Rotate back
    for (let i = 0; i < (4 - rotations[direction]) % 4; i++) {
        currentGrid = rotate(currentGrid);
    }
    
    if (moved) {
      currentGrid = addRandomTile(currentGrid);
      setBoard(transformToTileObjects(currentGrid));
      setScore(s => s + scoreToAdd);
      if (score + scoreToAdd > bestScore) {
          setBestScore(score + scoreToAdd);
          localStorage.setItem(BEST_SCORE_KEY, (score + scoreToAdd).toString());
      }
      checkGameOver(currentGrid);
    }
  }, [board, score, bestScore, isGameOver, isWin]);

  const checkGameOver = (grid) => {
    for (let r = 0; r < TILE_COUNT; r++) {
        for (let c = 0; c < TILE_COUNT; c++) {
            if (grid[r][c] === 0) return; // empty cell
            if (r < TILE_COUNT - 1 && grid[r][c] === grid[r + 1][c]) return; // can move down
            if (c < TILE_COUNT - 1 && grid[r][c] === grid[r][c + 1]) return; // can move right
        }
    }
    setIsGameOver(true);
  };

  useEffect(() => {
    startGame();
  }, [startGame]);
  
  const handleKeyDown = useCallback((e) => {
    const keyMap = {
      'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
      'w': 'up', 's': 'down', 'a': 'left', 'd': 'right'
    };
    if (keyMap[e.key]) {
      e.preventDefault();
      move(keyMap[e.key]);
    }
  }, [move]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) { // threshold
      const direction = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      move(direction);
    }
    setTouchStart(null);
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="header">
            <h1>2048</h1>
            <div className="scores-container">
                <div className="score-box">
                    <div className="score-box-label">SCORE</div>
                    <div className="score-box-value">{score}</div>
                </div>
                <div className="score-box">
                    <div className="score-box-label">BEST</div>
                    <div className="score-box-value">{bestScore}</div>
                </div>
            </div>
        </div>
        <button className="new-game-button" onClick={startGame}>New Game</button>
        <div style={{ position: 'relative' }}>
          {(isGameOver || isWin) && <GameOverlay onRestart={startGame} isWin={isWin} />}
          <GameBoard board={board} />
        </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
