import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { containsCoord, deepCopy, drawInstructionsHelper, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomEl, removeCoord } from "../js/utils.js";

const OFFSET_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 10;
const NODE_LINE_THICKNESS = 12;
const TEXT_SIZE = OFFSET_SIZE / 3;
const LINE_THICKNESS = 18;
const TILE_BORDER = 4;

const CLEAR_SOUND = 'warp';
const CLICK_SOUND = 'click';
const CHIME_SOUND = 'chime';

let DIFFICULTY;
let ROWS;
let COLS;
let LOOP_ROWS;
let LOOP_COLS;

let CELL_SIZE;
let NODE_SIZE;

let grid;
let solution;
let solutionLength;
let loopGrid;

let draggingValue = null;
let dragging = false;
let draggingTile;
let previousTouch;
let queuedSounds = [];


function generateGrid() {
  loopGrid = Array.from({length: LOOP_COLS},
      () => Array.from({length: LOOP_ROWS},
          () => Math.random() < 0.5 ? true : false));

  // Break up all 2x2 groups
  let all2x2Groups = getAll2x2Groups();

  while (all2x2Groups.length) {
    let group = randomEl(all2x2Groups);
    let coord = randomEl(group);

    loopGrid[coord[0]][coord[1]] = !loopGrid[coord[0]][coord[1]];

    all2x2Groups = getAll2x2Groups();
  }

  // Grow empty groups out to edge
  let allEmptyGroupsNotAtEdge = getAllEmptyGroupsNotAtEdge();

  while (allEmptyGroupsNotAtEdge.length) {
    let group = randomEl(allEmptyGroupsNotAtEdge);
    let coord = getClosestCoordToEdge(group);

    let neighbors = getNeighborCoords(coord);
    let neighbor = getClosestCoordToEdge(neighbors);

    loopGrid[neighbor[0]][neighbor[1]] = false;

    allEmptyGroupsNotAtEdge = getAllEmptyGroupsNotAtEdge();
  }

  // Grow filled groups to center, prioritizing smaller sizes
  let allFilledGroups = getAllFilledGroups();

  while (allFilledGroups.length > 1) {
    let minSize = LOOP_ROWS * LOOP_COLS;
    let smallestFilledGroups;

    allFilledGroups.forEach(group => {
      if (group.length < minSize) {
        smallestFilledGroups = [];
        minSize = group.length;
      }

      if (group.length === minSize) {
        smallestFilledGroups.push(group);
      }
    });

    let smallestFilledGroup = randomEl(smallestFilledGroups);
    let coord = getClosestCoordToCenter(smallestFilledGroup);

    // In case of an odd number of rows or columns, need to make sure to
    // filter out filled neighbors and only consider empty ones
    let neighbors = getNeighborCoords(coord).filter(neighbor => {
      return !loopGrid[neighbor[0]][neighbor[1]];
    });
    let neighbor = getClosestCoordToCenter(neighbors);

    loopGrid[neighbor[0]][neighbor[1]] = true;

    allFilledGroups = getAllFilledGroups();
  }

  // Fill all empty groups not at edge
  allEmptyGroupsNotAtEdge = getAllEmptyGroupsNotAtEdge();

  allEmptyGroupsNotAtEdge.forEach(group => {
    group.forEach(coord => {
      loopGrid[coord[0]][coord[1]] = true;
    });
  });

  // Find any 2x3 or 3x2 groups with center tiles at edge (if filled) or
  // against opposite value and extend that inward
  let allEligible2x3Groups = getAllEligible2x3Groups();
  let allEligible3x2Groups = getAllEligible3x2Groups();

  while(allEligible2x3Groups.length || allEligible3x2Groups.length) {
    if (Math.random() < allEligible2x3Groups.length
        / (allEligible2x3Groups.length + allEligible3x2Groups.length)) {
      let group = randomEl(allEligible2x3Groups);
      let i = group[0][0];
      let j = group[0][1];
      let cell = loopGrid[i][j];

      let leftEdge = (cell && i === 0) || loopGrid[i - 1][j + 1] !== cell;
      let rightEdge = (cell && i + 1 === LOOP_COLS - 1)
          || loopGrid[i + 2][j + 1] !== cell;

      if (leftEdge && (!rightEdge || Math.random() < 0.5)) {
        loopGrid[i][j + 1] = !cell;
      } else if (rightEdge) {
        loopGrid[i + 1][j + 1] = !cell;
      } else {
        console.error("Ineligible Group Used:", cell, group);
        generateGrid();
        return;
      }
    } else {
      let group = randomEl(allEligible3x2Groups);
      let i = group[0][0];
      let j = group[0][1];
      let cell = loopGrid[i][j];

      let topEdge = (cell && j === 0) || loopGrid[i + 1][j - 1] !== cell;
      let bottomEdge = (cell && j + 1 === LOOP_ROWS - 1)
          || loopGrid[i + 1][j + 2] !== cell;

      if (topEdge && (!bottomEdge || Math.random() < 0.5)) {
        loopGrid[i + 1][j] = !cell;
      } else if (bottomEdge) {
        loopGrid[i + 1][j + 1] = !cell;
      } else {
        console.error("Ineligible Group Used:", cell, group);
        generateGrid();
        return;
      }
    }

    allEligible2x3Groups = getAllEligible2x3Groups();
    allEligible3x2Groups = getAllEligible3x2Groups();
  }

  grid = Array.from({length: COLS},
      (el, x) => Array.from({length: ROWS},
          (el, y) => {
            return {
              coord: [x, y],
              neighborPaths: [],
              marked: isGridCoordMarked([x, y])
            };
  }));

  solution = deepCopy(grid);

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = solution[i][j];
      let neighbors = getGridPathNeighborCoords(tile.coord);
      tile.neighborPaths = neighbors;
    }
  }

  solutionLength = getPathLength(solution);

  let allPathsLoops = areAllPathsLoops(solution);
  let loops = getAllLoops(solution);
  let pathMatchesMarkers = doesPathMatchMarkers(solution);
  let solutionValid = allPathsLoops && loops.length === 1
      && pathMatchesMarkers;

  if (!solutionValid) {
    console.error("Will regenerate due to invalid solution:", solution);
    generateGrid();
    return;
  }
}

function getPathLength(gridToDraw = grid) {
  return gridToDraw.flat().map(tile => tile.neighborPaths)
      .flat().length / 2;
}

function getAll2x2Groups() {
  let groups = [];

  for (let i = 0; i < LOOP_COLS - 1; i++) {
    for (let j = 0; j < LOOP_ROWS - 1; j++) {
      let cell = loopGrid[i][j];
      let cellX = loopGrid[i + 1][j];
      let cellY = loopGrid[i][j + 1];
      let cellXY = loopGrid[i + 1][j + 1];

      let group = [cell, cellX, cellY, cellXY];

      if (group.every(val => val) || group.every(val => !val)) {
        groups.push([[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]);
      }
    }
  }

  return groups;
}

function getAllEligible2x3Groups() {
  let groups = [];

  for (let i = 0; i < LOOP_COLS - 1; i++) {
    for (let j = 0; j < LOOP_ROWS - 2; j++) {
      let cell = loopGrid[i][j];
      let cellX = loopGrid[i + 1][j];
      let cellY = loopGrid[i][j + 1];
      let cellXY = loopGrid[i + 1][j + 1];
      let cellYY = loopGrid[i][j + 2];
      let cellXYY = loopGrid[i + 1][j + 2];

      let group = [cell, cellX, cellY, cellXY, cellYY, cellXYY];

      if (group.every(val => val) || group.every(val => !val)) {
        groups.push([[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1], [i, j + 2], [i + 1, j+ 2]]);
      }
    }
  }

  return groups.filter(group => {
    let i = group[0][0];
    let j = group[0][1];
    let cell = loopGrid[i][j];

    let leftEdge = (cell && i === 0) || (i > 0 && loopGrid[i - 1][j + 1] !== cell);
    let rightEdge = (cell && i + 1 === LOOP_COLS - 1)
        || (i + 1 < LOOP_COLS - 1 && loopGrid[i + 2][j + 1] !== cell);

    return leftEdge || rightEdge;
  });
}

function getAllEligible3x2Groups() {
  let groups = [];

  for (let i = 0; i < LOOP_COLS - 2; i++) {
    for (let j = 0; j < LOOP_ROWS - 1; j++) {
      let cell = loopGrid[i][j];
      let cellX = loopGrid[i + 1][j];
      let cellXX = loopGrid[i + 2][j];
      let cellY = loopGrid[i][j + 1];
      let cellXY = loopGrid[i + 1][j + 1];
      let cellXXY = loopGrid[i + 2][j + 1];

      let group = [cell, cellX, cellXX, cellY, cellXY, cellXXY];

      if (group.every(val => val) || group.every(val => !val)) {
        groups.push([[i, j], [i + 1, j], [i + 2, j], [i, j + 1], [i + 1, j + 1], [i + 2, j + 1]]);
      }
    }
  }

  return groups.filter(group => {
    let i = group[0][0];
    let j = group[0][1];
    let cell = loopGrid[i][j];

    let topEdge = (cell && j === 0) || (j > 0 && loopGrid[i + 1][j - 1] !== cell);
    let bottomEdge = (cell && j + 1 === LOOP_ROWS - 1)
        || (j + 1 < LOOP_ROWS - 1 && loopGrid[i + 1][j + 2] !== cell);

    return topEdge || bottomEdge;
  });
}

function getAllEmptyGroupsNotAtEdge() {
  let emptyGroups = [];

  for (let i = 0; i < LOOP_COLS; i++) {
    for (let j = 0; j < LOOP_ROWS; j++) {
      let cell = loopGrid[i][j];

      if (!cell && emptyGroups.every(group => {
        return !containsCoord(group, [i, j]);
      })) {
        let emptyGroup = [];
        extendGroupForCoord(cell, emptyGroup, [i, j]);
        emptyGroups.push(emptyGroup);
      }
    }
  }

  return emptyGroups.filter(group => {
    return !group.some(coord => {
      return isAtEdge(coord);
    });
  });
}

function getAllFilledGroups() {
  let filledGroups = [];

  for (let i = 0; i < LOOP_COLS; i++) {
    for (let j = 0; j < LOOP_ROWS; j++) {
      let cell = loopGrid[i][j];

      if (cell && filledGroups.every(group => {
        return !containsCoord(group, [i, j]);
      })) {
        let filledGroup = [];
        extendGroupForCoord(cell, filledGroup, [i, j]);
        filledGroups.push(filledGroup);
      }
    }
  }

  return filledGroups;
}

function extendGroupForCoord(value, group, coord) {
  let i = coord[0];
  let j = coord[1];
  let cell = loopGrid[i][j];

  if (cell === value && !containsCoord(group, coord)) {
    group.push(coord);

    let neighbors = getNeighborCoords(coord);

    neighbors.forEach(neighbor => {
      extendGroupForCoord(value, group, neighbor);
    });
  }
}

function getNeighborCoords(coord) {
  let i = coord[0];
  let j = coord[1];
  let neighbors = [];

  if (i > 0) {
    neighbors.push([i - 1, j]);
  }

  if (i < LOOP_COLS - 1) {
    neighbors.push([i + 1, j]);
  }

  if (j > 0) {
    neighbors.push([i, j - 1]);
  }

  if (j < LOOP_ROWS - 1) {
    neighbors.push([i, j + 1]);
  }

  return neighbors;
}

// In other words, farthest coord from both vertical and horizontal edges
function getClosestCoordToCenter(array) {
  let closestCoords;
  let minDistance = -1;

  array.forEach(coord => {
    let upDistance = coord[1];
    let downDistance = LOOP_ROWS - 1 - coord[1];
    let leftDistance = coord[0];
    let rightDistance = LOOP_COLS - 1 - coord[0];
    let distance = Math.min(upDistance, downDistance) + Math.min(leftDistance, rightDistance);

    if (distance > minDistance) {
      closestCoords = [];
      minDistance = distance;
    }

    if (distance === minDistance) {
      closestCoords.push(coord);
    }
  });

  return randomEl(closestCoords);
}

function getClosestCoordToEdge(array) {
  let closestCoords;
  let minDistance = LOOP_COLS * LOOP_ROWS;

  array.forEach(coord => {
    let upDistance = coord[1];
    let downDistance = LOOP_ROWS - 1 - coord[1];
    let leftDistance = coord[0];
    let rightDistance = LOOP_COLS - 1 - coord[0];
    let distance = Math.min(upDistance, downDistance, leftDistance, rightDistance);

    if (distance < minDistance) {
      closestCoords = [];
      minDistance = distance;
    }

    if (distance === minDistance) {
      closestCoords.push(coord);
    }
  });

  return randomEl(closestCoords);
}

function isAtEdge(coord) {
  return coord[0] === 0 || coord[0] === LOOP_COLS - 1
      || coord[1] === 0 || coord[1] === LOOP_ROWS - 1;
}

function isGridCoordMarked(gridCoord) {
  let loopCoords = getLoopCoords(gridCoord);
  let filledCells = loopCoords.filter(loopCoord => {
    return loopGrid[loopCoord[0]][loopCoord[1]];
  });

  if (filledCells.length == 2) {
    let neighbors = getGridPathNeighborCoords(gridCoord);
    return neighbors.some(neighbor => isCorner(neighbor));
  }

  return false;
}

function isCorner(gridCoord) {
  let loopCoords = getLoopCoords(gridCoord);
  let filledCells = loopCoords.filter(loopCoord => {
    return loopGrid[loopCoord[0]][loopCoord[1]];
  });
  let emptyCells = loopCoords.filter(loopCoord => {
    return !loopGrid[loopCoord[0]][loopCoord[1]];
  });

  return filledCells.length === 1 || emptyCells.length === 1;
}

function getLoopCoords(gridCoord) {
  let i = gridCoord[0];
  let j = gridCoord[1];
  let loopCoords = [];

  if (i > 0) {
    if (j > 0) {
      loopCoords.push([i - 1, j - 1]);
    }

    if (j < ROWS - 1) {
      loopCoords.push([i - 1, j]);
    }
  }

  if (i < COLS - 1) {
    if (j > 0) {
      loopCoords.push([i, j - 1]);
    }

    if (j < ROWS - 1) {
      loopCoords.push([i, j]);
    }
  }

  return loopCoords;
}

function getGridPathNeighborCoords(gridCoord) {
  let i = gridCoord[0];
  let j = gridCoord[1];
  let neighbors = [];

  if (i > 0) {
    neighbors.push([i - 1, j]);
  }

  if (i < COLS - 1) {
    neighbors.push([i + 1, j]);
  }

  if (j > 0) {
    neighbors.push([i, j - 1]);
  }

  if (j < ROWS - 1) {
    neighbors.push([i, j + 1]);
  }

  let loopCoords = getLoopCoords(gridCoord);

  neighbors = neighbors.filter(neighbor => {
    let neighborLoopCoords = getLoopCoords(neighbor);
    let sharedLoopCoords = loopCoords.filter(loopCoord => {
      return containsCoord(neighborLoopCoords, loopCoord);
    });
    let filledCells = sharedLoopCoords.filter(loopCoord => {
      return loopGrid[loopCoord[0]][loopCoord[1]];
    });

    if (sharedLoopCoords.length < 1 || sharedLoopCoords.length > 2) {
      console.error("Grid neighbors do not share 1 or 2 loop coordinates:",
          gridCoord, neighbor, sharedLoopCoords);
    }

    return filledCells.length && (sharedLoopCoords.length === 1
        || loopGrid[sharedLoopCoords[0][0]][sharedLoopCoords[0][1]]
        !== loopGrid[sharedLoopCoords[1][0]][sharedLoopCoords[1][1]]);
  });

  return neighbors;
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  DIFFICULTY = window.app.router.difficulty;

  ROWS = 5 + DIFFICULTY * 2;
  COLS = 5 + DIFFICULTY * 2;
  LOOP_ROWS = ROWS - 1;
  LOOP_COLS = COLS - 1;

  CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
  NODE_SIZE = CELL_SIZE / 4;

  draggingValue = null;
  dragging = false;
  draggingTile = null;
  previousTouch = null;
  queuedSounds = [];

  generateGrid();

  drawInstructions();

  finishedLoading();
}

export function drawInstructions() {
  drawInstructionsHelper("💍\uFE0E Marked Loop Puzzle 💍\uFE0E",
      //["Draw a loop with the given length.  Markers indicate",
      //    "the locations of all straight segments before/after a turn."],
      ["Draw a loop of the given length, where the markers",
          "coincide with all straight segments before/after a turn."],
      ["Drag over the cells to draw/erase loop path segments."]);
}

function areAllPathsLoops(gridToDraw) {
  return !gridToDraw.flat().some(tile => {
      return tile.neighborPaths.length !== 0
          && tile.neighborPaths.length !== 2
  });
}

function getAllLoops(gridToDraw) {
  let paths = [];
  let loops = [];

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = gridToDraw[i][j];

      if (!tile.neighborPaths.length) {
        continue;
      }

      let tilePath;

      for (let k = 0; k < paths.length; k++) {
        let path = paths[k];

        if (containsCoord(path, tile.coord)) {
          tilePath = path;
          break;
        }
      }

      if (tilePath) {
        continue;
      } else {
        tilePath = [tile.coord];
        paths.push(tilePath);
      }

      let pathEnded = false;
      let prevTile = null;

      while (!pathEnded) {
        let neighborCoords;

        if (prevTile) {
          neighborCoords = tile.neighborPaths.filter(coord => {
            return coord[0] !== prevTile.coord[0]
                || coord[1] !== prevTile.coord[1];
          });
        } else {
          neighborCoords = tile.neighborPaths;
        }

        if (!neighborCoords.length) {
          pathEnded = true;
        } else {
          let neighborCoord = neighborCoords[0];
          prevTile = tile;
          tile = gridToDraw[neighborCoord[0]][neighborCoord[1]];

          if (!containsCoord(tilePath, tile.coord)) {
            tilePath.push(tile.coord);
          } else {
            pathEnded = true;
            loops.push(tilePath);
          }
        }
      }
    }
  }

  return loops;
}

function getBiggestLoop(loops) {
  return loops.reduce((loop, biggest) => {
    return loop.length > biggest.length ? loop : biggest;
  }, []);
}

function isPathCorner(gridCoord, gridToDraw) {
  let tile = gridToDraw[gridCoord[0]][gridCoord[1]];

  if (tile.neighborPaths.length == 2) {
    let path1 = tile.neighborPaths[0];
    let path2 = tile.neighborPaths[1];

    return path1[0] !== path2[0] && path1[1] !== path2[1];
  }

  return false;
}

function isStraightPathSegment(gridCoord, gridToDraw) {
  let tile = gridToDraw[gridCoord[0]][gridCoord[1]];

  if (tile.neighborPaths.length == 2) {
    let path1 = tile.neighborPaths[0];
    let path2 = tile.neighborPaths[1];

    return path1[0] === path2[0] || path1[1] === path2[1];
  }

  return false;
}

function doesMarkerBelong(gridCoord, gridToDraw) {
  if (isStraightPathSegment(gridCoord, gridToDraw)) {
    let tile = gridToDraw[gridCoord[0]][gridCoord[1]];

    return tile.neighborPaths.some(neighbor => {
      return isPathCorner(neighbor, gridToDraw)
    });
  }

  return false;
}

function doesPathMatchMarkers(gridToDraw) {
  return gridToDraw.flat().every(tile => {
    return doesMarkerBelong(tile.coord, gridToDraw) === tile.marked;
  });
}

export function drawPuzzle() {
  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let gridToDraw = window.app.puzzleState.showingSolution ? solution : grid;
  let pathLength = getPathLength(gridToDraw);
  let allPathsLoops = areAllPathsLoops(gridToDraw);
  let loops = getAllLoops(gridToDraw);
  let biggestLoop = getBiggestLoop(loops);
  let pathMatchesMarkers = doesPathMatchMarkers(gridToDraw);
  let solved = pathLength === solutionLength
      && allPathsLoops
      && loops.length === 1
      && pathMatchesMarkers;

  // Draws generated loop
  /*for (let i = 0; i < LOOP_COLS; i++) {
    for (let j = 0; j < LOOP_ROWS; j++) {
      let cell = loopGrid[i][j];
      let coord = getDrawCoord([i, j]);

      context.fillStyle = cell ? "#808080" : "#ffffff";
      context.fillRect(coord[0] + CELL_SIZE / 2 + TILE_BORDER,
          coord[1] + CELL_SIZE / 2 + TILE_BORDER,
          CELL_SIZE - 2 * TILE_BORDER,
          CELL_SIZE - 2 * TILE_BORDER);
    }
  }*/

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = gridToDraw[i][j];
      let coord = getDrawCoord(tile.coord);
      let centerCoord = getDrawCoord(tile.coord, true);

      context.beginPath();
      context.lineWidth = TILE_BORDER;
      context.fillStyle = "#ffffff";
      context.strokeStyle = "#000000";
      context.rect(coord[0], coord[1],
          CELL_SIZE, CELL_SIZE);
      context.fill();
      context.stroke();
    }
  }

  context.strokeStyle = solved ? SUCCESS_COLOR : "#808080";
  context.lineCap = "square"
  context.lineWidth = LINE_THICKNESS;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = gridToDraw[i][j];

      if (tile.neighborPaths.length) {
        let centerCoord = getDrawCoord(tile.coord, true);

        context.beginPath();

        tile.neighborPaths.forEach(neighbor => {
          context.moveTo(...centerCoord);
          context.lineTo(...getDrawCoord(neighbor, true));
        });

        context.stroke();
      }
    }
  }

  if (!allPathsLoops || loops.length > 1) {
    context.strokeStyle = ALERT_COLOR;

    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        let tile = gridToDraw[i][j];

        if (tile.neighborPaths.length > 2
            || (loops.length > 0
                && !containsCoord(biggestLoop, tile.coord))) {
          let centerCoord = getDrawCoord(tile.coord, true);

          context.beginPath();

          tile.neighborPaths.forEach(neighbor => {
            context.moveTo(...centerCoord);
            context.lineTo(...getDrawCoord(neighbor, true));
          });

          context.stroke();
        }
      }
    }
  }

  context.lineWidth = NODE_LINE_THICKNESS;

  for (let i = 0; i < COLS; i++) {
    for (let j = 0; j < ROWS; j++) {
      let tile = gridToDraw[i][j];

      let markerMatchesPath =
          doesMarkerBelong(tile.coord, gridToDraw) === tile.marked

      if (tile.marked ||
          (allPathsLoops && loops.length === 1 && !markerMatchesPath)) {
        let centerCoord = getDrawCoord(tile.coord, true);
        context.fillStyle = tile.marked ? "#000000" : ALERT_COLOR;
        context.strokeStyle = solved ? SUCCESS_COLOR
            : (!allPathsLoops || loops.length !== 1 || markerMatchesPath ?
                "#808080" : ALERT_COLOR);
        context.beginPath();
        context.arc(...centerCoord, NODE_SIZE, 0, 2 * Math.PI, false);
        context.fill();
        context.stroke();
      }
    }
  }

  context.font = "bold " + TEXT_SIZE + "px Arial"
  context.fillStyle = allPathsLoops && loops.length === 1
      && pathLength !== solutionLength ? ALERT_COLOR : "#ffffff";
  context.textAlign = "center";
  context.fillText("Path Length: " + pathLength + " / " + solutionLength, CANVAS_WIDTH / 2, (CANVAS_HEIGHT - OFFSET_SIZE / 2) + TEXT_SIZE / 3);

  if (!window.app.puzzleState.showingSolution) {
    if (solved && window.app.puzzleState.interactive) {
      window.app.puzzleState.interactive = false;
      window.app.puzzleState.ended = true;

      audioManager.play(CHIME_SOUND);
    } else {
      queuedSounds.forEach(sound => audioManager.play(sound));
    }

    queuedSounds = [];
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

function areGridCoordsAdjacent(coord1, coord2) {
  return Math.abs(coord1[0] - coord2[0]) === 1
      && Math.abs(coord1[1] - coord2[1]) === 0
      || Math.abs(coord1[0] - coord2[0]) === 0
      && Math.abs(coord1[1] - coord2[1]) === 1;
}

function pathInteraction(mouseX, mouseY) {
  let coord = convertToGridCoord(mouseX, mouseY);

  if (coord[0] >= 0 && coord[0] < COLS
      && coord[1] >= 0 && coord[1] < ROWS) {
    let tile = grid[coord[0]][coord[1]];

    if (draggingTile && draggingTile !== tile) {
      if (areGridCoordsAdjacent(tile.coord, draggingTile.coord)) {
        if (containsCoord(tile.neighborPaths, draggingTile.coord)) {
          if (draggingValue !== false) {
            draggingValue = true;
            removeCoord(tile.neighborPaths, draggingTile.coord);
            removeCoord(draggingTile.neighborPaths, tile.coord);

            queuedSounds.push(CLEAR_SOUND);
            drawPuzzle();
          }
        } else {
          if (draggingValue !== true) {
            draggingValue = false;
            tile.neighborPaths.push(draggingTile.coord);
            draggingTile.neighborPaths.push(tile.coord);

            queuedSounds.push(CLICK_SOUND);
            drawPuzzle();
          }
        }
      }
    }

    draggingTile = tile;
  }
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive) {
      dragging = true;

      let canvasRect = event.target.getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;
      let coord = convertToGridCoord(mouseX, mouseY);

      pathInteraction(mouseX, mouseY);
    }

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  if (window.app.puzzleState.interactive && event.changedTouches.length === 1) {
    dragging = true;

    let touch = event.changedTouches[0];
    previousTouch = touch;
    let canvasRect = event.target.getBoundingClientRect();
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    pathInteraction(touchX, touchY);
  }
}

export function onMouseMove(event) {
  if (window.app.puzzleState.interactive && dragging) {
    let canvasRect = event.target.getBoundingClientRect();
    let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
    let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;
    let coord = convertToGridCoord(mouseX, mouseY);

    pathInteraction(mouseX, mouseY);
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
      previousTouch = movedTouch;

      let canvasRect = event.target.getBoundingClientRect();
      let touchX = (movedTouch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
      let touchY = (movedTouch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

      pathInteraction(touchX, touchY);
    }
  }
}

export function onMouseUp(event) {
  // Left click
  if (event.button === 0) {
    dragging = false;
    draggingValue = null;
    draggingTile = null;

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
        dragging = false;
        draggingValue = null;
        draggingTile = null;
        return;
      }
    }
  }
}

export function onMouseOut(event) {
  dragging = false;
  draggingValue = null;
}
