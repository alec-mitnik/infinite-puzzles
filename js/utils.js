import audioManager from "./audio-manager.js";
import { BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, FONT_FAMILY, PUZZLE_CONFIGS } from "./config.js";
import dailyChallengeManager from "./daily-challenge-manager.js";
import router from "./router.js";
import statsManager from "./stats-manager.js";

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

    // Continuously trigger the confetti effect every second while
    // within the duration and the corresponding sound is still playing
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

// Proper markup for screen readers.  Use outerHTML to convert to a string.
export function getPuzzleIconElement(puzzleKey, className = undefined) {
  const span = document.createElement('span');
  span.role = 'img';

  if (className) {
    span.className = className;
  }

  span.ariaLabel = PUZZLE_CONFIGS[puzzleKey].name;
  span.textContent = PUZZLE_CONFIGS[puzzleKey].icon;

  return span;
}

export function finishedLoading() {
  // Add delay so pending clicks don't end up succeeding
  setTimeout(() => {
    router.puzzleState.showingInstructions = true;
    router.puzzleState.loaded = true;
    document.getElementById("canvasContainer").classList.remove("loading");
  });
}

export function startButtonClick() {
  if (router.puzzleState.loaded) {
    router.puzzleState.showingInstructions = false;
    const canvas = getPuzzleCanvas();
    canvas.ariaDescription = null;

    // Enable keyboard controls
    canvas.focus();

    router.currentPuzzle.drawPuzzle();

    document.getElementById('canvasContainer').classList.add('started');
    const instructionsButton = document.getElementById('instructionsButton');
    instructionsButton.classList.remove('active');
    instructionsButton.ariaLabel = 'Show Instructions';
    instructionsButton.querySelector('span').ariaLabel = 'Show Instructions';

    if (!router.puzzleState.ended) {
      router.puzzleState.interactive = true;
      router.puzzleState.started = true;

      updateForTutorialRecommendation();
    }
  }
}

export function isDirKey(event) {
  return isRightDirKey(event) || isLeftDirKey(event) || isUpDirKey(event) || isDownDirKey(event)
      || isUpLeftDirKey(event) || isUpRightDirKey(event)
      || isDownLeftDirKey(event) || isDownRightDirKey(event);
}

export function isRightDirKey(event) {
  return event.code === "ArrowRight" || event.code === "KeyD" || event.code === "Numpad6";
}

export function isLeftDirKey(event) {
  return event.code === "ArrowLeft" || event.code === "KeyA" || event.code === "Numpad4";
}

export function isUpDirKey(event) {
  return event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Numpad8";
}

export function isDownDirKey(event) {
  return event.code === "ArrowDown" || event.code === "KeyS" || event.code === "Numpad5"
      || event.code === "KeyX" || event.code === "Numpad2";
}

export function isUpLeftDirKey(event) {
  return event.code === "Numpad7" || event.code === "KeyQ";
}

export function isUpRightDirKey(event) {
  return event.code === "Numpad9" || event.code === "KeyE";
}

export function isDownLeftDirKey(event) {
  return event.code === "Numpad1" || event.code === "KeyZ";
}

export function isDownRightDirKey(event) {
  return event.code === "Numpad3" || event.code === "KeyC";
}

export function isUndoKey(event) {
  return event.code === "KeyZ" && (event.ctrlKey || event.metaKey)
        && !event.altKey && !event.shiftKey
        || !hasModifierKeys(event) && event.code === "Backspace";
}

export function isRestartKey(event) {
  return event.code === "KeyR" && !hasModifierKeys(event);
}

export function isActivationKey(event) {
  return event.code === "Space" || event.code === "Enter" || event.code === "NumpadEnter";
}

export function hasModifierKeys(event) {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

// TODO
// Shift is no good because of tabbing backwards to/from the canvas (such as from the volume button).
// CMD/CTRL is no good because of save and other shortcuts using it.
// Alt is no good because it moves focus to the browser menu and can't be prevented.
// Have to pick a standard letter key or something as a mode toggle...
export function isOnlyGrabbingModifierActive(event) {
  return (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey;
}

// Draws a line with the dash pattern centered between the points
export function drawCenteredDashedLine(context, dashPatternArray, x1, y1, x2, y2) {
  // Ensure lines are always drawn the the same direction to minimize mismatches for overlaps
  if (x2 < x1 || y2 < y1) {
    [x1, x2] = [x2, x1];
    [y1, y2] = [y2, y1];
  }

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Round to avoid floating point errors
  const distance = Math.round(Math.hypot(dx, dy));

  if (dashPatternArray.length % 2 !== 0) {
    dashPatternArray = [...dashPatternArray, ...dashPatternArray];
  }

  // Sum the dashes and gaps
  const cycle = dashPatternArray.reduce((a, b) => a + b, 0);

  // Sum all the gaps
  let offset = dashPatternArray.reduce((a, b, i) => i % 2 === 0 ? a : a + b, 0);
  offset += (distance - offset) % cycle / 2;

  // Make the offset negative to add blank space to the start of the line
  context.lineDashOffset = -offset;
  context.setLineDash(dashPatternArray);
  const oldLineCap = context.lineCap;
  context.lineCap = "butt";

  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();

  context.lineCap = oldLineCap;
  context.lineDashOffset = 0;
  context.setLineDash([]);
}

// Draws a square with the dash pattern centered between the corners
export function drawCenteredDashedSquare(context, dashPatternArray, x, y, size) {
  if (dashPatternArray.length % 2 !== 0) {
    dashPatternArray = [...dashPatternArray, ...dashPatternArray];
  }

  // Sum the dashes and gaps
  const cycle = dashPatternArray.reduce((a, b) => a + b, 0);

  // // Sum all the gaps
  let offset = dashPatternArray.reduce((a, b, i) => i % 2 === 0 ? a : a + b, 0);
  offset += (size - offset) % cycle / 2;

  context.beginPath();
  context.rect(x, y, size, size);
  context.fill();

  drawCenteredDashedLine(context, dashPatternArray, x, y, x + size, y);
  drawCenteredDashedLine(context, dashPatternArray, x + size, y, x + size, y + size);
  drawCenteredDashedLine(context, dashPatternArray, x + size, y + size, x, y + size);
  drawCenteredDashedLine(context, dashPatternArray, x, y + size, x, y);

  // Stroke the corners
  const oldLineCap = context.lineCap;
  context.lineCap = "square";

  context.beginPath();
  context.moveTo(x, y + offset);
  context.lineTo(x, y);
  context.lineTo(x + offset, y);
  context.stroke();

  context.beginPath();
  context.moveTo(x + size - offset, y);
  context.lineTo(x + size, y);
  context.lineTo(x + size, y + offset);
  context.stroke();

  context.beginPath();
  context.moveTo(x + size, y + size - offset);
  context.lineTo(x + size, y + size);
  context.lineTo(x + size - offset, y + size);
  context.stroke();

  context.beginPath();
  context.moveTo(x + offset, y + size);
  context.lineTo(x, y + size);
  context.lineTo(x, y + size - offset);
  context.stroke();

  context.lineCap = oldLineCap;
}

function showSolution() {
  let solutionButton = document.getElementById("solutionButton");
  solutionButton.classList.add("active");
  const newLabel = "Hide Solution";
  solutionButton.ariaLabel = newLabel;
  solutionButton.querySelector("span").ariaLabel = newLabel;
  router.puzzleState.showingSolution = true;
  router.puzzleState.interactive = false;

  if (!router.puzzleState.ended) {
    router.puzzleState.solutionPeeked = true;
  }

  router.currentPuzzle.drawPuzzle();
}

function hideSolution() {
  let solutionButton = document.getElementById("solutionButton");
  solutionButton.classList.remove("active");
  const newLabel = "Show Solution";
  solutionButton.ariaLabel = newLabel;
  solutionButton.querySelector("span").ariaLabel = newLabel;
  router.puzzleState.showingSolution = false;

  router.currentPuzzle.drawPuzzle();

  if (!router.puzzleState.ended) {
    router.puzzleState.interactive = true;
  }
}

export async function solutionToggle() {
  if (!router.puzzleState.showingSolution) {
    const doingRecordedDailyChallengePuzzle =
        dailyChallengeManager.isDoingRecordedDailyChallengePuzzle();

    if (!doingRecordedDailyChallengePuzzle || await router.getConfirmation(
        `Note that this will end your current streak.`,
        'Give up on the daily challenge and view the solution?')) {
      if (doingRecordedDailyChallengePuzzle) {
        // Mark challenge run as unsuccessful and reset the current streak.
        // JSON does not support NaN.
        dailyChallengeManager.activeDailyChallenge.endTime = -1;
        dailyChallengeManager.saveDailyChallengeData();
        statsManager.stats.dailyChallenges.currentStreak = 0;
        statsManager.saveStatsData();

        dailyChallengeManager.updateDailyChallengeCompletedContent();
        dailyChallengeManager.startNextChallengeCountdown();
      }

      if (router.puzzleState.showingInstructions) {
        startButtonClick();
      }

      showSolution();
    }
  } else {
    hideSolution();
  }
}

export function onMiddleMouseDown() {
  if (dailyChallengeManager.isDoingRecordedDailyChallengePuzzle()) {
    // Disable for recorded daily challenge puzzles that haven't been completed yet
    return;
  }

  if (router.puzzleState.showingInstructions) {
    startButtonClick();
  }

  showSolution();
}

export function onMiddleMouseUp() {
  if (router.puzzleState.showingSolution) {
    hideSolution();
  }
}

export function drawInstructionsHelper(puzzleTitle, puzzleSymbol, descriptionLines,
    controlLines, tutorialStage = 0, tutorialsTotal = 0) {
  if (!router.puzzleState.showingInstructions) {
    let instructionsButton = document.getElementById("instructionsButton");
    instructionsButton.classList.add("active");
    instructionsButton.ariaLabel = "Hide Instructions";
    instructionsButton.querySelector("span").ariaLabel = "Hide Instructions";

    hideSolution();

    router.puzzleState.showingInstructions = true;

    document.getElementById('canvasContainer').classList.remove('started');
    router.puzzleState.interactive = false;

    const canvas = getPuzzleCanvas();
    canvas.focus({ focusVisible: false }); // Prevent focus outline on iOS Safari
    const context = canvas.getContext("2d");
    const compiledInstructions = [];

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = `bold 60px ${FONT_FAMILY}`;
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText(`${puzzleSymbol} ${puzzleTitle} ${puzzleSymbol}`, CANVAS_WIDTH / 2, 150);
    compiledInstructions.push(`${puzzleTitle} Instructions:`);

    context.font = `40px ${FONT_FAMILY}`;
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
      context.fillText(`Tutorial Puzzle  ${tutorialStage} / ${tutorialsTotal}`, CANVAS_WIDTH / 2, yPos);
      compiledInstructions.push(`Tutorial Puzzle  ${tutorialStage} of ${tutorialsTotal}.`);
    } else if (dailyChallengeManager.isDoingDailyChallenge()) {
      const dailyChallengeDateText = `Daily Challenge for ${dailyChallengeManager.formatDateId(dailyChallengeManager.activeDailyChallenge.id)}`;
      const replayText = dailyChallengeManager.isDoingRecordedDailyChallengePuzzle() ? "" : " (Replay)";
      const fullDailyChallengeDateText = `${dailyChallengeDateText}${replayText}`;
      const dailyChallengePuzzleVisualText = `Puzzle  ${dailyChallengeManager.activeDailyChallengePuzzleIndex + 1
          } / ${dailyChallengeManager.activeDailyChallenge.puzzles.length}`;
      const dailyChallengePuzzleReaderText = `Puzzle ${dailyChallengeManager.activeDailyChallengePuzzleIndex + 1
          } of ${dailyChallengeManager.activeDailyChallenge.puzzles.length}.`;

      context.font = `40px ${FONT_FAMILY}`;
      context.fillText(fullDailyChallengeDateText, CANVAS_WIDTH / 2, yPos - 30);
      context.fillText(dailyChallengePuzzleVisualText, CANVAS_WIDTH / 2, yPos + 30);

      compiledInstructions.push(fullDailyChallengeDateText, dailyChallengePuzzleReaderText);
    } else {
      const selectText = "Select ";
      const atomText = "⚛\uFE0E";
      const tutorialText = " for an incremental tutorial.";

      context.font = `96px ${FONT_FAMILY}`;
      const atomTextWidth = context.measureText(atomText).width;

      context.font = `40px ${FONT_FAMILY}`;
      const selectTextWidth = context.measureText(selectText).width;
      const tutorialTextWidth = context.measureText(tutorialText).width;

      const totalWidth = selectTextWidth + atomTextWidth + tutorialTextWidth;

      context.fillText(selectText, CANVAS_WIDTH / 2 - totalWidth / 2 + selectTextWidth / 2, yPos);
      context.fillText(tutorialText, CANVAS_WIDTH / 2 + totalWidth / 2 - tutorialTextWidth / 2, yPos);

      if (document.querySelector('#tutorialButton.recommended:not(.active)')) {
        context.fillStyle = "#F9B70F";
      }

      context.font = `96px ${FONT_FAMILY}`;
      context.fillText(atomText, CANVAS_WIDTH / 2 - totalWidth / 2 + selectTextWidth + atomTextWidth / 2, yPos + 15);
      compiledInstructions.push(`${selectText}the Start Tutorial button${tutorialText}`);
    }

    context.font = `bold 50px ${FONT_FAMILY}`;
    context.fillStyle = "#F9B70F";
    const promptText = "Click or tap to ";
    const promptTextAction = router.puzzleState.started ? "resume" : "start";
    // Screen reader pronounces it like "résumé" otherwise...
    const promptTextActionPhonetic = router.puzzleState.started ? "re-zoom" : "start";
    context.fillText(`${promptText}${promptTextAction}!`, CANVAS_WIDTH / 2, 880);
    compiledInstructions.push(`${promptText}${promptTextActionPhonetic}!`);

    canvas.ariaDescription = compiledInstructions.join('\n');
  } else {
    startButtonClick();
  }
}

export function updateForTutorialState() {
  const tutorialButton = document.getElementById('tutorialButton');
  const tutorialButtonSpan = tutorialButton.querySelector('span');

  if (router.puzzleState.tutorialStage) {
    tutorialButton.classList.add('active');
    tutorialButton.ariaLabel = 'Exit Tutorial';
    tutorialButtonSpan.ariaLabel = 'Exit Tutorial';

    document.getElementById('generateNewPuzzleButton').classList.add('hidden');
    document.getElementById('nextTutorialPuzzleButton').classList.remove('hidden');
  } else {
    tutorialButton.classList.remove('active');
    tutorialButton.ariaLabel = 'Start Tutorial';
    tutorialButtonSpan.ariaLabel = 'Start Tutorial';

    document.getElementById('generateNewPuzzleButton').classList.remove('hidden');
    document.getElementById('nextTutorialPuzzleButton').classList.add('hidden');
  }
}

/*
 * Recommend the tutorial if all the following is true:
 * - Not in the tutorial
 * - Not doing the daily challenge
 * - Puzzle not started, or has ended
 * - Tutorial had never been completed
 * - A standalone level had never been completed without peeking at the solution
 *
 * This means completed daily challenge levels aren't considered,
 * and that completing the tutorial is counted even if the solution was peeked at
 */
export function updateForTutorialRecommendation() {
  if (!router.puzzleState.tutorialStage && !dailyChallengeManager.isDoingDailyChallenge()
      && (!router.puzzleState.started || router.puzzleState.ended)
      && !getTutorialDone() && !hasLevelBeenCompleted()) {
    document.getElementById('tutorialButton').classList.add('recommended');
  } else {
    document.getElementById('tutorialButton').classList.remove('recommended');
  }
}

export function openDialogWithTransition(dialog, transitionMs = 190) {
  const handler = e => e.preventDefault();

  // Prevent stray clicks on the dialog while transitioning
  dialog.classList.add('loading');
  dialog.style.pointerEvents = 'none';

  // Even with everything non-interactive, context menus will still trigger on the HTML element.
  // Specify capture phase on the document event to ensure it's reached first.
  document.addEventListener('contextmenu', handler, true);

  setTimeout(() => {
    // Need to transition by removing a class after showing the modal,
    // so give it 0.01s with the class, to be added to the transition duration
    dialog.classList.remove('loading');

    setTimeout(() => {
      // Once transition finishes, resume interactivity
      document.removeEventListener('contextmenu', handler, true);
      dialog.style.pointerEvents = null;
    }, transitionMs);
  }, 10);

  dialog.showModal();
}

export function endPuzzle(lastTutorialStage) {
  router.puzzleState.ended = true;
  router.puzzleState.interactive = false;
  document.getElementById('controls').classList.add('solved');

  // Handle daily challenge data if not already played
  if (dailyChallengeManager.isDoingRecordedDailyChallengePuzzle()) {
    dailyChallengeManager.activeDailyChallenge
        .puzzles[dailyChallengeManager.activeDailyChallengePuzzleIndex].completed = true;
    dailyChallengeManager.setDailyChallengePuzzlesForDialog();

    if (dailyChallengeManager.activeDailyChallenge.puzzles.every(puzzle => puzzle.completed)) {
      // Daily challenge completed
      dailyChallengeManager.activeDailyChallenge.endTime = Date.now();
      const duration = dailyChallengeManager.activeDailyChallenge.endTime
          - dailyChallengeManager.activeDailyChallenge.startTime;

      // Update daily challenge data
      statsManager.stats.dailyChallenges.totalCompleted++;
      statsManager.stats.dailyChallenges.currentStreak++;
      statsManager.stats.dailyChallenges.longestStreak = Math.max(
        statsManager.stats.dailyChallenges.longestStreak,
        statsManager.stats.dailyChallenges.currentStreak,
      );

      const fastestCompletion = statsManager.stats.dailyChallenges.fastestCompletion;
      if (fastestCompletion?.startTime == null || fastestCompletion?.endTime == null
          || fastestCompletion.endTime < 0
          || duration < fastestCompletion.endTime - fastestCompletion.startTime) {
        statsManager.stats.dailyChallenges.fastestCompletion = {
          ...dailyChallengeManager.activeDailyChallenge,
        };
      }

      statsManager.saveStatsData();
      dailyChallengeManager.startNextChallengeCountdown();
      dailyChallengeManager.setDailyChallengePuzzlesForDialog(
          dailyChallengeManager.activeDailyChallenge.id);

      const formattedTime = dailyChallengeManager.formatTimerForHtml(0, duration);
      document.getElementById('dailyChallengeJustCompletedMessage').innerHTML =
          `You beat the daily challenge in ${formattedTime}!`;
      const dailyChallengeDialog = document.getElementById('dailyChallengeDialog');
      dailyChallengeDialog.classList.add('just-completed');

      // If you're in the process of right-clicking to rotate a piece when the puzzle
      // is suddenly solved and the popup is shown, it will open the context menu
      // on the popup on mouse up, so disable interaction for a bit with a fancier transition
      openDialogWithTransition(dailyChallengeDialog, 990);
    }

    dailyChallengeManager.saveDailyChallengeData();
  }

  // Allow daily challenge puzzles to count towards general puzzle stats
  // So that it recognizes puzzle familiarity even if through the daily challenge.
  // Count replays too, since seed-generated puzzles could also be repeated
  // and still count anyway.
  if (!router.puzzleState.tutorialStage) {
    // Don't update stats if the solution was peeked
    if (!router.puzzleState.solutionPeeked) {
      // Update general puzzle stats
      const puzzleKey = router.getCurrentPuzzleKey();
      statsManager.stats.puzzles[puzzleKey].completions[router.difficulty]++;
      statsManager.saveStatsData();
    }

    // Must go after updating the stats above
    updateForTutorialRecommendation();
  } else if (lastTutorialStage) {
    setTutorialDone();
    updateForTutorialRecommendation();

    audioManager.stop(audioManager.SoundEffects.CHIME);
    audioManager.play(audioManager.SoundEffects.GRADUATION);

    // Start showing confetti
    if (confettiDurationTimeoutId) {
      clearTimeout(confettiDurationTimeoutId);
      confettiDurationTimeoutId = null;
    }

    showConfetti();
  }
}

export function hasLevelBeenCompleted(puzzleKey = router.puzzleState.puzzleKey) {
  const puzzleStats = statsManager.stats.puzzles[puzzleKey];
  return Object.values(puzzleStats?.completions || {}).some(val => val > 0);
}

export function getTutorialDone(puzzleKey = router.puzzleState.puzzleKey) {
  const puzzleStats = statsManager.stats.puzzles[puzzleKey];
  return puzzleStats.tutorialDone;
}

export function setTutorialDone(puzzleKey = router.puzzleState.puzzleKey) {
  statsManager.stats.puzzles[puzzleKey].tutorialDone = true;
  statsManager.saveStatsData();
}

export function sameCoord(coord1, coord2) {
  return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

export function containsCoord(array, coord) {
  return array.some(val => {
    return sameCoord(val, coord);
  });
}

export function removeCoord(array, coord) {
  for (let i = 0; i < array.length; i++) {
    let val = array[i];

    if (sameCoord(val, coord)) {
      array.splice(i, 1);
      return;
    }
  }
}

// https://github.com/bryc/code/blob/master/jshash/PRNGs.md
function splitMix32(seed) {
  // Seeded random function
  return function() {
    seed |= 0;
    seed = seed + 0x9e3779b9 | 0;
    let t = seed ^ seed >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}
function xMur3(str) {
  let h = 1779033703 ^ str.length;

  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = h << 13 | h >>> 19;
  }

  // Robust seed generator using hashing
  return function() {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }
}

export function generateSeed(str = String(Date.now())) {
  // Shorten by converting to base 36
  return xMur3(str)().toString(36);
}

export function generateSeeds(str = String(Date.now()), count = 1) {
  const generator = xMur3(str);
  const seeds = [];

  for (let i = 0; i < count; i++) {
    // Shorten by converting to base 36
    seeds.push(generator().toString(36));
  }

  return seeds;
}

export function getSeededRandomFunction(seedBase36) {
  return splitMix32(parseInt(seedBase36, 36));
}

export function randomIndex(array, sRandOverride = undefined) {
  return Math.floor((sRandOverride ?? router.sRand ?? Math.random)() * array.length);
}

export function randomEl(array, remove = false, sRandOverride = undefined) {
  if (remove) {
    return array.splice(randomIndex(array, sRandOverride), 1)[0];
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

export function isLocalStorageAvailable() {
  let storage;

  try {
    storage = window["localStorage"];
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

export function saveData(key, data) {
  try {
    localStorage.setItem(key, data);

    if (document.readyState === 'complete') {
      document.querySelector('.local-storage').classList.add('hidden');
    }
  } catch (e) {
    // console.warn(`Unable to save '${key}' to local storage:`, e);
    console.warn("Unable to save to local storage:", e);

    if (document.readyState === 'complete') {
      document.querySelector('.local-storage').classList.remove('hidden');
    }
  }
}

export function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key) ?? fallback;

    if (document.readyState === 'complete') {
      document.querySelector('.local-storage').classList.add('hidden');
    }

    return value;
  } catch (e) {
    // console.warn(`Unable to load '${key}' from local storage:`, e);
    console.warn("Unable to load from local storage:", e);

    if (document.readyState === 'complete') {
      document.querySelector('.local-storage').classList.remove('hidden');
    }

    return fallback;
  }
}

export function clearData() {
  try {
    localStorage.clear();
  } catch (e) {
    console.warn("Unable to clear local storage:", e);
  }
}
