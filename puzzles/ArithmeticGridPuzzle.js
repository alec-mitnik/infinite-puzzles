import audioManager from "../js/audio-manager.js";
import {
  ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH,
  FONT_FAMILY, SUCCESS_COLOR
} from "../js/config.js";
import keyboardManager from "../js/keyboard-manager.js";
import router from "../js/router.js";
import {
  deepCopy, drawCenteredDashedSquare, drawInstructionsHelper, endPuzzle,
  finishedLoading, getPuzzleCanvas, randomIndex,
  sameCoord, updateForTutorialRecommendation, updateForTutorialState
} from "../js/utils.js";

const SKIPPED_ROWS = 0;
const SKIPPED_COLS = 0;
const LARGEST_NUMBER = 4;

const TILE_PROPORTION = 0.6;
const LINE_THICKNESS = 12;

const SELECT_SOUND = audioManager.SoundEffects.CLICK;
const SWAP_SOUND = audioManager.SoundEffects.WHIR;
const RESTART_SOUND = audioManager.SoundEffects.BOING;
const CLINK_SOUND = audioManager.SoundEffects.CLINK;
const CHIME_SOUND = audioManager.SoundEffects.CHIME;

const TUTORIAL_CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 3;

const tutorials = [
  {
    rows: 2,
    cols: 1,
    grid: [
      [{
        num: 0,
        gridCoords: [0, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        // CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1);
        // x: CELL_SIZE * i + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        // y: CELL_SIZE * j + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE / 3 * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      },
      {
        num: 1,
        gridCoords: [0, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      }],
    ],
    // signGrid: Array.from({length: 2 * COLS - 1}, () => Array.from({length: 2 * ROWS - 1}, () => router.sRand() < MINUS_RATE ? -1 : 1)),
    signGrid: Array.from({length: 1 }, () => Array.from({length: 3}, () => 1)),
    colTotals: [{
      num: 1,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 0,
      // x: CELL_SIZE * i + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
      // y: CELL_SIZE * ROWS + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
      x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
    rowTotals: [{
      num: 0,
      gridCoords: null,
      rowTotalIndex: 0,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 1,
      gridCoords: null,
      rowTotalIndex: 1,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        num: 0,
        gridCoords: [0, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE / 3 * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      },
      {
        num: 1,
        gridCoords: [0, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      }],
      [{
        num: 1,
        gridCoords: [1, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: true,
      },
      {
        num: 0,
        gridCoords: [1, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: true,
      }],
    ],
    signGrid: Array.from({length: 3 }, () => Array.from({length: 3}, () => 1)),
    colTotals: [{
      num: 1,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 0,
      x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 1,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 1,
      x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
    rowTotals: [{
      num: 1,
      gridCoords: null,
      rowTotalIndex: 0,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 1,
      gridCoords: null,
      rowTotalIndex: 1,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        num: 0,
        gridCoords: [0, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE / 3 * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      },
      {
        num: 2,
        gridCoords: [0, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      }],
      [{
        num: 1,
        gridCoords: [1, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      },
      {
        num: 3,
        gridCoords: [1, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      }],
    ],
    signGrid: Array.from({length: 3 }, () => Array.from({length: 3}, () => 1)),
    colTotals: [{
      num: 2,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 0,
      x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 4,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 1,
      x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
    rowTotals: [{
      num: 1,
      gridCoords: null,
      rowTotalIndex: 0,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 5,
      gridCoords: null,
      rowTotalIndex: 1,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        num: 2,
        gridCoords: [0, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE / 3 * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      },
      {
        num: 4,
        gridCoords: [0, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      }],
      [{
        num: 0,
        gridCoords: [1, 0],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      },
      {
        num: 0,
        gridCoords: [1, 1],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
        fixed: false,
      }],
    ],
    signGrid: Array.from({length: 3 }, () => Array.from({length: 3}, () => -1)),
    colTotals: [{
      num: -2,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 0,
      x: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 0,
      gridCoords: null,
      rowTotalIndex: null,
      colTotalIndex: 1,
      x: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
    rowTotals: [{
      num: 2,
      gridCoords: null,
      rowTotalIndex: 0,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 0 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    },
    {
      num: 4,
      gridCoords: null,
      rowTotalIndex: 1,
      colTotalIndex: null,
      x: TUTORIAL_CELL_SIZE * 2 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      y: TUTORIAL_CELL_SIZE * 1 + (1 - TILE_PROPORTION) / 2 * TUTORIAL_CELL_SIZE,
      fixed: true,
    }],
  },
];

let DIFFICULTY;
let ROWS;
let COLS;
let CELL_SIZE;
let FIXED_TILES;
let MINUS_RATE;

let cursorCoord;
let grid;
let signGrid;
let originalState;
let solution;
let selection = null;
let rowTotals = [];
let colTotals = [];
let unusedRows = [];
let unusedCols = [];
let queuedSounds = [];

function generateGrid() {
  let maxOfNum = Math.ceil(COLS * ROWS / (LARGEST_NUMBER + 1)) + 1;

  let nums = []
  for (let i = 0; i <= LARGEST_NUMBER; i++) {
    for (let j = 0; j < maxOfNum; j++) {
      nums.push(i);
    }
  }

  let rawGrid = Array.from({length: COLS},
      () => Array.from({length: ROWS}, () => nums.splice(randomIndex(nums), 1)[0]));
  grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => {}));

  // 1 is plus, -1 is minus, invalid coordinates will just be unused
  signGrid = Array.from({length: 2 * COLS - 1},
      () => Array.from({length: 2 * ROWS - 1}, () => router.sRand() < MINUS_RATE ? -1 : 1));

  rawGrid.forEach((col, colIndex) => {
    let colTotal = col.reduce((total, num, i) => {
      if (i > 0) {
        total += signGrid[2 * colIndex][2 * i - 1] * num;
      }

      return total;
    }, col[0]);

    colTotals.push(colTotal);
  });

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    let row = rawGrid.reduce((rowConstruct, col) => {
      rowConstruct.push(col[rowIndex]);
      return rowConstruct;
    }, []);

    let rowTotal = row.reduce((total, num, i) => {
      if (i > 0) {
        total += signGrid[2 * i - 1][2 * rowIndex] * num;
      }

      return total;
    }, row[0]);

    rowTotals.push(rowTotal);
  }

  let colIndices = [...Array(COLS).keys()];
  for (let i = 0; i < SKIPPED_COLS; i++) {
    let unusedCol = colIndices.splice(randomIndex(colIndices), 1)[0];
    unusedCols.push(unusedCol);
  }

  let rowIndices = [...Array(ROWS).keys()];
  for (let i = 0; i < SKIPPED_ROWS; i++) {
    let unusedRow = rowIndices.splice(randomIndex(rowIndices), 1)[0];
    unusedRows.push(unusedRow);
  }

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = {
        num: rawGrid[i][j],
        gridCoords: [i, j],
        rowTotalIndex: null,
        colTotalIndex: null,
        x: CELL_SIZE * i + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        y: CELL_SIZE * j + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        fixed: false,
      }

      grid[i][j] = tile;
    }
  }

  rowTotals.forEach((total, i) => {
    if (unusedRows.indexOf(i) < 0) {
      let tile = {
        num: total,
        gridCoords: null,
        rowTotalIndex: i,
        colTotalIndex: null,
        x: CELL_SIZE * COLS + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        y: CELL_SIZE * i + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        fixed: true,
      }

      rowTotals[i] = tile;
    } else {
      rowTotals[i] = null;
    }
  });

  colTotals.forEach((total, i) => {
    if (unusedCols.indexOf(i) < 0) {
      let tile = {
        num: total,
        gridCoords: null,
        rowTotalIndex: null,
        colTotalIndex: i,
        x: CELL_SIZE * i + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        y: CELL_SIZE * ROWS + (1 - TILE_PROPORTION) / 2 * CELL_SIZE,
        fixed: true,
      }

      colTotals[i] = tile;
    } else {
      colTotals[i] = null;
    }
  });

  let moveableTiles = grid.flat();

  for (let i = 0; i < FIXED_TILES; i++) {
    let tile = moveableTiles.splice(randomIndex(moveableTiles), 1)[0];
    tile.fixed = true;
  }

  solution = deepCopy(grid);
}

function isSolved(tile, gridToDraw) {
  let solved = false;

  if (tile.rowTotalIndex !== null) {
    let rowTotal = gridToDraw[0][tile.rowTotalIndex].num;

    for (let i = 1; i < COLS; i++) {
      let sign = signGrid[i * 2 - 1][tile.rowTotalIndex * 2];
      rowTotal += sign * gridToDraw[i][tile.rowTotalIndex].num;
    }

    solved = rowTotal === tile.num;
  } else if (tile.colTotalIndex !== null) {
    let colTotal = gridToDraw[tile.colTotalIndex][0].num;

    for (let i = 1; i < ROWS; i++) {
      let sign = signGrid[tile.colTotalIndex * 2][i * 2 - 1];
      colTotal += sign * gridToDraw[tile.colTotalIndex][i].num;
    }

    solved = colTotal === tile.num;
  }

  return solved;
}

export function drawInstructions() {
  drawInstructionsHelper("Arithmetic Grid Puzzle", "📝\uFE0E",
      ["Arrange the tiles to get the expected totals.",
          "White tiles are fixed in place."],
      ["Click or tap to select tiles and swap them."],
      router.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = "#ffffff";
  context.font = "bold " + (CELL_SIZE * (1 - TILE_PROPORTION) * 3 / 4) + `px ${FONT_FAMILY}`;
  context.textAlign = "center";

  let gridToDraw = router.puzzleState.showingSolution ? solution : grid;

  for (let i = 0; i < COLS * 2; i++) {
    for (let j = 0; j < ROWS * 2; j++) {
      let symbol = '=';
      let lastCol = i === COLS * 2 - 1;
      let lastRow = j === ROWS * 2 - 1;

      if (lastCol && lastRow || (i + j) % 2 === 0
          || unusedCols.indexOf(i / 2) > -1
          || unusedRows.indexOf(j / 2) > -1) {
        continue;
      } else if (!lastCol && !lastRow) {
        let sign = signGrid[i][j];
        symbol = sign > 0 ? '+' : '-';
      }

      let xPos = CELL_SIZE * (i + 1) / 2;
      let yPos = CELL_SIZE * (j + 1) / 2;

      context.fillText(symbol, xPos, yPos + CELL_SIZE * (1 - TILE_PROPORTION) / 4);
    }
  }

  context.lineWidth = LINE_THICKNESS;

  const tileSize = CELL_SIZE * TILE_PROPORTION;
  let puzzleSolved = true;

  // Totals
  [...rowTotals, ...colTotals].forEach(tile => {
    if (tile) {
      let solvedResult = isSolved(tile, gridToDraw);
      puzzleSolved = puzzleSolved && solvedResult;
      let tileColor = solvedResult ? SUCCESS_COLOR : "#808080";

      if (solvedResult) {
        context.strokeStyle = `${tileColor}80`;
        context.beginPath();
        context.rect(tile.x - LINE_THICKNESS, tile.y - LINE_THICKNESS,
            tileSize + LINE_THICKNESS * 2, tileSize + LINE_THICKNESS * 2);
        context.stroke();
      }

      context.fillStyle = "#ffffff";
      context.strokeStyle = tileColor;
      context.beginPath();
      context.rect(tile.x, tile.y, tileSize, tileSize);
      context.fill();
      context.stroke();

      context.fillStyle = tileColor;
      context.font = "bold " + (CELL_SIZE * TILE_PROPORTION / 2) + `px ${FONT_FAMILY}`;
      context.textAlign = "center";
      context.fillText(tile.num, tile.x + tileSize / 2, tile.y + tileSize / 2 + CELL_SIZE * TILE_PROPORTION / 6);
    }
  });

  if (puzzleSolved) {
    if (router.puzzleState.interactive) {
      endPuzzle(router.puzzleState.tutorialStage === tutorials.length);
      audioManager.play(CHIME_SOUND);
    }
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));

    // Cursor
    if (router.puzzleState.usingKeyboard) {
      const cursorTile = gridToDraw[cursorCoord[0]][cursorCoord[1]];
      context.strokeStyle = ALERT_COLOR;
      context.beginPath();

      // Top-Left
      context.moveTo(cursorTile.x - LINE_THICKNESS * 1.25, cursorTile.y - LINE_THICKNESS * 1.25 + tileSize * 0.25);
      context.lineTo(cursorTile.x - LINE_THICKNESS * 1.25, cursorTile.y - LINE_THICKNESS * 1.25);
      context.lineTo(cursorTile.x - LINE_THICKNESS * 1.25 + tileSize * 0.25, cursorTile.y - LINE_THICKNESS * 1.25);

      // Top-Right
      context.moveTo(cursorTile.x + LINE_THICKNESS * 1.25 + tileSize * 0.75, cursorTile.y - LINE_THICKNESS * 1.25);
      context.lineTo(cursorTile.x + LINE_THICKNESS * 1.25 + tileSize, cursorTile.y - LINE_THICKNESS * 1.25);
      context.lineTo(cursorTile.x + LINE_THICKNESS * 1.25 + tileSize, cursorTile.y - LINE_THICKNESS * 1.25 + tileSize * 0.25);

      // Bottom-Right
      context.moveTo(cursorTile.x + LINE_THICKNESS * 1.25 + tileSize, cursorTile.y + LINE_THICKNESS * 1.25 + tileSize * 0.75);
      context.lineTo(cursorTile.x + LINE_THICKNESS * 1.25 + tileSize, cursorTile.y + LINE_THICKNESS * 1.25 + tileSize);
      context.lineTo(cursorTile.x + LINE_THICKNESS * 1.25 + tileSize * 0.75, cursorTile.y + LINE_THICKNESS * 1.25 + tileSize);

      // Bottom-Left
      context.moveTo(cursorTile.x - LINE_THICKNESS * 1.25, cursorTile.y + LINE_THICKNESS * 1.25 + tileSize * 0.75);
      context.lineTo(cursorTile.x - LINE_THICKNESS * 1.25, cursorTile.y + LINE_THICKNESS * 1.25 + tileSize);
      context.lineTo(cursorTile.x - LINE_THICKNESS * 1.25 + tileSize * 0.25, cursorTile.y + LINE_THICKNESS * 1.25 + tileSize);

      context.stroke();
    }

    if (!atOriginalState()) {
      // Restart
      const OFFSET_SIZE = CELL_SIZE * 0.9;
      const verticalOffset = ROWS * CELL_SIZE;
      const ARROW_SIZE = OFFSET_SIZE * 4 / 5;
      context.font = "bold " + (ARROW_SIZE / 4) + `px ${FONT_FAMILY}`;
      context.fillStyle = "#FFFFFF";
      context.textAlign = "center";
      context.fillText("Reset", CANVAS_WIDTH - OFFSET_SIZE * 0.5 ,
          verticalOffset + OFFSET_SIZE * 0.5 + ARROW_SIZE / 12 + OFFSET_SIZE * 7 / 20 + 10);

      context.lineWidth = Math.max(ROWS, COLS) <= 2 ? 16 : 12;
      context.strokeStyle = "#FFFFFF";
      context.beginPath();
      context.arc(CANVAS_WIDTH - OFFSET_SIZE * 0.5,
          verticalOffset + OFFSET_SIZE / 2, OFFSET_SIZE / 4, Math.PI, 3 / 2 * Math.PI, true);
      context.lineTo(OFFSET_SIZE * 1.55 + CANVAS_WIDTH - OFFSET_SIZE * 2,
          verticalOffset + OFFSET_SIZE * 0.35);
      context.lineTo(OFFSET_SIZE * 1.6 + CANVAS_WIDTH - OFFSET_SIZE * 2,
          verticalOffset + OFFSET_SIZE * 0.2);
      context.lineTo(OFFSET_SIZE * 1.48 + CANVAS_WIDTH - OFFSET_SIZE * 2,
          verticalOffset + OFFSET_SIZE * 0.24);
      context.lineTo(OFFSET_SIZE * 1.525 + CANVAS_WIDTH - OFFSET_SIZE * 2,
          verticalOffset + OFFSET_SIZE * 0.3);
      context.stroke();

      context.lineWidth = LINE_THICKNESS;
    }
  }

  queuedSounds = [];

  // Number Tiles
  gridToDraw.flat().forEach(tile => {
    let tileColor = puzzleSolved ? SUCCESS_COLOR : (tile === selection ? ALERT_COLOR : "#808080");
    context.fillStyle = tile.fixed ? "#ffffff" : "#000000";

    if (puzzleSolved) {
      context.strokeStyle = `${tileColor}80`;
      context.beginPath();
      context.rect(tile.x - LINE_THICKNESS, tile.y - LINE_THICKNESS,
          tileSize + LINE_THICKNESS * 2, tileSize + LINE_THICKNESS * 2);
      context.stroke();
    } else if (tile === selection) {
      context.strokeStyle = tileColor;
      drawCenteredDashedSquare(context, [15, 5], tile.x, tile.y, tileSize);
    }

    if (puzzleSolved || tile !== selection) {
      context.strokeStyle = tileColor;
      context.beginPath();
      context.rect(tile.x, tile.y, tileSize, tileSize);
      context.fill();
      context.stroke();
    }

    context.fillStyle = tileColor;
    context.font = "bold " + (CELL_SIZE * TILE_PROPORTION / 2) + `px ${FONT_FAMILY}`;
    context.textAlign = "center";
    context.fillText(tile.num, tile.x + tileSize / 2, tile.y + tileSize / 2 + CELL_SIZE * TILE_PROPORTION / 6);
  });
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (router.puzzleState.tutorialStage > tutorials.length) {
    router.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  DIFFICULTY = router.difficulty;

  // Quick: 3/3/2/+, Casual: 3/3/0/+, Challenging: 3/3/2/+-, Intense: 3/3/0/+-
  ROWS = 3; // + (DIFFICULTY > 2 ? 1 : 0);
  COLS = 3; // + (DIFFICULTY > 2 ? 1 : 0);
  CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1);
  FIXED_TILES = DIFFICULTY % 2 * 2; //(DIFFICULTY + DIFFICULTY % 3);
  MINUS_RATE = DIFFICULTY > 2 ? 0.5 : 0;

  selection = null;
  rowTotals = [];
  colTotals = [];
  unusedRows = [];
  unusedCols = [];
  queuedSounds = [];

  if (router.puzzleState.tutorialStage) {
    const tutorial = tutorials[router.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1);

    grid = deepCopy(tutorial.grid);
    signGrid = tutorial.signGrid;
    colTotals = tutorial.colTotals;
    rowTotals = tutorial.rowTotals;

    solution = deepCopy(grid);

    const tile1 = grid[0][0];
    const tile2 = grid[0][1];
    tile1.gridCoords = [0, 1];
    tile2.gridCoords = [0, 0];
    const tile2X = tile2.x;
    const tile2Y = tile2.y;
    tile2.x = tile1.x;
    tile2.y = tile1.y;
    tile1.x = tile2X;
    tile1.y = tile2Y;
    grid[0][0] = tile2;
    grid[0][1] = tile1;
  } else {
    generateGrid();

    let moveableTiles = grid.flat().filter(tile => {
      return !tile.fixed;
    });

    let puzzleSolved = true;

    while (puzzleSolved) {
      let coordinates = moveableTiles.map(tile => {
        return [tile.gridCoords, tile.x, tile.y];
      });

      moveableTiles.forEach(tile => {
        let coordinate = coordinates.splice(randomIndex(coordinates), 1)[0];
        tile.gridCoords = coordinate[0];
        grid[tile.gridCoords[0]][tile.gridCoords[1]] = tile;
        tile.x = coordinate[1];
        tile.y = coordinate[2];
      });

      [...rowTotals, ...colTotals].forEach(tile => {
        if (tile) {
          let solvedResult = isSolved(tile, grid);
          puzzleSolved = puzzleSolved && solvedResult;
        }
      });
    }
  }

  originalState = deepCopy(grid);
  cursorCoord = [0, 0];

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

function atOriginalState() {
  // Compare all tile values
  return grid.every((row, rowIndex) => {
    return row.every((tile, tileIndex) => {
      return tile.num === originalState[rowIndex][tileIndex].num;
    });
  });
}

async function restart() {
  if (!atOriginalState() && await router.getConfirmation('', "Reset Puzzle?")) {
    grid = deepCopy(originalState);
    selection = null;
    audioManager.play(RESTART_SOUND);
    drawPuzzle();
  }
}

function handleCursorMove() {
  audioManager.play(CLINK_SOUND, 0.3);
  drawPuzzle();
}

export function onKeyDown(event) {
  if (router.puzzleState.interactive) {
    // Restart
    if (keyboardManager.isRestartKey(event)) {
      void restart();
      event.preventDefault();
      return;
    }

    // Selection
    if (keyboardManager.isActivationKey(event)) {
      event.preventDefault();
      const tile = grid[cursorCoord[0]][cursorCoord[1]];

      if (tile.fixed) {
        audioManager.play(CLINK_SOUND);
        return;
      }

      if (selection) {
        if (sameCoord(selection.gridCoords, cursorCoord)) {
          audioManager.play(SELECT_SOUND);
        } else {
          queuedSounds.push(SWAP_SOUND);
          const coordinate = [selection.gridCoords, selection.x, selection.y];

          selection.gridCoords = tile.gridCoords;
          selection.x = tile.x;
          selection.y = tile.y;
          grid[tile.gridCoords[0]][tile.gridCoords[1]] = selection;

          tile.gridCoords = coordinate[0];
          tile.x = coordinate[1];
          tile.y = coordinate[2];
          grid[tile.gridCoords[0]][tile.gridCoords[1]] = tile;
        }

        selection = null;
      } else {
        audioManager.play(SELECT_SOUND);
        selection = grid[cursorCoord[0]][cursorCoord[1]];
      }

      drawPuzzle();
      return;
    }

    // Move Cursor
    if (!keyboardManager.hasModifierKeys(event)) {
      if (keyboardManager.isLeftDirKey(event)) {
        cursorCoord = [cursorCoord[0] <= 0 ? COLS - 1 : cursorCoord[0] - 1, cursorCoord[1]];
        handleCursorMove();
        event.preventDefault();
      } else if (keyboardManager.isRightDirKey(event)) {
        cursorCoord = [cursorCoord[0] >= COLS - 1 ? 0 : cursorCoord[0] + 1, cursorCoord[1]];
        handleCursorMove();
        event.preventDefault();
      } else if (keyboardManager.isUpDirKey(event)) {
        cursorCoord = [cursorCoord[0], cursorCoord[1] <= 0 ? ROWS - 1 : cursorCoord[1] - 1];
        handleCursorMove();
        event.preventDefault();
      } else if (keyboardManager.isDownDirKey(event)) {
        cursorCoord = [cursorCoord[0], cursorCoord[1] >= ROWS - 1 ? 0 : cursorCoord[1] + 1];
        handleCursorMove();
        event.preventDefault();
      }
    }
  }
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (router.puzzleState.interactive) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let tiles = grid.flat();

      // For-each loops cannot be broken out of!
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        if (Math.abs(mouseX - (tile.x + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2
            && Math.abs(mouseY - (tile.y + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2) {
          if (tile.fixed) {
            audioManager.play(CLINK_SOUND);
            return;
          }

          if (selection) {
            if (selection === tile) {
              audioManager.play(SELECT_SOUND);
              selection = null;

              drawPuzzle();
            } else {
              queuedSounds.push(SWAP_SOUND);

              let coordinate = [selection.gridCoords, selection.x, selection.y];

              selection.gridCoords = tile.gridCoords;
              selection.x = tile.x;
              selection.y = tile.y;
              grid[tile.gridCoords[0]][tile.gridCoords[1]] = selection;

              tile.gridCoords = coordinate[0];
              tile.x = coordinate[1];
              tile.y = coordinate[2];
              grid[tile.gridCoords[0]][tile.gridCoords[1]] = tile;

              selection = null;
              drawPuzzle();
            }
          } else {
            audioManager.play(SELECT_SOUND);
            selection = tile;

            drawPuzzle();
          }

          cursorCoord = tile.gridCoords;
          return;
        }
      }

      for (const endTile of [...rowTotals, ...colTotals]) {
        if (Math.abs(mouseX - (endTile.x + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2
            && Math.abs(mouseY - (endTile.y + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2) {
          // if (endTile.fixed) {
            audioManager.play(CLINK_SOUND);
            return;
          // }
        }
      }

      // Restart
      if (mouseX >= CANVAS_WIDTH - CELL_SIZE * 0.8 && mouseY >= CANVAS_HEIGHT - CELL_SIZE * 0.9) {
        void restart();
      }
    }
  }
}

export function onTouchStart(event) {
  if (event.changedTouches.length === 1 && router.puzzleState.interactive) {
    event.preventDefault();

    let canvasRect = getPuzzleCanvas().getBoundingClientRect();
    let touch = event.changedTouches[0];
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    let tiles = grid.flat();

    // For-each loops cannot be broken out of!
    for (let i = 0; i < tiles.length; i++) {
      let tile = tiles[i];

      if (Math.abs(touchX - (tile.x + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2
          && Math.abs(touchY - (tile.y + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2) {
        if (tile.fixed) {
          audioManager.play(CLINK_SOUND);
          return;
        }

        if (selection) {
          if (selection === tile) {
            audioManager.play(SELECT_SOUND);
            selection = null;

            drawPuzzle();
          } else {
            queuedSounds.push(SWAP_SOUND);

            let coordinate = [selection.gridCoords, selection.x, selection.y];

            selection.gridCoords = tile.gridCoords;
            selection.x = tile.x;
            selection.y = tile.y;
            grid[tile.gridCoords[0]][tile.gridCoords[1]] = selection;

            tile.gridCoords = coordinate[0];
            tile.x = coordinate[1];
            tile.y = coordinate[2];
            grid[tile.gridCoords[0]][tile.gridCoords[1]] = tile;

            selection = null;
            drawPuzzle();
          }
        } else {
          audioManager.play(SELECT_SOUND);
          selection = tile;

          drawPuzzle();
        }

        cursorCoord = tile.gridCoords;
        return;
      }
    }

    for (const endTile of [...rowTotals, ...colTotals]) {
      if (Math.abs(touchX - (endTile.x + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2
          && Math.abs(touchY - (endTile.y + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2) {
        // if (endTile.fixed) {
          audioManager.play(CLINK_SOUND);
          return;
        // }
      }
    }

    // Restart
    if (touchX >= CANVAS_WIDTH - CELL_SIZE * 0.8 && touchY >= CANVAS_HEIGHT - CELL_SIZE * 0.9) {
      void restart();
    }
  }
}
