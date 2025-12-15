import audioManager from "../js/audio-manager.js";
import {
  ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH,
  FONT_FAMILY, SUCCESS_COLOR
} from "../js/config.js";
import keyboardManager from "../js/keyboard-manager.js";
import router from "../js/router.js";
import {
  deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, getPuzzleCanvas,
  randomIndex, updateForTutorialRecommendation, updateForTutorialState
} from "../js/utils.js";

const SWITCH_RATE = 1/3;
const LIGHT_BORDER = 0;
const LINE_THICKNESS = 12;
const SWITCH_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 7;

const SWITCH_SOUND = audioManager.SoundEffects.CLICK;
const RESTART_SOUND = audioManager.SoundEffects.BOING;
const CLINK_SOUND = audioManager.SoundEffects.CLINK;
const CHIME_SOUND = audioManager.SoundEffects.CHIME;

const tutorials = [
  {
    rows: 2,
    cols: 2,
    // ROWS + COLS
    lightSwitches: [
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x === 0 && y === 0;
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x === 1 && y === 0;
        })),
        toggled: false,
      },
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, _y) => {
          return x === 1;
        })),
        toggled: false,
      },
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x === 1 || (x === 0 && y === 1);
        })),
        toggled: true,
      },
    ],
  },
  {
    rows: 2,
    cols: 2,
    lightSwitches: [
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x === y;
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x === 1 && y === 0;
        })),
        toggled: false,
      },
      {
        lightToggles: Array.from({length: 2}, (_elX, x) => Array.from({length: 2}, (_elY, _y) => {
          return x === 1;
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 2}, (_elX, _x) => Array.from({length: 2}, (_elY, y) => {
          return y === 1;
        })),
        toggled: true,
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    lightSwitches: [
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return !(x === 0 && y === 0);
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return !(x === 1 && y === 0);
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return !(x === 2 && y === 0);
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x !== 1 && y === 1;
        })),
        toggled: false,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, _x) => Array.from({length: 2}, (_elY, y) => {
          return y === 0;
        })),
        toggled: true,
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    lightSwitches: [
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return (x === 1 && y === 0) || x === 2;
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return !((x === 0 && y === 1) || (x=== 2 && y === 0));
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, _y) => {
          return x !== 0;
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return !(x === y + 1);
        })),
        toggled: true,
      },
      {
        lightToggles: Array.from({length: 3}, (_elX, x) => Array.from({length: 2}, (_elY, y) => {
          return x === 0 && y === 0;
        })),
        toggled: true,
      },
    ],
  },
];

let DIFFICULTY;
let ROWS;
let COLS;
let CELL_SIZE;

let cursorSwitchIndex;
let grid;
let lightSwitches;
let originalGrid;
let originalSwitches;
let solutionGrid;
let solutionSwitches;
let queuedSounds = [];

export function drawInstructions() {
  drawInstructionsHelper("Light Switches Puzzle", "🚨\uFE0E",
      ["Activate the correct switches to light all the grid tiles.",
          "Each switch toggles a specific set of tiles."],
      ["Click or tap a switch to toggle it."],
      router.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let gridToDraw = router.puzzleState.showingSolution ? solutionGrid : grid;
  let switchesToDraw = router.puzzleState.showingSolution ? solutionSwitches : lightSwitches;

  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let puzzleSolved = true;

  // Draw Grid
  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let light = gridToDraw[i][j];

      puzzleSolved &&= light;

      context.fillStyle = light ? SUCCESS_COLOR : "#808080";
      context.fillRect(i * CELL_SIZE + LIGHT_BORDER, j * CELL_SIZE + LIGHT_BORDER,
          CELL_SIZE - (2 * LIGHT_BORDER), CELL_SIZE - (2 * LIGHT_BORDER));
    }
  }

  // Draw Switches
  for (let i = 0; i < switchesToDraw.length; i++) {
    let lightSwitch = switchesToDraw[i];
    let coord = getSwitchCoord(lightSwitch, switchesToDraw);

    let switchColor = lightSwitch.toggled ? (puzzleSolved ? SUCCESS_COLOR : ALERT_COLOR) : "#000000";

    context.lineWidth = LINE_THICKNESS;
    context.fillStyle = switchColor;
    context.strokeStyle = "#808080";
    context.beginPath();
    context.arc(coord[0], coord[1], SWITCH_SIZE / 4, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();

    if (puzzleSolved) {
      if (lightSwitch.toggled) {
        context.strokeStyle = `${switchColor}80`;
        context.beginPath();
        context.arc(coord[0], coord[1], SWITCH_SIZE / 4 + LINE_THICKNESS, 0, 2 * Math.PI, false);
        context.stroke();
      }
    } else {
      // Draw Cursor
      if (router.puzzleState.usingKeyboard && i === cursorSwitchIndex) {
        context.lineWidth = LINE_THICKNESS * 0.5;
        context.strokeStyle = "#000";
        context.beginPath();
        context.strokeRect(coord[0] - SWITCH_SIZE * 0.5 + LINE_THICKNESS * 0.75,
            coord[1] - SWITCH_SIZE * 0.5 + LINE_THICKNESS * 0.75,
            SWITCH_SIZE - LINE_THICKNESS * 1.5,
            SWITCH_SIZE - LINE_THICKNESS * 1.5);

        context.strokeStyle = ALERT_COLOR;
        context.beginPath();
        context.strokeRect(coord[0] - SWITCH_SIZE * 0.5 + LINE_THICKNESS * 0.25,
            coord[1] - SWITCH_SIZE * 0.5 + LINE_THICKNESS * 0.25,
            SWITCH_SIZE - LINE_THICKNESS * 0.5,
            SWITCH_SIZE - LINE_THICKNESS * 0.5);
      }
    }
  }

  if (puzzleSolved) {
    if (router.puzzleState.interactive) {
      endPuzzle(router.puzzleState.tutorialStage === tutorials.length);
      audioManager.play(CHIME_SOUND);
    }
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));

    if (!atOriginalState()) {
      // Restart
      const OFFSET_SIZE = CELL_SIZE * 0.9;
      const verticalOffset = Math.max(ROWS, COLS) * CELL_SIZE;
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
    }
  }

  queuedSounds = [];
}

function getSwitchCoord(lightSwitch, switchesToCheck = lightSwitches) {
  let i = switchesToCheck.indexOf(lightSwitch);

  let lightX;
  let lightY;

  if (i < ROWS) {
    lightX = CELL_SIZE * (COLS + 0.5);
    lightY = CELL_SIZE * (i + 0.5);
  } else {
    // Start at right edge, so that order goes down the right side, then left along the bottom
    lightX = CELL_SIZE * (COLS - (i - ROWS + 0.5));
    lightY = CELL_SIZE * (ROWS + 0.5);
  }

  return [lightX, lightY];
}

function generateSwitches() {
  lightSwitches = [];

  const offGrid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => true));
  let anyToggled = false;

  for (let i = 0; i < COLS + ROWS - 1; i++) {
    const isToggled = router.sRand() < 0.5;
    anyToggled ||= isToggled;

    let connections;
    let connectionsGood = false;

    while (!connectionsGood) {
      connections = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => router.sRand() < SWITCH_RATE));
      let connectionsTotal = connections.flat().filter(connection => connection).length;
      connectionsGood = connectionsTotal > 0 && connectionsTotal < ROWS * COLS;

      // Prevent duplicates
      if (connectionsGood) {
        let connectionsString = connections.flat().map(toggle => toggle.toString()).join('');

        for (let j = 0; j < lightSwitches.length; j++) {
          let lightSwitch = lightSwitches[j];

          if (lightSwitch.lightToggles.flat().map(toggle => toggle.toString()).join('') === connectionsString) {
            connectionsGood = false;
            break;
          }
        }
      }
    }

    if (isToggled) {
      for (let j = 0; j < COLS; j++) {
        for (let k = 0; k < ROWS; k++) {
          if (connections[j][k]) {
            offGrid[j][k] = !offGrid[j][k];
          }
        }
      }
    }

    lightSwitches.push({
      lightToggles: connections,
      toggled: isToggled,
    });
  }

  if (!anyToggled) {
    const toggledSwitch = lightSwitches[randomIndex(lightSwitches)];
    toggledSwitch.toggled = true;

    for (let j = 0; j < COLS; j++) {
      for (let k = 0; k < ROWS; k++) {
        if (toggledSwitch.lightToggles[j][k]) {
          offGrid[j][k] = !offGrid[j][k];
        }
      }
    }
  }

  const offGridToggles = offGrid.flat().filter(connection => connection).length;
  const allOn = offGridToggles === COLS * ROWS;

  if (allOn) {
    // Toggled switches cancel each other out, so redo the generation
    generateSwitches();
    return;
  }

  let lastSwitchConnections;
  const lastSwitchIndex = randomIndex(lightSwitches);
  const allOff = offGridToggles === 0;

  if (allOff) {
    // Toggled switches already span the whole grid,
    // so just make this last one a random untoggled switch

    let connections;

    while (!connections || connections.flat().filter(connection => connection).length === 0) {
      connections = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => router.sRand() < SWITCH_RATE));
    }

    lastSwitchConnections = connections;
    lightSwitches.splice(lastSwitchIndex, 0, {
      lightToggles: connections,
      toggled: false
    });
  } else {
    lastSwitchConnections = offGrid;
    lightSwitches.splice(lastSwitchIndex, 0, {
      lightToggles: offGrid,
      toggled: true,
    });
  }

  // Make sure the last switch isn't a duplicate, otherwise redo the generation
  let connectionsString = lastSwitchConnections.flat().map(toggle => toggle.toString()).join('');

  for (let j = 0; j < lightSwitches.length; j++) {
    if (j === lastSwitchIndex) {
      continue;
    }

    let lightSwitch = lightSwitches[j];

    if (lightSwitch.lightToggles.flat().map(toggle => toggle.toString()).join('') === connectionsString) {
      generateSwitches();
      return;
    }
  }
}

function toggle(lightSwitch) {
  lightSwitch.toggled = !lightSwitch.toggled;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      if (lightSwitch.lightToggles[i][j]) {
        grid[i][j] = !grid[i][j];
      }
    }
  }
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (router.puzzleState.tutorialStage > tutorials.length) {
    router.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  queuedSounds = [];

  if (router.puzzleState.tutorialStage) {
    const tutorial = tutorials[router.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1);
    grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => true));

    lightSwitches = deepCopy(tutorial.lightSwitches);
  } else {
    DIFFICULTY = router.difficulty;

    // Quick: 2/3, Casual: 3/3, Challenging: 3/4, Intense: 4/4
    ROWS = DIFFICULTY <= 1 ? 2 : (DIFFICULTY <= 3 ? 3 : 4);
    COLS = DIFFICULTY <= 2 ? 3 : 4;
    CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1);
    grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => true));

    generateSwitches();
  }

  solutionGrid = deepCopy(grid);
  solutionSwitches = deepCopy(lightSwitches);

  lightSwitches.forEach(lightSwitch => {
    if (lightSwitch.toggled) {
      toggle(lightSwitch);
    }
  });

  originalGrid = deepCopy(grid);
  originalSwitches = deepCopy(lightSwitches);
  cursorSwitchIndex = lightSwitches.length - 1;

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

function atOriginalState() {
  // Are all switches turned off
  return lightSwitches.every(lightSwitch => !lightSwitch.toggled);
}

async function restart() {
  if (!atOriginalState() && await router.getConfirmation('', "Reset Puzzle?")) {
    lightSwitches = deepCopy(originalSwitches);
    grid = deepCopy(originalGrid);
    audioManager.play(RESTART_SOUND);
    drawPuzzle();
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

    // Toggle Switch
    if (keyboardManager.isActivationKey(event)) {
      event.preventDefault();
      const lightSwitch = lightSwitches[cursorSwitchIndex];
      queuedSounds.push(SWITCH_SOUND);
      toggle(lightSwitch);
      drawPuzzle();
      return;
    }

    // Move Cursor
    if (!keyboardManager.hasModifierKeys(event)) {
      if (keyboardManager.isOrthogonalDirKey(event)) {
        event.preventDefault();

        if (keyboardManager.isLeftDirKey(event)) {
          cursorSwitchIndex = cursorSwitchIndex >= lightSwitches.length - 1 ? 0 : cursorSwitchIndex + 1;
          audioManager.play(CLINK_SOUND, 0.3);
        } else if (keyboardManager.isRightDirKey(event)) {
          cursorSwitchIndex = cursorSwitchIndex <= 0 ? lightSwitches.length - 1 : cursorSwitchIndex - 1;
          audioManager.play(CLINK_SOUND, 0.3);
        } else if (keyboardManager.isUpDirKey(event)) {
          cursorSwitchIndex = cursorSwitchIndex <= 0 ? lightSwitches.length - 1 : cursorSwitchIndex - 1;
          audioManager.play(CLINK_SOUND, 0.3);
        } else if (keyboardManager.isDownDirKey(event)) {
          cursorSwitchIndex = cursorSwitchIndex >= lightSwitches.length - 1 ? 0 : cursorSwitchIndex + 1;
          audioManager.play(CLINK_SOUND, 0.3);
        }

        drawPuzzle();
      }
    }
  }
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (router.puzzleState.interactive) {
      const canvasRect = getPuzzleCanvas().getBoundingClientRect();
      const mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      const mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      // For-each loops cannot be broken out of!
      for (let i = 0; i < lightSwitches.length; i++) {
        const lightSwitch = lightSwitches[i];
        const coord = getSwitchCoord(lightSwitch);

        if (Math.sqrt(Math.pow(mouseX - coord[0], 2)
            + Math.pow(mouseY - coord[1], 2)) < SWITCH_SIZE / 3) {
          queuedSounds.push(SWITCH_SOUND);
          toggle(lightSwitch);
          cursorSwitchIndex = i;
          drawPuzzle();
          return;
        }
      }

      if (mouseX >= CANVAS_WIDTH - CELL_SIZE * 0.8 && mouseY >= CANVAS_HEIGHT - CELL_SIZE * 0.9) {
        void restart();
      }
    }
  }
}

export function onTouchStart(event) {
  if (router.puzzleState.interactive && event.changedTouches.length === 1) {
    const touch = event.changedTouches[0];
    const canvasRect = getPuzzleCanvas().getBoundingClientRect();
    const touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    const touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    // For-each loops cannot be broken out of!
    for (let i = 0; i < lightSwitches.length; i++) {
      const lightSwitch = lightSwitches[i];
      const coord = getSwitchCoord(lightSwitch);

      if (Math.sqrt(Math.pow(touchX - coord[0], 2)
          + Math.pow(touchY - coord[1], 2)) < SWITCH_SIZE / 3) {
        queuedSounds.push(SWITCH_SOUND);
        toggle(lightSwitch);
        cursorSwitchIndex = i;
        drawPuzzle();
        return;
      }
    }

    if (touchX >= CANVAS_WIDTH - CELL_SIZE * 0.8 && touchY >= CANVAS_HEIGHT - CELL_SIZE * 0.9) {
      void restart();
    }
  }
}
