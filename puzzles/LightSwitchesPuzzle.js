import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialState } from "../js/utils.js";

const SWITCH_RATE = 1/3;
const LIGHT_BORDER = 0;
const LINE_THICKNESS = 12;
const SWITCH_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 7;

const SWITCH_SOUND = 'click';
const CHIME_SOUND = 'chime';

let DIFFICULTY;
let ROWS;
let COLS;
let CELL_SIZE;

let grid;
let lightSwitches;
let solutionGrid;
let solutionSwitches;
let queuedSounds = [];

export function drawInstructions() {
  drawInstructionsHelper("🚨\uFE0E Light Switches Puzzle 🚨\uFE0E",
      ["Activate the correct switches to light all the grid tiles.",
          "Each switch toggles a specific set of tiles."],
      ["Click or tap a switch to toggle it."]);
}

export function drawPuzzle() {
  let gridToDraw = window.app.puzzleState.showingSolution ? solutionGrid : grid;
  let switchesToDraw = window.app.puzzleState.showingSolution ? solutionSwitches : lightSwitches;

  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let puzzleSolved = true;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let light = gridToDraw[i][j];

      puzzleSolved &= light;

      context.fillStyle = light ? SUCCESS_COLOR : "#808080";
      context.fillRect(i * CELL_SIZE + LIGHT_BORDER, j * CELL_SIZE + LIGHT_BORDER,
          CELL_SIZE - (2 * LIGHT_BORDER), CELL_SIZE - (2 * LIGHT_BORDER));
    }
  }

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

  context.lineWidth = LINE_THICKNESS;

  for (let i = 0; i < switchesToDraw.length; i++) {
    let lightSwitch = switchesToDraw[i];
    let coord = getSwitchCoord(lightSwitch, switchesToDraw);

    let tileColor = lightSwitch.toggled ? (puzzleSolved ? SUCCESS_COLOR : ALERT_COLOR) : "#000000";

    context.fillStyle = tileColor;
    context.strokeStyle = "#808080";
    context.beginPath();
    context.arc(coord[0], coord[1], SWITCH_SIZE / 4, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();
  }
}

function getSwitchCoord(lightSwitch, switchesToCheck = lightSwitches) {
  let i = switchesToCheck.indexOf(lightSwitch);

  let lightX;
  let lightY;

  if (i < ROWS) {
    lightX = CELL_SIZE * (COLS + 0.5);
    lightY = CELL_SIZE * (i + 0.5);
  } else {
    lightX = CELL_SIZE * (i - ROWS + 0.5);
    lightY = CELL_SIZE * (ROWS + 0.5);
  }

  return [lightX, lightY];
}

function generateGrid() {
  lightSwitches = [];

  grid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => true));

  let offGrid = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => true));
  let anyToggled = false;

  for (let i = 0; i < COLS + ROWS - 1; i++) {
    let isToggled = Math.random() < 0.5;
    anyToggled ||= isToggled;

    let connections;
    let connectionsGood = false;

    while (!connectionsGood) {
      connections = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => Math.random() < SWITCH_RATE));
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
      toggled: isToggled
    });
  }

  if (!anyToggled) {
    let toggledSwitch = lightSwitches[randomIndex(lightSwitches)];
    toggledSwitch.toggled = true;

    for (let j = 0; j < COLS; j++) {
      for (let k = 0; k < ROWS; k++) {
        if (toggledSwitch.lightToggles[j][k]) {
          offGrid[j][k] = !offGrid[j][k];
        }
      }
    }
  }

  let offGridToggles = offGrid.flat().filter(connection => connection).length;
  let allOn = offGridToggles === COLS * ROWS;

  if (allOn) {
    // Toggled switches cancel each other out, so redo the generation
    generateGrid();
    return;
  }

  let allOff = offGridToggles === 0;

  if (allOff) {
    // Toggled switches already span the whole grid,
    // so just make this last one a random untoggled switch

    let connections;

    while (!connections || connections.flat().filter(connection => connection).length === 0) {
      connections = Array.from({length: COLS}, () => Array.from({length: ROWS}, () => Math.random() < SWITCH_RATE));
    }

    lightSwitches.splice(randomIndex(lightSwitches), 0, {
      lightToggles: connections,
      toggled: false
    });
  } else {
    lightSwitches.splice(randomIndex(lightSwitches), 0, {
      lightToggles: offGrid,
      toggled: true,
    });
  }

  solutionGrid = deepCopy(grid);
  solutionSwitches = deepCopy(lightSwitches);
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
  if (window.app.puzzleState.tutorialStage > 0 /* tutorials.length */) {
    window.app.puzzleState.tutorialStage = 0;
    alert("Tutorial for this puzzle coming soon!");
  }

  DIFFICULTY = window.app.router.difficulty;

  // Quick: 3/3, Casual: 3/4, Challenging: 4/4, Intense: 4/5
  ROWS = 3 + (DIFFICULTY > 2 ? 1 : 0);
  COLS = 2 + DIFFICULTY - (DIFFICULTY > 2 ? 1 : 0);
  CELL_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / (Math.max(ROWS, COLS) + 1);

  queuedSounds = [];

  generateGrid();

  lightSwitches.forEach(lightSwitch => {
    if (lightSwitch.toggled) {
      toggle(lightSwitch);
    }
  });

  updateForTutorialState();

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

      // For-each loops cannot be broken out of!
      for (let i = 0; i < lightSwitches.length; i++) {
        let lightSwitch = lightSwitches[i];
        let coord = getSwitchCoord(lightSwitch);

        if (Math.sqrt(Math.pow(mouseX - coord[0], 2)
            + Math.pow(mouseY - coord[1], 2)) < SWITCH_SIZE / 3) {
          queuedSounds.push(SWITCH_SOUND);
          toggle(lightSwitch);
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

export function onTouchStart(event) {
  if (window.app.puzzleState.interactive && event.changedTouches.length === 1) {
    let touch = event.changedTouches[0];
    let canvasRect = event.target.getBoundingClientRect();
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    // For-each loops cannot be broken out of!
    for (let i = 0; i < lightSwitches.length; i++) {
      let lightSwitch = lightSwitches[i];
      let coord = getSwitchCoord(lightSwitch);

      if (Math.sqrt(Math.pow(touchX - coord[0], 2)
          + Math.pow(touchY - coord[1], 2)) < SWITCH_SIZE / 3) {
        queuedSounds.push(SWITCH_SOUND);
        toggle(lightSwitch);
        drawPuzzle();
        return;
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
