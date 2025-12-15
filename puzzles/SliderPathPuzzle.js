import audioManager from "../js/audio-manager.js";
import {
  ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH,
  FONT_FAMILY, SUCCESS_COLOR
} from "../js/config.js";
import keyboardManager from "../js/keyboard-manager.js";
import router from "../js/router.js";
import {
  deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading,
  getPuzzleCanvas, peek, randomIndex, updateForTutorialRecommendation,
  updateForTutorialState
} from "../js/utils.js";

// Note, below 7/7 not supported, exceeds stack size!
const ROWS = 10;
const COLS = 10;
const HISTORY_LIMIT = 100;

const OFFSET_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 10;
const CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
const NODE_SIZE = 1.5 * CELL_SIZE;
const LINE_THICKNESS = 6;

const CLINK_SOUND = audioManager.SoundEffects.CLINK;
const UNDO_SOUND = audioManager.SoundEffects.WHIR;
const RESTART_SOUND = audioManager.SoundEffects.BOING;
const CHIME_SOUND = audioManager.SoundEffects.CHIME;

const tutorials = [
  {
    grid: Array.from({length: COLS}, (_elX, x) => Array.from({length: ROWS}, (_elY, y) => ({
      path: false, // Only matters for generation
      block: x === 0 && y === 5,
      brokenBlock: false, // Only matters during play
      // Starts from 1
      keyNumber: (x === 0 && y === 4) ? 1 : (
        (x === COLS - 1 && y === 4) ? 2 : (
          (x === COLS - 1 && y === ROWS - 1) ? 3 : NaN
        )
      ),
      goal: x === COLS - 1 && y === ROWS - 1,
      containsSlider: x === 0 && y === 0,
    }))),
  },
  {
    grid: Array.from({length: COLS}, (_elX, x) => Array.from({length: ROWS}, (_elY, y) => ({
      path: false,
      block: x === 0 && y === 5,
      brokenBlock: false,
      keyNumber: (x === COLS - 1 && y === 0) ? 1 : (
        (x === COLS - 1 && y === ROWS - 1) ? 2 : (
          (x === 0 && y === ROWS - 1) ? 3 : (
            (x === 0 && y === 6) ? 4 : (
              (x === COLS - 1 && y === 6) ? 5 : NaN
            )
          )
        )
      ),
      goal: x === COLS - 1 && y === 6,
      containsSlider: x === 0 && y === 0,
    }))),
  },
  {
    grid: Array.from({length: COLS}, (_elX, x) => Array.from({length: ROWS}, (_elY, y) => ({
      path: false,
      block: (x === 0 && y === 5) || (x === COLS - 1 && y === 0) || (x === COLS - 1 && y === 6),
      brokenBlock: false,
      keyNumber: (x === COLS - 2 && y === 0) ? 1 : (
        (x === COLS - 2 && y === ROWS - 1) ? 2 : (
          (x === 0 && y === ROWS - 1) ? 3 : (
            (x === 0 && y === 6) ? 4 : (
              (x === COLS - 2 && y === 6) ? 5 : NaN
            )
          )
        )
      ),
      goal: x === COLS - 2 && y === 6,
      containsSlider: x === 0 && y === 0,
    }))),
  },
  {
    grid: Array.from({length: COLS}, (_elX, x) => Array.from({length: ROWS}, (_elY, y) => ({
      path: false,
      block: (x === 3 && y === 0) || (x === 5 && y === 0) || (x === 4 && y === ROWS - 1)
          || (x === 4 && y === ROWS - 2),
      brokenBlock: false,
      keyNumber: (x === 0 && y === 4) ? 1 : (
        (x === 0 && y === 0) ? 2 : (
          (x === 2 && y === 0) ? 3 : (
            (x === 2 && y === ROWS - 1) ? 4 : (
              (x === 3 && y === ROWS - 1) ? 5 : (
                (x === 3 && y === 0) ? 6 : (
                  (x === 4 && y === 0) ? 7 : (
                    (x === 4 && y === ROWS - 3) ? 8 : NaN
                  )
                )
              )
            )
          )
        )
      ),
      goal: x === 4 && y === ROWS - 3,
      containsSlider: x === 4 && y === 4,
    }))),
  },
  {
    grid: Array.from({length: COLS}, (_elX, x) => Array.from({length: ROWS}, (_elY, y) => ({
      path: false,
      block: (x === COLS - 1 && y === 0) || (x === COLS - 2 && y === ROWS - 1) || (x === 0 && y === ROWS - 2)
          || (x === 1 && y === 1) || (x === COLS - 3 && y === 2) || (x === COLS - 4 && y === ROWS - 3)
          || (x === 2 && y === ROWS - 4) || (x === 3 && y === 3) || (x === COLS - 5 && y === 4),
      brokenBlock: false,
      keyNumber: (x === COLS - 1 && y === 0) ? 1 : (
        (x === COLS - 2 && y === ROWS - 1) ? 2 : (
          (x === 0 && y === ROWS - 2) ? 3 : (
            (x === 1 && y === 1) ? 4 : (
              (x === COLS - 3 && y === 2) ? 5 : (
                (x === COLS - 4 && y === ROWS - 3) ? 6 : (
                  (x === 2 && y === ROWS - 4) ? 7 : (
                    (x === 3 && y === 3) ? 8 : (
                      (x === COLS - 5 && y === 4) ? 9 : NaN
                    )
                  )
                )
              )
            )
          )
        )
      ),
      goal: x === 4 && y === 4,
      containsSlider: x === 0 && y === 0,
    }))),
  },
];

let DIFFICULTY;
let MAX_BLOCKS;

let gridHistory;
let grid;
let solution;
let alternateToVerticalHistory = [];
let queuedSounds = [];

function availableStops(directionVertical, x, y, goalPlacement = false) {
  let relativeCoords = [];

  if (directionVertical) {
    let hitStop = false;
    let newY = y;

    while (!hitStop && newY > goalPlacement ? 1 : 0) {
      newY--;
      let cell = grid[x][newY];
      let cellAbove = newY === 0 ? null : grid[x][newY - 1];

      if ((!cell.block && !cell.keyNumber && !cell.containsSlider)
          && (newY === 0 || (!cellAbove.path && !cellAbove.keyNumber && !cellAbove.entrance && !cellAbove.block))) {
        relativeCoords.push(newY - y);
      } else {
        // hitStop = cell.block;
      }
    }

    hitStop = false;
    newY = y;

    while (!hitStop && newY < ROWS - 1 - (goalPlacement ? 1 : 0)) {
      newY++;
      let cell = grid[x][newY];
      let cellBelow = newY === ROWS - 1 ? null : grid[x][newY + 1];

      if ((!cell.block && !cell.keyNumber && !cell.containsSlider)
          && (newY === ROWS - 1 || (!cellBelow.path && !cellBelow.keyNumber && !cellBelow.containsSlider && !cellBelow.block))) {
        relativeCoords.push(newY - y);
      } else {
        // hitStop = cell.block;
      }
    }
  } else {
    let hitStop = false;
    let newX = x;

    while (!hitStop && newX > goalPlacement ? 1 : 0) {
      newX--;
      let cell = grid[newX][y];
      let cellLeft = newX === 0 ? null : grid[newX - 1][y];

      if ((!cell.block && !cell.keyNumber && !cell.containsSlider)
          && (newX === 0 || (!cellLeft.path && !cellLeft.keyNumber && !cellLeft.containsSlider && !cellLeft.block))) {
        relativeCoords.push(newX - x);
      } else {
        // hitStop = cell.block;
      }
    }

    hitStop = false;
    newX = x;

    while (!hitStop && newX < COLS - 1 - (goalPlacement ? 1 : 0)) {
      newX++;
      let cell = grid[newX][y];
      let cellRight = newX === COLS - 1 ? null : grid[newX + 1][y];

      if ((!cell.block && !cell.keyNumber && !cell.containsSlider)
          && (newX === COLS - 1 || (!cellRight.path && !cellRight.keyNumber && !cellRight.containsSlider && !cellRight.block))) {
        relativeCoords.push(newX - x);
      } else {
        // hitStop = cell.block;
      }
    }
  }

  return relativeCoords;
}

function generateGrid() {
  grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => ({
    path: false,
    block: false,
    brokenBlock: false,
    keyNumber: NaN,
    goal: false,
    containsSlider: false,
  })));

  let x = Math.floor(router.sRand() * (COLS - 2)) + 1;
  let y = Math.floor(router.sRand() * (ROWS - 2)) + 1;
  grid[x][y].containsSlider = true;

  let directionVertical = router.sRand() < 0.5;
  let pathContinues = true;
  let keyNum = 1;
  let totalBlocks = 0;

  while (pathContinues && totalBlocks < MAX_BLOCKS) {
    let relativeCoords = availableStops(directionVertical, x, y, totalBlocks === MAX_BLOCKS - 1);

    // Try other direction
//      if (relativeCoords.length === 0) {
//        directionVertical = !directionVertical;
//        relativeCoords = availableStops(directionVertical, x, y, totalBlocks === MAX_BLOCKS - 1);
//      }

    if (relativeCoords.length === 0) {
      pathContinues = false;
    } else {
      let coord = relativeCoords[randomIndex(relativeCoords)];

      if (directionVertical) {
        if (coord > 0) {
          for (let pathY = y; pathY <= y + coord; pathY++) {
            grid[x][pathY].path = true;
          }

          if (y + coord + 1 < ROWS) {
            grid[x][y + coord + 1].block = true;
            totalBlocks++;
          }
        } else {
          for (let pathY = y + coord; pathY <= y; pathY++) {
            grid[x][pathY].path = true;
          }

          if (y + coord - 1 >= 0) {
            grid[x][y + coord - 1].block = true;
            totalBlocks++;
          }
        }

        y += coord;
      } else {
        if (coord > 0) {
          for (let pathX = x; pathX <= x + coord; pathX++) {
            grid[pathX][y].path = true;
          }

          if (x + coord + 1 < COLS) {
            grid[x + coord + 1][y].block = true;
            totalBlocks++;
          }
        } else {
          for (let pathX = x + coord; pathX <= x; pathX++) {
            grid[pathX][y].path = true;
          }

          if (x + coord - 1 >= 0) {
            grid[x + coord - 1][y].block = true;
            totalBlocks++;
          }
        }

        x += coord;
      }

      grid[x][y].keyNumber = keyNum;
      keyNum++;

      directionVertical = !directionVertical;
    }
  }

  if (totalBlocks < MAX_BLOCKS) {
    generateGrid();
    return;
  }

  grid[x][y].goal = true;
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (router.puzzleState.tutorialStage > tutorials.length) {
    router.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  alternateToVerticalHistory = [];
  queuedSounds = [];
  gridHistory = [];

  if (router.puzzleState.tutorialStage) {
    const tutorial = tutorials[router.puzzleState.tutorialStage - 1];

    grid = deepCopy(tutorial.grid);
  } else {
    DIFFICULTY = router.difficulty;

    // Quick: 10, Casual: 12, Challenging: 14, Intense: 16
    MAX_BLOCKS = 8 + 2 * DIFFICULTY;

    generateGrid();
  }

  solution = deepCopy(grid);

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

export function drawInstructions() {
  drawInstructionsHelper("Slider Path Puzzle", "🚩\uFE0E",
      ["Break all the white blocks and land in the green goal.",
          "Hint: alternate vertical and horizontal moves."],
      ["Click or tap the arrows to move the slider."],
      router.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let gridToDraw = router.puzzleState.showingSolution ? solution : grid;

  context.lineWidth = LINE_THICKNESS;

  let sliderCoord;
  let solved = false;
  let sliderInGoal = false;
  let blocksLeft = 0;
  let goalCoord;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let cell = gridToDraw[i][j];
      let coord = getDrawCoord(i, j);
      let centerCoord = getDrawCoord(i, j, true);

      if (cell.block) {
        blocksLeft++;
      }

      if (cell.goal) {
        goalCoord = [i, j];
      }

      // context.strokeStyle = "#808080";
      context.fillStyle = cell.goal ? SUCCESS_COLOR : (cell.block? "#ffffff" : (/*cell.brokenBlock ? "#808080" :*/ "#000000"));

//        if (cell.goal || cell.block) {
        context.fillRect(coord[0], coord[1], CELL_SIZE, CELL_SIZE);
//        }

      if (cell.brokenBlock) {
        context.strokeStyle = "#808080";
        context.beginPath();
        context.rect(coord[0] + LINE_THICKNESS / 2, coord[1] + LINE_THICKNESS / 2,
            CELL_SIZE - LINE_THICKNESS, CELL_SIZE - LINE_THICKNESS);
        context.stroke();
      }

      if (cell.keyNumber) {
        if (router.puzzleState.showingSolution) {
          context.fillStyle = SUCCESS_COLOR;
          context.beginPath();
          context.arc(centerCoord[0], centerCoord[1], NODE_SIZE / 4, 0, 2 * Math.PI, false);
          context.fill();

          context.font = "bold " + (NODE_SIZE / 4) + `px ${FONT_FAMILY}`;
          context.textAlign = "center";
          context.fillStyle = "#000000";
          context.fillText(cell.keyNumber, centerCoord[0], centerCoord[1] + NODE_SIZE / 12);
        }
      }

      if (cell.containsSlider) {
        if (cell.goal) {
          sliderInGoal = true;
        }

        sliderCoord = [i, j];

        context.fillStyle = /*"#000000";
        context.strokeStyle =*/ "#808080";
        context.beginPath();
        context.arc(centerCoord[0], centerCoord[1], NODE_SIZE / 4, 0, 2 * Math.PI, false);
        context.fill();
//          context.stroke();
      }
    }
  }

  if (blocksLeft === 0) {
    // let coord = getDrawCoord(...goalCoord);
    // context.fillStyle = SUCCESS_COLOR;
    // context.fillRect(coord[0], coord[1], CELL_SIZE, CELL_SIZE);

    if (sliderInGoal) {
      solved = true;

      // let centerCoord = getDrawCoord(...sliderCoord, true);
      // context.fillStyle = "#808080";
      // context.beginPath();
      // context.arc(centerCoord[0], centerCoord[1], NODE_SIZE / 4, 0, 2 * Math.PI, false);
      // context.fill();
    }
  }

  if (!router.puzzleState.showingSolution) {
    if (blocksLeft > 0) {
      let centerCoord = getDrawCoord(...goalCoord, true);
      context.font = "bold " + (NODE_SIZE / 2) + `px ${FONT_FAMILY}`;
      context.textAlign = "center";
      context.fillStyle = "#ffffff";
      context.fillText(blocksLeft, centerCoord[0], centerCoord[1] + NODE_SIZE / 6);
    }

    if (solved) {
      for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
          let cell = grid[i][j];
          let coord = getDrawCoord(i, j);

          if (cell.brokenBlock) {
            context.strokeStyle = SUCCESS_COLOR;
            context.beginPath();
            context.rect(coord[0] + LINE_THICKNESS / 2, coord[1] + LINE_THICKNESS / 2,
                CELL_SIZE - LINE_THICKNESS, CELL_SIZE - LINE_THICKNESS);
            context.stroke();
          }
        }
      }

      if (router.puzzleState.interactive) {
        endPuzzle(router.puzzleState.tutorialStage === tutorials.length);
        audioManager.play(CHIME_SOUND);
      }
    } else {
      queuedSounds.forEach(sound => audioManager.play(sound));

      drawMoveCells(sliderCoord, gridToDraw, context);

      if (gridHistory.length > 0) {
        // Restart
        context.font = "bold " + (NODE_SIZE / 4) + `px ${FONT_FAMILY}`;
        context.textAlign = "right";
        context.fillStyle = "#ffffff";
        context.fillText("Reset", COLS * CELL_SIZE + OFFSET_SIZE, OFFSET_SIZE / 2 + NODE_SIZE / 12);

        context.lineWidth = LINE_THICKNESS;
        context.strokeStyle = "#ffffff";
        context.beginPath();
        context.arc(OFFSET_SIZE * 1.5 + COLS * CELL_SIZE, OFFSET_SIZE / 2,
            OFFSET_SIZE / 4, Math.PI, 3 / 2 * Math.PI, true);
        context.lineTo(OFFSET_SIZE * 1.55 + COLS * CELL_SIZE, OFFSET_SIZE * 0.35);
        context.lineTo(OFFSET_SIZE * 1.6 + COLS * CELL_SIZE, OFFSET_SIZE * 0.2);
        context.lineTo(OFFSET_SIZE * 1.48 + COLS * CELL_SIZE, OFFSET_SIZE / 4);
        context.lineTo(OFFSET_SIZE * 1.525 + COLS * CELL_SIZE, OFFSET_SIZE * 0.3);
        context.stroke();

        // Undo
        context.font = "bold " + (NODE_SIZE / 4) + `px ${FONT_FAMILY}`;
        context.textAlign = "left";
        context.fillStyle = "#ffffff";
        context.fillText("Undo", OFFSET_SIZE, OFFSET_SIZE / 2 + NODE_SIZE / 12);

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
  }
}

// Arrows
function drawMoveCells(sliderCoord, gridToDraw, context) {
  if (sliderCoord[0] > 0) {
    let cell = gridToDraw[sliderCoord[0] - 1][sliderCoord[1]];

    if (!cell.block) {
      context.lineWidth = alternateToVerticalHistory.length > 0 && peek(alternateToVerticalHistory) ? LINE_THICKNESS : LINE_THICKNESS * 2;
      context.strokeStyle = alternateToVerticalHistory.length > 0 && peek(alternateToVerticalHistory) ? `${ALERT_COLOR}80` : ALERT_COLOR;

      // Relative
      let coord = getDrawCoord(sliderCoord[0] - 1, sliderCoord[1], true);
      context.beginPath();
      context.moveTo(coord[0] - CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
      context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.lineTo(coord[0] - CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] - CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.stroke();

      // Absolute
      coord = getDrawCoord(-1, ROWS / 2 - 0.5, true);

      context.beginPath();
      context.moveTo(coord[0] - CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
      context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.lineTo(coord[0] - CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] - CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.stroke();
    }
  }

  if (sliderCoord[0] < COLS - 1) {
    let cell = gridToDraw[sliderCoord[0] + 1][sliderCoord[1]];

    if (!cell.block) {
      context.lineWidth = alternateToVerticalHistory.length > 0 && peek(alternateToVerticalHistory) ? LINE_THICKNESS : LINE_THICKNESS * 2;
      context.strokeStyle = alternateToVerticalHistory.length > 0 && peek(alternateToVerticalHistory) ? `${ALERT_COLOR}80` : ALERT_COLOR;

      // Relative
      let coord = getDrawCoord(sliderCoord[0] + 1, sliderCoord[1], true);

      context.beginPath();
      context.moveTo(coord[0] - CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
      context.moveTo(coord[0] + CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.stroke();

      // Absolute
      coord = getDrawCoord(COLS, ROWS / 2 - 0.5, true);

      context.beginPath();
      context.moveTo(coord[0] - CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
      context.moveTo(coord[0] + CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.lineTo(coord[0] + CELL_SIZE / 3, coord[1]);
      context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.stroke();
    }
  }

  if (sliderCoord[1] > 0) {
    let cell = gridToDraw[sliderCoord[0]][sliderCoord[1] - 1];

    if (!cell.block) {
      context.lineWidth = alternateToVerticalHistory.length === 0 || peek(alternateToVerticalHistory) ? LINE_THICKNESS * 2 : LINE_THICKNESS;
      context.strokeStyle = alternateToVerticalHistory.length === 0 || peek(alternateToVerticalHistory) ? ALERT_COLOR : `${ALERT_COLOR}80`;

      // Relative
      let coord = getDrawCoord(sliderCoord[0], sliderCoord[1] - 1, true);

      context.beginPath();
      context.moveTo(coord[0], coord[1] - CELL_SIZE / 3);
      context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
      context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.lineTo(coord[0], coord[1] - CELL_SIZE / 3);
      context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.stroke();

      // Absolute
      coord = getDrawCoord(COLS / 2 - 0.5, -1, true);

      context.beginPath();
      context.moveTo(coord[0], coord[1] - CELL_SIZE / 3);
      context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
      context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.lineTo(coord[0], coord[1] - CELL_SIZE / 3);
      context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] - CELL_SIZE / 8);
      context.stroke();
    }
  }

  if (sliderCoord[1] < ROWS - 1) {
    let cell = gridToDraw[sliderCoord[0]][sliderCoord[1] + 1];

    if (!cell.block) {
      context.lineWidth = alternateToVerticalHistory.length === 0 || peek(alternateToVerticalHistory) ? LINE_THICKNESS * 2 : LINE_THICKNESS;
      context.strokeStyle = alternateToVerticalHistory.length === 0 || peek(alternateToVerticalHistory) ? ALERT_COLOR : `${ALERT_COLOR}80`;

      // Relative
      let coord = getDrawCoord(sliderCoord[0], sliderCoord[1] + 1, true);

      context.beginPath();
      context.moveTo(coord[0], coord[1] - CELL_SIZE / 3);
      context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
      context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
      context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.stroke();

      // Absolute
      coord = getDrawCoord(COLS / 2 - 0.5, ROWS, true);

      context.beginPath();
      context.moveTo(coord[0], coord[1] - CELL_SIZE / 3);
      context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
      context.moveTo(coord[0] - CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.lineTo(coord[0], coord[1] + CELL_SIZE / 3);
      context.lineTo(coord[0] + CELL_SIZE / 8, coord[1] + CELL_SIZE / 8);
      context.stroke();
    }
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

function moveLeft(x, y) {
  let slider = grid[x + 1][y];

  if (!slider.containsSlider) {
    console.error("trying to move cell without slider");
    return;
  }

  if (x >= 0) {
    let leftCell = grid[x][y];

    if (!leftCell.block) {
      slider.containsSlider = false;
      leftCell.containsSlider = true;
      leftCell.keyNumber = NaN;

      moveLeft(x - 1, y);
      return;
    } else {
      leftCell.block = false;
      leftCell.brokenBlock = true;
    }
  }

  alternateToVerticalHistory.push(true);

  queuedSounds.push(CLINK_SOUND);
  drawPuzzle();
}

function moveRight(x, y) {
  let slider = grid[x - 1][y];

  if (!slider.containsSlider) {
    console.error("trying to move cell without slider");
    return;
  }

  if (x < COLS) {
    let rightCell = grid[x][y];

    if (!rightCell.block) {
      slider.containsSlider = false;
      rightCell.containsSlider = true;
      rightCell.keyNumber = NaN;

      moveRight(x + 1, y);
      return;
    } else {
      rightCell.block = false;
      rightCell.brokenBlock = true;
    }
  }

  alternateToVerticalHistory.push(true);

  queuedSounds.push(CLINK_SOUND);
  drawPuzzle();
}

function moveUp(x, y) {
  let slider = grid[x][y + 1];

  if (!slider.containsSlider) {
    console.error("trying to move cell without slider");
    return;
  }

  if (y >= 0) {
    let aboveCell = grid[x][y];

    if (!aboveCell.block) {
      slider.containsSlider = false;
      aboveCell.containsSlider = true;
      aboveCell.keyNumber = NaN;

      moveUp(x, y - 1);
      return;
    } else {
      aboveCell.block = false;
      aboveCell.brokenBlock = true;
    }
  }

  alternateToVerticalHistory.push(false);

  queuedSounds.push(CLINK_SOUND);
  drawPuzzle();
}

function moveDown(x, y) {
  let slider = grid[x][y - 1];

  if (!slider.containsSlider) {
    console.error("trying to move cell without slider");
    return;
  }

  if (y < ROWS) {
    let belowCell = grid[x][y];

    if (!belowCell.block) {
      slider.containsSlider = false;
      belowCell.containsSlider = true;
      belowCell.keyNumber = NaN;

      moveDown(x, y + 1);
      return;
    } else {
      belowCell.block = false;
      belowCell.brokenBlock = true;
    }
  }

  alternateToVerticalHistory.push(false);

  queuedSounds.push(CLINK_SOUND);
  drawPuzzle();
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (router.puzzleState.interactive) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let coord = convertToGridCoord(mouseX, mouseY);
      handleLeftClickOrTap(coord);
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

    let coord = convertToGridCoord(touchX, touchY);
    handleLeftClickOrTap(coord);
  }
}

export function onKeyDown(event) {
  if (router.puzzleState.interactive) {
    // Restart
    if (keyboardManager.isRestartKey(event)) {
      void restart();
      event.preventDefault();
      return;
    }

    // Undo
    if (keyboardManager.isUndoKey(event)) {
      undo();
      event.preventDefault();
      return;
    }

    // Move
    if (!keyboardManager.hasModifierKeys(event)
        && keyboardManager.isOrthogonalDirKey(event)) {
      event.preventDefault();
      let sliderCoord;

      for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
          let gridCell = grid[i][j];
          if (gridCell.containsSlider) {
            sliderCoord = [i, j];
            break;
          }
        }
      }

      if (keyboardManager.isLeftDirKey(event)) {
        handleLeftClickOrTap([sliderCoord[0] - 1, sliderCoord[1]], true);
      } else if (keyboardManager.isRightDirKey(event)) {
        handleLeftClickOrTap([sliderCoord[0] + 1, sliderCoord[1]], true);
      } else if (keyboardManager.isUpDirKey(event)) {
        handleLeftClickOrTap([sliderCoord[0], sliderCoord[1] - 1], true);
      } else if (keyboardManager.isDownDirKey(event)) {
        handleLeftClickOrTap([sliderCoord[0], sliderCoord[1] + 1], true);
      }
    }
  }
}

async function restart() {
  if (gridHistory.length && await router.getConfirmation('', "Reset Puzzle?")) {
    // Alternative approach if I wanted to be able to undo restarts,
    // but would need to figure out alternateToVerticalHistory and
    // disabling the restart action for the initial restarted state

    // if (gridHistory >= HISTORY_LIMIT) {
      // gridHistory.shift();
    // }

    // gridHistory.push(deepCopy(grid));

    gridHistory = [];
    alternateToVerticalHistory = [];

    grid = deepCopy(solution);
    audioManager.play(RESTART_SOUND);
    drawPuzzle();
  }
}

function undo() {
  if (gridHistory.length > 0) {
    audioManager.play(UNDO_SOUND);
    grid = gridHistory.pop();
    alternateToVerticalHistory.pop();
    drawPuzzle();
  }
}

function handleLeftClickOrTap(coord, movementOnly = false) {
  // Restart
  if ((coord[0] === COLS || coord[0] === COLS - 1) && coord[1] === -1) {
    if (movementOnly) {
      return;
    }

    void restart();

  // Undo
  } else if ((coord[0] === -1 || coord[0] === 0) && coord[1] === -1) {
    if (movementOnly) {
      return;
    }

    undo();
  } else {
    let rightMove = false;
    let leftMove = false;
    let downMove = false;
    let upMove = false;

    let sliderCoord;

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        let gridCell = grid[i][j];
        if (gridCell.containsSlider) {
          sliderCoord = [i, j];
          break;
        }
      }
    }

    if (coord[0] === sliderCoord[0] && coord[1] === sliderCoord[1]) {
      return;
    }

    if (coord[0] <= -1 && coord[1] >= ROWS / 2 - 4 && coord[1] <= ROWS / 2 + 3) {
      leftMove = true;
    } else if (coord[0] >= COLS && coord[1] >= ROWS / 2 - 4 && coord[1] <= ROWS / 2 + 3) {
      rightMove = true;
    } else if (coord[0] >= COLS / 2 - 4 && coord[0] <= COLS / 2 + 3 && coord[1] <= -1) {
      upMove = true;
    } else if (coord[0] >= COLS / 2 - 4 && coord[0] <= COLS / 2 + 3 && coord[1] >= ROWS) {
      downMove = true;
    } else {
      let deltaX = Math.abs(coord[0] - sliderCoord[0]);
      let deltaY = Math.abs(coord[1] - sliderCoord[1]);

      if (deltaX !== deltaY) {
        if (deltaX > deltaY) {
          if (deltaX <= 2) {
            if (coord[0] - sliderCoord[0] < 0) {
              leftMove = true;
            } else {
              rightMove = true;
            }
          }
        } else {
          if (deltaY <= 2) {
            if (coord[1] - sliderCoord[1] < 0) {
              upMove = true;
            } else {
              downMove = true;
            }
          }
        }
      }
    }

    let neighborCoord;

    if (leftMove) {
      if (sliderCoord[0] > 0) {
        neighborCoord = [sliderCoord[0] - 1, sliderCoord[1]];
      }
    } else if (rightMove) {
      if (sliderCoord[0] < COLS - 1) {
        neighborCoord = [sliderCoord[0] + 1, sliderCoord[1]];
      }
    } else if (upMove) {
      if (sliderCoord[1] > 0) {
        neighborCoord = [sliderCoord[0], sliderCoord[1] - 1];
      }
    } else if (downMove) {
      if (sliderCoord[1] < ROWS - 1) {
        neighborCoord = [sliderCoord[0], sliderCoord[1] + 1];
      }
    }

    if (neighborCoord && !grid[neighborCoord[0]][neighborCoord[1]].block) {
      if (rightMove || leftMove || downMove || upMove) {
        if (gridHistory >= HISTORY_LIMIT) {
          gridHistory.shift();
        }

        gridHistory.push(deepCopy(grid));
      }

      if (rightMove) {
        moveRight(...neighborCoord);
      } else if (leftMove) {
        moveLeft(...neighborCoord);
      } else if (downMove) {
        moveDown(...neighborCoord);
      } else if (upMove) {
        moveUp(...neighborCoord);
      }
    }
  }
}
