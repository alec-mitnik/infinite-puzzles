import audioManager from "../js/audio-manager.js";
import {
  ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH,
  FONT_FAMILY, SUCCESS_COLOR
} from "../js/config.js";
import router from "../js/router.js";
import {
  containsCoord, deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading,
  getPuzzleCanvas, isDownDirKey, isLeftDirKey, isRestartKey, isRightDirKey,
  isUpDirKey, onMiddleMouseDown, onMiddleMouseUp, randomEl,
  removeCoord, sameCoord, updateForTutorialRecommendation, updateForTutorialState
} from "../js/utils.js";

const OFFSET_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 10;
const NODE_LINE_THICKNESS = 12;
const TEXT_SIZE = OFFSET_SIZE / 3;
const LINE_THICKNESS = 18;
const TILE_BORDER = 4;

const CLEAR_SOUND = audioManager.SoundEffects.WARP;
const CLICK_SOUND = audioManager.SoundEffects.CLICK;
const RESTART_SOUND = audioManager.SoundEffects.BOING;
const CHIME_SOUND = audioManager.SoundEffects.CHIME;

const tutorials = [
  {
    rows: 2,
    cols: 2,
    loopGrid: [
      [true],
    ],
  },
  {
    rows: 2,
    cols: 3,
    loopGrid: [
      [true],
      [false],
    ],
  },
  {
    rows: 3,
    cols: 3,
    loopGrid: [
      [true, true],
      [true, true],
    ],
  },
  {
    rows: 4,
    cols: 4,
    loopGrid: [
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ],
  },
  {
    rows: 4,
    cols: 4,
    loopGrid: [
      [true, true, true],
      [true, false, false],
      [true, true, true],
    ],
  },
  {
    rows: 4,
    cols: 4,
    loopGrid: [
      [true, true, true],
      [true, true, false],
      [true, true, true],
    ],
  },
  {
    rows: 4,
    cols: 4,
    loopGrid: [
      [true, true, false],
      [true, true, true],
      [false, true, true],
    ],
  },
  {
    rows: 4,
    cols: 4,
    loopGrid: [
      [true, false, false],
      [true, true, false],
      [true, false, false],
    ],
  },
  {
    rows: 4,
    cols: 4,
    loopGrid: [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ],
  },
  {
    rows: 5,
    cols: 5,
    loopGrid: [
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
      [true, true, true, true],
    ],
  },
  {
    rows: 5,
    cols: 5,
    loopGrid: [
      [true, true, true, true],
      [true, false, false, false],
      [true, false, false, false],
      [true, true, true, true],
    ],
  },
];

let DIFFICULTY;
let ROWS;
let COLS;
let LOOP_ROWS;
let LOOP_COLS;

let CELL_SIZE;
let NODE_SIZE;

let cursorCoord;
let isCursorApplying = false;
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
          () => router.sRand() < 0.5 ? true : false));

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

    // In case the smallest filled group ends up somehow surrounding the center,
    // need to make sure to only consider coordinates at the edge of the group
    // when finding the one closest to the center to grow from
    let smallestFilledGroup = randomEl(smallestFilledGroups);
    let edgesOfGroup = getEdgesOfGroup(smallestFilledGroup);
    let coord = getClosestCoordToCenter(edgesOfGroup);

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
    if (router.sRand() < allEligible2x3Groups.length
        / (allEligible2x3Groups.length + allEligible3x2Groups.length)) {
      let group = randomEl(allEligible2x3Groups);
      let i = group[0][0];
      let j = group[0][1];
      let cell = loopGrid[i][j];

      let leftEdge = (cell && i === 0) || (i > 0 && loopGrid[i - 1][j + 1] !== cell);
      let rightEdge = (cell && i + 1 === LOOP_COLS - 1)
          || (i + 1 < LOOP_COLS - 1 && loopGrid[i + 2][j + 1] !== cell);

      if (leftEdge && (!rightEdge || router.sRand() < 0.5)) {
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

      let topEdge = (cell && j === 0) || (j > 0 && loopGrid[i + 1][j - 1] !== cell);
      let bottomEdge = (cell && j + 1 === LOOP_ROWS - 1)
          || (j + 1 < LOOP_ROWS - 1 && loopGrid[i + 1][j + 2] !== cell);

      if (topEdge && (!bottomEdge || router.sRand() < 0.5)) {
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

  grid = Array.from({length: COLS}, (_el, x) => Array.from({length: ROWS}, (_el, y) => {
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
  let solutionValid = allPathsLoops && loops.length === 1 && pathMatchesMarkers;

  if (!solutionValid) {
    console.error("Will regenerate due to invalid solution:", solution, "\nall paths loops:",
        allPathsLoops, "\nloops length:", loops.length, "\npath matches markers:", pathMatchesMarkers);
    generateGrid();
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

// Get cells of a group that neighbor a cell of the opposite value
function getEdgesOfGroup(group) {
  let edges = [];

  group.forEach(coord => {
    let neighbors = getNeighborCoords(coord);

    if (neighbors.some(neighbor => loopGrid[neighbor[0]][neighbor[1]] !== loopGrid[coord[0]][coord[1]])) {
      edges.push(coord);
    }
  });

  return edges;
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
  if (router.puzzleState.tutorialStage > tutorials.length) {
    router.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  DIFFICULTY = router.difficulty;

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

  if (router.puzzleState.tutorialStage) {
    const tutorial = tutorials[router.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;
    LOOP_ROWS = ROWS - 1;
    LOOP_COLS = COLS - 1;

    CELL_SIZE = (Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) - 2 * OFFSET_SIZE) / Math.max(ROWS, COLS);
    NODE_SIZE = CELL_SIZE / 4;

    loopGrid = tutorial.loopGrid;

    grid = Array.from({length: COLS}, (_el, x) => Array.from({length: ROWS}, (_el, y) => {
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
    let solutionValid = allPathsLoops && loops.length === 1 && pathMatchesMarkers;

    if (!solutionValid) {
      console.error("Tutorial resulted in invalid solution:", solution, "\nall paths loops:",
        allPathsLoops, "\nloops length:", loops.length, "\npath matches markers:", pathMatchesMarkers);
      return;
    }
  } else {
    generateGrid();
  }

  cursorCoord = [0, 0];

  updateForTutorialState();

  drawInstructions();

  finishedLoading();
}

export function drawInstructions() {
  drawInstructionsHelper("Marked Loop Puzzle", "💍\uFE0E",
      //["Draw a loop with the given length.  Markers indicate",
      //    "the locations of all straight segments before/after a turn."],
      ["Draw a loop of the given length, where the markers",
          "coincide with all straight segments before/after a turn."],
      ["Drag over the cells to draw/erase loop path segments."],
      router.puzzleState.tutorialStage, tutorials.length);
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
      return isPathCorner(neighbor, gridToDraw);
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
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  let gridToDraw = router.puzzleState.showingSolution ? solution : grid;
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

      context.beginPath();
      context.lineWidth = TILE_BORDER;
      context.fillStyle = "#ffffff";
      context.strokeStyle = "#000000";
      context.rect(coord[0], coord[1],
          CELL_SIZE, CELL_SIZE);
      context.fill();
      context.stroke();

      if (!solved && router.puzzleState.usingKeyboard && sameCoord([i, j], cursorCoord)) {
        if (isCursorApplying) {
          context.fillStyle = ALERT_COLOR;
        } else {
          context.fillStyle = `${ALERT_COLOR}80`;
        }

        context.fillRect(coord[0], coord[1], CELL_SIZE, CELL_SIZE);
        context.stroke();
      }
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
      const tile = gridToDraw[i][j];

      const markerMatchesPath =
          doesMarkerBelong(tile.coord, gridToDraw) === tile.marked
      const markerOnCorner = tile.marked && isPathCorner([i, j], gridToDraw);

      if (tile.marked || !markerMatchesPath) {
        let centerCoord = getDrawCoord(tile.coord, true);
        context.fillStyle = tile.marked ? "#000000" : ALERT_COLOR;
        context.strokeStyle = solved ? SUCCESS_COLOR
            : (!markerOnCorner && (((!allPathsLoops || loops.length !== 1) && tile.marked) || markerMatchesPath) ?
                "#808080" : ALERT_COLOR);
        context.lineCap = "round";
        context.beginPath();
        context.arc(...centerCoord, NODE_SIZE, 0, 2 * Math.PI, false);
        context.fill();
        context.stroke();
        context.lineCap = "square";
      }
    }
  }

  context.font = "bold " + TEXT_SIZE + `px ${FONT_FAMILY}`;
  context.fillStyle = allPathsLoops && loops.length === 1
      && pathLength !== solutionLength ? ALERT_COLOR : "#ffffff";
  context.textAlign = "center";
  context.fillText("Path Length: " + pathLength + " / " + solutionLength, CANVAS_WIDTH / 2, (CANVAS_HEIGHT - OFFSET_SIZE / 2) + TEXT_SIZE / 3);

  if (!solved && !atOriginalState()) {
    // Restart
    context.textAlign = "right";
    context.fillStyle = "#ffffff";
    context.fillText("Reset", COLS * CELL_SIZE + OFFSET_SIZE, OFFSET_SIZE / 2 + TEXT_SIZE / 3);

    context.lineWidth = 6;
    context.strokeStyle = "#ffffff";
    context.beginPath();
    context.arc(OFFSET_SIZE * 1.5 + COLS * CELL_SIZE, OFFSET_SIZE / 2,
        OFFSET_SIZE / 4, Math.PI, 3 / 2 * Math.PI, true);
    context.lineTo(OFFSET_SIZE * 1.55 + COLS * CELL_SIZE, OFFSET_SIZE * 0.35);
    context.lineTo(OFFSET_SIZE * 1.6 + COLS * CELL_SIZE, OFFSET_SIZE * 0.2);
    context.lineTo(OFFSET_SIZE * 1.48 + COLS * CELL_SIZE, OFFSET_SIZE / 4);
    context.lineTo(OFFSET_SIZE * 1.525 + COLS * CELL_SIZE, OFFSET_SIZE * 0.3);
    context.stroke();
  }

  if (!router.puzzleState.showingSolution) {
    if (solved && router.puzzleState.interactive) {
      endPuzzle(router.puzzleState.tutorialStage === tutorials.length);
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

  if (x < 0) {
    console.error("X coord out of bounds:", x);
    x = 0;
  } else if (x >= COLS) {
    console.error("X coord out of bounds:", x);
    x = COLS - 1;
  }

  if (y < 0) {
    console.error("Y coord out of bounds:", y);
    y = 0;
  } else if (y >= ROWS) {
    console.error("Y coord out of bounds:", y);
    y = ROWS - 1;
  }

  let drawX = OFFSET_SIZE + x * CELL_SIZE + addition;
  let drawY = OFFSET_SIZE + y * CELL_SIZE + addition;

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

function pathInteractionForScreen(mouseX, mouseY) {
  let coord = convertToGridCoord(mouseX, mouseY);
  pathInteraction(coord);
}

function pathInteraction(coord) {
  if (coord[0] >= 0 && coord[0] < COLS
      && coord[1] >= 0 && coord[1] < ROWS) {
    cursorCoord = coord;
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
          } else if (router.puzzleState.usingKeyboard && isCursorApplying) {
            drawPuzzle();
          }
        } else {
          if (draggingValue !== true) {
            draggingValue = false;
            tile.neighborPaths.push(draggingTile.coord);
            draggingTile.neighborPaths.push(tile.coord);

            queuedSounds.push(CLICK_SOUND);
            drawPuzzle();
          } else if (router.puzzleState.usingKeyboard && isCursorApplying) {
            drawPuzzle();
          }
        }
      }
    }

    draggingTile = tile;
  }
}

function atOriginalState() {
  return grid.every(row => row.every(tile => tile.neighborPaths.length === 0));
}

function restart() {
  if (!atOriginalState()) {
    grid.forEach(row => row.forEach(tile => tile.neighborPaths = []));
    previousTouch = null;
    draggingTile = null;
    draggingValue = null;
    dragging = false;
    audioManager.play(RESTART_SOUND);
    drawPuzzle();
  }
}

export function onKeyUp(event) {
  const newApplyingState = event.ctrlKey || event.metaKey;
  const applyingStateChanged = newApplyingState !== isCursorApplying;
  isCursorApplying = newApplyingState;

  if (applyingStateChanged) {
    if (!isCursorApplying) {
      previousTouch = null;
      draggingTile = null;
      draggingValue = null;
      dragging = false;
    }

    if (router.puzzleState.interactive) {
      drawPuzzle();
    }
  }
}

export function onKeyDown(event) {
  const newApplyingState = event.ctrlKey || event.metaKey;
  const applyingStateChanged = newApplyingState !== isCursorApplying;
  isCursorApplying = newApplyingState;

  if (applyingStateChanged) {
    if (isCursorApplying) {
      dragging = true;
      draggingTile = grid[cursorCoord[0]][cursorCoord[1]];
      draggingValue = null;
    }
  }

  if (router.puzzleState.interactive) {
    // Restart
    if (isRestartKey(event)) {
      restart();
      return;
    }

    // Move Cursor
    if (!event.altKey && !event.shiftKey) {
      if (isLeftDirKey(event)) {
        cursorCoord = [cursorCoord[0] <= 0 ? COLS - 1 : cursorCoord[0] - 1, cursorCoord[1]];

        if (isCursorApplying) {
          pathInteraction(cursorCoord);
        } else {
          drawPuzzle();
        }

        return;
      } else if (isRightDirKey(event)) {
        cursorCoord = [cursorCoord[0] >= COLS - 1 ? 0 : cursorCoord[0] + 1, cursorCoord[1]];

        if (isCursorApplying) {
          pathInteraction(cursorCoord);
        } else {
          drawPuzzle();
        }

        return;
      } else if (isUpDirKey(event)) {
        cursorCoord = [cursorCoord[0], cursorCoord[1] <= 0 ? ROWS - 1 : cursorCoord[1] - 1];

        if (isCursorApplying) {
          pathInteraction(cursorCoord);
        } else {
          drawPuzzle();
        }

        return;
      } else if (isDownDirKey(event)) {
        cursorCoord = [cursorCoord[0], cursorCoord[1] >= ROWS - 1 ? 0 : cursorCoord[1] + 1];

        if (isCursorApplying) {
          pathInteraction(cursorCoord);
        } else {
          drawPuzzle();
        }

        return;
      }
    }
  }

  if (applyingStateChanged) {
    drawPuzzle();
  }
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (router.puzzleState.interactive) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      if (mouseX >= COLS * CELL_SIZE && mouseY <= OFFSET_SIZE * 0.9) {
        restart();
        return;
      }

      dragging = true;
      pathInteractionForScreen(mouseX, mouseY);
    }

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  if (router.puzzleState.interactive && event.changedTouches.length === 1) {
    let canvasRect = getPuzzleCanvas().getBoundingClientRect();
    let touch = event.changedTouches[0];
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    if (touchX >= COLS * CELL_SIZE && touchY <= OFFSET_SIZE * 0.9) {
      restart();
      return;
    }

    previousTouch = touch;
    dragging = true;
    pathInteractionForScreen(touchX, touchY);
  }
}

export function onMouseMove(event) {
  if (router.puzzleState.interactive && dragging) {
    let canvasRect = getPuzzleCanvas().getBoundingClientRect();
    let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
    let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

    pathInteractionForScreen(mouseX, mouseY);
  }
}

export function onTouchMove(event) {
  if (router.puzzleState.interactive && dragging && previousTouch) {
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

      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let touchX = (movedTouch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
      let touchY = (movedTouch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

      pathInteractionForScreen(touchX, touchY);
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
  if (router.puzzleState.interactive && dragging && previousTouch) {
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

export function onMouseOut() {
  dragging = false;
  draggingValue = null;
}
