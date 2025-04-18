import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomIndex } from "../js/utils.js";

const ROWS = 10;
const COLS = 10;
const MIRROR_RATIO = 0.67;

const OFFSET_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 10;
const CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
const NODE_SIZE = 1.5 * CELL_SIZE;
const LINE_THICKNESS = 6;

const DIRECTION = Object.freeze({
  "UP": 1,
  "UP_RIGHT": 2,
  "RIGHT": 3,
  "DOWN_RIGHT": 4,
  "DOWN": 5,
  "DOWN_LEFT": 6,
  "LEFT": 7,
  "UP_LEFT": 8
});

const TAP_SOUND = 'clink';
const MIRROR_SOUND = 'whir';
const UNDO_SOUND = 'warp';
const RESTART_SOUND = 'boing';
const CHIME_SOUND = 'chime';

let DIFFICULTY;
let MOVES;
let MIN_MIRRORS;

let gridHistory;
let grid;
let solution;
let solutionSteps;
let tapsHistory;
let allowedTaps;
let availableTaps;
let mirrorsHistory;
let allowedMirrors;
let availableMirrors;
let queuedSounds = [];

function generateGrid() {
  solutionSteps = [];
  allowedTaps = 0;
  allowedMirrors = 0;

  grid = Array.from({length: COLS}, () => Array.from({length: ROWS},
      () => ({
        inSolution: false,
        solutionOrderIndex: null,
        filled: false,
      })));

  for (let i = 0; i < MOVES; i++) {
    if (i > 0 && Math.random() < MIRROR_RATIO) {
      let oldGrid = deepCopy(grid);

      let directions = getAvailableMirrors(true);

      if (directions.length === 0) {
        i--;
      } else {
        let randomDirection = directions[randomIndex(directions)];
        mirrorGrid(randomDirection, true);

        solutionSteps.push({
          solutionOrderIndex: i + 1,
          mirrorDirection: randomDirection
        });

        allowedMirrors++;
      }
    } else {
      let unfilledCells = grid.flat().filter(cell => !cell.inSolution);
      let randomCell = unfilledCells[randomIndex(unfilledCells)];

      randomCell.inSolution = true;
      randomCell.solutionOrderIndex = i + 1;

      solutionSteps.push(randomCell);
      allowedTaps++;
    }
  }

  if (allowedMirrors < MIN_MIRRORS) {
    generateGrid();
    return;
  }

  availableTaps = allowedTaps;
  availableMirrors = allowedMirrors;
  solution = deepCopy(grid);
  gridHistory = [];
  tapsHistory = [];
  mirrorsHistory = [];
}

function getAvailableMirrors(forGeneratingSolution = false) {
  let mirrorDirections = [];

  if (!forGeneratingSolution && gridHistory.length === 0) {
    return mirrorDirections;
  }

  let edgeReachedUp = false;
  let edgeReachedRight = false;
  let edgeReachedDown = false;
  let edgeReachedLeft = false;
  let leftmostTopEdge = COLS - 1;
  let rightmostTopEdge = 0;
  let leftmostBottomEdge = COLS - 1;
  let rightmostBottomEdge = 0;
  let bottommostLeftEdge = 0;
  let topmostLeftEdge = ROWS - 1;
  let bottommostRightEdge = 0;
  let topmostRightEdge = ROWS - 1;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let cell = grid[i][j];
      let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

      if (filled) {
        if (i === 0) {
          edgeReachedLeft = true;

          if (topmostLeftEdge > j) {
            topmostLeftEdge = j;
          }

          if (bottommostLeftEdge < j) {
            bottommostLeftEdge = j;
          }
        } else if (i === COLS - 1) {
          edgeReachedRight = true;

          if (topmostRightEdge > j) {
            topmostRightEdge = j;
          }

          if (bottommostRightEdge < j) {
            bottommostRightEdge = j;
          }
        }

        if (j === 0) {
          edgeReachedUp = true;

          if (leftmostTopEdge > i) {
            leftmostTopEdge = i;
          }

          if (rightmostTopEdge < i) {
            rightmostTopEdge = i;
          }
        } else if (j === ROWS - 1) {
          edgeReachedDown = true;

          if (leftmostBottomEdge > i) {
            leftmostBottomEdge = i;
          }

          if (rightmostBottomEdge < i) {
            rightmostBottomEdge = i;
          }
        }
      }
    }
  }

  let edgeReachedUpRight = edgeReachedUp || edgeReachedRight;
  let edgeReachedDownRight = edgeReachedDown || edgeReachedRight;
  let edgeReachedDownLeft = edgeReachedDown || edgeReachedLeft;
  let edgeReachedUpLeft = edgeReachedUp || edgeReachedLeft;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let cell = grid[i][j];
      let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

      if (filled) {
        if (edgeReachedUpRight) {
          let rightmostTopIndex = Math.max(rightmostTopEdge, ROWS - 1 - topmostRightEdge);
          let topmostRightIndex = ROWS - 1 - rightmostTopIndex;
          edgeReachedUpRight =
              !(i > rightmostTopIndex && j < topmostRightIndex);
        }

        if (edgeReachedDownRight) {
          let rightmostBottomIndex = Math.max(rightmostBottomEdge, bottommostRightEdge);
          let bottommostRightIndex = rightmostBottomIndex;
          edgeReachedDownRight =
              !(i > rightmostBottomIndex && j > bottommostRightIndex);
        }

        if (edgeReachedDownLeft) {
          let bottommostLeftIndex = Math.max(bottommostLeftEdge, COLS - 1 -leftmostBottomEdge);
          let leftmostBottomIndex = COLS - 1 - bottommostLeftIndex;
          edgeReachedDownLeft =
              !(i < leftmostBottomIndex && j > bottommostLeftIndex);
        }

        if (edgeReachedUpLeft) {
          let leftmostTopIndex = Math.min(leftmostTopEdge, topmostLeftEdge);
          let topmostLeftIndex = leftmostTopIndex;
          edgeReachedUpLeft =
              !(i < leftmostTopIndex && j < topmostLeftIndex);
        }
      }
    }
  }

  if (!edgeReachedLeft) {
    mirrorDirections.push(DIRECTION.LEFT);
  }

  if (!edgeReachedRight) {
    mirrorDirections.push(DIRECTION.RIGHT);
  }

  if (!edgeReachedUp) {
    mirrorDirections.push(DIRECTION.UP);
  }

  if (!edgeReachedDown) {
    mirrorDirections.push(DIRECTION.DOWN);
  }

  if (!edgeReachedUpLeft) {
    mirrorDirections.push(DIRECTION.UP_LEFT);
  }

  if (!edgeReachedDownRight) {
    mirrorDirections.push(DIRECTION.DOWN_RIGHT);
  }

  if (!edgeReachedUpRight) {
    mirrorDirections.push(DIRECTION.UP_RIGHT);
  }

  if (!edgeReachedDownLeft) {
    mirrorDirections.push(DIRECTION.DOWN_LEFT);
  }

  return mirrorDirections;
}

function mirrorGrid(direction, forGeneratingSolution = false) {
  let leftIndex = COLS - 1;
  let rightIndex = 0;
  let topIndex = ROWS - 1;
  let bottomIndex = 0;
  let topLeftIndex = COLS + ROWS - 2;
  let topRightIndex = 0;
  let bottomLeftIndex = 0;
  let bottomRightIndex = 0;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let cell = grid[i][j];
      let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

      if (filled) {
        leftIndex = Math.min(leftIndex, i);
        rightIndex = Math.max(rightIndex, i);
        topIndex = Math.min(topIndex, j);
        bottomIndex = Math.max(bottomIndex, j);
        topLeftIndex = Math.min(topLeftIndex, i + j);
        topRightIndex = Math.max(topRightIndex, i + ROWS - 1 - j);
        bottomLeftIndex = Math.max(bottomLeftIndex, COLS - 1 - i + j);
        bottomRightIndex = Math.max(bottomRightIndex, i + j);
      }
    }
  }

  switch (direction) {
      case DIRECTION.UP:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexY = topIndex - (j - topIndex) - 1;

              if (mirroredIndexY >= 0) {
                let mirroredCell = grid[i][mirroredIndexY];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.UP_RIGHT:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexX = rightIndex + (j - topIndex) + 1 - (rightIndex + (ROWS - 1 - topIndex) - topRightIndex);
              let mirroredIndexY = topIndex - (rightIndex - i) - 1 + (rightIndex + (ROWS - 1 - topIndex) - topRightIndex);

              if (mirroredIndexX <= COLS - 1 && mirroredIndexY >= 0) {
                let mirroredCell = grid[mirroredIndexX][mirroredIndexY];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.RIGHT:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexX = rightIndex + (rightIndex - i) + 1;

              if (mirroredIndexX <= COLS - 1) {
                let mirroredCell = grid[mirroredIndexX][j];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.DOWN_RIGHT:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexX = rightIndex + (bottomIndex - j) + 1 - (rightIndex + bottomIndex - bottomRightIndex);
              let mirroredIndexY = bottomIndex + (rightIndex - i) + 1 - (rightIndex + bottomIndex - bottomRightIndex);

              if (mirroredIndexX <= COLS - 1 && mirroredIndexY <= ROWS - 1) {
                let mirroredCell = grid[mirroredIndexX][mirroredIndexY];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.DOWN:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexY = bottomIndex + (bottomIndex - j) + 1;

              if (mirroredIndexY <= ROWS - 1) {
                let mirroredCell = grid[i][mirroredIndexY];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.DOWN_LEFT:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexX = leftIndex - (bottomIndex - j) - 1 + ((COLS - 1 - leftIndex) + bottomIndex - bottomLeftIndex);
              let mirroredIndexY = bottomIndex + (i - leftIndex) + 1 - ((COLS - 1 - leftIndex) + bottomIndex - bottomLeftIndex);

              if (mirroredIndexX >= 0 && mirroredIndexY <= ROWS - 1) {
                let mirroredCell = grid[mirroredIndexX][mirroredIndexY];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.LEFT:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexX = leftIndex - (i - leftIndex) - 1;

              if (mirroredIndexX >= 0) {
                let mirroredCell = grid[mirroredIndexX][j];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      case DIRECTION.UP_LEFT:
        for (let i = 0; i < COLS; i++) {
          for (let j = 0; j < ROWS; j++) {
            let cell = grid[i][j];
            let filled = forGeneratingSolution ? cell.inSolution : cell.filled;

            if (filled) {
              let mirroredIndexX = leftIndex - (j - topIndex) - 1 - (leftIndex + topIndex - topLeftIndex);
              let mirroredIndexY = topIndex - (i - leftIndex) - 1 - (leftIndex + topIndex - topLeftIndex);

              if (mirroredIndexX >= 0 && mirroredIndexY >= 0) {
                let mirroredCell = grid[mirroredIndexX][mirroredIndexY];

                if (forGeneratingSolution) {
                  mirroredCell.inSolution = true;
                } else {
                  mirroredCell.filled = true;
                }
              }
            }
          }
        }

        break;
      default:
        console.error("Unrecognized direction");
    }
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  DIFFICULTY = window.app.router.difficulty;
  MOVES = 4 + 2 * DIFFICULTY;
  MIN_MIRRORS = MOVES / 2;

  queuedSounds = [];

  generateGrid();

  drawInstructions();

  finishedLoading();
}

export function drawInstructions() {
  drawInstructionsHelper("🔆\uFE0E Grid Mirror Puzzle 🔆\uFE0E",
      ["Use the alotted taps and mirrors to match the pattern."],
      ["Click or tap a grid tile to fill it.",
          "Click or tap the arrows to mirror in that direction."]);
}

export function drawPuzzle() {
  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.lineWidth = LINE_THICKNESS;

  let gridToDraw = window.app.puzzleState.showingSolution ? solution : grid;
  let solved = true;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let cell = gridToDraw[i][j];

      if (cell.filled !== cell.inSolution) {
        solved = false;
        break;
      }
    }
  }

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let cell = gridToDraw[i][j];
      let coord = getDrawCoord(i, j);
      let centerCoord = getDrawCoord(i, j, true);

      context.fillStyle = cell.filled ? (solved ? SUCCESS_COLOR : (cell.inSolution ? "#808080" : ALERT_COLOR)) : "#000000";
      context.fillRect(coord[0], coord[1], CELL_SIZE, CELL_SIZE);

      if (!cell.filled && cell.inSolution) {
        context.strokeStyle = solved ? SUCCESS_COLOR : "#808080";
        context.beginPath();
        context.rect(coord[0] + LINE_THICKNESS, coord[1] + LINE_THICKNESS,
            CELL_SIZE - LINE_THICKNESS * 2, CELL_SIZE - LINE_THICKNESS * 2);
        context.stroke();
      }

      if (window.app.puzzleState.showingSolution && cell.solutionOrderIndex) {
        context.fillStyle = SUCCESS_COLOR;
        context.beginPath();
        context.arc(centerCoord[0], centerCoord[1], NODE_SIZE / 4, 0, 2 * Math.PI, false);
        context.fill();

        context.font = "bold " + (NODE_SIZE / 4) + "px Arial"
        context.textAlign = "center";
        context.fillStyle = "#000000";
        context.fillText(cell.solutionOrderIndex, centerCoord[0], centerCoord[1] + NODE_SIZE / 12);
      }
    }
  }

  if (!window.app.puzzleState.showingSolution) {
    context.font = "bold " + (NODE_SIZE / 4) + "px Arial"
    context.fillStyle = "#ffffff";
    context.textAlign = "center";

    // Taps
    context.fillText(availableTaps + " / " + allowedTaps + "  Taps", CANVAS_WIDTH / 4, (CANVAS_HEIGHT - OFFSET_SIZE / 2) + NODE_SIZE / 12);

    // Mirrors
    context.fillText(availableMirrors + " / " + allowedMirrors + "  Mirrors", CANVAS_WIDTH * 3 / 4, (CANVAS_HEIGHT - OFFSET_SIZE / 2) + NODE_SIZE / 12);


    if (solved) {
      if (window.app.puzzleState.interactive) {
        window.app.puzzleState.interactive = false;
        window.app.puzzleState.ended = true;

        audioManager.play(CHIME_SOUND);
      }
    } else {
      queuedSounds.forEach(sound => audioManager.play(sound));

      if (gridHistory.length > 0) {
        if (availableMirrors > 0) {
          drawArrows(context);
        }

        context.font = "bold " + (NODE_SIZE / 4) + "px Arial"
        context.fillStyle = "#ffffff";

        // Restart
        let restartOffset = 1.93;
        context.textAlign = "right";
        context.fillText("Restart", (COLS - restartOffset + 0.2) * CELL_SIZE + OFFSET_SIZE, OFFSET_SIZE / 2 + NODE_SIZE / 12);

        context.lineWidth = LINE_THICKNESS;
        context.strokeStyle = "#ffffff";
        context.beginPath();
        context.arc(OFFSET_SIZE * 1.5 + (COLS - restartOffset) * CELL_SIZE, OFFSET_SIZE / 2, OFFSET_SIZE / 4, Math.PI, 3 / 2 * Math.PI, true);
        context.lineTo(OFFSET_SIZE * 1.55 + (COLS - restartOffset) * CELL_SIZE, OFFSET_SIZE * 0.35);
        context.lineTo(OFFSET_SIZE * 1.6 + (COLS - restartOffset) * CELL_SIZE, OFFSET_SIZE * 0.2);
        context.lineTo(OFFSET_SIZE * 1.48 + (COLS - restartOffset) * CELL_SIZE, OFFSET_SIZE / 4);
        context.lineTo(OFFSET_SIZE * 1.525 + (COLS - restartOffset) * CELL_SIZE, OFFSET_SIZE * 0.3);
        context.stroke();

        // Undo
        let undoOffset = 2.1;
        context.textAlign = "left";
        context.fillText("Undo", OFFSET_SIZE + (undoOffset - 0.2) * CELL_SIZE, OFFSET_SIZE / 2 + NODE_SIZE / 12);

        context.beginPath();
        context.moveTo(OFFSET_SIZE * 0.75 + undoOffset * CELL_SIZE, OFFSET_SIZE / 2);
        context.lineTo(OFFSET_SIZE * 0.3 + undoOffset * CELL_SIZE, OFFSET_SIZE / 2);
        context.moveTo(OFFSET_SIZE * 0.45 + undoOffset * CELL_SIZE, OFFSET_SIZE * 0.35);
        context.lineTo(OFFSET_SIZE * 0.3 + undoOffset * CELL_SIZE, OFFSET_SIZE / 2);
        context.lineTo(OFFSET_SIZE * 0.45 + undoOffset * CELL_SIZE, OFFSET_SIZE * 0.65);
        context.stroke();
      }
    }

    queuedSounds = [];
  } else {
    context.font = "bold " + (NODE_SIZE / 4) + "px Arial"
    context.textAlign = "center";

    let startCoord = (12 - solutionSteps.length) / 2 - 1;

    solutionSteps.forEach((step, i) => {
      let coord = getDrawCoord(startCoord + i, COLS, true)
      coord[1] += OFFSET_SIZE / 12;

      if (step.mirrorDirection) {
        context.lineWidth = LINE_THICKNESS * 2;
        context.strokeStyle = SUCCESS_COLOR;

        switch(step.mirrorDirection) {
          case DIRECTION.UP:
            drawArrowUp(context, coord);
            break;
          case DIRECTION.UP_RIGHT:
            drawArrowUpRight(context, coord);
            break;
          case DIRECTION.RIGHT:
            drawArrowRight(context, coord);
            break;
          case DIRECTION.DOWN_RIGHT:
            drawArrowDownRight(context, coord);
            break;
          case DIRECTION.DOWN:
            drawArrowDown(context, coord);
            break;
          case DIRECTION.DOWN_LEFT:
            drawArrowDownLeft(context, coord);
            break;
          case DIRECTION.LEFT:
            drawArrowLeft(context, coord);
            break;
          case DIRECTION.UP_LEFT:
            drawArrowUpLeft(context, coord);
            break;
        }
      } else {
        context.fillStyle = SUCCESS_COLOR;
        context.beginPath();
        context.arc(coord[0], coord[1], NODE_SIZE / 4, 0, 2 * Math.PI, false);
        context.fill();

        context.fillStyle = "#000000";
        context.fillText(step.solutionOrderIndex, coord[0], coord[1] + NODE_SIZE / 12);
      }
    });
  }
}

function drawArrowLeft(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] - CELL_SIZE / 3, coord[1]);
  context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
  context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
  context.lineTo(coord[0] - CELL_SIZE / 3, coord[1]);
  context.lineTo(coord[0] - CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
  context.stroke();
}

function drawArrowRight(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] - CELL_SIZE / 3, coord[1]);
  context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
  context.moveTo(coord[0] + CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
  context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
  context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
  context.stroke();
}

function drawArrowUp(context, coord) {
  context.beginPath();
  context.moveTo(coord[0], coord[1] - CELL_SIZE / 3);
  context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
  context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
  context.lineTo(coord[0], coord[1] - CELL_SIZE / 3);
  context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
  context.stroke();
}

function drawArrowDown(context, coord) {
  context.beginPath();
  context.moveTo(coord[0], coord[1] - CELL_SIZE / 3);
  context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
  context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
  context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
  context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
  context.stroke();
}

function drawArrowUpLeft(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] - CELL_SIZE / 4, coord[1] - CELL_SIZE / 4);
  context.lineTo(coord[0] + CELL_SIZE / 4, coord[1] + CELL_SIZE / 4);
  context.moveTo(coord[0] - CELL_SIZE / 50, coord[1] - CELL_SIZE / 5);
  context.lineTo(coord[0] - CELL_SIZE / 4, coord[1] - CELL_SIZE / 4);
  context.lineTo(coord[0] - CELL_SIZE / 5, coord[1] - CELL_SIZE / 50);
  context.stroke();
}

function drawArrowDownRight(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] - CELL_SIZE / 4, coord[1] - CELL_SIZE / 4);
  context.lineTo(coord[0] + CELL_SIZE / 4, coord[1] + CELL_SIZE / 4);
  context.moveTo(coord[0] + CELL_SIZE / 50, coord[1] + CELL_SIZE / 5);
  context.lineTo(coord[0] + CELL_SIZE / 4, coord[1] + CELL_SIZE / 4);
  context.lineTo(coord[0] + CELL_SIZE / 5, coord[1] + CELL_SIZE / 50);
  context.stroke();
}

function drawArrowUpRight(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] + CELL_SIZE / 4, coord[1] - CELL_SIZE / 4);
  context.lineTo(coord[0] - CELL_SIZE / 4, coord[1] + CELL_SIZE / 4);
  context.moveTo(coord[0] + CELL_SIZE / 50, coord[1] - CELL_SIZE / 5);
  context.lineTo(coord[0] + CELL_SIZE / 4, coord[1] - CELL_SIZE / 4);
  context.lineTo(coord[0] + CELL_SIZE / 5, coord[1] - CELL_SIZE / 50);
  context.stroke();
}

function drawArrowDownLeft(context, coord) {
  context.beginPath();
  context.moveTo(coord[0] + CELL_SIZE / 4, coord[1] - CELL_SIZE / 4);
  context.lineTo(coord[0] - CELL_SIZE / 4, coord[1] + CELL_SIZE / 4);
  context.moveTo(coord[0] - CELL_SIZE / 50, coord[1] + CELL_SIZE / 5);
  context.lineTo(coord[0] - CELL_SIZE / 4, coord[1] + CELL_SIZE / 4);
  context.lineTo(coord[0] - CELL_SIZE / 5, coord[1] + CELL_SIZE / 50);
  context.stroke();
}

function drawArrows(context) {
  context.lineWidth = LINE_THICKNESS * 2;
  context.strokeStyle = ALERT_COLOR;

  let mirrorDirections = getAvailableMirrors();

  if (mirrorDirections.indexOf(DIRECTION.LEFT) > -1) {
    let coord = getDrawCoord(-1, ROWS / 2 - 0.5, true);
    drawArrowLeft(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.RIGHT) > -1) {
    let coord = getDrawCoord(COLS, ROWS / 2 - 0.5, true);
    drawArrowRight(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.UP) > -1) {
    let coord = getDrawCoord(COLS / 2 - 0.5, -1, true);
    drawArrowUp(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.DOWN) > -1) {
    let coord = getDrawCoord(COLS / 2 - 0.5, ROWS, true);
    drawArrowDown(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.UP_LEFT) > -1) {
    let coord = getDrawCoord(-1, -1, true);
    drawArrowUpLeft(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.DOWN_RIGHT) > -1) {
    let coord = getDrawCoord(COLS, ROWS, true);
    drawArrowDownRight(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.UP_RIGHT) > -1) {
    let coord = getDrawCoord(ROWS, -1, true);
    drawArrowUpRight(context, coord);
  }

  if (mirrorDirections.indexOf(DIRECTION.DOWN_LEFT) > -1) {
    let coord = getDrawCoord(-1, COLS, true);
    drawArrowDownLeft(context, coord);
  }
}

function getDrawCoord(x, y, center = false) {
  let addition = center ? CELL_SIZE / 2 : 0;

  let drawX = OFFSET_SIZE + x * CELL_SIZE + addition;
  let drawY = OFFSET_SIZE + y * CELL_SIZE + addition;

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
      let canvasRect = event.target.getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let coord = convertToGridCoord(mouseX, mouseY);

      // Restart
      if ((coord[0] <= COLS - 2 && coord[0] >= COLS - 3) && coord[1] === -1) {
        gridHistory = [];
        tapsHistory = [];
        availableTaps = allowedTaps;
        mirrorsHistory = [];
        availableMirrors = allowedMirrors;

        grid = deepCopy(solution);
        audioManager.play(RESTART_SOUND);
        drawPuzzle();

      // Undo
      } else if ((coord[0] >= 1 && coord[0] <= 2) && coord[1] === -1) {
        if (gridHistory.length > 0) {
          audioManager.play(UNDO_SOUND);
          grid = gridHistory.pop();
          availableTaps = tapsHistory.pop();
          availableMirrors = mirrorsHistory.pop();

          drawPuzzle();
        }
      } else if (coord[0] >= 0 && coord[0] < COLS
          && coord[1] >= 0 && coord[1] < ROWS) {
        if (availableTaps > 0) {
          let cell = grid[coord[0]][coord[1]];

          if (!cell.filled) {
            gridHistory.push(deepCopy(grid));
            tapsHistory.push(availableTaps);
            mirrorsHistory.push(availableMirrors);

            availableTaps--;

            cell.filled = true;
            queuedSounds.push(TAP_SOUND);

            drawPuzzle();
          }
        }
      } else if (availableMirrors > 0) {
        let mirrorDirections = getAvailableMirrors();
        let direction = null;

        if (coord[0] <= -1 && coord[1] >= ROWS / 2 - 2 && coord[1] <= ROWS / 2 + 1) {
          if (mirrorDirections.indexOf(DIRECTION.LEFT) > -1) {
            direction = DIRECTION.LEFT;
          }
        } else if (coord[0] >= COLS && coord[1] >= ROWS / 2 - 2 && coord[1] <= ROWS / 2 + 1) {
          if (mirrorDirections.indexOf(DIRECTION.RIGHT) > -1) {
            direction = DIRECTION.RIGHT;
          }
        } else if (coord[0] >= COLS / 2 - 2 && coord[0] <= COLS / 2 + 1 && coord[1] <= -1) {
          if (mirrorDirections.indexOf(DIRECTION.UP) > -1) {
            direction = DIRECTION.UP;
          }
        } else if (coord[0] >= COLS / 2 - 2 && coord[0] <= COLS / 2 + 1 && coord[1] >= ROWS) {
          if (mirrorDirections.indexOf(DIRECTION.DOWN) > -1) {
            direction = DIRECTION.DOWN;
          }
        } else if ((coord[0] <= -1 && coord[1] <= 0)
            || (coord[1] <= -1 && coord[0] <= 0)) {
          if (mirrorDirections.indexOf(DIRECTION.UP_LEFT) > -1) {
            direction = DIRECTION.UP_LEFT;
          }
        } else if ((coord[0] >= COLS && coord[1] <= 0)
            || (coord[1] <= -1 && coord[0] >= COLS - 1)) {
          if (mirrorDirections.indexOf(DIRECTION.UP_RIGHT) > -1) {
            direction = DIRECTION.UP_RIGHT;
          }
        } else if ((coord[0] <= -1 && coord[1] >= ROWS - 1)
            || (coord[1] >= ROWS && coord[0] <= 0)) {
          if (mirrorDirections.indexOf(DIRECTION.DOWN_LEFT) > -1) {
            direction = DIRECTION.DOWN_LEFT;
          }
        } else if ((coord[0] >= COLS && coord[1] >= ROWS - 1)
            || (coord[1] >= ROWS && coord[0] >= COLS - 1)) {
          if (mirrorDirections.indexOf(DIRECTION.DOWN_RIGHT) > -1) {
            direction = DIRECTION.DOWN_RIGHT;
          }
        }

        if (direction) {
          gridHistory.push(deepCopy(grid));
          tapsHistory.push(availableTaps);
          mirrorsHistory.push(availableMirrors);

          availableMirrors--;

          mirrorGrid(direction);
          queuedSounds.push(MIRROR_SOUND);

          drawPuzzle();
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
