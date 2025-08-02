
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const TILE_COUNT = 4;
const BEST_SCORE_KEY = 'bestScore2048';

interface TileData {
  value: number;
  x: number;
  y: number;
  id: number;
  isNew: boolean;
  isMerged: boolean;
}

const getTileStyle = (value: number) => {
  const background = `var(--color-${value > 2048 ? 'super' : value}, #3c3a32)`;
  const color = `var(--text-${value > 2048 ? 'super' : value}, #f9f6f2)`;
  const fontSize = value > 1000 ? '36px' : value > 100 ? '40px' : '48px';
  return { background, color, fontSize };
};

const Tile = ({ value, x, y, isNew, isMerged }: TileData) => {
  if (!value) return null;
  const tileStyle = getTileStyle(value);
  const transformStyle = {
    transform: `translate(calc(${x} * (var(--tile-size) + var(--grid-gap))), calc(${y} * (var(--tile-size) + var(--grid-gap))))`,
  };
  
  let className = 'tile';
  if (isNew) className += ' tile-new';
  if (isMerged) className += ' tile-merged';

  return <div className={className} style={{...tileStyle, ...transformStyle}}>{value}</div>;
};

const GameBoard = ({ board }: { board: TileData[] }) => {
  return (
    <div className="game-board">
      {Array.from({ length: TILE_COUNT * TILE_COUNT }).map((_, i) => (
        <div key={i} className="grid-cell" />
      ))}
      {board.map((tile) => (
        <Tile key={tile.id} {...tile} />
      ))}
    </div>
  );
};

const GameOverlay = ({ onRestart, isWin }: { onRestart: () => void; isWin: boolean }) => (
    <div className="game-overlay">
        <h2>{isWin ? 'You Win!' : 'Game Over!'}</h2>
        <button className="new-game-button" onClick={onRestart}>Try Again</button>
    </div>
);


const App = () => {
  const [board, setBoard] = useState<TileData[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem(BEST_SCORE_KEY) || '0'));
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  const idCounter = useRef(1);

  const transformToTileObjects = (grid: number[][], animationData: { newTilePos?: { r: number, c: number } | null, mergedCells?: Set<string> } = {}): TileData[] => {
    const { newTilePos, mergedCells } = animationData;
    const tiles: TileData[] = [];
    for (let r = 0; r < TILE_COUNT; r++) {
      for (let c = 0; c < TILE_COUNT; c++) {
        const value = grid[r][c];
        if (value !== 0) {
          const isNew = !!(newTilePos && newTilePos.r === r && newTilePos.c === c);
          const isMerged = !!(mergedCells && mergedCells.has(`${r},${c}`));
          tiles.push({ value, x: c, y: r, id: idCounter.current++, isNew, isMerged });
        }
      }
    }
    return tiles;
  };

  const createInitialBoard = (): TileData[] => {
    let newGrid: number[][] = Array.from({ length: TILE_COUNT }, () => Array(TILE_COUNT).fill(0));
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    return transformToTileObjects(newGrid);
  };
  
  const startGame = useCallback(() => {
    idCounter.current = 1;
    setBoard(createInitialBoard());
    setScore(0);
    setIsGameOver(false);
    setIsWin(false);
  }, []);

  const getGrid = (): number[][] => {
    const grid: number[][] = Array.from({ length: TILE_COUNT }, () => Array(TILE_COUNT).fill(0));
    board.forEach(tile => {
      grid[tile.y][tile.x] = tile.value;
    });
    return grid;
  };

  const addRandomTile = (grid: number[][]): number[][] => {
    const emptyCells: { r: number, c: number }[] = [];
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

  const findNewTilePos = (oldGrid: number[][], newGrid: number[][]): { r: number, c: number } | null => {
    for (let r = 0; r < TILE_COUNT; r++) {
      for (let c = 0; c < TILE_COUNT; c++) {
        if (oldGrid[r][c] === 0 && newGrid[r][c] !== 0) {
          return { r, c };
        }
      }
    }
    return null;
  }

  type Direction = 'up' | 'down' | 'left' | 'right';

  const move = useCallback((direction: Direction) => {
    if (isGameOver && !isWin) return;
    
    let currentGrid: number[][] = getGrid();
    let scoreToAdd = 0;
    let moved = false;
    const mergedCells = new Set<string>();
    
    const rotate = (grid: any[][], times: number): any[][] => {
      let g = grid;
      for (let i = 0; i < times; i++) {
        const newGrid = Array.from({ length: TILE_COUNT }, () => Array(TILE_COUNT).fill(0));
        for (let r = 0; r < TILE_COUNT; r++) {
          for (let c = 0; c < TILE_COUNT; c++) {
            newGrid[r][c] = g[TILE_COUNT - 1 - c][r];
          }
        }
        g = newGrid;
      }
      return g;
    };
    
    const rotations: Record<Direction, number> = { 'up': 1, 'right': 2, 'down': 3, 'left': 0 };
    const numRotations = rotations[direction];
    currentGrid = rotate(currentGrid, numRotations);

    for (let r = 0; r < TILE_COUNT; r++) {
      const row = currentGrid[r].filter(cell => cell !== 0);
      const newRow: number[] = [];
      for (let i = 0; i < row.length; i++) {
        if (i + 1 < row.length && row[i] === row[i + 1]) {
          const newValue = row[i] * 2;
          newRow.push(newValue);
          scoreToAdd += newValue;
          if (newValue === 2048) setIsWin(true);
          
          // Track merged cell position
          const unrotated = rotate([ [r, newRow.length - 1] ], (4-numRotations)%4 )[0];
          mergedCells.add(`${unrotated[0]},${unrotated[1]}`);
          i++;
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

    currentGrid = rotate(currentGrid, (4 - numRotations) % 4);
    
    if (moved) {
      const gridBeforeAddingTile = JSON.parse(JSON.stringify(currentGrid));
      const gridWithNewTile = addRandomTile(currentGrid);
      const newTilePos = findNewTilePos(gridBeforeAddingTile, gridWithNewTile);

      setBoard(transformToTileObjects(gridWithNewTile, { newTilePos, mergedCells }));
      const newScore = score + scoreToAdd;
      setScore(newScore);
      if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem(BEST_SCORE_KEY, newScore.toString());
      }
      checkGameOver(gridWithNewTile);
    }
  }, [board, score, bestScore, isGameOver, isWin]);

  const checkGameOver = (grid: number[][]) => {
    for (let r = 0; r < TILE_COUNT; r++) {
        for (let c = 0; c < TILE_COUNT; c++) {
            if (grid[r][c] === 0) return;
            if (r < TILE_COUNT - 1 && grid[r][c] === grid[r + 1][c]) return;
            if (c < TILE_COUNT - 1 && grid[r][c] === grid[r][c + 1]) return;
        }
    }
    setIsGameOver(true);
  };

  useEffect(() => {
    startGame();
  }, [startGame]);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const keyMap: Record<string, Direction> = {
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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 1) return;
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) { // threshold
      const direction: Direction = absDx > absDy ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      move(direction);
    }
    setTouchStart(null);
  };

  return (
    <div className="container" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={() => setTouchStart(null)}>
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
        <div className="controls">
            <button className="new-game-button" onClick={startGame}>New Game</button>
        </div>
        <div className="game-container">
          {(isGameOver || isWin) && <GameOverlay onRestart={startGame} isWin={isWin} />}
          <GameBoard board={board} />
        </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
