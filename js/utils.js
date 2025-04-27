import { BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH } from "./config.js";

export function finishedLoading() {
  // Add delay so pending clicks don't end up succeeding
  setTimeout(() => {
    document.getElementById("startButton").disabled = false;
    window.app.puzzleState.showingInstructions = true;
    window.app.puzzleState.loaded = true;
    document.getElementById("canvasContainer").classList.remove("loading");
  })
}

export function startButtonClick() {
  if (window.app.puzzleState.loaded) {
    window.app.puzzleState.showingInstructions = false;

    window.app.currentPuzzle.drawPuzzle();

    document.getElementById('canvasContainer').classList.add('started');
    document.getElementById('instructionsButton').classList.remove('active');

    if (!window.app.puzzleState.ended) {
      window.app.puzzleState.interactive = true;
      window.app.puzzleState.started = true;
    }
  }
}

export function solutionToggle() {
  if (window.app.puzzleState.showingInstructions) {
    startButtonClick();
  }

  let solutionButton = document.getElementById("solutionButton");

  if (!window.app.puzzleState.showingSolution) {
    solutionButton.classList.add("active");
    window.app.puzzleState.showingSolution = true;
    window.app.puzzleState.interactive = false;

    window.app.currentPuzzle.drawPuzzle();
  } else {
    solutionButton.classList.remove("active");
    window.app.puzzleState.showingSolution = false;

    window.app.currentPuzzle.drawPuzzle();

    if (!window.app.puzzleState.ended) {
      window.app.puzzleState.interactive = true;
    }
  }
}

export function onMiddleMouseDown() {
  if (window.app.puzzleState.showingInstructions) {
    startButtonClick();
  }

  let solutionButton = document.getElementById("solutionButton");
  solutionButton.classList.add("active");
  window.app.puzzleState.showingSolution = true;
  window.app.puzzleState.interactive = false;

  window.app.currentPuzzle.drawPuzzle();
}

export function onMiddleMouseUp() {
  if (window.app.puzzleState.showingSolution) {
      let solutionButton = document.getElementById("solutionButton");
      solutionButton.classList.remove("active");
      window.app.puzzleState.showingSolution = false;

      window.app.currentPuzzle.drawPuzzle();

      if (!window.app.puzzleState.ended) {
        window.app.puzzleState.interactive = true;
      }
    }
}

export function drawInstructionsHelper(puzzleTitle, descriptionLines, controlLines, tutorialStage = 0, tutorialsTotal = 0) {
  if (!window.app.puzzleState.showingInstructions) {
    let instructionsButton = document.getElementById("instructionsButton");
    instructionsButton.classList.add("active");
    window.app.puzzleState.showingInstructions = true;

    let solutionButton = document.getElementById("solutionButton");
    solutionButton.classList.remove("active");
    window.app.puzzleState.showingSolution = false;

    document.getElementById('canvasContainer').classList.remove('started');
    window.app.puzzleState.interactive = false;

    let canvas = document.getElementById("puzzleCanvas");
    let context = canvas.getContext("2d");

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = "bold 60px Arial"
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText(puzzleTitle, CANVAS_WIDTH / 2, 150);

    context.font = "40px Arial";
    let yPos = 265;

    descriptionLines.forEach(line => {
      yPos += 60;
      context.fillText(line, CANVAS_WIDTH / 2, yPos);
    });

    yPos += 100;

    controlLines.forEach(line => {
      yPos += 60;
      context.fillText(line, CANVAS_WIDTH / 2, yPos);
    });

    yPos += 160;

    if (tutorialStage) {
      context.fillText(`Tutorial ${tutorialStage}/${tutorialsTotal}`, CANVAS_WIDTH / 2, yPos);
    } else {
      const selectText = "Select ";
      const atomText = "⚛\uFE0E";
      const tutorialText = " for an incremental tutorial.";

      context.font = "96px Arial";
      const atomTextWidth = context.measureText(atomText).width;

      context.font = "40px Arial";
      const selectTextWidth = context.measureText(selectText).width;
      const tutorialTextWidth = context.measureText(tutorialText).width;

      const totalWidth = selectTextWidth + atomTextWidth + tutorialTextWidth;

      context.fillText(selectText, CANVAS_WIDTH / 2 - totalWidth / 2 + selectTextWidth / 2, yPos);
      context.fillText(tutorialText, CANVAS_WIDTH / 2 + totalWidth / 2 - tutorialTextWidth / 2, yPos);

      context.font = "96px Arial";
      context.fillText(atomText, CANVAS_WIDTH / 2 - totalWidth / 2 + selectTextWidth + atomTextWidth / 2, yPos + 18);
    }

    context.font = "bold 50px Arial"
    context.fillStyle = "#F9B70F";
    context.fillText("Click or tap to " + (window.app.puzzleState.started ? "resume!" : "start!"), CANVAS_WIDTH / 2, 880);
  } else {
    startButtonClick();
  }
}

export function updateForTutorialState() {
  if (window.app.puzzleState.tutorialStage) {
    document.getElementById('tutorialButton').classList.add('active');
    document.getElementById('generateNewPuzzleButton').classList.add('hidden');
    document.getElementById('nextTutorialButton').classList.remove('hidden');
  } else {
    document.getElementById('tutorialButton').classList.remove('active');
    document.getElementById('generateNewPuzzleButton').classList.remove('hidden');
    document.getElementById('nextTutorialButton').classList.add('hidden');
  }
}

export function containsCoord(array, coord) {
  return array.some(val => {
    return val[0] === coord[0] && val[1] === coord[1];
  });
}

export function removeCoord(array, coord) {
  for (let i = 0; i < array.length; i++) {
    let val = array[i];

    if (val[0] === coord[0] && val[1] === coord[1]) {
      array.splice(i, 1);
      return;
    }
  }
}

export function randomIndex(array) {
  return Math.floor(Math.random() * array.length);
}

export function randomEl(array, remove = false) {
  if (remove) {
    return array.splice(randomIndex(array), 1)[0];
  } else {
    return array[randomIndex(array)];
  }
}

export function peek(array) {
  return array[array.length - 1];
}

export function deepCopy(inObject) {
  let outObject, value, key;

  if (typeof inObject !== "object" || inObject === null) {
    return inObject; // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  outObject = Array.isArray(inObject) ? [] : {};

  for (key in inObject) {
    value = inObject[key];

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = deepCopy(value);
  }

  return outObject;
}
