import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialState } from "../js/utils.js";

const NODE_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 7;
const LINE_THICKNESS = 12;

let DIFFICULTY;
let GRAPH_SIZE;
let FIXED_NODES;

const CLINK_SOUND = 'clink';
const CHIME_SOUND = 'chime';

let solution;
let dragging = null;
let previousTouch = null;
let nodes = [];
let queuedSounds = [];

function generateGraph() {
  let graph = [{
    id: 0,
    fixed: false,
    x: setXtoGridCoordinates(1),
    y: setYtoGridCoordinates(1),
    neighbors: []
  },{
    id: 1,
    fixed: false,
    x: setXtoGridCoordinates(GRAPH_SIZE - 1),
    y: setYtoGridCoordinates(1),
    neighbors: []
  },{
    id: 2,
    fixed: false,
    x: setXtoGridCoordinates(GRAPH_SIZE - 1),
    y: setYtoGridCoordinates(GRAPH_SIZE - 1),
    neighbors: []
  },{
    id: 3,
    fixed: false,
    x: setXtoGridCoordinates(1),
    y: setYtoGridCoordinates(GRAPH_SIZE - 1),
    neighbors: []
  }];
  let nodeMap = [[1, 3], [0, 2, 3], [1, 3], [0, 1, 2]];
  let cycles = [[0, 1, 3],[1, 2, 3]];

  let i;
  for (i = 4; i < GRAPH_SIZE * 2 / 3; i++) {
    if (Math.random() < 0.75) {
      // Split an edge and connect to the opposite node
      // for all cycles containing that edge
      let randomCycle = cycles[randomIndex(cycles)];

      let randomCycleNodeIndex = randomIndex(randomCycle);
      let nodeId = randomCycle[randomCycleNodeIndex];
      let node = nodeMap[nodeId];
      let randomCycleNeighborIndex = (randomCycleNodeIndex + (Math.random() < 0.5 ? 1 : 2)) % randomCycle.length;
      let neighborId = randomCycle[randomCycleNeighborIndex];
      let neighbor = nodeMap[neighborId];

      let neighborIndex = node.indexOf(neighborId);
      let nodeIndex = neighbor.indexOf(nodeId);

      node.splice(neighborIndex, 1, i);
      neighbor.splice(nodeIndex, 1, i);

      let oppositeIds = [];

      [...cycles].forEach(cycle => {
        let nodeCycleIndex = cycle.indexOf(nodeId);
        let neighborCycleIndex = cycle.indexOf(neighborId);

        let wrappedNeighbors = nodeCycleIndex === 0 && neighborCycleIndex === cycle.length - 1
            || nodeCycleIndex === cycle.length - 1 && neighborCycleIndex === 0;

        if (nodeCycleIndex > -1 && neighborCycleIndex > -1
            && (Math.abs(nodeCycleIndex - neighborCycleIndex) === 1 || wrappedNeighbors)) {
          cycle.splice(wrappedNeighbors ? 0 : Math.max(nodeCycleIndex, neighborCycleIndex), 0, i);

          let oppositeId = cycle.filter(id => {
            return id !== nodeId && id !== neighborId && id !== i;
          })[0];
          oppositeIds.push(oppositeId);

          let opposite = nodeMap[oppositeId];
          opposite.push(i);

          nodeCycleIndex = cycle.indexOf(nodeId);
          neighborCycleIndex = cycle.indexOf(neighborId);
          let oppositeCycleIndex = cycle.indexOf(oppositeId);
          let newNodeCycleIndex = cycle.indexOf(i);

          if (newNodeCycleIndex < oppositeCycleIndex) {
            cycles.push([i, ...cycle.splice(newNodeCycleIndex + 1, oppositeCycleIndex - newNodeCycleIndex - 1), oppositeId]);
          } else {
            cycles.push([oppositeId, ...cycle.splice(oppositeCycleIndex + 1, newNodeCycleIndex - oppositeCycleIndex - 1), i]);
          }
        }
      });

      nodeMap.push([nodeId, neighborId, ...oppositeIds]);
      graph.push({
        id: i,
        fixed: false,
        x: (graph[nodeId].x + graph[neighborId].x) / 2,
        y: (graph[nodeId].y + graph[neighborId].y) / 2,
        neighbors: []
      });
    } else {
      // Connect all the nodes of a cycle to a new node at its midpoint,
      // splitting the cycle into three

      // If there wouldn't be any more regular cycle splitting after,
      // take the opportunity to convert the center node into a center cycle
      let centerCycle = i + 2 >= GRAPH_SIZE * 2 / 3;

      let randomCycle = cycles.splice(randomIndex(cycles), 1)[0];

      let totalX = randomCycle.reduce((total, id) => {
        return total + graph[id].x;
      }, 0);
      let totalY = randomCycle.reduce((total, id) => {
        return total + graph[id].y;
      }, 0);
      let midPointX = totalX / randomCycle.length;
      let midPointY = totalY / randomCycle.length;

      if (!centerCycle) {
        randomCycle.forEach(nodeId => {
          let node = nodeMap[nodeId];
          node.push(i);
          cycles.push([i, ...randomCycle.filter(id => id !== nodeId)]);
        });

        nodeMap.push([...randomCycle]);

        graph.push({
          id: i,
          fixed: false,
          x: midPointX,
          y: midPointY,
          neighbors: []
        });
      } else {
        i--;
        let cycleNodeIds = [i+1, i+2, i+3];
        cycles.push(cycleNodeIds);

        randomCycle.forEach(nodeId => {
          i++;

          nodeMap.push([nodeId, ...cycleNodeIds.filter(id => id !== i)]);

          graph.push({
            id: i,
            fixed: false,
            x: (midPointX + graph[nodeId].x) / 2,
            y: (midPointY + graph[nodeId].y) / 2,
            neighbors: []
          });

          let node = nodeMap[nodeId];
          node.push(i);
        });
      }
    }
  }

  let stragglers = Math.floor(Math.random() * (GRAPH_SIZE - i)) + i;

  for (i; i < stragglers; i++) {
    // Add a straggling node to a cycle's midpoint.
    // Remove the cycle from the list so that it can't be chosen again.
    let randomCycle = cycles.splice(randomIndex(cycles), 1)[0];

    let nodeId = randomCycle[randomIndex(randomCycle)];
    let node = nodeMap[nodeId];

    node.push(i);
    nodeMap.push([nodeId]);

    let totalX = randomCycle.reduce((total, id) => {
      return total + graph[id].x;
    }, 0);
    let totalY = randomCycle.reduce((total, id) => {
      return total + graph[id].y;
    }, 0);

    graph.push({
      id: i,
      fixed: false,
      x: totalX / randomCycle.length,
      y: totalY / randomCycle.length,
      neighbors: []
    });
  }

  for (i; i < GRAPH_SIZE; i++) {
    // Split an edge
    let nodeId = randomIndex(nodeMap);
    let node = nodeMap[nodeId];
    let neighborIndex = randomIndex(node);

    let neighborId = node[neighborIndex];
    let neighbor = nodeMap[neighborId];
    let nodeIndex = neighbor.indexOf(nodeId);

    node.splice(neighborIndex, 1, i);
    neighbor.splice(nodeIndex, 1, i);

    nodeMap.push([nodeId, neighborId]);
    graph.push({
      id: i,
      fixed: false,
      x: (graph[nodeId].x + graph[neighborId].x) / 2,
      y: (graph[nodeId].y + graph[neighborId].y) / 2,
      neighbors: []
    });
  }

  let fixedIndices = [];

  for (let j = 0; j < FIXED_NODES; j++) {
    let remainingNodes = graph.filter(node => {
      return !fixedIndices.includes(node.id);
    });

    let newFixedIndex = remainingNodes[randomIndex(remainingNodes)].id;
    fixedIndices.push(newFixedIndex);
    graph[newFixedIndex].fixed = true;
  }

  // Randomize IDs so that the solution won't always have the first 4 in the outer corners
  let ids = Array.from(Array(GRAPH_SIZE).keys());
  graph.forEach(node => {
    node.id = ids.splice(randomIndex(ids), 1)[0];
  });

  solution = deepCopy(graph);

  graph.forEach((node, j) => {
    nodeMap[j].forEach(neighborId => {
      node.neighbors.push(graph[neighborId]);
      solution[j].neighbors.push(solution[neighborId]);
    });
  });

  // Shuffle the data so the draw order doesn't hint at the solution
  while (graph.length > 0) {
    nodes.push(graph.splice(randomIndex(graph), 1)[0]);
  }
}

export function drawInstructions() {
  drawInstructionsHelper("🕸︎\uFE0E Tangled Graph Puzzle 🕸︎\uFE0E",
      ["Untangle the graph so that no lines intersect.",
          "White nodes are fixed in place."],
      ["Drag the nodes to move them."]);
}

function drawStage() {
  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawPuzzle() {
  drawStage();

  let canvas = document.getElementById("puzzleCanvas");
  let context = canvas.getContext("2d");

  let solved = !dragging;

  let nodesToDraw = window.app.puzzleState.showingSolution ? solution : nodes;

  nodesToDraw.forEach(node => {
    node.neighbors.forEach(neighbor => {
      let isOverlapping = pathIsOverlapping(node, neighbor, nodesToDraw);
      solved = solved && !isOverlapping;

      context.strokeStyle = isOverlapping ? ALERT_COLOR : "#808080";
      context.beginPath();
      context.lineWidth = LINE_THICKNESS;
      context.moveTo(node.x, node.y);
      context.lineTo(neighbor.x, neighbor.y);
      context.stroke();
    });
  });

  nodesToDraw.forEach(node => {
    context.beginPath();
    context.strokeStyle = "#808080";
    context.fillStyle = node.fixed? "#ffffff" : "#000000";
    context.arc(node.x, node.y, NODE_SIZE / 4, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();

    context.font = "bold " + (NODE_SIZE / 4) + "px Arial"
    context.textAlign = "center";
    context.fillStyle = "#808080";
    context.fillText(node.id + 1, node.x, node.y + NODE_SIZE / 12);
  });

  if (solved) {
    drawStage();

    nodesToDraw.forEach(node => {
      node.neighbors.forEach(neighbor => {
        context.strokeStyle = SUCCESS_COLOR;
        context.beginPath();
        context.lineWidth = LINE_THICKNESS;
        context.moveTo(node.x, node.y);
        context.lineTo(neighbor.x, neighbor.y);
        context.stroke();
      });
    });

    nodesToDraw.forEach(node => {
      context.beginPath();
      context.strokeStyle = SUCCESS_COLOR;
      context.fillStyle = node.fixed? "#ffffff" : "#000000";
      context.arc(node.x, node.y, NODE_SIZE / 4, 0, 2 * Math.PI, false);
      context.fill();
      context.stroke();

      context.font = "bold " + (NODE_SIZE / 4) + "px Arial"
      context.textAlign = "center";
      context.fillStyle = SUCCESS_COLOR;
      context.fillText(node.id + 1, node.x, node.y + NODE_SIZE / 12);
    });

    if (window.app.puzzleState.interactive) {
      endPuzzle();
      audioManager.play(CHIME_SOUND);
    }
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];
}

function pathIsOverlapping(nodeA, nodeB, nodesList) {
  return nodeA.id !== nodeB.id && nodeA !== dragging && nodeB !== dragging
      && nodesList.reduce((overlapping, node) => {
    return overlapping || (nodeA.id !== node.id && nodeB.id !== node.id
        && node.neighbors.reduce((intersects, neighbor) => {
      let overlapDiscovered = neighbor.id !== nodeA.id && neighbor.id !== nodeB.id
          && linesIntersect([nodeA.x,nodeA.y], [nodeB.x,nodeB.y], [node.x,node.y], [neighbor.x,neighbor.y]);

      if (overlapDiscovered) {
        overlapDiscovered = true; // something to break on
      }

      return intersects || overlapDiscovered;
    }, false));
  }, false);
}

// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect
function linesIntersect(p1, q1, p2, q2) {
  // Colinear lines weren't being calculated as such, so add this extra check first
  if (p1[0] < p2[0] && p1[0] < q2[0] && q1[0] < p2[0] && q1[0] < q2[0]
      || p1[0] > p2[0] && p1[0] > q2[0] && q1[0] > p2[0] && q1[0] > q2[0]
      || p1[1] < p2[1] && p1[1] < q2[1] && q1[1] < p2[1] && q1[1] < q2[1]
      || p1[1] > p2[1] && p1[1] > q2[1] && q1[1] > p2[1] && q1[1] > q2[1]) {
    return false;
  }

  // Find the four orientations needed for general and
  // special cases
  let o1 = orientation(p1, q1, p2);
  let o2 = orientation(p1, q1, q2);
  let o3 = orientation(p2, q2, p1);
  let o4 = orientation(p2, q2, q1);

  // General case
  if (o1 != o2 && o3 != o4) {
    return true;
  }

  // Special Cases
  // p1, q1 and p2 are colinear and p2 lies on segment p1q1
  if (o1 == 0 && onSegment(p1, p2, q1)) {
    return true;
  }

  // p1, q1 and q2 are colinear and q2 lies on segment p1q1
  if (o2 == 0 && onSegment(p1, q2, q1)) {
    return true;
  }

  // p2, q2 and p1 are colinear and p1 lies on segment p2q2
  if (o3 == 0 && onSegment(p2, p1, q2)) {
    return true;
  }

  // p2, q2 and q1 are colinear and q1 lies on segment p2q2
  if (o4 == 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  return false; // Doesn't fall in any of the above cases
}

// Given three colinear points p, q, r, the function checks if
// point q lies on line segment 'pr'
function onSegment(p, q, r) {
  return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0])
      && q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1]);
}

// To find orientation of ordered triplet (p, q, r).
// The function returns the following values
// 0 --> p, q and r are colinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function orientation(p, q, r) {
  // See https://www.geeksforgeeks.org/orientation-3-ordered-points/
  // for details of below formula.
  let val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);

  if (val == 0) return 0; // Colinear

  return (val > 0) ? 1 : 2; // Clockwise or counterclockwise
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

  // Quick: 12/1, Casual: 14/2, Challenging: 16/3, Intense: 18/3
  GRAPH_SIZE = 10 + 2 * DIFFICULTY;
  FIXED_NODES = Math.min(DIFFICULTY, 3);

  dragging = null;
  previousTouch = null;
  nodes = [];
  queuedSounds = [];

  generateGraph();

  let puzzleSolved = true;

  while (puzzleSolved) {
    nodes.forEach(node => {
      if (!node.fixed) {
        randomizeNodePosition(node);
      }
    });

    for (let i = 0; i < nodes.length && puzzleSolved; i++) {
      let node = nodes[i];

      for (let j = 0; j < node.neighbors.length && puzzleSolved; j++) {
        let neighbor = node.neighbors[j];
        let isOverlapping = pathIsOverlapping(node, neighbor, nodes);
        puzzleSolved = puzzleSolved && !isOverlapping;
      }
    }
  }

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

      // Reverse the order so nodes in front will be picked up first
      for (let i = nodes.length - 1; i >= 0; i--) {
        let node = nodes[i];

        if (!node.fixed && Math.sqrt(Math.pow(mouseX - node.x, 2)
            + Math.pow(mouseY - node.y, 2)) < NODE_SIZE / 3) {
          dragging = node;
          return;
        }
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
    let touch = event.changedTouches[0];
    let canvasRect = event.target.getBoundingClientRect();
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    // Reverse the order so nodes in front will be picked up first
    for (let i = nodes.length - 1; i >= 0; i--) {
      let node = nodes[i];

      if (!node.fixed && Math.sqrt(Math.pow(touchX - node.x, 2)
          + Math.pow(touchY - node.y, 2)) < NODE_SIZE / 2) {
        previousTouch = touch;
        dragging = node;
        return;
      }
    }
  }
}

export function onMouseMove(event) {
  if (window.app.puzzleState.interactive && dragging) {
    // Can happen if mouse down triggered from touch end...
    if (!isNaN(event.movementX) && !isNaN(event.movementY)) {
      let canvasRect = event.target.getBoundingClientRect();

      dragging.x += event.movementX / window.devicePixelRatio  * CANVAS_WIDTH / canvasRect.width;
      dragging.y += event.movementY / window.devicePixelRatio  * CANVAS_HEIGHT / canvasRect.height;

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
      let canvasRect = event.target.getBoundingClientRect();
      let movementX = movedTouch.clientX - previousTouch.clientX;
      let movementY = movedTouch.clientY - previousTouch.clientY;

      previousTouch = movedTouch;

      dragging.x += movementX * CANVAS_WIDTH / canvasRect.width;
      dragging.y += movementY * CANVAS_HEIGHT / canvasRect.height;

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

export function onMouseOut(event) {
  if (window.app.puzzleState.interactive && dragging) {
    releaseNode(dragging);
    dragging = null;

    drawPuzzle();
  }

  dragging = null;
}

function randomizeNodePosition(node) {
  node.x = Math.random() * (CANVAS_WIDTH - NODE_SIZE) + NODE_SIZE / 2;
  node.y = Math.random() * (CANVAS_HEIGHT - NODE_SIZE) + NODE_SIZE / 2;
}

function setXtoGridCoordinates(gridX) {
  let gridWidth = CANVAS_WIDTH - NODE_SIZE;
  return gridWidth *  gridX / GRAPH_SIZE + NODE_SIZE / 2;
}

function setYtoGridCoordinates(gridY) {
  let gridHeight = CANVAS_HEIGHT - NODE_SIZE;
  return gridHeight * gridY / GRAPH_SIZE + NODE_SIZE / 2;
}

function releaseNode(node, playSound = true) {
  node.x = Math.max(NODE_SIZE / 2, Math.min(CANVAS_WIDTH - NODE_SIZE / 2, node.x));
  node.y = Math.max(NODE_SIZE / 2, Math.min(CANVAS_HEIGHT - NODE_SIZE / 2, node.y));

  if (playSound) {
    queuedSounds.push(CLINK_SOUND);
  }

  previousTouch = null;
}
