import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialState } from "../js/utils.js";

const TILE_SIZE = 3;
const MAX_TILE_CIRCUITS = TILE_SIZE * 2; // For reference
const TILE_CIRCUITS = MAX_TILE_CIRCUITS / 2; // MAX_TILE_CIRCUITS - 2; // Might be limited by tile size

const OFFSET_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 10;
const LINE_THICKNESS = 12;
const TILE_BORDER = 2;

const SELECT_SOUND = 'click';
const SWAP_SOUND = 'whir';
const ROTATE_SOUND = 'warp';
const CHIME_SOUND = 'chime';

const TUTORIAL_CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / 2;

const tutorials = [
  {
    rows: 1,
    cols: 1,
    grid: [
      [{
        gridCoords: [0, 0],
        // x: OFFSET_SIZE + CELL_SIZE * i,
        // y: OFFSET_SIZE + CELL_SIZE * j,
        x: OFFSET_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[1, 0], [3, 0]]],
        fixed: false,
      }],
    ],
    // [0, j * (TILE_SIZE + 2) + coord[1]]
    // [(TILE_SIZE + 2) * COLS - 1, j * (TILE_SIZE + 2) + coord[1]]
    // [i * (TILE_SIZE + 2) + coord[0], (TILE_SIZE + 2) * ROWS - 1]
    circuitEnds: [[1, 0], [3, 0]],
    rotate: true,
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        gridCoords: [0, 0],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [0, 2]]],
        fixed: false,
      },
      {
        gridCoords: [0, 1],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [],
        fixed: false,
      }],
      [{
        gridCoords: [1, 0],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [],
        fixed: true,
      },
      {
        gridCoords: [1, 1],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [],
        fixed: true,
      }]
    ],
    circuitEnds: [[2, 0], [0, 2]],
    swap: true,
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        gridCoords: [0, 0],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [0, 2]]],
        fixed: false,
      },
      {
        gridCoords: [0, 1],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [],
        fixed: false,
      }],
      [{
        gridCoords: [1, 0],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [],
        fixed: true,
      },
      {
        gridCoords: [1, 1],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [],
        fixed: true,
      }]
    ],
    circuitEnds: [[2, 0], [0, 2]],
    rotate: true,
    swap: true,
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        gridCoords: [0, 0],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [0, 2]]],
        fixed: false,
      },
      {
        gridCoords: [0, 1],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [[[0, 3], [1, (TILE_SIZE + 1)]], [[0, 2], [2, (TILE_SIZE + 1)]]],
        fixed: false,
      }],
      [{
        gridCoords: [1, 0],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[1, (TILE_SIZE + 1)], [3, (TILE_SIZE + 1)]]],
        fixed: true,
      },
      {
        gridCoords: [1, 1],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [[[1, 0], [3, 0]]],
        fixed: true,
      }]
    ],
    circuitEnds: [[2, 0], [0, 2], [0, (TILE_SIZE + 2) + 3], [0, (TILE_SIZE + 2) + 2],
        [1, 2 * (TILE_SIZE + 2) - 1], [2, 2 * (TILE_SIZE + 2) - 1]],
    swap: true,
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        gridCoords: [0, 0],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [0, 2]], [[0, 3], [(TILE_SIZE + 1), 3]]],
        fixed: false,
      },
      {
        gridCoords: [0, 1],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [[[0, 3], [1, (TILE_SIZE + 1)]], [[0, 2], [2, (TILE_SIZE + 1)]],
            [[(TILE_SIZE + 1), 2], [(TILE_SIZE + 1), 3]]],
        fixed: false,
      }],
      [{
        gridCoords: [1, 0],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [2, (TILE_SIZE + 1)]], [[0, 3], [(TILE_SIZE + 1), 3]]],
        fixed: true,
      },
      {
        gridCoords: [1, 1],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [[[2, 0], [2, (TILE_SIZE + 1)]], [[0, 2], [0, 3]]],
        fixed: false,
      }]
    ],
    circuitEnds: [[2, 0], [0, 2], [0, (TILE_SIZE + 2) + 3], [0, (TILE_SIZE + 2) + 2],
        [1, 2 * (TILE_SIZE + 2) - 1], [2, 2 * (TILE_SIZE + 2) - 1], [2 * (TILE_SIZE + 2) - 1, 3],
        [(TILE_SIZE + 2) + 2, 0], [(TILE_SIZE + 2) + 2, 2 * (TILE_SIZE + 2) - 1], [0, 3]],
    swap: true,
  },
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        gridCoords: [0, 0],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [0, 2]], [[0, 3], [(TILE_SIZE + 1), 3]]],
        fixed: false,
      },
      {
        gridCoords: [0, 1],
        x: OFFSET_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [[[0, 3], [1, (TILE_SIZE + 1)]], [[0, 2], [2, (TILE_SIZE + 1)]],
            [[(TILE_SIZE + 1), 2], [(TILE_SIZE + 1), 3]]],
        fixed: false,
      }],
      [{
        gridCoords: [1, 0],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE,
        circuitPaths: [[[2, 0], [2, (TILE_SIZE + 1)]], [[0, 3], [(TILE_SIZE + 1), 3]]],
        fixed: false,
      },
      {
        gridCoords: [1, 1],
        x: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        y: OFFSET_SIZE + TUTORIAL_CELL_SIZE,
        circuitPaths: [[[2, 0], [2, (TILE_SIZE + 1)]], [[0, 2], [0, 3]]],
        fixed: false,
      }]
    ],
    circuitEnds: [[2, 0], [0, 2], [0, (TILE_SIZE + 2) + 3], [0, (TILE_SIZE + 2) + 2],
        [1, 2 * (TILE_SIZE + 2) - 1], [2, 2 * (TILE_SIZE + 2) - 1], [2 * (TILE_SIZE + 2) - 1, 3],
        [(TILE_SIZE + 2) + 2, 0], [(TILE_SIZE + 2) + 2, 2 * (TILE_SIZE + 2) - 1], [0, 3]],
    rotate: true,
    swap: true,
  },
];

let ROWS = 3;
let COLS = 3;
let CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
let TILE_CELL_SIZE = CELL_SIZE / (TILE_SIZE + 2);

let DIFFICULTY;
let FIXED_TILES;

let grid;
let solution;
let selection = null;
let circuitEnds = [];
let queuedSounds = [];

function generateGrid() {
  grid = Array.from({length: COLS}, () => Array.from({length: ROWS}));

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let availableCoordinates = Array.from({length: TILE_SIZE + 2}, () => Array.from({length: TILE_SIZE + 2}), () => false);

      for (let k = 1; k < TILE_SIZE + 1; k++) {
        availableCoordinates[TILE_SIZE + 1][k] = true;
        availableCoordinates[k][TILE_SIZE + 1] = true;

        if (i === 0) {
            availableCoordinates[0][k] = true;
        }

        if (j === 0) {
          availableCoordinates[k][0] = true;
        }
      }

      let necessaryCoordinates = [];

      if (i > 0) {
        let leftTile = grid[i - 1][j];

        for (let k = 0; k < leftTile.circuitPaths.length; k++) {
          let coord1 = leftTile.circuitPaths[k][0];
          let coord2 = leftTile.circuitPaths[k][1];

          if (coord1[0] === TILE_SIZE + 1) {
            necessaryCoordinates.push([0, coord1[1]]);
            availableCoordinates[0][coord1[1]] = true;
          }

          if (coord2[0] === TILE_SIZE + 1) {
            necessaryCoordinates.push([0, coord2[1]]);
            availableCoordinates[0][coord2[1]] = true;
          }
        }
      }

      if (j > 0) {
        let upTile = grid[i][j - 1];

        for (let k = 0; k < upTile.circuitPaths.length; k++) {
          let coord1 = upTile.circuitPaths[k][0];
          let coord2 = upTile.circuitPaths[k][1];

          if (coord1[1] === TILE_SIZE + 1) {
            necessaryCoordinates.push([coord1[0], 0]);
            availableCoordinates[coord1[0]][0] = true;
          }

          if (coord2[1] === TILE_SIZE + 1) {
            necessaryCoordinates.push([coord2[0], 0]);
            availableCoordinates[coord2[0]][0] = true;
          }
        }
      }

      let tileCircuits = [];
      let availableCoordList = [];

      for (let k = 1; k < TILE_SIZE + 2; k++) {
        if (availableCoordinates[0][k]) {
          availableCoordList.push([0, k]);
        }
        if (availableCoordinates[k][0]) {
          availableCoordList.push([k, 0]);
        }
        if (availableCoordinates[TILE_SIZE + 1][k]) {
          availableCoordList.push([TILE_SIZE + 1, k]);
        }
        if (availableCoordinates[k][TILE_SIZE + 1]) {
          availableCoordList.push([k, TILE_SIZE + 1]);
        }
      }

      while (necessaryCoordinates.length > 0) {
        let coord = necessaryCoordinates.splice(randomIndex(necessaryCoordinates), 1)[0];

        for (let k = 0; k < availableCoordList.length; k++) {
          if (availableCoordList[k][0] === coord[0]
              && availableCoordList[k][1] === coord[1]) {
            availableCoordList.splice(k, 1);
            break;
          }
        }

        let availableCoord;

        if (necessaryCoordinates.length < TILE_CIRCUITS - tileCircuits.length) {
          availableCoord = availableCoordList.splice(randomIndex(availableCoordList), 1)[0];

          for (let k = 0; k < necessaryCoordinates.length; k++) {
            if (necessaryCoordinates[k][0] === availableCoord[0]
                && necessaryCoordinates[k][1] === availableCoord[1]) {
              necessaryCoordinates.splice(k, 1);
              break;
            }
          }
        } else {
          availableCoord = necessaryCoordinates.splice(randomIndex(necessaryCoordinates), 1)[0];

          for (let k = 0; k < availableCoordList.length; k++) {
            if (availableCoordList[k][0] === availableCoord[0]
                && availableCoordList[k][1] === availableCoord[1]) {
              availableCoordList.splice(k, 1);
              break;
            }
          }
        }

        tileCircuits.push([coord, availableCoord]);
        updateCircuitEnds(i, j, coord);
        updateCircuitEnds(i, j, availableCoord);
      }

      while (tileCircuits.length < TILE_CIRCUITS && availableCoordList.length > 1) {
        let coord1 = availableCoordList.splice(randomIndex(availableCoordList), 1)[0];
        let coord2 = availableCoordList.splice(randomIndex(availableCoordList), 1)[0];

        tileCircuits.push([coord1, coord2]);
        updateCircuitEnds(i, j, coord1);
        updateCircuitEnds(i, j, coord2);
      }

      grid[i][j] = {
        gridCoords: [i, j],
        x: OFFSET_SIZE + CELL_SIZE * i,
        y: OFFSET_SIZE + CELL_SIZE * j,
        circuitPaths: tileCircuits,
        fixed: false,
      };
    }
  }
}

function updateCircuitEnds(i, j, coord) {
  if (i === 0) {
    if (coord[0] === 0) {
      circuitEnds.push([0, j * (TILE_SIZE + 2) + coord[1]]);
    }
  } else if (i === COLS - 1) {
    if (coord[0] === TILE_SIZE + 1) {
      circuitEnds.push([(TILE_SIZE + 2) * COLS - 1, j * (TILE_SIZE + 2) + coord[1]]);
    }
  }

  if (j === 0) {
    if (coord[1] === 0) {
      circuitEnds.push([i * (TILE_SIZE + 2) + coord[0], 0]);
    }
  } else if (j === ROWS - 1) {
    if (coord[1] === TILE_SIZE + 1) {
      circuitEnds.push([i * (TILE_SIZE + 2) + coord[0], (TILE_SIZE + 2) * ROWS - 1]);
    }
  }
}

function getConnectedTile(coord, tile, gridToDraw) {
  let connectingTile;
  let connectingCoord;

  if (coord[0] === 0) {
    if (tile.gridCoords[0] === 0) {
      return null;
    }

    connectingTile = gridToDraw[tile.gridCoords[0] - 1][tile.gridCoords[1]];
    connectingCoord = [TILE_SIZE + 1, coord[1]];
  } else if (coord[0] === TILE_SIZE + 1) {
    if (tile.gridCoords[0] === COLS - 1) {
      return null;
    }

    connectingTile = gridToDraw[tile.gridCoords[0] + 1][tile.gridCoords[1]];
    connectingCoord = [0, coord[1]];
  } else if (coord[1] === 0) {
    if (tile.gridCoords[1] === 0) {
      return null;
    }

    connectingTile = gridToDraw[tile.gridCoords[0]][tile.gridCoords[1] - 1];
    connectingCoord = [coord[0], TILE_SIZE + 1];
  } else if (coord[1] === TILE_SIZE + 1) {
    if (tile.gridCoords[1] === ROWS - 1) {
      return null;
    }

    connectingTile = gridToDraw[tile.gridCoords[0]][tile.gridCoords[1] + 1];
    connectingCoord = [coord[0], 0];
  }

  for (let i = 0; i < connectingTile.circuitPaths.length; i++) {
    let coord1 = connectingTile.circuitPaths[i][0];
    let coord2 = connectingTile.circuitPaths[i][1];

    if (coord1[0] === connectingCoord[0] && coord1[1] === connectingCoord[1]) {
      return [coord2, coord1, connectingTile];
    } else if (coord2[0] === connectingCoord[0] && coord2[1] === connectingCoord[1]) {
      return [coord1, coord2, connectingTile];
    }
  }

  return null;
}

function recursiveGetConnectedTile(coord, otherCoord, tile, gridToDraw, context) {
  if (context) {
    let coordPath1 = getCoordinatePath(tile.gridCoords, coord);
    let coordPath2 = getCoordinatePath(tile.gridCoords, otherCoord);

    context.beginPath();
    context.moveTo(coordPath1[0][0], coordPath1[0][1]);
    context.lineTo(coordPath1[1][0], coordPath1[1][1]);
    context.lineTo(coordPath2[1][0], coordPath2[1][1]);
    context.lineTo(coordPath2[0][0], coordPath2[0][1]);
    context.stroke();
  }

  let connectedTileResult = getConnectedTile(coord, tile, gridToDraw);

  if (connectedTileResult) {
    return recursiveGetConnectedTile(...connectedTileResult, gridToDraw, context);
  }

  if (coord[0] === 0 && tile.gridCoords[0] === 0) {
    for (let i = 0; i < circuitEnds.length; i++) {
      let circuitEnd = circuitEnds[i];

      if (circuitEnd[0] === 0 && circuitEnd[1] === coord[1] + tile.gridCoords[1] * (TILE_SIZE + 2)) {
        return circuitEnd;
      }
    }

    return null;
  } else if (coord[0] === TILE_SIZE + 1 && tile.gridCoords[0] === COLS - 1) {
    for (let i = 0; i < circuitEnds.length; i++) {
      let circuitEnd = circuitEnds[i];

      if (circuitEnd[0] === COLS * (TILE_SIZE + 2) - 1 && circuitEnd[1] === coord[1] + tile.gridCoords[1] * (TILE_SIZE + 2)) {
        return circuitEnd;
      }
    }

    return null;
  } else if (coord[1] === 0 && tile.gridCoords[1] === 0) {
    for (let i = 0; i < circuitEnds.length; i++) {
      let circuitEnd = circuitEnds[i];

      if (circuitEnd[1] === 0 && circuitEnd[0] === coord[0] + tile.gridCoords[0] * (TILE_SIZE + 2)) {
        return circuitEnd;
      }
    }

    return null;
  } else if (coord[1] === TILE_SIZE + 1 && tile.gridCoords[1] === ROWS - 1) {
    for (let i = 0; i < circuitEnds.length; i++) {
      let circuitEnd = circuitEnds[i];

      if (circuitEnd[1] === ROWS * (TILE_SIZE + 2) - 1 && circuitEnd[0] === coord[0] + tile.gridCoords[0] * (TILE_SIZE + 2)) {
        return circuitEnd;
      }
    }

    return null;
  }

  return null;
}

function circuitGetConnectedEnd(circuitEnd, gridToDraw, context = null) {
  let connectingTile;
  let connectingCoord;

  if (circuitEnd[0] === 0) {
    connectingTile = gridToDraw[0][Math.floor(circuitEnd[1] / (TILE_SIZE + 2))];
    connectingCoord = [0, circuitEnd[1] % (TILE_SIZE + 2)];
  } else if (circuitEnd[0] === (COLS * (TILE_SIZE + 2) - 1)) {
    connectingTile = gridToDraw[COLS - 1][Math.floor(circuitEnd[1] / (TILE_SIZE + 2))];
    connectingCoord = [TILE_SIZE + 1, circuitEnd[1] % (TILE_SIZE + 2)];
  } else if (circuitEnd[1] === 0) {
    connectingTile = gridToDraw[Math.floor(circuitEnd[0] / (TILE_SIZE + 2))][0];
    connectingCoord = [circuitEnd[0] % (TILE_SIZE + 2), 0];
  } else if (circuitEnd[1] === (ROWS * (TILE_SIZE + 2) - 1)) {
    connectingTile = gridToDraw[Math.floor(circuitEnd[0] / (TILE_SIZE + 2))][ROWS - 1];
    connectingCoord = [circuitEnd[0] % (TILE_SIZE + 2), TILE_SIZE + 1];
  }

  for (let i = 0; i < connectingTile.circuitPaths.length; i++) {
    let coord1 = connectingTile.circuitPaths[i][0];
    let coord2 = connectingTile.circuitPaths[i][1];

    if (coord1[0] === connectingCoord[0] && coord1[1] === connectingCoord[1]) {
      return recursiveGetConnectedTile(coord2, coord1, connectingTile, gridToDraw, context);
    } else if (coord2[0] === connectingCoord[0] && coord2[1] === connectingCoord[1]) {
      return recursiveGetConnectedTile(coord1, coord2, connectingTile, gridToDraw, context);
    }
  }

  return null;
}

export function drawInstructions() {
  drawInstructionsHelper("🔌\uFE0E Circuit Grid Puzzle 🔌\uFE0E",
      ["Arrange the tiles to complete all the outgoing circuits."],
      ["Click or tap to select tiles and swap them.",
          "Right-click or tap with a 2nd finger to rotate tiles."],
          window.app.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.lineWidth = LINE_THICKNESS;

  let gridToDraw = window.app.puzzleState.showingSolution ? solution : grid;
  gridToDraw.flat().forEach(tile => {
    context.fillStyle = tile.fixed ? BACKGROUND_COLOR : (tile === selection ? ALERT_COLOR : "#000000");
    context.strokeStyle = "#808080";
    context.beginPath();
    context.rect(tile.x + TILE_BORDER, tile.y + TILE_BORDER, CELL_SIZE - 2 * TILE_BORDER, CELL_SIZE - 2 * TILE_BORDER);
    context.fill();

    tile.circuitPaths.forEach(path => {
      let coord1 = path[0];
      let coord2 = path[1];

      let coordPath1 = getCoordinatePath(tile.gridCoords, coord1);
      let coordPath2 = getCoordinatePath(tile.gridCoords, coord2);

      context.beginPath();
      context.moveTo(coordPath1[0][0], coordPath1[0][1]);
      context.lineTo(coordPath1[1][0], coordPath1[1][1]);
      context.lineTo(coordPath2[1][0], coordPath2[1][1]);
      context.lineTo(coordPath2[0][0], coordPath2[0][1]);
      context.stroke();
    });
  });

  let solved = true;
  let circuitEndsToDraw = [...circuitEnds];

  while (circuitEndsToDraw.length > 0) {
    let coord = circuitEndsToDraw.splice(0, 1)[0];

    let connectedEnd = circuitGetConnectedEnd(coord, gridToDraw);

    drawCircuitEnd(context, coord, connectedEnd != null);

    if (connectedEnd) {
      drawCircuitEnd(context, connectedEnd, true);

      for (let i = 0; i < circuitEndsToDraw.length; i++) {
        if (circuitEndsToDraw[i][0] == connectedEnd[0]
            && circuitEndsToDraw[i][1] == connectedEnd[1]) {
          circuitEndsToDraw.splice(i, 1);
          break;
        }
      }

      // Draw whole path as connected
      circuitGetConnectedEnd(coord, gridToDraw, context);
    } else {
      solved = false;
    }
  }

  if (solved) {
    if (selection) {
      selection = null;
      drawPuzzle();
      return;
    }

    context.strokeStyle = SUCCESS_COLOR;
    context.lineWidth = OFFSET_SIZE / 2;
    context.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!window.app.puzzleState.showingSolution) {
      if (window.app.puzzleState.interactive) {
        endPuzzle();
        audioManager.play(CHIME_SOUND);
      }
    }
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];
}

function drawCircuitEnd(context, coord, connected) {
  let startX;
  let startY;
  let endX;
  let endY;

  let offset = OFFSET_SIZE;

  if (coord[0] === 0) {
    startX = OFFSET_SIZE;
    endX = startX - offset;
    startY = OFFSET_SIZE + TILE_CELL_SIZE / 2 + coord[1] * TILE_CELL_SIZE;
    endY = startY;
  } else if (coord[0] === COLS * (TILE_SIZE + 2) - 1) {
    startX = OFFSET_SIZE + CELL_SIZE * COLS;
    endX = startX + offset;
    startY = OFFSET_SIZE + TILE_CELL_SIZE / 2 + coord[1] * TILE_CELL_SIZE;
    endY = startY;
  } else if (coord[1] === 0) {
    startX = OFFSET_SIZE + TILE_CELL_SIZE / 2 + coord[0] * TILE_CELL_SIZE;
    endX = startX;
    startY = OFFSET_SIZE;
    endY = startY - offset;
  } else if (coord[1] === ROWS * (TILE_SIZE + 2) - 1) {
    startX = OFFSET_SIZE + TILE_CELL_SIZE / 2 + coord[0] * TILE_CELL_SIZE;
    endX = startX;
    startY = OFFSET_SIZE + CELL_SIZE * ROWS;
    endY = startY + offset;
  }

  context.strokeStyle = connected ? SUCCESS_COLOR : "#808080";
  context.beginPath();
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
}

function getCoordinatePath(gridCoords, coord) {
  let convertedCoord = [coord[0] + gridCoords[0] * (TILE_SIZE + 2),
      coord[1] + gridCoords[1] * (TILE_SIZE + 2)];

  let startX;
  let startY;
  let endX;
  let endY;

  if (coord[0] === 0) {
    startX = OFFSET_SIZE + convertedCoord[0] * TILE_CELL_SIZE;
    endX = startX + TILE_CELL_SIZE / 2;
    startY = OFFSET_SIZE + TILE_CELL_SIZE / 2 + convertedCoord[1] * TILE_CELL_SIZE;
    endY = startY;
  } else if (coord[0] === TILE_SIZE + 1) {
    startX = OFFSET_SIZE + (convertedCoord[0] + 1) * TILE_CELL_SIZE;
    endX = startX - TILE_CELL_SIZE / 2;
    startY = OFFSET_SIZE + TILE_CELL_SIZE / 2 + convertedCoord[1] * TILE_CELL_SIZE;
    endY = startY;
  } else if (coord[1] === 0) {
    startX = OFFSET_SIZE + TILE_CELL_SIZE / 2 + convertedCoord[0] * TILE_CELL_SIZE;
    endX = startX;
    startY = OFFSET_SIZE + convertedCoord[1] * TILE_CELL_SIZE;
    endY = startY + TILE_CELL_SIZE / 2;
  } else if (coord[1] === TILE_SIZE + 1) {
    startX = OFFSET_SIZE + TILE_CELL_SIZE / 2 + convertedCoord[0] * TILE_CELL_SIZE;
    endX = startX;
    startY = OFFSET_SIZE + (convertedCoord[1] + 1) * TILE_CELL_SIZE;
    endY = startY - TILE_CELL_SIZE / 2;
  }

  return [[startX, startY], [endX, endY]];
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (window.app.puzzleState.tutorialStage > tutorials.length) {
    window.app.puzzleState.tutorialStage = 0;
  }

  DIFFICULTY = window.app.router.difficulty;
  FIXED_TILES = 5 - DIFFICULTY; // Quick: 4, Casual: 3, Challenging: 2, Intense: 1

  selection = null;
  circuitEnds = [];
  queuedSounds = [];

  if (window.app.puzzleState.tutorialStage) {
    const tutorial = tutorials[window.app.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
    TILE_CELL_SIZE = CELL_SIZE / (TILE_SIZE + 2);

    grid = deepCopy(tutorial.grid);
    circuitEnds = tutorial.circuitEnds;

    solution = deepCopy(grid);

    if (tutorial.rotate) {
      rotateTile(grid[0][0], false);
    }

    if (tutorial.swap) {
      const tile1 = grid[0][0];
      const tile1X = tile1.x;
      const tile1Y = tile1.y;

      const tile2 = grid[0][1];

      tile1.gridCoords = [0, 1];
      tile2.gridCoords = [0, 0];
      tile1.x = tile2.x;
      tile1.y = tile2.y;
      tile2.x = tile1X;
      tile2.y = tile1Y;
      grid[0][0] = tile2;
      grid[0][1] = tile1;
    }
  } else {
    ROWS = 3;
    COLS = 3;
    CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
    TILE_CELL_SIZE = CELL_SIZE / (TILE_SIZE + 2);

    generateGrid();

    let moveableTiles = grid.flat();

    for (let i = 0; i < FIXED_TILES; i++) {
      let fixedTile = moveableTiles.splice(randomIndex(moveableTiles), 1)[0];
      fixedTile.fixed = true;
    }

    solution = deepCopy(grid);

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

        let tileRotations = Math.floor(Math.random() * 4);
        for (let i = 0; i < tileRotations; i++) {
          rotateTile(tile, false);
        }
      });

      let circuitEndsToDraw = [...circuitEnds];

      while (puzzleSolved && circuitEndsToDraw.length > 0) {
        let coord = circuitEndsToDraw.splice(0, 1)[0];
        let connectedEnd = circuitGetConnectedEnd(coord, grid);
        puzzleSolved &= connectedEnd;

        if (connectedEnd) {
          for (let i = 0; i < circuitEndsToDraw.length; i++) {
            if (circuitEndsToDraw[i][0] == connectedEnd[0]
                && circuitEndsToDraw[i][1] == connectedEnd[1]) {
              circuitEndsToDraw.splice(i, 1);
              break;
            }
          }
        }
      }
    }
  }

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

function rotateTile(tile, playSound = true) {
  if (playSound) {
    queuedSounds.push(ROTATE_SOUND);
  }

  tile.circuitPaths.forEach(path => {
    path.forEach(coord => {
      let x = coord[0];
      let y = coord[1];
      coord[0] = TILE_SIZE + 1 - y;
      coord[1] = x;
    });
  });
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

        if (!tile.fixed && mouseX > tile.x && mouseY > tile.y
            && mouseX - tile.x < CELL_SIZE && mouseY - tile.y < CELL_SIZE) {
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

  // Right click
  } else if (event.button === 2) {
    if (window.app.puzzleState.interactive) {
      let canvasRect = event.target.getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;
      let tiles = grid.flat();

      // For-each loops cannot be broken out of!
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        if (!tile.fixed && mouseX > tile.x && mouseY > tile.y
            && mouseX - tile.x < CELL_SIZE && mouseY - tile.y < CELL_SIZE) {
          rotateTile(tile);

          drawPuzzle();
          return;
        }
      }
    }

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseDown();
  }
}

export function onMouseUp(event) {
  // Middle click
  if (event.button === 1) {
    onMiddleMouseUp();
  }
}

export function onTouchStart(event) {
  if (event.touches.length === 2) {
    if (window.app.puzzleState.interactive) {
      // Prevent triggered mouse events
      event.preventDefault();

      let canvasRect = document.getElementById("puzzleCanvas").getBoundingClientRect();

      let tiles = grid.flat();
      let touchedTile;

      // For-each loops cannot be broken out of!
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        for (let j = 0; j < event.touches.length; j++) {
          let touch = event.touches[j];
          let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
          let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

          if (!tile.fixed && touchX > tile.x && touchY > tile.y
              && touchX - tile.x < CELL_SIZE && touchY - tile.y < CELL_SIZE) {
            // If two different tiles are touched simultaneously, do nothing
            if (touchedTile && event.changedTouches.length > 1
                && tile !== touchedTile) {
              return;
            }

            // Otherwise if two different tiles are both touched,
            // rotate the one touched least recently
            if (!touchedTile || touch.identifier !== event.changedTouches[0].identifier) {
              touchedTile = tile;
            }

            break;
          }
        }
      }

      if (touchedTile) {
        rotateTile(touchedTile);

        drawPuzzle();
      }
    }
  } else if (event.changedTouches.length === 1) {
    if (window.app.puzzleState.interactive) {
      let canvas = document.getElementById("puzzleCanvas");
      if (event.target !== canvas) {
        return;
      }

      // Prevent triggered mouse events
      event.preventDefault();

      let canvasRect = canvas.getBoundingClientRect();
      let touch = event.changedTouches[0];
      let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
      let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;
      let tiles = grid.flat();

      // For-each loops cannot be broken out of!
      for (let i = 0; i < tiles.length; i++) {
        let tile = tiles[i];

        if (!tile.fixed && touchX > tile.x && touchY > tile.y
            && touchX - tile.x < CELL_SIZE && touchY - tile.y < CELL_SIZE) {
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
