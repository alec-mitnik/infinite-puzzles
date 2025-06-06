import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, getPuzzleCanvas, onMiddleMouseDown, onMiddleMouseUp, randomEl, updateForTutorialRecommendation, updateForTutorialState } from "../js/utils.js";

const DIRECTION = Object.freeze({
  "UP": 1,
  "RIGHT": 2,
  "DOWN": 3,
  "LEFT": 4,
});
const DIRECTIONS = Object.values(DIRECTION);

const NODE_TYPE = Object.freeze({
  "EMITTER": 1,
  "BLOCK": 2,
  "RECEIVER": 3,
});

const CLINK_SOUND = audioManager.SoundEffects.CLINK;
const SNAP_SOUND = audioManager.SoundEffects.CLICK;
const RESET_SOUND = audioManager.SoundEffects.BOING;
const CHIME_SOUND = audioManager.SoundEffects.CHIME;

const tutorials = [
  {
    rows: 2,
    cols: 2,
    grid: [
      [{
        coord: [0, 0],
      },
      {
        coord: [0, 1],
      }],
      [{
        coord: [1, 0],
      },
      {
        coord: [1, 1],
      }],
    ],
    nodes: [
      {
        type: NODE_TYPE.EMITTER,
        coord: [0, 0],
        // GRID_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(ROWS, COLS) / (Math.max(ROWS, COLS) + 1.5);
        // CELL_SIZE = GRID_SIZE / Math.max(ROWS, COLS);
        // CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1.5);
        // let centerOffset = center ? CELL_SIZE / 2 : 0;
        // return [coord[0] * CELL_SIZE + centerOffset, coord[1] * CELL_SIZE + centerOffset];
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [1, 1],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [0, 1],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [1, 0],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (2 + 1.5))],
      },
      // {
      //   type: NODE_TYPE.RECEIVER,
      //   coord: [i, receiverY],
      //   canvasCoord: gridToCanvasCoord([i, receiverY], true),
      //   directions: [DIRECTION.UP],
      // },
    ],
  },
  {
    rows: 3,
    cols: 3,
    grid: [
      [{
        coord: [0, 0],
      },
      {
        coord: [0, 1],
      },
      {
        coord: [0, 2],
      }],
      [{
        coord: [1, 0],
      },
      {
        coord: [1, 1],
      },
      {
        coord: [1, 2],
      }],
      [{
        coord: [2, 0],
      },
      {
        coord: [2, 1],
      },
      {
        coord: [2, 2],
      }],
    ],
    nodes: [
      {
        type: NODE_TYPE.EMITTER,
        coord: [0, 0],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [1, 1],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [2, 2],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [1, 0],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [2, 1],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [0, 2],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
    ],
  },
  {
    rows: 3,
    cols: 3,
    grid: [
      [{
        coord: [0, 0],
      },
      {
        coord: [0, 1],
      },
      {
        coord: [0, 2],
      }],
      [{
        coord: [1, 0],
      },
      {
        coord: [1, 1],
      },
      {
        coord: [1, 2],
      }],
      [{
        coord: [2, 0],
      },
      {
        coord: [2, 1],
      },
      {
        coord: [2, 2],
      }],
    ],
    nodes: [
      {
        type: NODE_TYPE.EMITTER,
        coord: [0, 0],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [1, 1],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [2, 2],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [1, 0],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [2, 1],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [0, 2],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [0, 1],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
        directions: [DIRECTION.UP, DIRECTION.RIGHT],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [1, 2],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
        directions: [DIRECTION.UP, DIRECTION.RIGHT],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [2, 0],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (3 + 1.5))],
        directions: [],
      },
    ],
  },
  {
    rows: 4,
    cols: 4,
    grid: [
      [{
        coord: [0, 0],
      },
      {
        coord: [0, 1],
      },
      {
        coord: [0, 2],
      },
      {
        coord: [0, 3],
      }],
      [{
        coord: [1, 0],
      },
      {
        coord: [1, 1],
      },
      {
        coord: [1, 2],
      },
      {
        coord: [1, 3],
      }],
      [{
        coord: [2, 0],
      },
      {
        coord: [2, 1],
      },
      {
        coord: [2, 2],
      },
      {
        coord: [2, 3],
      }],
    ],
    nodes: [
      {
        type: NODE_TYPE.EMITTER,
        coord: [1, 0],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [2, 1],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [3, 2],
        canvasCoord: [3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.EMITTER,
        coord: [0, 3],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [0, 0],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [1, 3],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [2, 2],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.BLOCK,
        coord: [3, 1],
        canvasCoord: [3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [0, 1],
        canvasCoord: [0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
        directions: [DIRECTION.DOWN, DIRECTION.RIGHT],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [1, 2],
        canvasCoord: [1.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
        directions: [DIRECTION.UP],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [2, 3],
        canvasCoord: [2.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
        directions: [],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [3, 3],
        canvasCoord: [3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
        directions: [DIRECTION.UP],
      },
      {
        type: NODE_TYPE.RECEIVER,
        coord: [3, 0],
        canvasCoord: [3.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5)),
            0.5 * (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (4 + 1.5))],
        directions: [DIRECTION.LEFT],
      },
    ],
  },
];

let DIFFICULTY;
let ROWS;
let COLS;
let GRID_SIZE;
let CELL_SIZE;
let NODE_SIZE;
let LINE_THICKNESS;

let grid;
let nodes;
let solution;
let initialState;
let dragging = null;
let previousTouch = null;
let queuedSounds = [];

function generateGrid() {
  grid = Array.from({length: COLS}, (_el, x) => Array.from({length: ROWS},
      (_el, y) => ({
    coord: [x, y]
  })));

  let placementFound = false;

  while(!placementFound) {
    nodes = [];
    placementFound = true;
    let emitterColIndexes = Array.from({length: ROWS}, (_el, y) => y);
    let blockColIndexes = Array.from({length: ROWS}, (_el, y) => y);
    let receiverColIndexes = Array.from({length: ROWS}, (_el, y) => y);

    for (let i = 0; i < grid.length; i++) {
      let emitterY = randomEl(emitterColIndexes, true);

      let blockY = null;
      let savedIndexes = [];

      while (blockColIndexes.length && (blockY === null || blockY === emitterY)) {
        if (blockY !== null) {
          savedIndexes.push(blockY);
        }

        blockY = randomEl(blockColIndexes, true);
      }

      if (blockY === null || blockY === emitterY) {
        placementFound = false;
        break;
      }

      blockColIndexes = blockColIndexes.concat(savedIndexes);

      let receiverY = null;
      savedIndexes = [];

      while (receiverColIndexes.length &&
          (receiverY === null || receiverY === emitterY || receiverY === blockY)) {
        if (receiverY !== null) {
          savedIndexes.push(receiverY);
        }

        receiverY = randomEl(receiverColIndexes, true);
      }

      if (receiverY === null || receiverY === emitterY || receiverY === blockY) {
        placementFound = false;
        break;
      }

      receiverColIndexes = receiverColIndexes.concat(savedIndexes);

      nodes.push({
        type: NODE_TYPE.EMITTER,
        coord: [i, emitterY],
        canvasCoord: gridToCanvasCoord([i, emitterY], true),
      });

      nodes.push({
        type: NODE_TYPE.BLOCK,
        coord: [i, blockY],
        canvasCoord: gridToCanvasCoord([i, blockY], true),
      });

      nodes.push({
        type: NODE_TYPE.RECEIVER,
        coord: [i, receiverY],
        canvasCoord: gridToCanvasCoord([i, receiverY], true),
        directions: [],
      });
    }
  }

  const MAX_RECEIVERS_PER_SLICE = Math.floor((ROWS + COLS) / 5);
  const MAX_RECEIVERS = Math.floor((ROWS + COLS) * 3 / 4
      + Math.random() * (ROWS + COLS) / 2);
      //(ROWS + COLS) / 4 * MAX_RECEIVERS_PER_SLICE
      //+ Math.floor(Math.random() * ((ROWS + COLS) / 4 * MAX_RECEIVERS_PER_SLICE));

  // Add receivers past blocks that are receiving emission to make them relevant
  let preferredCells = [];
  let blocks = nodes.filter(node => node.type === NODE_TYPE.BLOCK);
  blocks.forEach(block => {
    DIRECTIONS.forEach(direction => {
      let foundEmitter = false;

      switch (direction) {
        case DIRECTION.UP:
          for (let i = block.coord[1]; i >= 0; i--) {
            let nodeAtCoord = getNodeAtCoord(block.coord[0], i);

            if (!nodeAtCoord) {
              if (foundEmitter) {
                preferredCells.push(grid[block.coord[0]][i]);
              }

              continue;
            } else if (nodeAtCoord.type === NODE_TYPE.BLOCK) {
              break;
            } else if (nodeAtCoord.type === NODE_TYPE.EMITTER) {
              foundEmitter = true;
            }
          }

          break;
        case DIRECTION.DOWN:
          for (let i = block.coord[1]; i < ROWS; i++) {
            let nodeAtCoord = getNodeAtCoord(block.coord[0], i);

            if (!nodeAtCoord) {
              if (foundEmitter) {
                preferredCells.push(grid[block.coord[0]][i]);
              }

              continue;
            } else if (nodeAtCoord.type === NODE_TYPE.BLOCK) {
              break;
            } else if (nodeAtCoord.type === NODE_TYPE.EMITTER) {
              foundEmitter = true;
            }
          }

          break;
        case DIRECTION.LEFT:
          for (let i = block.coord[0]; i >= 0; i--) {
            let nodeAtCoord = getNodeAtCoord(i, block.coord[1]);

            if (!nodeAtCoord) {
              if (foundEmitter) {
                preferredCells.push(grid[i][block.coord[1]]);
              }

              continue;
            } else if (nodeAtCoord.type === NODE_TYPE.BLOCK) {
              break;
            } else if (nodeAtCoord.type === NODE_TYPE.EMITTER) {
              foundEmitter = true;
            }
          }

          break;
        case DIRECTION.RIGHT:
          for (let i = block.coord[0]; i < COLS; i++) {
            let nodeAtCoord = getNodeAtCoord(i, block.coord[1]);

            if (!nodeAtCoord) {
              if (foundEmitter) {
                preferredCells.push(grid[i][block.coord[1]]);
              }

              continue;
            } else if (nodeAtCoord.type === NODE_TYPE.BLOCK) {
              break;
            } else if (nodeAtCoord.type === NODE_TYPE.EMITTER) {
              foundEmitter = true;
            }
          }

          break;
        default:
          console.error("Unrecognized direction:", direction);
      }
    });
  });

  let colReceiverCount = Array.from({length: COLS}, () => 1);
  let rowReceiverCount = Array.from({length: ROWS}, () => 1);
  let freeCells = grid.flat().filter(cell => {
    return !preferredCells.includes(cell) && !getNodeAtCoord(cell.coord);
  });

  for (let i = COLS; i <= MAX_RECEIVERS && (preferredCells.length || freeCells.length); i++) {
    let cell = preferredCells.length ? randomEl(preferredCells, true)
        : randomEl(freeCells, true);

    colReceiverCount[cell.coord[0]]++;
    if (colReceiverCount[cell.coord[0]] >= MAX_RECEIVERS_PER_SLICE) {
      freeCells = freeCells.filter(freeCell => freeCell.coord[0] !== cell.coord[0]);
    }

    rowReceiverCount[cell.coord[1]]++;
    if (rowReceiverCount[cell.coord[1]] >= MAX_RECEIVERS_PER_SLICE) {
      freeCells = freeCells.filter(freeCell => freeCell.coord[1] !== cell.coord[1]);
    }

    nodes.push({
      directions: [],
      type: NODE_TYPE.RECEIVER,
      coord: [...cell.coord],
      canvasCoord: gridToCanvasCoord([...cell.coord], true)
    });
  }

  nodes.filter(node => node.type === NODE_TYPE.RECEIVER).forEach(node => {
    // let cell = grid[node.coord[0]][node.coord[1]];

    node.directions = DIRECTIONS.filter(direction => {
      return isCoordReceivingFromDirection(node.coord, direction);
    });
  });

  // Shuffle the data order so the draw order won't reveal the solution.
  // Fixed elements (receivers) should come first so they always show behind.
  let shuffledNodes = nodes.filter(node => node.type === NODE_TYPE.RECEIVER);
  let remainingNodes = nodes.filter(node => node.type !== NODE_TYPE.RECEIVER);
  while (remainingNodes.length > 0) {
    shuffledNodes.push(randomEl(remainingNodes, true));
  }

  nodes = shuffledNodes;
  solution = deepCopy(nodes);

  setTimeout(finishInit);
}

function getNodeAtCoord(coord) {
  let nodesToUse = window.app.puzzleState.showingSolution ? solution : nodes;
  let matches = nodesToUse.filter(node => {
    return dragging !== node
        && node.coord[0] === coord[0] && node.coord[1] === coord[1];
  });

  let emitterMatches = matches.filter(node => node.type === NODE_TYPE.EMITTER);
  return emitterMatches.length ? emitterMatches[0]
      : (matches.length ? matches[0] : null);
}

function isCoordReceivingFromDirection(coord, direction) {
  switch (direction) {
    case DIRECTION.UP:
      for (let i = coord[1] - 1; i >= 0; i--) {
        let node = getNodeAtCoord([coord[0], i]);

        if (node) {
          return node.type === NODE_TYPE.EMITTER;
        }
      }

      break;
    case DIRECTION.DOWN:
      for (let i = coord[1] + 1; i < ROWS; i++) {
        let node = getNodeAtCoord([coord[0], i]);

        if (node) {
          return node.type === NODE_TYPE.EMITTER;
        }
      }

      break;
    case DIRECTION.LEFT:
      for (let i = coord[0] - 1; i >= 0; i--) {
        let node = getNodeAtCoord([i, coord[1]]);

        if (node) {
          return node.type === NODE_TYPE.EMITTER;
        }
      }

      break;
    case DIRECTION.RIGHT:
      for (let i = coord[0] + 1; i < COLS; i++) {
        let node = getNodeAtCoord([i, coord[1]]);

        if (node) {
          return node.type === NODE_TYPE.EMITTER;
        }
      }

      break;
    default:
      console.error("Unrecognized direction:", direction);
  }

  return false;
}

export function drawInstructions() {
  drawInstructionsHelper("Emitters Grid Puzzle", "📻\uFE0E",
      ["Place a 4-way emitter and a block in each row/column,",
          "activating each white receiver but no black ones."],
      ["Drag emitters and blocks to move them."],
      window.app.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (!window.app.puzzleState.showingSolution && !window.app.puzzleState.ended) {
    // Reset
    context.font = "bold " + (CELL_SIZE / 4) + "px Arial"
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#ffffff";
    context.lineWidth = LINE_THICKNESS;
    let resetX = CANVAS_WIDTH - CELL_SIZE / 2;
    let resetY = CANVAS_HEIGHT - CELL_SIZE / 2 - CELL_SIZE * 1 / 20;

    context.fillText("Reset", resetX,
        resetY + CELL_SIZE / 12 + CELL_SIZE * 8 / 20);

    context.beginPath();
    context.arc(resetX, resetY, CELL_SIZE / 4, Math.PI, 3 / 2 * Math.PI, true);
    context.lineTo(resetX + CELL_SIZE * 0.05, resetY - CELL_SIZE * 0.15);
    context.lineTo(resetX + CELL_SIZE * 0.1, resetY - CELL_SIZE * 0.3);
    context.lineTo(resetX - CELL_SIZE * 0.03, resetY - CELL_SIZE * 0.25);
    context.lineTo(resetX + CELL_SIZE * 0.028, resetY - CELL_SIZE * 0.18);
    context.lineTo(resetX + CELL_SIZE * 0.03, resetY - CELL_SIZE * 0.25);
    context.stroke();
  }


  context.strokeStyle = "#808080";
  context.lineWidth = LINE_THICKNESS;
  context.lineCap = "square";

  for (let i = 0; i < ROWS; i++) {
    context.beginPath();
    context.moveTo(0, (i + 1) * CELL_SIZE);
    context.lineTo(COLS * CELL_SIZE, (i + 1) * CELL_SIZE);
    context.stroke();
  }

  for (let i = 0; i < COLS; i++) {
    context.beginPath();
    context.moveTo((i + 1) * CELL_SIZE, 0);
    context.lineTo((i + 1) * CELL_SIZE, ROWS * CELL_SIZE);
    context.stroke();
  }

  context.lineCap = "butt";
  let nodesToDraw = window.app.puzzleState.showingSolution ? solution : nodes;

  let allEmittersInGrid = nodesToDraw.every(node => {
    return node.type !== NODE_TYPE.EMITTER || isNodeInGrid(node);
  });

  let allNodesInGrid = nodesToDraw.every(node => isNodeInGrid(node));
  let anyOverlapping = nodesToDraw.some(node => isOverlapping(node));
  let rowsWithSharedEmitters = getSharedRows(NODE_TYPE.EMITTER);
  let rowsWithSharedBlocks = getSharedRows(NODE_TYPE.BLOCK);
  let columnsWithSharedEmitters = getSharedCols(NODE_TYPE.EMITTER);
  let columnsWithSharedBlocks = getSharedCols(NODE_TYPE.BLOCK);

  let solved = !dragging && allNodesInGrid && !anyOverlapping
      && !rowsWithSharedEmitters.length && !rowsWithSharedBlocks.length
      && !columnsWithSharedEmitters.length && !columnsWithSharedBlocks.length;

  drawEmissions(context);
  context.lineWidth = LINE_THICKNESS;

  nodesToDraw.forEach(node => {
    let invalid;

    switch(node.type) {
      case NODE_TYPE.RECEIVER:
        context.fillStyle = "#808080";
        //context.beginPath();
        //context.arc(...node.canvasCoord, NODE_SIZE, 0, 2 * Math.PI, false);
        //context.fill();
        context.fillRect(node.canvasCoord[0] - CELL_SIZE / 2, node.canvasCoord[1] - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);

        DIRECTIONS.forEach(direction => {
          let active = node.directions.includes(direction);
          let receiving = isCoordReceivingFromDirection(node.coord, direction);
          let strokeColor = ((!active || allEmittersInGrid) && active !== receiving)
              ? ALERT_COLOR
              : (active && active === receiving ? SUCCESS_COLOR : "#808080");

          if (active !== receiving) {
            solved = false;
          }

          context.beginPath();
          context.strokeStyle = strokeColor;
          context.fillStyle = active ?
              (/*active === receiving ? SUCCESS_COLOR :*/ "#ffffff") : "#000000";
          let dirCoord;

          switch (direction) {
            case DIRECTION.UP:
              dirCoord = [node.canvasCoord[0], node.canvasCoord[1] - CELL_SIZE * 3 / 8 + LINE_THICKNESS];
              break;
            case DIRECTION.DOWN:
              dirCoord = [node.canvasCoord[0], node.canvasCoord[1] + CELL_SIZE * 3 / 8 - LINE_THICKNESS];
              break;
            case DIRECTION.LEFT:
              dirCoord = [node.canvasCoord[0] - CELL_SIZE * 3 / 8 + LINE_THICKNESS, node.canvasCoord[1]];
              break;
            case DIRECTION.RIGHT:
              dirCoord = [node.canvasCoord[0] + CELL_SIZE * 3 / 8 - LINE_THICKNESS, node.canvasCoord[1]];
              break;
            default:
              console.error("Unrecognized direction:", direction);
              return;
          }

          context.arc(dirCoord[0], dirCoord[1], CELL_SIZE * 3 / 16 - LINE_THICKNESS / 2, 0, 2 * Math.PI, false);
          context.fill();
          context.stroke();
        });

        break;
      case NODE_TYPE.EMITTER:
        invalid = isOverlapping(node) || (isNodeInGrid(node)
            && (rowsWithSharedEmitters.includes(node.coord[1])
            || columnsWithSharedEmitters.includes(node.coord[0])));

        if (invalid) {
          solved = false;
        }

        drawEmitter(node, context, invalid);

        break;
      case NODE_TYPE.BLOCK:
        invalid = isOverlapping(node) || (isNodeInGrid(node)
            && (rowsWithSharedBlocks.includes(node.coord[1])
            || columnsWithSharedBlocks.includes(node.coord[0])));

        if (invalid) {
          solved = false;
        }

        drawBlock(node, context, invalid);

        break;
      default:
        console.error("Unrecognized node type:", node.type);
    }
  });

  if (solved) {
    //drawEmissions(context, true);

    nodesToDraw.filter(node => node.type === NODE_TYPE.EMITTER).forEach(node => {
      drawEmitter(node, context, false, true);
    });

    nodesToDraw.filter(node => node.type === NODE_TYPE.BLOCK).forEach(node => {
      drawBlock(node, context, false, true);
    });

    if (window.app.puzzleState.interactive) {
      // Cover up the reset button
      context.fillStyle = BACKGROUND_COLOR;
      context.fillRect(CANVAS_WIDTH - CELL_SIZE, CANVAS_HEIGHT - CELL_SIZE,
          CELL_SIZE, CELL_SIZE);

      endPuzzle(window.app.puzzleState.tutorialStage === tutorials.length);
      audioManager.play(CHIME_SOUND);
    }
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];
}

function drawEmissions(context, solved = false) {
  context.strokeStyle = solved ? SUCCESS_COLOR : "#ffffff40";
  context.lineWidth = LINE_THICKNESS * 2;

  let nodesToDraw = window.app.puzzleState.showingSolution ? solution : nodes;

  nodesToDraw.forEach(node => {
    let coord = node.coord;

    if (node.type === NODE_TYPE.EMITTER && isNodeInGrid(node)) {
      let upIndex = -1;
      let downIndex = ROWS;
      let leftIndex = -1;
      let rightIndex = COLS;

      // Up
      for (let i = coord[1] - 1; i >= 0; i--) {
        let node = getNodeAtCoord([coord[0], i]);

        if (node) {
          upIndex = i;
          break;
        }
      }

      // Down
      for (let i = coord[1] + 1; i < ROWS; i++) {
        let node = getNodeAtCoord([coord[0], i]);

        if (node) {
          downIndex = i;
          break;
        }
      }

      // Left
      for (let i = coord[0] - 1; i >= 0; i--) {
        let node = getNodeAtCoord([i, coord[1]]);

        if (node) {
          leftIndex = i;
          break;
        }
      }

      // Right
      for (let i = coord[0] + 1; i < COLS; i++) {
        let node = getNodeAtCoord([i, coord[1]]);

        if (node) {
          rightIndex = i;
          break;
        }
      }

      context.beginPath();
      context.moveTo(node.canvasCoord[0],
          upIndex * CELL_SIZE + (upIndex >= 0 ? CELL_SIZE / 2 : CELL_SIZE));
      context.lineTo(node.canvasCoord[0],
          downIndex * CELL_SIZE + (downIndex <= ROWS - 1 ? CELL_SIZE / 2 : 0));
      context.stroke();

      context.beginPath();
      context.moveTo(leftIndex * CELL_SIZE + (leftIndex >= 0 ? CELL_SIZE / 2 : CELL_SIZE),
          node.canvasCoord[1]);
      context.lineTo(rightIndex * CELL_SIZE + (rightIndex <= COLS - 1 ? CELL_SIZE / 2 : 0),
          node.canvasCoord[1]);
      context.stroke();
    }
  });
}

function drawEmitter(node, context, invalid, solved = false) {
  context.lineWidth = LINE_THICKNESS;

  context.fillStyle = solved ? SUCCESS_COLOR : (invalid ? ALERT_COLOR : "#808080");
  context.fillRect(node.canvasCoord[0] - NODE_SIZE, node.canvasCoord[1] - NODE_SIZE / 2, NODE_SIZE * 2, NODE_SIZE);
  context.fillRect(node.canvasCoord[0] - NODE_SIZE / 2, node.canvasCoord[1] - NODE_SIZE, NODE_SIZE, NODE_SIZE * 2);

  context.strokeStyle = "#ffffff";
  context.beginPath();
  context.moveTo(node.canvasCoord[0] - NODE_SIZE, node.canvasCoord[1]);
  context.lineTo(node.canvasCoord[0] + NODE_SIZE, node.canvasCoord[1]);
  context.stroke();
  context.beginPath();
  context.moveTo(node.canvasCoord[0], node.canvasCoord[1] - NODE_SIZE);
  context.lineTo(node.canvasCoord[0], node.canvasCoord[1] + NODE_SIZE);
  context.stroke();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(...node.canvasCoord, LINE_THICKNESS * 2, 0, 2 * Math.PI, false);
  context.fill();
}

function drawBlock(node, context, invalid, solved = false) {
  context.fillStyle = solved ? SUCCESS_COLOR : (invalid ? ALERT_COLOR : "#808080");
  context.fillRect(node.canvasCoord[0] - NODE_SIZE * 3 / 4,
      node.canvasCoord[1] - NODE_SIZE * 3 / 4, NODE_SIZE * 3 / 2, NODE_SIZE * 3 / 2);
}

function isNodeInGrid(node) {
  return node.type === NODE_TYPE.RECEIVER || (dragging !== node
      && node.canvasCoord[0] > 0 && node.canvasCoord[0] < COLS * CELL_SIZE
      && node.canvasCoord[1] > 0 && node.canvasCoord[1] < ROWS * CELL_SIZE);
}

function getSharedRows(nodeType) {
  let nodeList = window.app.puzzleState.showingSolution ? solution : nodes;
  let rows = nodeList.reduce((result, node, index) => {
    return (node.type === nodeType && isNodeInGrid(node)) ?
        [...result, node.coord[1]] : result;
  }, []);

  return [...new Set(rows.filter((row, index) => {
    return rows.indexOf(row) !== index;
  }))];
}

function getSharedCols(nodeType) {
  let nodeList = window.app.puzzleState.showingSolution ? solution : nodes;
  let cols = nodeList.reduce((result, node, index) => {
    return (node.type === nodeType && isNodeInGrid(node)) ?
        [...result, node.coord[0]] : result;
  }, []);

  return [...new Set(cols.filter((col, index) => {
    return cols.indexOf(col) !== index;
  }))];
}

function isOverlapping(node) {
  let nodeList = window.app.puzzleState.showingSolution ? solution : nodes;

  if (node.type !== NODE_TYPE.RECEIVER) {
    for (let i = 0; i < nodeList.length; i++) {
      let otherNode = nodeList[i];
      if (nodeList.indexOf(otherNode) !== nodeList.indexOf(node)
          && dragging !== node && dragging !== otherNode) {
        let distance =
            Math.sqrt(Math.pow(otherNode.canvasCoord[0] - node.canvasCoord[0], 2)
                + Math.pow(otherNode.canvasCoord[1] - node.canvasCoord[1], 2));

        if (distance <= NODE_SIZE * 2) {
          return true;
        }
      }
    }
  }

  return false;
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
  queuedSounds = [];

  if (window.app.puzzleState.tutorialStage) {
    const tutorial = tutorials[window.app.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    GRID_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(ROWS, COLS) / (Math.max(ROWS, COLS) + 1.5);
    CELL_SIZE = GRID_SIZE / Math.max(ROWS, COLS);
    NODE_SIZE = CELL_SIZE / 3;
    LINE_THICKNESS = -2 * Math.max(ROWS, COLS) + 18;

    grid = deepCopy(tutorial.grid);
    nodes = deepCopy(tutorial.nodes);
    solution = deepCopy(tutorial.nodes);

    finishInit();
  } else {
    DIFFICULTY = window.app.router.difficulty;

    // Quick: 6/6, Casual: 8/8, Challenging: 10/10, Intense: 12/12
    ROWS = 4 + DIFFICULTY * 2;
    COLS = 4 + DIFFICULTY * 2;
    GRID_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * Math.max(ROWS, COLS) / (Math.max(ROWS, COLS) + 1.5);
    CELL_SIZE = GRID_SIZE / Math.max(ROWS, COLS);
    NODE_SIZE = CELL_SIZE / 3;
    LINE_THICKNESS = 6;

    // Allow opportunity for loading screen to show
    setTimeout(generateGrid, 100);
  }
}

function finishInit() {
  let emitters = nodes.filter(node => node.type === NODE_TYPE.EMITTER);
  let blocks = nodes.filter(node => node.type === NODE_TYPE.BLOCK);

  emitters.forEach((node, i) => {
    node.canvasCoord = [(i + 1 / 2) * CELL_SIZE, CANVAS_HEIGHT - CELL_SIZE / 2];
    node.coord = canvasToGridCoord(node.canvasCoord);
  });

  blocks.forEach((node, i) => {
    node.canvasCoord = [CANVAS_WIDTH - CELL_SIZE / 2, (i + 1 / 2) * CELL_SIZE];
    node.coord = canvasToGridCoord(node.canvasCoord);
  });

  initialState = deepCopy(nodes);

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

function resetPuzzle() {
  nodes = deepCopy(initialState);
  audioManager.play(RESET_SOUND);
  drawPuzzle();
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive) {
      dragging = null;

      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let moveableNodes = nodes.filter(node => node.type !== NODE_TYPE.RECEIVER);

      for (let i = moveableNodes.length - 1; i >= 0; i--) {
        let node = moveableNodes[i];

        if (Math.sqrt(Math.pow(mouseX - node.canvasCoord[0], 2)
            + Math.pow(mouseY - node.canvasCoord[1], 2)) < CELL_SIZE * 3 / 8) {
          dragging = node;
          return;
        }
      }

      if (mouseX > CANVAS_WIDTH - CELL_SIZE && mouseY > CANVAS_HEIGHT - CELL_SIZE) {
        resetPuzzle();
      }
    }

  // Middle click
  } else if (event.button === 1) {
    if (dragging) {
      releaseNode(dragging);
      dragging = null;
    }

    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  if (window.app.puzzleState.interactive && !dragging && event.changedTouches.length === 1) {
    dragging = null;
    previousTouch = null;

    let touch = event.changedTouches[0];
    let canvasRect = getPuzzleCanvas().getBoundingClientRect();
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    let moveableNodes = nodes.filter(node => node.type !== NODE_TYPE.RECEIVER);

    for (let i = moveableNodes.length - 1; i >= 0; i--) {
      let node = moveableNodes[i];

      if (Math.sqrt(Math.pow(touchX - node.canvasCoord[0], 2)
          + Math.pow(touchY - node.canvasCoord[1], 2)) < CELL_SIZE / 2) {
        previousTouch = touch;
        dragging = node;
        return;
      }
    }

    if (touchX > CANVAS_WIDTH - CELL_SIZE && touchY > CANVAS_HEIGHT - CELL_SIZE) {
      resetPuzzle();
    }
  }
}

export function onMouseMove(event) {
  if (window.app.puzzleState.interactive && dragging) {
    // Can happen if mouse down triggered from touch end...
    if (!isNaN(event.movementX) && !isNaN(event.movementY)) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();

      dragging.canvasCoord[0] += event.movementX / window.devicePixelRatio * CANVAS_WIDTH / canvasRect.width;
      dragging.canvasCoord[1] += event.movementY / window.devicePixelRatio * CANVAS_HEIGHT / canvasRect.height;

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
      let movementX = movedTouch.clientX - previousTouch.clientX;
      let movementY = movedTouch.clientY - previousTouch.clientY;

      previousTouch = movedTouch;

      dragging.canvasCoord[0] += movementX * CANVAS_WIDTH / canvasRect.width;
      dragging.canvasCoord[1] += movementY * CANVAS_HEIGHT / canvasRect.height;

      drawPuzzle();
    }
  }
}

export function onMouseUp(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive && dragging) {
      releaseNode(dragging);
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
    let changedTouches = [...event.changedTouches];

    for (let i = 0; i < changedTouches.length; i++) {
      if (changedTouches[i].identifier === previousTouch.identifier) {
        previousTouch = null;
        releaseNode(dragging);
        dragging = null;

        drawPuzzle();

        return;
      }
    }
  }
}

export function onMouseOut() {
  if (window.app.puzzleState.interactive && dragging) {
    releaseNode(dragging);
    dragging = null;

    drawPuzzle();
  }

  dragging = null;
}

function releaseNode(node, playSound = true) {
  let xPos = Math.max(NODE_SIZE, Math.min(CANVAS_WIDTH - NODE_SIZE, node.canvasCoord[0]));
  let yPos = Math.max(NODE_SIZE, Math.min(CANVAS_HEIGHT - NODE_SIZE, node.canvasCoord[1]));

  if (xPos > 0 && xPos < COLS * CELL_SIZE
      && yPos > 0 && yPos < ROWS * CELL_SIZE) {
    xPos = Math.floor(xPos / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    yPos = Math.floor(yPos / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;

    if (playSound) {
      queuedSounds.push(SNAP_SOUND);
    }
  } else if (playSound) {
    audioManager.play(CLINK_SOUND);
  }

  node.canvasCoord = [xPos, yPos];
  node.coord = canvasToGridCoord(node.canvasCoord);

  previousTouch = null;
}

function gridToCanvasCoord(coord, center = false) {
  let centerOffset = center ? CELL_SIZE / 2 : 0;
  return [coord[0] * CELL_SIZE + centerOffset, coord[1] * CELL_SIZE + centerOffset];
}

function canvasToGridCoord(coord) {
  return [Math.floor(coord[0] / CELL_SIZE), Math.floor(coord[1] / CELL_SIZE)];
}
