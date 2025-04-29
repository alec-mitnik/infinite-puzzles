import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialState } from "../js/utils.js";

const TILE_VISIBILITY_RATE = 1;
const GRID_MASK_SIZE = 5;
const COLORS = ["#000000", "#ffffff"]; //, "#ff0000", "#0000ff", "#ffff00"
const LINE_THICKNESS = 12;

const SNAP_SOUND = 'click';
const ROTATE_SOUND = 'warp';
const CHIME_SOUND = 'chime';

const tutorials = [
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
    ],
    tiles: [
      {
        cells: [
          {
            value: COLORS[0],
            // CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 2);
            // GRID_MASK_SIZE * CELL_SIZE * i + cell[0] * CELL_SIZE + CELL_SIZE/2;
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            // [0 or 1, 0 or 1]
            coordinates: [0, 0],
          },
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [1, 0],
          },
        ],
        fixed: false,
      },
      {
        cells: [
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [0, 0],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [1, 0],
          },
        ],
        fixed: false,
      },
    ],
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
    ],
    tiles: [
      {
        cells: [
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [0, 0],
          },
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [1, 0],
          },
        ],
        fixed: false,
      },
      {
        cells: [
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [0, 0],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [1, 0],
          },
        ],
        fixed: false,
      },
    ],
    rotate: true,
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
      [{
        value: COLORS[1],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
    ],
    tiles: [
      {
        cells: [
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [0, 0],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [1, 0],
          },
        ],
        fixed: false,
      },
      {
        cells: [
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [0, 0],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 4) / 2,
            coordinates: [1, 0],
          },
        ],
        fixed: false,
      },
    ],
  },
  {
    rows: 3,
    cols: 2,
    grid: [
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
      [{
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[0],
        show: true,
      },
      {
        value: COLORS[1],
        show: true,
      }],
    ],
    tiles: [
      {
        cells: [
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            coordinates: [1, 0],
          },
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            coordinates: [0, 0],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            coordinates: [0, 1],
          },
        ],
        fixed: false,
      },
      {
        cells: [
          {
            value: COLORS[0],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            y: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            coordinates: [1, 1],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            y: 2 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            coordinates: [1, 2],
          },
          {
            value: COLORS[1],
            x: (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            y: 2 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) + (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 5) / 2,
            coordinates: [0, 2],
          },
        ],
        fixed: false,
      },
    ],
    rotate: true,
  },
];

let DIFFICULTY;
let ROWS;
let COLS;
let FIXED_TILES;
let CELL_SIZE;
let CELL_CONNECTION_THICKNESS;

let grid;
let solution;
let dragging = null;
let previousTouch = null;
let tiles = [];
let queuedSounds = [];

let gridMasks = [
  [
    [
      [0,0],[0,1],[1,1]
    ],[
      [1,0],[2,0]
    ],[
      [3,0],[4,0],[4,1]
    ],[
      [2,1],[2,2]
    ],[
      [3,1],[3,2]
    ],[
      [1,2],[0,2],[0,3]
    ],[
      [4,2],[4,3]
    ],[
      [1,3],[2,3],[2,4]
    ],[
      [3,3],[3,4],[4,4]
    ],[
      [0,4],[1,4]
    ]
  ],[
    [
      [0,0],[1,0]
    ],[
      [2,1],[2,0],[3,0]
    ],[
      [4,0],[4,1]
    ],[
      [0,1],[1,1],[1,2]
    ],[
      [2,2],[3,2],[3,1]
    ],[
      [0,2],[0,3]
    ],[
      [3,3],[4,3],[4,2]
    ],[
      [0,4],[1,4],[1,3]
    ],[
      [2,3],[2,4]
    ],[
      [3,4],[4,4]
    ]
  ],[
    [
      [0,0],[0,1]
    ],[
      [1,1],[1,0],[2,0]
    ],[
      [3,0],[4,0],[4,1]
    ],[
      [2,1],[3,1]
    ],[
      [0,2],[0,3]
    ],[
      [1,2],[2,2]
    ],[
      [3,3],[3,2],[4,2]
    ],[
      [0,4],[1,4],[1,3]
    ],[
      [2,3],[2,4],[3,4]
    ],[
      [4,3],[4,4]
    ]
  ]
];

function generateGrid() {
  return Array.from({length: COLS}, () => Array.from({length: ROWS}, () => {
    return {
      value: COLORS[randomIndex(COLORS)],
      show: Math.random() < TILE_VISIBILITY_RATE
    };
  }));
}

// Requires the matrix be square!!!
function rotateMatrix(matrix) {
  const n = matrix.length;
  const x = Math.floor(n / 2);
  const y = n - 1;

  for (let i = 0; i < x; i++) {
    for (let j = i; j < y - i; j++) {
      let k = matrix[i][j];
      matrix[i][j] = matrix[j][y - i];
      matrix[j][y - i] = matrix[y - i][y - j];
      matrix[y - i][y - j] = matrix[y - j][i];
      matrix[y - j][i] = k;
    }
  }
}

function rotateTileset(tileset) {
  tileset.forEach(tile => {
    tile.cells.forEach(cell => {
      let cellX = cell.x;
      let cellY = cell.y;
      cell.x = CELL_SIZE * ROWS - cellY;
      cell.y = cellX;

      let cellCoord0 = cell.coordinates[0];
      let cellCoord1 = cell.coordinates[1];

      if (cellCoord1 > 0) {
        if (cellCoord0 > 0) {
          cell.coordinates[0] = 0;
        }
      } else {
        if (cellCoord0 === 0) {
          cell.coordinates[0] = 1;
        }
      }

      if (cellCoord0 > 0) {
        if (cellCoord1 === 0) {
          cell.coordinates[1] = 1;
        }
      } else {
        if (cellCoord1 > 0) {
          cell.coordinates[1] = 0;
        }
      }
    });
  });
}

function flipMatrix(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length / 2; j++) {
      let temp = matrix[i][j];
      matrix[i][j] = matrix[i][matrix[i].length - 1 - j];
      matrix[i][matrix[i].length - 1 - j] = temp;
    }
  }
}

function flipTileset(tileset) {
  tileset.forEach(tile => {
    tile.cells.forEach(cell => {
      cell.coordinates[1] = cell.coordinates[1] > 0 ? 0 : 1;
      cell.y = CELL_SIZE * ROWS - cell.y;
    });
  });
}

/* function flipTile(tile) {
  tile.cells.forEach(cell => {
    let cellCoord1 = cell.coordinates[1];

    if (cellCoord1 > 0) {
      cell.coordinates[1] = 0;
      cell.y -= CELL_SIZE;
    } else {
      cell.coordinates[1] = 1;
      cell.y += CELL_SIZE;
    }
  });
} */

// Rotates around mouse position
/* function rotateTile(tile, event = null) {
  let mouseX, mouseY;

  if (event) {
    let canvasRect = event.target.getBoundingClientRect();
    mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
    mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;
  }

  tile.cells.forEach(cell => {
    let cellCoord0 = cell.coordinates[0];
    let cellCoord1 = cell.coordinates[1];

    if (cellCoord1 > 0) {
      if (cellCoord0 > 0) {
        cell.coordinates[0] = 0;

        if (!event) {
          cell.x -= CELL_SIZE;
        }
      }
    } else {
      if (cellCoord0 === 0) {
        cell.coordinates[0] = 1;

        if (!event) {
          cell.x += CELL_SIZE;
        }
      }
    }

    if (cellCoord0 > 0) {
      if (cellCoord1 === 0) {
        cell.coordinates[1] = 1;

        if (!event) {
          cell.y += CELL_SIZE;
        }
      }
    } else {
      if (cellCoord1 > 0) {
        cell.coordinates[1] = 0;

        if (!event) {
          cell.y -= CELL_SIZE;
        }
      }
    }

    if (event) {
      let deltaX = mouseX - cell.x;
      let deltaY = mouseY - cell.y;

      cell.x += deltaY + deltaX;
      cell.y += deltaY - deltaX;
    }
  });
} */

// Rotates around tile's center
function rotateTile(tile, playSound = true) {
  tile.cells.forEach(cell => {
    let cellCoord0 = cell.coordinates[0];
    let cellCoord1 = cell.coordinates[1];

    if (cellCoord1 > 0) {
      if (cellCoord0 > 0) {
        cell.coordinates[0] = 0;
        cell.x -= CELL_SIZE;
      }
    } else {
      if (cellCoord0 === 0) {
        cell.coordinates[0] = 1;
        cell.x += CELL_SIZE;
      }
    }

    if (cellCoord0 > 0) {
      if (cellCoord1 === 0) {
        cell.coordinates[1] = 1;
        cell.y += CELL_SIZE;
      }
    } else {
      if (cellCoord1 > 0) {
        cell.coordinates[1] = 0;
        cell.y -= CELL_SIZE;
      }
    }
  });

  if (tile.cells.length === 2) {
    let cell0Coords = tile.cells[0].coordinates;
    let cell1Coords = tile.cells[1].coordinates;
    let moveX;
    let moveY;

    if (cell0Coords[0] > 0 && cell1Coords[0] > 0) {
      moveX = -CELL_SIZE / 2;
      moveY = -CELL_SIZE / 2;
    } else if (cell0Coords[0] === 0 && cell1Coords[0] === 0) {
      moveX = CELL_SIZE / 2;
      moveY = CELL_SIZE / 2;
    } else if (cell0Coords[1] > 0 && cell1Coords[1] > 0) {
      moveX = CELL_SIZE / 2;
      moveY = -CELL_SIZE / 2;
    } else if (cell0Coords[1] === 0 && cell1Coords[1] === 0) {
      moveX = -CELL_SIZE / 2;
      moveY = CELL_SIZE / 2;
    }

    tile.cells.forEach(cell => {
      cell.x += moveX;
      cell.y += moveY;
    });
  }

  // For rotating around 4-cell coordinate space
  /* if (tile.cells.reduce((offsetX, cell) => {
    return offsetX && cell.coordinates[0] > 0;
  }, true)) {
    tile.cells.forEach(cell => {
      cell.coordinates[0] = 0;
      cell.x -= CELL_SIZE;
    });
  }

  if (tile.cells.reduce((offsetY, cell) => {
    return offsetY && cell.coordinates[1] > 0;
  }, true)) {
    tile.cells.forEach(cell => {
      cell.coordinates[1] = 0;
      cell.y -= CELL_SIZE;
    });
  } */

  if (playSound) {
    audioManager.play(ROTATE_SOUND);
  }
}

export function drawInstructions() {
  drawInstructionsHelper("🏁\uFE0E Color Pieces Grid Puzzle 🏁\uFE0E",
      ["Arrange the puzzle pieces into the grid by color."],
      ["Drag the pieces to move them.  While dragging,",
          "right-click or tap with a 2nd finger to rotate the piece."],
          window.app.puzzleState.tutorialStage, tutorials.length);
}

function puzzleSolved(playSound = true) {
  let solved = !dragging && tiles.reduce((valid, tile) => {
    return valid && !tileIsOverlapping(tile, tiles) && tileHasValidPlacement(tile);
  }, true);

  if (window.app.puzzleState.interactive && solved && playSound) {
    endPuzzle();
    audioManager.play(CHIME_SOUND);
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];

  return solved;
}

export function drawPuzzle() {
  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  let solved = puzzleSolved();

  context.fillStyle = solved || window.app.puzzleState.showingSolution ?
      SUCCESS_COLOR : BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let tilesToDraw = window.app.puzzleState.showingSolution ? solution : tiles;

  if (TILE_VISIBILITY_RATE < 1) {
    context.strokeStyle = "#808080";
    context.lineWidth = LINE_THICKNESS / 2;
    context.beginPath();
    context.rect(0 - LINE_THICKNESS / 4, 0 - LINE_THICKNESS / 4,
        CELL_SIZE * COLS + LINE_THICKNESS / 2, CELL_SIZE * ROWS + LINE_THICKNESS / 2);
    context.stroke();
  }

  grid.forEach((gridRow, rowIndex) => {
    gridRow.forEach((spot, colIndex) => {
      //if (spot.show) {
        context.fillStyle = spot.show ? spot.value : BACKGROUND_COLOR;
        context.fillRect(CELL_SIZE * rowIndex, CELL_SIZE * colIndex, CELL_SIZE, CELL_SIZE);
      //}
    });
  });

  tilesToDraw.forEach(tile => {
    let isOverlapping = tileIsOverlapping(tile, tilesToDraw);
    let validPlacement = tileHasValidPlacement(tile);
    let tileColor = isOverlapping ? ALERT_COLOR : (validPlacement ? SUCCESS_COLOR : "#808080");

    context.beginPath();
    context.strokeStyle = tileColor;
    context.lineWidth = CELL_CONNECTION_THICKNESS;

    tile.cells.forEach(cell => {
      context.lineTo(cell.x, cell.y);
    });

    context.stroke();
    context.lineWidth = LINE_THICKNESS;

    tile.cells.forEach(cell => {
      context.beginPath();
      context.fillStyle = tile.fixed ? (isOverlapping ? ALERT_COLOR : SUCCESS_COLOR) : cell.value;
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
        && grid[coords[0]][coords[1]].value === cell.value;
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
  }

  dragging = null;
  previousTouch = null;
  queuedSounds = [];
  let rotateForTutorial;

  if (window.app.puzzleState.tutorialStage) {
    const tutorial = tutorials[window.app.puzzleState.tutorialStage - 1];
    rotateForTutorial = tutorial.rotate;

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 2);
    CELL_CONNECTION_THICKNESS = CELL_SIZE / 4;

    grid = deepCopy(tutorial.grid);
    tiles = deepCopy(tutorial.tiles);
  } else {
    DIFFICULTY = window.app.router.difficulty;

    // Quick: 5/5/3, Casual: 5/5/0, Challenging: 10/10/20, Intense: 10/10/10
    ROWS = GRID_MASK_SIZE + (DIFFICULTY > 2 ? GRID_MASK_SIZE : 0);
    COLS = GRID_MASK_SIZE + (DIFFICULTY > 2 ? GRID_MASK_SIZE : 0);
    FIXED_TILES = DIFFICULTY === 1 ? 2 : (DIFFICULTY === 2 ? 0 : (DIFFICULTY === 3 ? 20 : 10));
    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 2);
    CELL_CONNECTION_THICKNESS = CELL_SIZE / 4;

    grid = generateGrid();
    tiles = [];

    for (let i = 0; i < COLS / GRID_MASK_SIZE; i++) {
      for (let j = 0; j < ROWS / GRID_MASK_SIZE; j++) {
        let gridMask = gridMasks[randomIndex(gridMasks)];

        gridMask.forEach(tile => {
          let cellObjects = [];
          let tileMinCoordX = tile.reduce((total, cell) => {
            return Math.min(total, cell[0]);
          }, 999);
          let tileMinCoordY = tile.reduce((total, cell) => {
            return Math.min(total, cell[1]);
          }, 999);

          tile.forEach(cell => {
            let cellX = GRID_MASK_SIZE * CELL_SIZE * i + cell[0] * CELL_SIZE + CELL_SIZE/2;
            let cellY = GRID_MASK_SIZE * CELL_SIZE * j + cell[1] * CELL_SIZE + CELL_SIZE/2;

            let cellObject = {
              value: grid[GRID_MASK_SIZE * i + cell[0]][GRID_MASK_SIZE * j + cell[1]].value,
              x: cellX,
              y: cellY,
              coordinates: [cell[0] === tileMinCoordX ? 0 : 1, cell[1] === tileMinCoordY ? 0 : 1],
            };
            cellObjects.push(cellObject);
          });

          let tileObject = {
            cells: cellObjects,
            fixed: false,
          };

          // Shuffle the data so the draw order doesn't reveal the solution
          tiles.splice(randomIndex(tiles), 0, tileObject);
        });
      }
    }

    let rotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < rotations; i++) {
      rotateMatrix(grid);
      rotateTileset(tiles);
    }

    if (Math.random() < 0.5) {
      flipMatrix(grid);
      flipTileset(tiles);
    }

    let moveableTiles = [...tiles];

    for (let i = 0; i < FIXED_TILES; i++) {
      let fixedTile = moveableTiles.splice(randomIndex(moveableTiles), 1)[0];
      fixedTile.fixed = true;

      fixedTile.cells.forEach(cell => {
        let coord = getGridCoordinatesForCell(cell);
        grid[coord[0]][coord[1]].show = false;
      });
    }
  }

  solution = deepCopy(tiles);

  // Place on bottom or right edge to not obscure the grid
  let bottomEdge = Math.random() < 0.5;

  do {
    tiles.forEach((tile, index) => {
      if (!tile.fixed) {
        let tileRotations = Math.floor(Math.random() * 4);

        if (window.app.puzzleState.tutorialStage) {
          tileRotations = index === 0 && rotateForTutorial ? 1 : 0;
        }

        for (let i = 0; i < tileRotations; i++) {
          rotateTile(tile, false);
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
      }
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
      let canvasRect = event.target.getBoundingClientRect();
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
    if (window.app.puzzleState.interactive && dragging) {
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
      let canvasRect = document.getElementById("puzzleCanvas").getBoundingClientRect();
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
    if (window.app.puzzleState.interactive) {
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
      let canvasRect = event.target.getBoundingClientRect();

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
      let canvasRect = document.getElementById("puzzleCanvas").getBoundingClientRect();

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
