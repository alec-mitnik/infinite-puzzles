import audioManager from "./audio-manager.js";
import { BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH } from "./config.js";

const CONFETTI_DURATION = 10000;
const CONFETTI_OPTIONS = {
  angle: 90,
  spread: 180,
  particleCount: 150,
  origin: { x: 0.5, y: -0.1 },
  ticks: 1000,
  shapes: ['star', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square',
      'circle', 'square', 'circle', 'square', 'circle', 'square', 'circle', 'square'],
  scalar: 2,
  disableForReducedMotion: true,
};

let confettiDurationTimeoutId = null;
let confettiTimeoutId = null;

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
    getPuzzleCanvas().ariaDescription = null;

    window.app.currentPuzzle.drawPuzzle();

    document.getElementById('canvasContainer').classList.add('started');
    const instructionsButton = document.getElementById('instructionsButton');
    instructionsButton.classList.remove('active');
    instructionsButton.ariaLabel = 'Show Instructions';
    instructionsButton.querySelector('span').ariaLabel = 'Show Instructions';

    if (!window.app.puzzleState.ended) {
      window.app.puzzleState.interactive = true;
      window.app.puzzleState.started = true;
    }
  }
}

function showSolution() {
  let solutionButton = document.getElementById("solutionButton");
  solutionButton.classList.add("active");
  const newLabel = "Hide Solution";
  solutionButton.ariaLabel = newLabel;
  solutionButton.querySelector("span").ariaLabel = newLabel;
  window.app.puzzleState.showingSolution = true;
  window.app.puzzleState.interactive = false;

  window.app.currentPuzzle.drawPuzzle();
}

function hideSolution() {
  let solutionButton = document.getElementById("solutionButton");
  solutionButton.classList.remove("active");
  const newLabel = "Show Solution";
  solutionButton.ariaLabel = newLabel;
  solutionButton.querySelector("span").ariaLabel = newLabel;
  window.app.puzzleState.showingSolution = false;

  window.app.currentPuzzle.drawPuzzle();

  if (!window.app.puzzleState.ended) {
    window.app.puzzleState.interactive = true;
  }
}

export function solutionToggle() {
  if (window.app.puzzleState.showingInstructions) {
    startButtonClick();
  }

  if (!window.app.puzzleState.showingSolution) {
    showSolution();
  } else {
    hideSolution();
  }
}

export function onMiddleMouseDown() {
  if (window.app.puzzleState.showingInstructions) {
    startButtonClick();
  }

  showSolution();
}

export function onMiddleMouseUp() {
  if (window.app.puzzleState.showingSolution) {
    hideSolution();
  }
}

export function drawInstructionsHelper(puzzleTitle, puzzleSymbol, descriptionLines, controlLines, tutorialStage = 0, tutorialsTotal = 0) {
  if (!window.app.puzzleState.showingInstructions) {
    let instructionsButton = document.getElementById("instructionsButton");
    instructionsButton.classList.add("active");
    instructionsButton.ariaLabel = "Hide Instructions";
    instructionsButton.querySelector("span").ariaLabel = "Hide Instructions";

    hideSolution();

    window.app.puzzleState.showingInstructions = true;

    document.getElementById('canvasContainer').classList.remove('started');
    window.app.puzzleState.interactive = false;

    const canvas = getPuzzleCanvas();
    canvas.focus({ focusVisible: false }); // Prevent focus outline on iOS Safari
    const context = canvas.getContext("2d");
    const compiledInstructions = [];

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = "bold 60px Arial"
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText(`${puzzleSymbol} ${puzzleTitle} ${puzzleSymbol}`, CANVAS_WIDTH / 2, 150);
    compiledInstructions.push(`${puzzleTitle} Instructions:`);

    context.font = "40px Arial";
    let yPos = 265;

    descriptionLines.forEach(line => {
      yPos += 60;
      context.fillText(line, CANVAS_WIDTH / 2, yPos);
      compiledInstructions.push(line);
    });

    yPos += 100;

    controlLines.forEach(line => {
      yPos += 60;
      context.fillText(line, CANVAS_WIDTH / 2, yPos);
      compiledInstructions.push(line);
    });

    yPos += 160;

    if (tutorialStage) {
      context.fillText(`Tutorial  ${tutorialStage} / ${tutorialsTotal}`, CANVAS_WIDTH / 2, yPos);
      compiledInstructions.push(`Tutorial  ${tutorialStage} of ${tutorialsTotal}.`);
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

      if (document.querySelector('#tutorialButton.recommended:not(.active)')) {
        context.fillStyle = "#F9B70F";
      }

      context.font = "96px Arial";
      context.fillText(atomText, CANVAS_WIDTH / 2 - totalWidth / 2 + selectTextWidth + atomTextWidth / 2, yPos + 15);
      compiledInstructions.push(`${selectText}the Start Tutorial button${tutorialText}`);
    }

    context.font = "bold 50px Arial"
    context.fillStyle = "#F9B70F";
    const promptText = "Click or tap to ";
    const promptTextAction = window.app.puzzleState.started ? "resume" : "start";
    // Screen reader pronounces it like "résumé" otherwise...
    const promptTextActionPhonetic = window.app.puzzleState.started ? "re-zoom" : "start";
    context.fillText(`${promptText}${promptTextAction}!`, CANVAS_WIDTH / 2, 880);
    compiledInstructions.push(`${promptText}${promptTextActionPhonetic}!`);

    canvas.ariaDescription = compiledInstructions.join('\n');

    // This one it pronounces fine...
    document.getElementById('startButton').ariaLabel = window.app.puzzleState.started ? 'Resume Puzzle' : 'Start Puzzle';
  } else {
    startButtonClick();
  }
}

export function updateForTutorialState() {
  const tutorialButton = document.getElementById('tutorialButton');
  const tutorialButtonSpan = tutorialButton.querySelector('span');

  if (window.app.puzzleState.tutorialStage) {
    tutorialButton.classList.add('active');
    tutorialButton.ariaLabel = 'Exit Tutorial';
    tutorialButtonSpan.ariaLabel = 'Exit Tutorial';

    document.getElementById('generateNewPuzzleButton').classList.add('hidden');
    document.getElementById('nextTutorialButton').classList.remove('hidden');
  } else {
    tutorialButton.classList.remove('active');
    tutorialButton.ariaLabel = 'Start Tutorial';
    tutorialButtonSpan.ariaLabel = 'Start Tutorial';

    document.getElementById('generateNewPuzzleButton').classList.remove('hidden');
    document.getElementById('nextTutorialButton').classList.add('hidden');
  }
}

export function updateForTutorialRecommendation() {
  if (!window.app.puzzleState.tutorialStage && !getTutorialDone()) {
    document.getElementById('tutorialButton').classList.add('recommended');
  } else {
    document.getElementById('tutorialButton').classList.remove('recommended');
  }
}

export function endPuzzle(lastTutorialStage) {
  window.app.puzzleState.ended = true;
  window.app.puzzleState.interactive = false;
  document.getElementById('controls').classList.add('solved');

  if (lastTutorialStage) {
    audioManager.stop(audioManager.SoundEffects.CHIME);
    audioManager.play(audioManager.SoundEffects.GRADUATION);

    // Start showing confetti
    if (confettiDurationTimeoutId) {
      clearTimeout(confettiDurationTimeoutId);
      confettiDurationTimeoutId = null;
    }

    showConfetti();
  }

  if (!window.app.puzzleState.tutorialStage || lastTutorialStage) {
    setTutorialDone();
    updateForTutorialRecommendation();
  }
}

function showConfetti() {
  if (audioManager.isSoundPlaying(audioManager.SoundEffects.GRADUATION)) {
    if (!confettiDurationTimeoutId) {
      confettiDurationTimeoutId = setTimeout(() => {
        if (confettiTimeoutId) {
          clearTimeout(confettiTimeoutId);
          confettiTimeoutId = null;
        }

        confettiDurationTimeoutId = null;
      }, CONFETTI_DURATION);
    }

    if (confettiTimeoutId) {
      clearTimeout(confettiTimeoutId);
    }

    // Trigger the confetti effect
    window.confetti(CONFETTI_OPTIONS);

    confettiTimeoutId = setTimeout(() => {
      showConfetti();
    }, 1000);
  }
}

export function stopConfetti() {
  if (confettiDurationTimeoutId) {
    clearTimeout(confettiDurationTimeoutId);
    confettiDurationTimeoutId = null;
  }

  if (confettiTimeoutId) {
    clearTimeout(confettiTimeoutId);
    confettiTimeoutId = null;
  }

  window.confetti.reset();
}

export function getTutorialDone() {
  return localStorage.getItem(`${window.app.puzzleState.puzzleName}_TutorialDone`) === 'true';
}

export function setTutorialDone() {
  return localStorage.setItem(`${window.app.puzzleState.puzzleName}_TutorialDone`, 'true');
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

export function getPuzzleCanvas() {
  return document.getElementById('puzzleCanvas');
}
