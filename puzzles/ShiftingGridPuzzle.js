import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, getPuzzleCanvas, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialRecommendation, updateForTutorialState } from "../js/utils.js";

const HISTORY_LIMIT = 100;

const OFFSET_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 10;
const ARROW_SIZE = OFFSET_SIZE * 4 / 5;

const ARROW_THICKNESS = 12;
const LINE_THICKNESS = ARROW_THICKNESS * 2;
const TILE_BORDER = LINE_THICKNESS / 2;

const DIRECTION = Object.freeze({
  "UP": 1,
  "RIGHT": 2,
  "DOWN": 3,
  "LEFT": 4,
});

const SHIFT_SOUND = "whir";
const UNDO_SOUND = "warp";
const RESTART_SOUND = "boing";
const SAVE_SOUND = "click";
const LOAD_SOUND = "boing";
const CHIME_SOUND = "chime";

const tutorials = [
  {
    rows: 2,
    cols: 2,
    // grid: Array.from({length: COLS}, (_el, x) => Array.from({length: ROWS}, (_el, y) => ({
    //   id: (1000 * x + y),
    //   coord: [x, y],
    //   connections: [DIRECTION.UP],
    // }))),
    grid: [
      [
        {
          id: 0,
          coord: [0, 0],
          connections: [DIRECTION.DOWN, DIRECTION.RIGHT],
        },
        {
          id: 1,
          coord: [0, 1],
          connections: [DIRECTION.UP],
        },
      ],
      [
        {
          id: 1000,
          coord: [1, 0],
          connections: [DIRECTION.LEFT, DIRECTION.DOWN],
        },
        {
          id: 1001,
          coord: [1, 1],
          connections: [DIRECTION.UP],
        },
      ],
    ],
    startingTileId: 1,
    shuffles: [
      {
        direction: DIRECTION.DOWN,
        rowOrColIndex: 1,
      },
    ],
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [
        {
          id: 0,
          coord: [0, 0],
          connections: [DIRECTION.UP, DIRECTION.RIGHT],
        },
        {
          id: 1,
          coord: [0, 1],
          connections: [DIRECTION.DOWN],
        },
      ],
      [
        {
          id: 1000,
          coord: [1, 0],
          connections: [DIRECTION.DOWN, DIRECTION.LEFT],
        },
        {
          id: 1001,
          coord: [1, 1],
          connections: [DIRECTION.UP],
        },
      ],
    ],
    startingTileId: 0,
    shuffles: [
      {
        direction: DIRECTION.DOWN,
        rowOrColIndex: 1,
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    grid: [
      [
        {
          id: 0,
          coord: [0, 0],
          connections: [DIRECTION.DOWN, DIRECTION.RIGHT, DIRECTION.LEFT],
        },
        {
          id: 1,
          coord: [0, 1],
          connections: [DIRECTION.UP],
        },
      ],
      [
        {
          id: 1000,
          coord: [1, 0],
          connections: [DIRECTION.LEFT, DIRECTION.DOWN],
        },
        {
          id: 1001,
          coord: [1, 1],
          connections: [DIRECTION.UP, DIRECTION.RIGHT],
        },
      ],
      [
        {
          id: 2000,
          coord: [2, 0],
          connections: [DIRECTION.RIGHT],
        },
        {
          id: 2001,
          coord: [2, 1],
          connections: [DIRECTION.LEFT],
        },
      ],
    ],
    startingTileId: 0,
    shuffles: [
      {
        direction: DIRECTION.UP,
        rowOrColIndex: 2,
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    grid: [
      [
        {
          id: 0,
          coord: [0, 0],
          connections: [DIRECTION.DOWN, DIRECTION.RIGHT, DIRECTION.LEFT],
        },
        {
          id: 1,
          coord: [0, 1],
          connections: [DIRECTION.UP],
        },
      ],
      [
        {
          id: 1000,
          coord: [1, 0],
          connections: [DIRECTION.LEFT, DIRECTION.DOWN],
        },
        {
          id: 1001,
          coord: [1, 1],
          connections: [DIRECTION.UP, DIRECTION.RIGHT],
        },
      ],
      [
        {
          id: 2000,
          coord: [2, 0],
          connections: [DIRECTION.RIGHT],
        },
        {
          id: 2001,
          coord: [2, 1],
          connections: [DIRECTION.LEFT],
        },
      ],
    ],
    startingTileId: 0,
    shuffles: [
      {
        direction: DIRECTION.RIGHT,
        rowOrColIndex: 1,
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    grid: [
      [
        {
          id: 0,
          coord: [0, 0],
          connections: [DIRECTION.DOWN, DIRECTION.RIGHT, DIRECTION.LEFT],
        },
        {
          id: 1,
          coord: [0, 1],
          connections: [DIRECTION.UP],
        },
      ],
      [
        {
          id: 1000,
          coord: [1, 0],
          connections: [DIRECTION.LEFT, DIRECTION.DOWN],
        },
        {
          id: 1001,
          coord: [1, 1],
          connections: [DIRECTION.UP, DIRECTION.RIGHT],
        },
      ],
      [
        {
          id: 2000,
          coord: [2, 0],
          connections: [DIRECTION.RIGHT],
        },
        {
          id: 2001,
          coord: [2, 1],
          connections: [DIRECTION.LEFT],
        },
      ],
    ],
    startingTileId: 0,
    shuffles: [
      {
        direction: DIRECTION.UP,
        rowOrColIndex: 2,
      },
      {
        direction: DIRECTION.RIGHT,
        rowOrColIndex: 1,
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    grid: [
      [
        {
          id: 0,
          coord: [0, 0],
          connections: [DIRECTION.DOWN, DIRECTION.RIGHT],
        },
        {
          id: 1,
          coord: [0, 1],
          connections: [DIRECTION.UP],
        },
      ],
      [
        {
          id: 1000,
          coord: [1, 0],
          connections: [DIRECTION.LEFT, DIRECTION.DOWN],
        },
        {
          id: 1001,
          coord: [1, 1],
          connections: [DIRECTION.UP, DIRECTION.RIGHT],
        },
      ],
      [
        {
          id: 2000,
          coord: [2, 0],
          connections: [DIRECTION.DOWN],
        },
        {
          id: 2001,
          coord: [2, 1],
          connections: [DIRECTION.LEFT, DIRECTION.UP],
        },
      ],
    ],
    startingTileId: 1001,
    shuffles: [
      {
        direction: DIRECTION.DOWN,
        rowOrColIndex: 0,
      },
      {
        direction: DIRECTION.LEFT,
        rowOrColIndex: 0,
      },
      {
        direction: DIRECTION.DOWN,
        rowOrColIndex: 0,
      },
      {
        direction: DIRECTION.RIGHT,
        rowOrColIndex: 0,
      },
      {
        direction: DIRECTION.UP,
        rowOrColIndex: 0,
      },
    ],
  },
];

let DIFFICULTY;
let SHUFFLE_SHIFTS;
let ROWS;
let COLS;
let CELL_SIZE;
let NODE_SIZE;

let savedGrid;
let gridHistory;
let grid;
let startingTile;
let solution;
let solutionStartingTile;
let solutionSteps;
let queuedSounds = [];

function generateGrid() {
  grid = Array.from({length: COLS}, (_el, x) => Array.from({length: ROWS}, (_el, y) => ({
    id: (1000 * x + y),
    coord: [x, y],
    connections: [],
  })));

  let tiles = grid.flat();
  startingTile = tiles[randomIndex(tiles)];
  let connectedTiles = [startingTile];

  while (connectedTiles.length < tiles.length) {
    let tile = connectedTiles[randomIndex(connectedTiles)];
    let availableDirections = Object.values(DIRECTION)
        .filter(dir => !tile.connections.includes(dir));

    let connectionMade = false;
    while (!connectionMade) {
      if (!availableDirections.length) {
        //console.log("Restarting Grid Generation");
        generateGrid();
        return;
      }

      let randomDirection =
          availableDirections.splice(randomIndex(availableDirections), 1)[0];
      let neighbor = getNeighborTile(tile, randomDirection);

      if (connectedTiles.includes(neighbor)) {
        continue;
      }

      tile.connections.push(randomDirection);
      neighbor.connections.push(getDirectionComplement(randomDirection));
      connectedTiles.push(neighbor);
      connectionMade = true;
    }
  }

  solution = deepCopy(grid);
  solutionStartingTile = getStartingTileForGrid(solution);
}

function getStartingTileForGrid(gridToUse, startingTileId = startingTile?.id) {
  let tiles = gridToUse.flat();

  for (let i = 0; i < tiles.length; i++) {
    let tile = tiles[i];

    if (tile.id === startingTileId) {
      return tile;
    }
  }

  console.error("Starting tile not found:", template, gridToUse);
}

function getNeighborCoord(coord, direction) {
  let neighborCoord = [...coord];

  switch (direction) {
    case DIRECTION.UP:
      if (coord[1] <= 0) {
        neighborCoord[1] = ROWS - 1;
      } else {
        neighborCoord[1]--;
      }

      break;
    case DIRECTION.RIGHT:
      if (coord[0] >= COLS - 1) {
        neighborCoord[0] = 0;
      } else {
        neighborCoord[0]++;
      }

      break;
    case DIRECTION.DOWN:
      if (coord[1] >= ROWS - 1) {
        neighborCoord[1] = 0;
      } else {
        neighborCoord[1]++;
      }

      break;
    case DIRECTION.LEFT:
      if (coord[0] <= 0) {
        neighborCoord[0] = COLS - 1;
      } else {
        neighborCoord[0]--;
      }

      break;
    default:
      console.error("Unrecognized direction:", direction);
  }

  return neighborCoord;
}

function getNeighborTile(tile, direction, gridToDraw = grid) {
  let neighborCoord = getNeighborCoord(tile.coord, direction);
  return gridToDraw[neighborCoord[0]][neighborCoord[1]];
}

function getDirectionComplement(direction) {
  let complement = null;

  switch (direction) {
    case DIRECTION.UP:
      complement = DIRECTION.DOWN;
      break;
    case DIRECTION.RIGHT:
      complement = DIRECTION.LEFT;
      break;
    case DIRECTION.DOWN:
      complement = DIRECTION.UP;
      break;
    case DIRECTION.LEFT:
      complement = DIRECTION.RIGHT;
      break;
    default:
      console.error("Unrecognized direction:", direction);
  }

  return complement;
}

function shiftColumnUp(index) {
  let columnTiles = grid.flat().filter(tile => {
    return tile.coord[0] === index;
  });

  columnTiles.forEach(tile => {
    let newY = tile.coord[1] <= 0 ? ROWS - 1 : tile.coord[1] - 1;
    tile.coord[1] = newY;
    grid[tile.coord[0]][tile.coord[1]] = tile;
  });
}

function shiftRowRight(index) {
  let rowTiles = grid.flat().filter(tile => {
    return tile.coord[1] === index;
  });

  rowTiles.forEach(tile => {
    let newY = tile.coord[0] >= COLS - 1 ? 0 : tile.coord[0] + 1;
    tile.coord[0] = newY;
    grid[tile.coord[0]][tile.coord[1]] = tile;
  });
}

function shiftColumnDown(index) {
  let columnTiles = grid.flat().filter(tile => {
    return tile.coord[0] === index;
  });

  columnTiles.forEach(tile => {
    let newY = tile.coord[1] >= ROWS - 1 ? 0 : tile.coord[1] + 1;
    tile.coord[1] = newY;
    grid[tile.coord[0]][tile.coord[1]] = tile;
  });
}

function shiftRowLeft(index) {
  let rowTiles = grid.flat().filter(tile => {
    return tile.coord[1] === index;
  });

  rowTiles.forEach(tile => {
    let newY = tile.coord[0] <= 0 ? COLS - 1 : tile.coord[0] - 1;
    tile.coord[0] = newY;
    grid[tile.coord[0]][tile.coord[1]] = tile;
  });
}

function shiftAtIndex(index, direction) {
  switch (direction) {
    case DIRECTION.UP:
      shiftColumnUp(index);
      break;
    case DIRECTION.RIGHT:
      shiftRowRight(index);
      break;
    case DIRECTION.DOWN:
      shiftColumnDown(index);
      break;
    case DIRECTION.LEFT:
      shiftRowLeft(index);
      break;
    default:
      console.error("Unrecognized direction:", direction);
  }
}

function isHorizontal(direction) {
  return direction === DIRECTION.LEFT || direction === DIRECTION.RIGHT;
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (window.app.puzzleState.tutorialStage > tutorials.length) {
    window.app.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  queuedSounds = [];
  gridHistory = [];

  if (window.app.puzzleState.tutorialStage) {
    const tutorial = tutorials[window.app.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
    NODE_SIZE = CELL_SIZE / 6;

    const startingTileId = tutorial.startingTileId;
    grid = deepCopy(tutorial.grid);
    solution = deepCopy(grid);
    startingTile = getStartingTileForGrid(grid, startingTileId);
    solutionStartingTile = getStartingTileForGrid(solution);

    const shuffles = tutorial.shuffles;
    solutionSteps = [];

    for (const {direction, rowOrColIndex} of shuffles) {
      shiftAtIndex(rowOrColIndex, direction);

      solutionSteps.unshift(
        [rowOrColIndex, getDirectionComplement(direction)]
      );
    }
  } else {
    DIFFICULTY = window.app.router.difficulty;

    // Must not exceed 12 to ensure enough space to show solution steps
    SHUFFLE_SHIFTS = Math.floor(Math.random() * (DIFFICULTY + 3)) + DIFFICULTY + 2;
    // 2x3/2x4/3x3/3x4
    ROWS = DIFFICULTY <= 2 ? 2 : 3;
    COLS = DIFFICULTY % 2 === 0 ? 4 : 3;
    CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
    NODE_SIZE = CELL_SIZE / 6;

    generateGrid();

    let directions = Object.values(DIRECTION);
    let solved = true;

    while (solved) {
      // [[index, direction], ...]
      solutionSteps = [];
      let latestShiftLengths = {
        true: {},
        false: {},
      };

      for (let i = 0; i < SHUFFLE_SHIFTS; i++) {
        let prevDirection = solutionSteps.length ? solutionSteps[0][1] : null;
        let isPrevShiftHorizontal = prevDirection ? isHorizontal(prevDirection) : false;
        let randomDirection;
        let isShiftHorizontal;
        let randomIndexUpperLimit;
        let randomIndexValue;
        let currentShift;

        do {
          randomDirection = directions[randomIndex(directions)];
          isShiftHorizontal = isHorizontal(randomDirection);
          randomIndexUpperLimit = isShiftHorizontal ? ROWS : COLS;
          randomIndexValue = Math.floor(Math.random() * randomIndexUpperLimit);
          currentShift = latestShiftLengths[isShiftHorizontal][randomIndexValue] ?? {count: 0, direction: randomDirection};
        } while (solutionSteps.length && ((
            randomDirection === getDirectionComplement(currentShift.direction)
          ) || (
            currentShift.count + 1 > randomIndexUpperLimit * 0.5
          ) || (
            Object.keys(latestShiftLengths[isShiftHorizontal]).length >= randomIndexUpperLimit - 1
            && Object.entries(latestShiftLengths[isShiftHorizontal]).every(([index, shift]) => {
              return index === randomIndexValue || shift.direction === randomDirection;
            })
          ))
        );

        currentShift.count++;
        latestShiftLengths[isShiftHorizontal][randomIndexValue] = currentShift;

        if (solutionSteps.length && isShiftHorizontal !== isPrevShiftHorizontal) {
          const shiftKeys = Object.keys(latestShiftLengths[isPrevShiftHorizontal]);

          for (let i = 0; i < shiftKeys.length; i++) {
            delete latestShiftLengths[isPrevShiftHorizontal][shiftKeys[i]];
          }
        }

        shiftAtIndex(randomIndexValue, randomDirection);
        solutionSteps.unshift(
            [randomIndexValue, getDirectionComplement(randomDirection)]);
      }

      solved = puzzleSolved();
    }
  }

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

function puzzleSolved() {
  let connectedTiles = [startingTile];
  getConnectedTiles(startingTile, connectedTiles);
  return connectedTiles.length === grid.flat().length;
}

export function drawInstructions() {
  drawInstructionsHelper("🚂\uFE0E Shifting Grid Puzzle 🚂\uFE0E",
      ["Shift tiles to connect all the tracks to the station.",
          "Tracks and shifted tiles both loop back around."],
      ["Click or tap the arrows to shift the row or column."],
      window.app.puzzleState.tutorialStage, tutorials.length);
}

function getConnectedTiles(tile, connectedTiles, gridToDraw) {
  tile.connections.forEach(dir => {
    let neighbor = getNeighborTile(tile, dir, gridToDraw);

    if (!connectedTiles.includes(neighbor)
        && neighbor.connections.includes(getDirectionComplement(dir))) {
      connectedTiles.push(neighbor);
      getConnectedTiles(neighbor, connectedTiles, gridToDraw);
    }
  });
}

export function drawPuzzle() {
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.lineWidth = LINE_THICKNESS;
  context.lineCap = "square";

  let gridToDraw = window.app.puzzleState.showingSolution ? solution : grid;
  let stationToDraw = window.app.puzzleState.showingSolution ? solutionStartingTile : startingTile;
  let solved = true;
  let connectedTiles = [stationToDraw];

  getConnectedTiles(stationToDraw, connectedTiles, gridToDraw);
  solved = connectedTiles.length === grid.flat().length;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = gridToDraw[i][j];
      let coord = getDrawCoord(tile.coord);

      context.fillStyle = "#000000";
      context.fillRect(coord[0] + TILE_BORDER, coord[1] + TILE_BORDER,
          CELL_SIZE - 2 * TILE_BORDER, CELL_SIZE - 2 * TILE_BORDER);
    }
  }

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = gridToDraw[i][j];
      let coord = getDrawCoord(tile.coord);
      let centerCoord = getDrawCoord(tile.coord, true);

      context.strokeStyle = connectedTiles.includes(tile) ?
          SUCCESS_COLOR : "#808080";
      context.beginPath();

      tile.connections.forEach(dir => {
        context.moveTo(...centerCoord);

        let endCoord = [...centerCoord];
        switch (dir) {
          case DIRECTION.UP:
            endCoord[1] = coord[1];
            break;
          case DIRECTION.RIGHT:
            endCoord[0] = coord[0] + CELL_SIZE;
            break;
          case DIRECTION.DOWN:
            endCoord[1] = coord[1] + CELL_SIZE;
            break;
          case DIRECTION.LEFT:
            endCoord[0] = coord[0];
            break;
          default:
            console.error("Unrecognized direction:", dir);
        }

        context.lineTo(...endCoord);
      });

      context.stroke();

      if (stationToDraw === tile) {
        context.fillStyle = solved ? SUCCESS_COLOR : "#ffffff"
        context.strokeStyle = SUCCESS_COLOR;
        context.lineCap = "round";
        context.beginPath();
        context.arc(...centerCoord, NODE_SIZE, 0, 2 * Math.PI, false);
        context.fill();
        context.stroke();
        context.lineCap = "square";
      } else if (tile.connections.length === 1) {
        context.fillStyle = context.strokeStyle;
        context.beginPath();
        context.arc(...centerCoord, LINE_THICKNESS, 0, 2 * Math.PI, false);
        context.fill();
      }
    }
  }

  if (!window.app.puzzleState.showingSolution) {
    if (solved) {
      if (window.app.puzzleState.interactive) {
        endPuzzle(window.app.puzzleState.tutorialStage === tutorials.length);
        audioManager.play(CHIME_SOUND);
      }
    } else {
      queuedSounds.forEach(sound => audioManager.play(sound));

      drawArrows(context);

      context.font = "bold " + (ARROW_SIZE / 4) + "px Arial"
      context.fillStyle = "#ffffff";
      context.lineWidth = 6;
      context.lineCap = "butt";
      context.strokeStyle = "#ffffff";

      // Save
      let saveCoord = getDrawCoord([COLS, ROWS], true);
      saveCoord[0] += 9;

      context.textAlign = "center";
      context.fillText("Save", saveCoord[0],
          saveCoord[1] + ARROW_SIZE / 12 + OFFSET_SIZE * 7 / 20);

      context.beginPath();

      context.moveTo(...saveCoord);
      context.lineTo(saveCoord[0], saveCoord[1] - OFFSET_SIZE * 0.4);
      context.moveTo(saveCoord[0] - OFFSET_SIZE * 0.15, saveCoord[1] - OFFSET_SIZE * 0.15);
      context.lineTo(...saveCoord);
      context.lineTo(saveCoord[0] + OFFSET_SIZE * 0.15, saveCoord[1] - OFFSET_SIZE * 0.15);

      context.moveTo(saveCoord[0] - OFFSET_SIZE * 0.3, saveCoord[1] - OFFSET_SIZE * 0.35);
      context.lineTo(saveCoord[0] - OFFSET_SIZE * 0.3, saveCoord[1] + OFFSET_SIZE * 0.15);
      context.lineTo(saveCoord[0] + OFFSET_SIZE * 0.3, saveCoord[1] + OFFSET_SIZE * 0.15);
      context.lineTo(saveCoord[0] + OFFSET_SIZE * 0.3, saveCoord[1] - OFFSET_SIZE * 0.35);

      context.stroke();

      // Load
      if (savedGrid) {
        let loadCoord = getDrawCoord([-1, ROWS], true);
        loadCoord[0] -= 9;

        context.textAlign = "center";
        context.fillText("Load", loadCoord[0],
            loadCoord[1] + ARROW_SIZE / 12 + OFFSET_SIZE * 7 / 20);

        context.beginPath();

        context.moveTo(...loadCoord);
        context.lineTo(loadCoord[0], loadCoord[1] - OFFSET_SIZE * 0.4);
        context.moveTo(loadCoord[0] - OFFSET_SIZE * 0.15, loadCoord[1] - OFFSET_SIZE * 0.4 + OFFSET_SIZE * 0.15);
        context.lineTo(loadCoord[0], loadCoord[1] - OFFSET_SIZE * 0.4);
        context.lineTo(loadCoord[0] + OFFSET_SIZE * 0.15, loadCoord[1] - OFFSET_SIZE * 0.4 + OFFSET_SIZE * 0.15);

        context.moveTo(loadCoord[0] - OFFSET_SIZE * 0.3, loadCoord[1] - OFFSET_SIZE * 0.35);
        context.lineTo(loadCoord[0] - OFFSET_SIZE * 0.3, loadCoord[1] + OFFSET_SIZE * 0.15);
        context.lineTo(loadCoord[0] + OFFSET_SIZE * 0.3, loadCoord[1] + OFFSET_SIZE * 0.15);
        context.lineTo(loadCoord[0] + OFFSET_SIZE * 0.3, loadCoord[1] - OFFSET_SIZE * 0.35);

        context.stroke();
      }

      if (gridHistory.length > 0) {
        // Restart
        let restartCoord = getDrawCoord([COLS, -1], true);

        context.textAlign = "center";
        context.fillText("Restart", restartCoord[0] + 10,
            restartCoord[1] + ARROW_SIZE / 12 + OFFSET_SIZE * 7 / 20);

        context.beginPath();
        context.arc(OFFSET_SIZE * 1.5 + COLS * CELL_SIZE, OFFSET_SIZE / 2, OFFSET_SIZE / 4, Math.PI, 3 / 2 * Math.PI, true);
        context.lineTo(OFFSET_SIZE * 1.55 + COLS * CELL_SIZE, OFFSET_SIZE * 0.35);
        context.lineTo(OFFSET_SIZE * 1.6 + COLS * CELL_SIZE, OFFSET_SIZE * 0.2);
        context.lineTo(OFFSET_SIZE * 1.48 + COLS * CELL_SIZE, OFFSET_SIZE / 4);
        context.lineTo(OFFSET_SIZE * 1.525 + COLS * CELL_SIZE, OFFSET_SIZE * 0.3);
        context.stroke();

        // Undo
        let undoCoord = getDrawCoord([-1, -1], true);

        context.textAlign = "center";
        context.fillText("Undo", undoCoord[0] - 9,
            undoCoord[1] + ARROW_SIZE / 12 + OFFSET_SIZE * 7 / 20);

        context.beginPath();
        context.moveTo(OFFSET_SIZE * 0.75, OFFSET_SIZE / 2);
        context.lineTo(OFFSET_SIZE * 0.3, OFFSET_SIZE / 2);
        context.moveTo(OFFSET_SIZE * 0.45, OFFSET_SIZE * 0.35);
        context.lineTo(OFFSET_SIZE * 0.3, OFFSET_SIZE / 2);
        context.lineTo(OFFSET_SIZE * 0.45, OFFSET_SIZE * 0.65);
        context.stroke();
      }
    }

    queuedSounds = [];
  } else {
    const letters = "ABCDEF";

    context.textAlign = "center";
    context.font = "bold " + (ARROW_SIZE * 3 / 4) + "px Arial"
    context.fillStyle = "#ffffff";

    for (let i = 0; i < COLS; i++) {
      let coord = getDrawCoord([i, -1], true);
      context.fillText(letters.charAt(i), coord[0], coord[1] + ARROW_SIZE / 4);
    }

    for (let i = 0; i < ROWS; i++) {
      let coord = getDrawCoord([-1, i], true);
      context.fillText(i + 1, coord[0], coord[1] + ARROW_SIZE / 3);
    }

    let startCoord = (12 - solutionSteps.length) / 2;

    solutionSteps.forEach((step, i) => {
      let coord = getDrawCoord([startCoord + i, COLS], true);
      coord[1] += OFFSET_SIZE / 6;
      coord[0] = (startCoord + i) * (CANVAS_WIDTH - OFFSET_SIZE / 3) / 12
          + CANVAS_WIDTH / 24 + OFFSET_SIZE / 6;

      context.lineWidth = ARROW_THICKNESS;
      context.lineCap = "butt";
      context.strokeStyle = SUCCESS_COLOR;

      let horizontal = false;

      switch(step[1]) {
        case DIRECTION.UP:
          drawArrowUp(context, coord);
          break;
        case DIRECTION.RIGHT:
          horizontal = true;
          drawArrowRight(context, coord);
          break;
        case DIRECTION.DOWN:
          drawArrowDown(context, coord);
          break;
        case DIRECTION.LEFT:
          horizontal = true;
          drawArrowLeft(context, coord);
          break;
      }

      context.fillStyle = SUCCESS_COLOR;
      context.beginPath();
      context.arc(coord[0], coord[1], ARROW_THICKNESS * 13 / 8, 0, 2 * Math.PI, false);
      context.fill();

      context.font = "bold " + (ARROW_SIZE * 5 / 12) + "px Arial"
      context.fillStyle = "#000000";
      context.fillText(horizontal ? step[0] + 1 : letters.charAt(step[0]),
          coord[0], coord[1] + ARROW_SIZE * 5 / 36);
    });
  }
}

function drawArrowLeft(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] - ARROW_SIZE / 3, coord[1]);
  context.lineTo(coord[0] + ARROW_SIZE / 3, coord[1]);
  context.moveTo(coord[0] - ARROW_SIZE / 8, coord[1] - ARROW_SIZE / 8);
  context.lineTo(coord[0] - ARROW_SIZE / 3, coord[1]);
  context.lineTo(coord[0] - ARROW_SIZE / 8, coord[1] + ARROW_SIZE / 8);
  context.stroke();
}

function drawArrowRight(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] - ARROW_SIZE / 3, coord[1]);
  context.lineTo(coord[0] + ARROW_SIZE / 3, coord[1]);
  context.moveTo(coord[0] + ARROW_SIZE / 8, coord[1] - ARROW_SIZE / 8);
  context.lineTo(coord[0] + ARROW_SIZE / 3, coord[1]);
  context.lineTo(coord[0] + ARROW_SIZE / 8, coord[1] + ARROW_SIZE / 8);
  context.stroke();
}

function drawArrowUp(context, coord) {
  context.beginPath();
  context.moveTo(coord[0], coord[1] - ARROW_SIZE / 3);
  context.lineTo(coord[0], coord[1] + ARROW_SIZE / 3);
  context.moveTo(coord[0] - ARROW_SIZE / 8, coord[1] - ARROW_SIZE / 8);
  context.lineTo(coord[0], coord[1] - ARROW_SIZE / 3);
  context.lineTo(coord[0] + ARROW_SIZE / 8, coord[1] - ARROW_SIZE / 8);
  context.stroke();
}

function drawArrowDown(context, coord) {
  context.beginPath();
  context.moveTo(coord[0], coord[1] - ARROW_SIZE / 3);
  context.lineTo(coord[0], coord[1] + ARROW_SIZE / 3);
  context.moveTo(coord[0] - ARROW_SIZE / 8, coord[1] + ARROW_SIZE / 8);
  context.lineTo(coord[0], coord[1] + ARROW_SIZE / 3);
  context.lineTo(coord[0] + ARROW_SIZE / 8, coord[1] + ARROW_SIZE / 8);
  context.stroke();
}

function drawArrows(context) {
  context.lineWidth = ARROW_THICKNESS;
  context.lineCap = "butt";
  context.strokeStyle = ALERT_COLOR;

  for (let i = 0; i < COLS; i++) {
    drawArrowUp(context, getDrawCoord([i, -1], true));
    drawArrowDown(context, getDrawCoord([i, ROWS], true));
  }

  for (let i = 0; i < ROWS; i++) {
    drawArrowLeft(context, getDrawCoord([-1, i], true));
    drawArrowRight(context, getDrawCoord([COLS, i], true));
  }
}

function getDrawCoord(coord, center = false) {
  let x = coord[0];
  let y = coord[1];
  let addition = center ? CELL_SIZE / 2 : 0;

  let drawX = OFFSET_SIZE + x * CELL_SIZE + addition;
  let drawY = OFFSET_SIZE + y * CELL_SIZE + addition;

  if (x < 0) {
    drawX += ( CELL_SIZE / 2 - ARROW_SIZE / 2);
  } else if (x >= COLS) {
    drawX -= ( CELL_SIZE / 2 - ARROW_SIZE / 2);
  }

  if (y < 0) {
    drawY += ( CELL_SIZE / 2 - ARROW_SIZE / 2);
  } else if (y >= ROWS) {
    drawY -= ( CELL_SIZE / 2 - ARROW_SIZE / 2);
  }

  return [drawX, drawY];
}

function convertToGridCoord(x, y) {
  let gridX = Math.floor((x - OFFSET_SIZE) / CELL_SIZE);
  let gridY = Math.floor((y - OFFSET_SIZE) / CELL_SIZE);

  return [gridX, gridY];
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let coord = convertToGridCoord(mouseX, mouseY);
      handleLeftClickOrTap(coord);
    }

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  if (event.changedTouches.length === 1 && window.app.puzzleState.interactive) {
    event.preventDefault();

    let canvasRect = getPuzzleCanvas().getBoundingClientRect();
    let touch = event.changedTouches[0];
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    let coord = convertToGridCoord(touchX, touchY);
    handleLeftClickOrTap(coord);
  }
}

function handleLeftClickOrTap(coord) {
  // Restart
  if (coord[0] >= COLS && coord[1] < 0) {
    if (gridHistory.length > 0) {
      grid = gridHistory[0];
      startingTile = getStartingTileForGrid(grid);
      gridHistory = [];

      audioManager.play(RESTART_SOUND);
      drawPuzzle();
    }

  // Undo
  } else if (coord[0] < 0 && coord[1] < 0) {
    if (gridHistory.length > 0) {
      grid = gridHistory.pop();
      startingTile = getStartingTileForGrid(grid);

      audioManager.play(UNDO_SOUND);
      drawPuzzle();
    }

  // Save
  } else if (coord[0] >= COLS && coord[1] >= ROWS) {
    savedGrid = deepCopy(grid);
    audioManager.play(SAVE_SOUND);
    drawPuzzle();

  // Load
  } else if (coord[0] < 0 && coord[1] >= ROWS) {
    if (savedGrid) {
      if (gridHistory >= HISTORY_LIMIT) {
        gridHistory.shift();
      }

      gridHistory.push(deepCopy(grid));
      grid = deepCopy(savedGrid);
      startingTile = getStartingTileForGrid(grid);

      audioManager.play(LOAD_SOUND);
      drawPuzzle();
    }
  } else {
    let direction = null;
    let index = -1;

    if (coord[1] < 0) {
      if (coord[0] >= 0 && coord[0] < COLS) {
        direction = DIRECTION.UP;
        index = coord[0];
      }
    } else if (coord[0] >= COLS) {
      if (coord[1] >= 0 && coord[1] < ROWS) {
        direction = DIRECTION.RIGHT;
        index = coord[1];
      }
    } else if (coord[1] >= ROWS) {
      if (coord[0] >= 0 && coord[0] < COLS) {
        direction = DIRECTION.DOWN;
        index = coord[0];
      }
    } else if (coord[0] < 0) {
      if (coord[1] >= 0 && coord[1] < ROWS) {
        direction = DIRECTION.LEFT;
        index = coord[1];
      }
    }

    if (direction) {
      if (gridHistory >= HISTORY_LIMIT) {
        gridHistory.shift();
      }

      gridHistory.push(deepCopy(grid));

      shiftAtIndex(index, direction);
      queuedSounds.push(SHIFT_SOUND);

      drawPuzzle();
    }
  }
}

export function onMouseUp(event) {
  // Middle click
  if (event.button === 1) {
    onMiddleMouseUp();
  }
}
