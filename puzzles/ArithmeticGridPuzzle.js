import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomIndex } from "../js/utils.js";

const SKIPPED_ROWS = 0;
const SKIPPED_COLS = 0;
const LARGEST_NUMBER = 4;

const TILE_PROPORTION = 0.6;
const LINE_THICKNESS = 12;

const SELECT_SOUND = 'click';
const SWAP_SOUND = 'whir';
const CHIME_SOUND = 'chime';

let DIFFICULTY;
let ROWS;
let COLS;
let CELL_SIZE;
let FIXED_TILES;
let MINUS_RATE;

let grid;
let signGrid;
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

  let rawGrid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => nums.splice(randomIndex(nums), 1)[0]));
  grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => {}));

  // 1 is plus, -1 is minus, invalid coordinates will just be unused
  signGrid = Array.from({length: 2 * COLS - 1}, () => Array.from({length: 2 * ROWS - 1}, () => Math.random() < MINUS_RATE ? -1 : 1));

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
  drawInstructionsHelper("📝\uFE0E Arithmetic Grid Puzzle 📝\uFE0E",
      ["Arrange the tiles to get the expected totals.",
          "White tiles are fixed in place."],
      ["Click or tap to select tiles and swap them."]);
}

export function drawPuzzle() {
  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = "#ffffff";
  context.font = "bold " + (CELL_SIZE * (1 - TILE_PROPORTION) * 3 / 4) + "px Arial"
  context.textAlign = "center";

  let gridToDraw = window.app.puzzleState.showingSolution ? solution : grid;

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

  let tileSize = CELL_SIZE * TILE_PROPORTION;
  let puzzleSolved = true;

  [...rowTotals, ...colTotals].forEach(tile => {
    if (tile) {
      let solvedResult = isSolved(tile, gridToDraw);
      puzzleSolved = puzzleSolved && solvedResult;
      let tileColor = solvedResult ? SUCCESS_COLOR : "#808080";

      context.fillStyle = "#ffffff";
      context.strokeStyle = tileColor;
      context.beginPath();
      context.rect(tile.x, tile.y, tileSize, tileSize);
      context.fill();
      context.stroke();

      context.fillStyle = tileColor;
      context.font = "bold " + (CELL_SIZE * TILE_PROPORTION / 2) + "px Arial"
      context.textAlign = "center";
      context.fillText(tile.num, tile.x + tileSize / 2, tile.y + tileSize / 2 + CELL_SIZE * TILE_PROPORTION / 6);
    }
  });

  if (puzzleSolved) {
    if (window.app.puzzleState.interactive) {
      window.app.puzzleState.interactive = false;
      window.app.puzzleState.ended = true;

      audioManager.play(CHIME_SOUND);
    }
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];

  gridToDraw.flat().forEach(tile => {
    let tileColor = puzzleSolved ? SUCCESS_COLOR : (tile === selection ? ALERT_COLOR : "#808080");

    context.fillStyle = tile.fixed ? "#ffffff" : "#000000";
    context.strokeStyle = tileColor;
    context.beginPath();
    context.rect(tile.x, tile.y, tileSize, tileSize);
    context.fill();
    context.stroke();

    context.fillStyle = tileColor;
    context.font = "bold " + (CELL_SIZE * TILE_PROPORTION / 2) + "px Arial"
    context.textAlign = "center";
    context.fillText(tile.num, tile.x + tileSize / 2, tile.y + tileSize / 2 + CELL_SIZE * TILE_PROPORTION / 6);
  });
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  DIFFICULTY = window.app.router.difficulty;

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

  drawInstructions();

  finishedLoading();
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive) {
      let canvasRect = event.target.getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let tiles = grid.flat();

      // For-each loops cannot be broken out of!
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        if (!tile.fixed && Math.abs(mouseX - (tile.x + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2
            && Math.abs(mouseY - (tile.y + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2) {
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

          return;
        }
      }
    }

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  if (event.changedTouches.length === 1) {
    if (window.app.puzzleState.interactive) {
      event.preventDefault();

      let canvasRect = event.target.getBoundingClientRect();
      let touch = event.changedTouches[0];
      let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
      let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

      let tiles = grid.flat();

      // For-each loops cannot be broken out of!
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        if (!tile.fixed && Math.abs(touchX - (tile.x + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2
            && Math.abs(touchY - (tile.y + TILE_PROPORTION * CELL_SIZE / 2)) < CELL_SIZE * TILE_PROPORTION / 2 + LINE_THICKNESS / 2) {
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

          return;
        }
      }
    }
  }
}

export function onMouseUp(event) {
  // Middle click
  if (event.button === 1) {
    onMiddleMouseUp();
  }
}
