// Theme colors
// Blue: #0062A5
// Gold: #F9B70F

// Also tied to canvas container styles
export const BACKGROUND_COLOR = "#333366";
export const SUCCESS_COLOR = "#80ccaa";
export const ALERT_COLOR = "#ccaa80";

export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 1000;

export const FONT_FAMILY = 'system-ui, sans-serif';

// If this list ever changes, or if the set of puzzles shown in the puzzle selection changes,
// it will change the selected puzzles for the current and past daily challenges!
export const PUZZLE_CONFIGS = {
  'TetrominoGridPuzzle': {
    key: 'TetrominoGridPuzzle',
    name: 'Tetromino Grid Puzzle',
    icon: '🔲︎',
  },
  'ArithmeticGridPuzzle': {
    key: 'ArithmeticGridPuzzle',
    name: 'Arithmetic Grid Puzzle',
    icon: '📝︎',
  },
  'TangledGraphPuzzle': {
    key: 'TangledGraphPuzzle',
    name: 'Tangled Graph Puzzle',
    icon: '🕸︎',
  },
  'LogicGridPuzzle': {
    key: 'LogicGridPuzzle',
    name: 'Logic Grid Puzzle',
    icon: '💭︎',
  },
  'ShiftingGridPuzzle': {
    key: 'ShiftingGridPuzzle',
    name: 'Shifting Grid Puzzle',
    icon: '🚂︎',
  },
  'ColorPiecesGridPuzzle': {
    key: 'ColorPiecesGridPuzzle',
    name: 'Color Pieces Grid Puzzle',
    icon: '🏁︎',
  },
  'LightSwitchesPuzzle': {
    key: 'LightSwitchesPuzzle',
    name: 'Light Switches Puzzle',
    icon: '🚨︎',
  },
  'SliderPathPuzzle': {
    key: 'SliderPathPuzzle',
    name: 'Slider Path Puzzle',
    icon: '🚩︎',
  },
  'EmittersGridPuzzle': {
    key: 'EmittersGridPuzzle',
    name: 'Emitters Grid Puzzle',
    icon: '📻︎',
  },
  'GridMirrorPuzzle': {
    key: 'GridMirrorPuzzle',
    name: 'Grid Mirror Puzzle',
    icon: '🔆︎',
  },
  'CircuitGridPuzzle': {
    key: 'CircuitGridPuzzle',
    name: 'Circuit Grid Puzzle',
    icon: '🔌︎',
  },
  'MarkedLoopPuzzle': {
    key: 'MarkedLoopPuzzle',
    name: 'Marked Loop Puzzle',
    icon: '💍︎',
  },
};
