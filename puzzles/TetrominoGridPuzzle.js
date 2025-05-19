import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, getPuzzleCanvas, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialRecommendation, updateForTutorialState } from "../js/utils.js";

const ROTATIONS = false;
const TETROMINO_SIZE = 4;
const LINE_THICKNESS = 12;

const SNAP_SOUND = 'click';
const ROTATE_SOUND = 'warp';
const CHIME_SOUND = 'chime';

const tutorials = [
  {
    rows: 2,
    cols: 2,
    grid: Array.from({length: 2}, () => Array.from({length: 2}, () => ({
      occupied: false,
    }))),
    tiles: [
      {
        cells: [
          {
            // CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 2);
            // let cellX = CELL_SIZE * cellCoord[0] + CELL_SIZE/2;
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            // coordinates: [cellCoord[0] - tileMinCoordX, cellCoord[1] - tileMinCoordY],
            coordinates: [0, 0],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            coordinates: [0, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            coordinates: [1, 0],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 2),
            coordinates: [1, 1],
          },
        ],
      },
    ],
  },
  {
    rows: 4,
    cols: 4,
    grid: Array.from({length: 4}, (_el, x) => Array.from({length: 4}, (_el, y) => ({
      occupied: x >= 2 && (y <= 0 || y >= 3),
    }))),
    tiles: [
      {
        cells: [
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [2, 1],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [2, 2],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [3, 1],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [3, 2],
          },
        ],
      },
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 0],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 1],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 2],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 3],
          },
        ],
      },
      {
        cells: [
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 0],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 2],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 3],
          },
        ],
      },
    ],
  },
  {
    rows: 4,
    cols: 4,
    grid: Array.from({length: 4}, () => Array.from({length: 4}, () => ({
      occupied: false,
    }))),
    tiles: [
      {
        cells: [
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [2, 0],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [2, 1],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [3, 0],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [3, 1],
          },
        ],
      },
      {
        cells: [
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [2, 2],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [2, 3],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [3, 2],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [3, 3],
          },
        ],
      },
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 0],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 0],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 2],
          },
        ],
      },
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 1],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 2],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [0, 3],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 2),
            coordinates: [1, 3],
          },
        ],
      },
    ],
  },
  {
    rows: 5,
    cols: 5,
    grid: Array.from({length: 5}, (_el, x) => Array.from({length: 5}, (_el, y) => ({
      occupied: (x === 0 && y === 0) || (x === 1 && y === 3) || (x === 4 && (y === 0 || y === 3 || y === 4)),
    }))),
    tiles: [
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 0],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 0],
          },
        ],
      },
      {
        cells: [
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 0],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 1],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 1],
          },
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 1],
          },
        ],
      },
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 2],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 3],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 4],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 4],
          },
        ],
      },
      {
        cells: [
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 2],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 2],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 2],
          },
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 2],
          },
        ],
      },
      {
        cells: [
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 3],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 3],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 4],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 4],
          },
        ],
      },
    ],
  },
  {
    rows: 5,
    cols: 5,
    grid: Array.from({length: 5}, (_el, x) => Array.from({length: 5}, (_el, y) => ({
      occupied: (x === 2 && y === 2),
    }))),
    tiles: [
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 0],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 1],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 2],
          },
        ],
      },
      {
        cells: [
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 0],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 0],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 0],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 1],
          },
        ],
      },
      {
        cells: [
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 0],
          },
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 1],
          },
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 2],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 1],
          },
        ],
      },
      {
        cells: [
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 2],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 3],
          },
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 3],
          },
          {
            x: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [4, 4],
          },
        ],
      },
      {
        cells: [
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 4],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 4],
          },
          {
            x: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [3, 4],
          },
          {
            x: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [2, 3],
          },
        ],
      },
      {
        cells: [
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 2.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 2],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 3],
          },
          {
            x: 0.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 4.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [0, 4],
          },
          {
            x: 1.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            y: 3.5 * Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (5 + 2),
            coordinates: [1, 3],
          },
        ],
      },
    ],
  },
];

let DIFFICULTY;
let COLS;
let ROWS;
let TILES;
let CELL_SIZE;
let CELL_CONNECTION_THICKNESS;

let grid;
let solution;
let dragging = null;
let previousTouch = null;
let tiles = [];
let queuedSounds = [];

function generateGrid() {
  grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => {
    return {
      occupied: false,
    };
  }));

  while (tiles.length < TILES) {
    let availableCoords = [];

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        let spot = grid[i][j];

        if (!spot.occupied) {
          availableCoords.push([i, j]);
        }
      }
    }

    if (availableCoords.length === 0) {
      // Unable to fit enough tiles, so start over
      tiles = [];
      generateGrid();
      return;
    }

    let randomCoord = availableCoords.splice(randomIndex(availableCoords), 1)[0];
    grid[randomCoord[0]][randomCoord[1]].occupied = "used";
    let cellCoords = [randomCoord];

    for (let i = 1; i < TETROMINO_SIZE; i++) {
      let availableNeighbors = [];

      cellCoords.forEach(cellCoord => {
        if (cellCoord[0] > 0 && !grid[cellCoord[0] - 1][cellCoord[1]].occupied) {
          availableNeighbors.push([cellCoord[0] - 1, cellCoord[1]]);
        }

        if (cellCoord[0] < COLS - 1 && !grid[cellCoord[0] + 1][cellCoord[1]].occupied) {
          availableNeighbors.push([cellCoord[0] + 1, cellCoord[1]]);
        }

        if (cellCoord[1] > 0 && !grid[cellCoord[0]][cellCoord[1] - 1].occupied) {
          availableNeighbors.push([cellCoord[0], cellCoord[1] - 1]);
        }

        if (cellCoord[1] < ROWS - 1 && !grid[cellCoord[0]][cellCoord[1] + 1].occupied) {
          availableNeighbors.push([cellCoord[0], cellCoord[1] + 1]);
        }
      });

      if (availableNeighbors.length === 0) {
        cellCoords.forEach(cellCoord => {
          grid[cellCoord[0]][cellCoord[1]].occupied = true;
        });

        break;
      } else {
        let randomNeighbor = availableNeighbors.splice(randomIndex(availableNeighbors), 1)[0];
        grid[randomNeighbor[0]][randomNeighbor[1]].occupied = "used";
        cellCoords.push(randomNeighbor);
      }
    }

    if (cellCoords.length === TETROMINO_SIZE) {
      let tileMinCoordX = cellCoords.reduce((total, coord) => {
        return Math.min(total, coord[0]);
      }, 999);
      let tileMinCoordY = cellCoords.reduce((total, coord) => {
        return Math.min(total, coord[1]);
      }, 999);

      let cellObjects = [];

      cellCoords.forEach(cellCoord => {
        let cellX = CELL_SIZE * cellCoord[0] + CELL_SIZE/2;
        let cellY = CELL_SIZE * cellCoord[1] + CELL_SIZE/2;

        cellObjects.push({
          x: cellX,
          y: cellY,
          coordinates: [cellCoord[0] - tileMinCoordX, cellCoord[1] - tileMinCoordY],
        });
      });

      let tileObj = {
        cells: cellObjects
      };

      // Shuffle the data so the draw order doesn't hint at the solution
      tiles.splice(randomIndex(tiles), 0, tileObj);
    }
  }

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let spot = grid[i][j];

      if (spot.occupied === "used") {
        spot.occupied = false;
      } else if (spot.occupied == false) {
        spot.occupied = true;
      }
    }
  }
}

// Rotates around tile's center
function rotateTile(tile, playSound = true) {
  let oldTileMinCoordX = tile.cells.reduce((total, cell) => {
    return Math.min(total, cell.coordinates[0]);
  }, 999);
  let oldTileMaxCoordX = tile.cells.reduce((total, cell) => {
    return Math.max(total, cell.coordinates[0]);
  }, 0);
  let oldTileMinCoordY = tile.cells.reduce((total, cell) => {
    return Math.min(total, cell.coordinates[1]);
  }, 999);
  let oldTileMaxCoordY = tile.cells.reduce((total, cell) => {
    return Math.max(total, cell.coordinates[1]);
  }, 0);

  tile.cells.forEach(cell => {
    let cellCoord0 = cell.coordinates[0];
    let cellCoord1 = cell.coordinates[1];

    cell.coordinates = [TETROMINO_SIZE - 1 - cellCoord1, cellCoord0];
    let deltaX = cell.coordinates[0] - cellCoord0;
    let deltaY = cell.coordinates[1] - cellCoord1;
    cell.x += deltaX * CELL_SIZE;
    cell.y += deltaY * CELL_SIZE;
  });

  let newTileMinCoordX = tile.cells.reduce((total, cell) => {
    return Math.min(total, cell.coordinates[0]);
  }, 999);
  let newTileMaxCoordX = tile.cells.reduce((total, cell) => {
    return Math.max(total, cell.coordinates[0]);
  }, 0);
  let newTileMinCoordY = tile.cells.reduce((total, cell) => {
    return Math.min(total, cell.coordinates[1]);
  }, 999);
  let newTileMaxCoordY = tile.cells.reduce((total, cell) => {
    return Math.max(total, cell.coordinates[1]);
  }, 0);

  let deltaX = newTileMinCoordX - oldTileMinCoordX + newTileMaxCoordX - oldTileMaxCoordX;
  let deltaY = newTileMinCoordY - oldTileMinCoordY + newTileMaxCoordY - oldTileMaxCoordY;

  let moveX = deltaX * CELL_SIZE / 2;
  let moveY = deltaY * CELL_SIZE / 2;

  tile.cells.forEach(cell => {
    cell.x -= moveX;
    cell.y -= moveY;
  });

  if (playSound) {
    audioManager.play(ROTATE_SOUND);
  }
}

function puzzleSolved(playSound = true) {
  let solved = !dragging && tiles.reduce((valid, tile) => {
    return valid && !tileIsOverlapping(tile, tiles) && tileHasValidPlacement(tile);
  }, true);

  if (window.app.puzzleState.interactive && solved && playSound) {
    endPuzzle(window.app.puzzleState.tutorialStage === tutorials.length);
    audioManager.play(CHIME_SOUND);
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];

  return solved;
}

export function drawInstructions() {
  drawInstructionsHelper("🔲\uFE0E Tetromino Grid Puzzle 🔲\uFE0E",
      ["Fit all the tetromino pieces into the black area.",
          "Pieces must not overlap each other or the white area."],
      ["Drag the pieces to move them."],
      window.app.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  let solved = puzzleSolved();

  context.fillStyle = solved || window.app.puzzleState.showingSolution ?
      SUCCESS_COLOR : BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let tilesToDraw = window.app.puzzleState.showingSolution ? solution : tiles;

  grid.forEach((gridRow, rowIndex) => {
    gridRow.forEach((spot, colIndex) => {
      context.fillStyle = spot.occupied ? "#ffffff" : "#000000"
      context.fillRect(CELL_SIZE * rowIndex, CELL_SIZE * colIndex, CELL_SIZE, CELL_SIZE);
    });
  });

  tilesToDraw.forEach(tile => {
    let isOverlapping = tileIsOverlapping(tile, tilesToDraw);
    let validPlacement = tileHasValidPlacement(tile);
    let tileColor = isOverlapping ? ALERT_COLOR : (validPlacement ? SUCCESS_COLOR : "#808080");

    context.strokeStyle = tileColor;
    context.lineWidth = CELL_CONNECTION_THICKNESS;

    tile.cells.forEach(cell => {
      tile.cells.forEach(otherCell => {
        if (Math.round(Math.abs(cell.x - otherCell.x) + Math.abs(cell.y - otherCell.y)) === Math.round(CELL_SIZE)) {
          context.beginPath();
          context.moveTo(cell.x, cell.y);
          context.lineTo(otherCell.x, otherCell.y);
          context.stroke();
        }
      });
    });

    context.lineWidth = LINE_THICKNESS;

    tile.cells.forEach(cell => {
      context.beginPath();
      context.fillStyle = "#000000";
      context.strokeStyle = tileColor;
      context.arc(cell.x, cell.y, CELL_SIZE/4, 0, 2 * Math.PI, false);
      context.fill();
      context.stroke();
    });
  });
}

function tileIsOverlapping(tileToCheck, tilesList) {
  return tileToCheck !== dragging && tilesList.reduce((overlapping, tile) => {
    return overlapping || (tile !== dragging && tile.cells.reduce((overlappingCell, cell) => {
      return overlappingCell || tileToCheck.cells.reduce((cellOverlaps, cellToCheck) => {
        let cellToCheckCoords = getGridCoordinatesForCell(cellToCheck);
        let cellCoords = getGridCoordinatesForCell(cell);
        return cellOverlaps || (cellToCheck !== cell && cellToCheckCoords[0] === cellCoords[0] && cellToCheckCoords[1] === cellCoords[1]);
      }, false);
    }, false));
  }, false);
}

function tileHasValidPlacement(tile) {
  return tile !== dragging && tile.cells.reduce((valid, cell) => {
    let coords = getGridCoordinatesForCell(cell);
    return valid && coords[0] >= 0 && coords[0] < COLS
        && coords[1] >= 0 && coords[1] < ROWS
        && !grid[coords[0]][coords[1]].occupied;
  }, true);
}

function getGridCoordinatesForCell(cell) {
  return [
    Math.floor(cell.x / CELL_SIZE),
    Math.floor(cell.y / CELL_SIZE)
  ];
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (window.app.puzzleState.tutorialStage > tutorials.length) {
    window.app.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  dragging = null;
  previousTouch = null;
  tiles = [];
  queuedSounds = [];

  if (window.app.puzzleState.tutorialStage) {
    const tutorial = tutorials[window.app.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 2);
    CELL_CONNECTION_THICKNESS = CELL_SIZE / 4;

    grid = deepCopy(tutorial.grid);
    tiles = deepCopy(tutorial.tiles);
  } else {
    DIFFICULTY = window.app.router.difficulty;

    // Quick: 6/6/7, Casual: 7/6/9, Challenging: 7/7/10, Intense: 8/7/12
    COLS = 6 + Math.floor(DIFFICULTY / 2);
    ROWS = 5 + Math.floor((DIFFICULTY + 1) / 2);
    TILES = 6 + DIFFICULTY + (DIFFICULTY > 1 ? 1 : 0) + (DIFFICULTY > 3 ? 1 : 0);

    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 2);
    CELL_CONNECTION_THICKNESS = CELL_SIZE / 4;

    generateGrid();
  }

  solution = deepCopy(tiles);

  // Place on bottom or right edge to not obscure the grid
  let bottomEdge = Math.random() < 0.5;

  do {
    // Randomize tile orientations and positions
    tiles.forEach(tile => {
      if (ROTATIONS) {
        let tileRotations = Math.floor(Math.random() * 4);
        for (let i = 0; i < tileRotations; i++) {
          rotateTile(tile, false);
        }
      }

      let tileMinCoordX = tile.cells.reduce((total, cell) => {
        return Math.min(total, cell.coordinates[0]);
      }, 999);
      let tileMaxCoordX = tile.cells.reduce((total, cell) => {
        return Math.max(total, cell.coordinates[0]);
      }, 0);
      let tileMinCoordY = tile.cells.reduce((total, cell) => {
        return Math.min(total, cell.coordinates[1]);
      }, 999);
      let tileMaxCoordY = tile.cells.reduce((total, cell) => {
        return Math.max(total, cell.coordinates[1]);
      }, 0);

      let maxX = CANVAS_WIDTH - CELL_SIZE * (0.5 + tileMaxCoordX - tile.cells[0].coordinates[0]);
      let minX = !bottomEdge ? maxX
          : CELL_SIZE * (0.5 + tile.cells[0].coordinates[0] - tileMinCoordX);
      let moveX = Math.random() * (maxX - minX) + minX - tile.cells[0].x;

      let maxY = CANVAS_WIDTH - CELL_SIZE * (0.5 + tileMaxCoordY - tile.cells[0].coordinates[1]);
      let minY = bottomEdge ? maxY
          : CELL_SIZE * (0.5 + tile.cells[0].coordinates[1] - tileMinCoordY);
      let moveY = Math.random() * (maxY - minY) + minY - tile.cells[0].y;

      tile.cells.forEach(cell => {
        cell.x += moveX;
        cell.y += moveY;
      });

      bottomEdge = !bottomEdge;
    });
  } while (puzzleSolved());

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = (event.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
      let mouseY = (event.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

      // For-each loops cannot be broken out of!
      // Reverse the order so tiles in front are picked up first.
      for (let i = tiles.length - 1; i >= 0; i--) {
        let tile = tiles[i];

        if (!tile.fixed) {
          for (let j = 0; j < tile.cells.length; j++) {
            let cell = tile.cells[j];

            if (Math.abs(mouseX - cell.x) < CELL_SIZE / 2
                && Math.abs(mouseY - cell.y) < CELL_SIZE / 2) {
              dragging = tile;
              return;
            }
          }
        }
      }
    }

  // Right click
  } else if (event.button === 2) {
    if (window.app.puzzleState.interactive && dragging && ROTATIONS) {
      rotateTile(dragging);

      drawPuzzle();
    }

  // Middle click
  } else if (event.button === 1) {
    if (dragging) {
      snapToGrid(dragging);
      dragging = null;
    }

    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  // Single touch
  if (!dragging && event.changedTouches.length === 1) {
    if (window.app.puzzleState.interactive) {
      event.preventDefault();

      let touch = event.changedTouches[0];
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
      let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

      // For-each loops cannot be broken out of!
      // Reverse the order so tiles in front are picked up first.
      for (let i = tiles.length - 1; i >= 0; i--) {
        let tile = tiles[i];

        if (!tile.fixed) {
          for (let j = 0; j < tile.cells.length; j++) {
            let cell = tile.cells[j];

            if (Math.abs(touchX - cell.x) < CELL_SIZE / 2
                && Math.abs(touchY - cell.y) < CELL_SIZE / 2) {
              previousTouch = touch;
              dragging = tile;
              return;
            }
          }
        }
      }
    }

  // Double tap
  } else if (dragging && event.touches.length === 2) {
    if (window.app.puzzleState.interactive && ROTATIONS) {
      event.preventDefault();

      rotateTile(dragging);

      drawPuzzle();
    }
  }
}

export function onMouseMove(event) {
  if (window.app.puzzleState.interactive && dragging) {
    // Can happen if mouse down triggered from touch end...
    if (!isNaN(event.movementX) && !isNaN(event.movementY)) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();

      dragging.cells.forEach(cell => {
        cell.x += event.movementX * CANVAS_WIDTH / canvasRect.width;
        cell.y += event.movementY * CANVAS_HEIGHT / canvasRect.height;
      });

      drawPuzzle();
    }
  }
}

export function onTouchMove(event) {
  if (window.app.puzzleState.interactive && dragging && previousTouch) {
    let movedTouch;
    let changedTouches = [...event.changedTouches];

    for (let i = 0; i < changedTouches.length; i++) {
      if (changedTouches[i].identifier === previousTouch.identifier) {
        movedTouch = changedTouches[i];
        break;
      }
    }

    if (movedTouch) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();

      // Detect drag-out
      if (movedTouch.clientX < canvasRect.left
          || movedTouch.clientX > canvasRect.right
          || movedTouch.clientY < canvasRect.top
          || movedTouch.clientY > canvasRect.bottom) {
        snapToGrid(dragging);
        dragging = null;
        previousTouch = null;
      } else {
        let movementX = movedTouch.clientX - previousTouch.clientX;
        let movementY = movedTouch.clientY - previousTouch.clientY;

        previousTouch = movedTouch;

        dragging.cells.forEach(cell => {
          cell.x += movementX * CANVAS_WIDTH / canvasRect.width;
          cell.y += movementY * CANVAS_HEIGHT / canvasRect.height;
        });
      }

      drawPuzzle();
    }
  }
}

export function onMouseUp(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive && dragging) {
      snapToGrid(dragging);
      dragging = null;

      drawPuzzle();
    }

    dragging = null;

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseUp();
  }
}

export function onTouchEnd(event) {
  if (window.app.puzzleState.interactive && dragging && previousTouch) {
    event.preventDefault();

    let changedTouches = [...event.changedTouches];

    for (let i = 0; i < changedTouches.length; i++) {
      if (changedTouches[i].identifier === previousTouch.identifier) {
        previousTouch = null;
        snapToGrid(dragging);
        dragging = null;

        drawPuzzle();

        return;
      }
    }
  }
}

export function onMouseOut() {
  if (window.app.puzzleState.interactive && dragging) {
    snapToGrid(dragging);
    dragging = null;

    drawPuzzle();
  }

  dragging = null;
}

function snapToGrid(tile, playSound = true) {
  let xChange;
  let yChange;

  tile.cells.forEach(cell => {
    if (!xChange) {
      xChange = Math.floor(cell.x / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2 - cell.x;
    }

    if (!yChange) {
      yChange = Math.floor(cell.y / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2 - cell.y;
    }

    cell.x += xChange;
    cell.y += yChange;

    if (cell.x < 0) {
      let offset = Math.ceil((0 - cell.x) / CELL_SIZE) * CELL_SIZE;

      tile.cells.forEach(cell => {
        cell.x += offset;
      });
    } else if (cell.x > CANVAS_WIDTH) {
      let offset = Math.ceil((cell.x - CANVAS_WIDTH) / CELL_SIZE) * CELL_SIZE;

      tile.cells.forEach(cell => {
        cell.x -= offset;
      });
    }

    if (cell.y < 0) {
      let offset = Math.ceil((0 - cell.y) / CELL_SIZE) * CELL_SIZE;

      tile.cells.forEach(cell => {
        cell.y += offset;
      });
    } else if (cell.y > CANVAS_HEIGHT) {
      let offset = Math.ceil((cell.y - CANVAS_HEIGHT) / CELL_SIZE) * CELL_SIZE;

      tile.cells.forEach(cell => {
        cell.y -= offset;
      });
    }
  });

  if (playSound) {
    queuedSounds.push(SNAP_SOUND);
  }
}
