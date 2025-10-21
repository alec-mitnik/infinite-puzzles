import audioManager from './audio-manager.js';
import { BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, FONT_FAMILY, PUZZLE_CONFIGS } from './config.js';
import dailyChallengeManager from './daily-challenge-manager.js';
import {
  generateSeed, getPuzzleCanvas, getSeededRandomFunction,
  getTutorialDone, stopConfetti, updateForTutorialRecommendation
} from './utils.js';

class Router {
  routes;
  currentParams;
  difficulty;
  currentRoute;
  seed;
  cancelingNavigation;
  puzzleState;
  currentPuzzle;

  constructor() {
    this.routes = {
      'home': {
        init: () => this.loadHome(),
        title: 'Infinite Puzzles',
      }
    };

    // Store current state
    this.currentParams = new URLSearchParams(window.location.search);
    this.difficulty = parseInt(this.currentParams.get('difficulty')) || 1;
    this.currentRoute = this.currentParams.get('puzzle') || 'home';
    this.seed = this.currentParams.get('seed');
    this.cancelingNavigation = false;
    this.puzzleState = {};
    this.currentPuzzle = null;

    // Set up puzzle routes
    Object.keys(PUZZLE_CONFIGS).forEach(puzzleKey => {
      this.routes[puzzleKey] = {
        init: (startTutorial) => this.loadPuzzle(puzzleKey, startTutorial),
        title: `${PUZZLE_CONFIGS[puzzleKey].name} - Infinite Puzzles`,
      };
    });
  }

  // Use arrow function to retain reference to this
  sRand = () => {
    if (dailyChallengeManager.isDoingDailyChallenge()) {
      return dailyChallengeManager.activeDailyChallenge
          .puzzles[dailyChallengeManager.activeDailyChallengePuzzleIndex].sRand();
    } else {
      return this.puzzleState.sRand();
    }
  }

  init() {
    // Handle abandoning puzzles
    window.addEventListener('beforeunload', (event) => {
      // Check if we need to confirm leaving current puzzle
      if (this.getNavigationConfirmCondition()) {
        // Triggers a confirmation dialog
        event.preventDefault();
      }
    });

    function handleDifficultySelection(difficulty) {
      // Don't allow difficulty selection if doing daily challenge
      if (dailyChallengeManager.isDoingDailyChallenge()) {
        const oldInput = document.querySelector(`#difficulty${this.difficulty} input`);
        oldInput.checked = true
        oldInput.focus();
        return;
      }

      this.setDifficulty(difficulty);
    }

    // Handle difficulty controls
    document.querySelector('#difficulty1 input')?.addEventListener('change', () => {
      handleDifficultySelection.call(this, 1);
    });
    document.querySelector('#difficulty2 input')?.addEventListener('change', () => {
      handleDifficultySelection.call(this, 2);
    });
    document.querySelector('#difficulty3 input')?.addEventListener('change', () => {
      handleDifficultySelection.call(this, 3);
    });
    document.querySelector('#difficulty4 input')?.addEventListener('change', () => {
      handleDifficultySelection.call(this, 4);
    });

    // Handle canvas inputs
    let canvasContainer = document.getElementById('canvasContainer');
    canvasContainer?.addEventListener('touchstart', (event) => {
      if (typeof this.currentPuzzle?.onTouchStart === 'function') {
        this.currentPuzzle.onTouchStart(event);
      }

      if (event.target.tagName !== 'A') {
        // Prevent double-tap selection/magnification on mobile.
        // Any child elements will need to listen to touch events to still trigger on touch devices.
        event.preventDefault();
      }
    }, { passive: false });
    canvasContainer?.addEventListener('touchmove', (event) => {
      if (typeof this.currentPuzzle?.onTouchMove === 'function') {
        this.currentPuzzle.onTouchMove(event);
      }
    }, { passive: false });
    canvasContainer?.addEventListener('touchend', (event) => {
      if (typeof this.currentPuzzle?.onTouchEnd === 'function') {
        this.currentPuzzle.onTouchEnd(event);
      }
    }, { passive: false });

    let puzzleCanvas = getPuzzleCanvas();
    puzzleCanvas?.addEventListener('mousedown', (event) => {
      if (typeof this.currentPuzzle?.onMouseDown === 'function') {
        this.currentPuzzle.onMouseDown(event);
      }
    });
    puzzleCanvas?.addEventListener('mousemove', (event) => {
      if (typeof this.currentPuzzle?.onMouseMove === 'function') {
        this.currentPuzzle.onMouseMove(event);
      }
    });
    puzzleCanvas?.addEventListener('mouseup', (event) => {
      if (typeof this.currentPuzzle?.onMouseUp === 'function') {
        this.currentPuzzle.onMouseUp(event);
      }
    });

    // Touch end is triggered even if outside the target, but mouse up is only triggered on the target,
    // so need to handle mouse out as cancelling the action
    puzzleCanvas?.addEventListener('mouseout', (event) => {
      if (typeof this.currentPuzzle?.onMouseOut === 'function') {
        this.currentPuzzle.onMouseOut(event);
      }
    });

    // Handle popstate events (browser back/forward)
    window.addEventListener('popstate', (event) => {
      if (!this.cancelingNavigation) {
        if (!this.confirmAbandon()) {
          this.cancelingNavigation = true;
          window.history.forward();
          return;
        }
      }

      if (event.state) {
        this.loadRoute(event.state.route, false, this.cancelingNavigation);

        // Retain latest difficulty setting in the URL
        this.setDifficulty(this.difficulty);
      } else {
        // Default to home if no state
        this.loadRoute('home', false, this.cancelingNavigation);
      }

      this.cancelingNavigation = false;
    });

    // Initial loading
    this.setDifficulty(this.difficulty);
    this.loadRoute(this.currentRoute, false);

    // Update difficulty UI
    this.updateDifficultyUI();

    // Remove loading class once initialized
    document.body.classList.remove('loading');
  }

  loadRoute(route, updateHistory = true, skipInitialization = false, startTutorial = false) {
    // Default to home if route doesn't exist
    if (!this.routes[route]) {
      route = 'home';
    }

    const historyFunction = this.currentRoute === route ?
        window.history.replaceState.bind(window.history) : window.history.pushState.bind(window.history);

    // Update current route
    this.currentRoute = route;

    // Stop all sounds
    audioManager.fadeOutAllSounds();

    // Stop any confetti
    stopConfetti();

    // Update title
    document.title = this.routes[route].title;

    // Update URL if needed
    if (updateHistory) {
      historyFunction(
        { route },
        document.title,
        this.buildUrl(),
      );
    }

    if (!skipInitialization) {
      let canvas = getPuzzleCanvas();
      let context = canvas.getContext("2d");
      context.reset();

      document.getElementById('controls').classList.remove('solved');

      if (dailyChallengeManager.isDoingDailyChallenge()) {
        document.getElementById('controls').classList.add('daily-challenge');
        document.getElementById('difficulty-group').classList.add('daily-challenge');
      } else {
        document.getElementById('controls').classList.remove('daily-challenge');
        document.getElementById('difficulty-group').classList.remove('daily-challenge');
      }

      // Initialize the route
      this.routes[route].init(startTutorial);
    }
  }

  reloadPuzzle(newSeed = '') {
    if (this.confirmAbandon()) {
      this.seed = newSeed;
      this.loadRoute(this.currentRoute);
      return true;
    }

    return false;
  }

  toggleTutorial() {
    const startTutorial = !this.puzzleState.tutorialStage;

    if (startTutorial && !this.confirmAbandon()) {
      return;
    }

    // If exiting the tutorial, and it hasn't been done yet, show the prompt
    if (!startTutorial && !getTutorialDone() && !this.getConfirmation(
        "Exit Tutorial?\nYou can try again at any time and skip through any of its levels.")) {
      // If the confirmation to exit was cancelled, abort
      return;
    }

    if (!startTutorial) {
      this.puzzleState.tutorialStage = 0;
    }

    this.loadRoute(this.currentRoute, false, false, startTutorial);
  }

  getNavigationConfirmCondition() {
    return this.currentRoute !== 'home'
        && this.puzzleState && this.puzzleState.started && !this.puzzleState.ended;
  }

  getConfirmation(message) {
    // Navigating back at any point breaks confirmation dialogs in mobile iOS
    let startingTime = Date.now();
    const abandonConfirmed = confirm(message);
    return abandonConfirmed || Date.now() - startingTime < 10;
  }

  confirmAbandon() {
    // Check if we need to confirm leaving current puzzle
    if (this.getNavigationConfirmCondition()) {
      return this.getConfirmation("Abandon Puzzle?");
    }

    return true;
  }

  navigate(route) {
    // Check if we need to confirm leaving current puzzle
    if (this.confirmAbandon()) {
      this.seed = '';

      if (!route || route === 'home') {
        // Keep the active daily challenge as today's when not doing it
        // so that the home screen timer will always reflect today's challenge
        dailyChallengeManager.activeDailyChallenge = dailyChallengeManager.getDailyChallengeForToday();
        dailyChallengeManager.activeDailyChallengePuzzleIndex = -1;
      }

      this.loadRoute(route);
    }
  }

  // Load home page content
  async loadHome() {
    this.currentPuzzle = null;

    if (this.puzzleState) {
      this.puzzleState.tutorialStage = 0;
    }

    let canvas = getPuzzleCanvas();
    let context = canvas.getContext("2d");
    const compiledText = [];

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = `bold 100px ${FONT_FAMILY}`;
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText("\u221E Infinite Puzzles \u221E", CANVAS_WIDTH / 2, 140);
    context.font = `bold 40px ${FONT_FAMILY}`;
    context.fillText("\u223D By Alec Mitnik \u223C", CANVAS_WIDTH / 2, 220);
    compiledText.push("Infinite Puzzles: By Alec Mitnik.");

    context.font = `104px ${FONT_FAMILY}`;
    context.fillText("\uD83D\uDE0B➧\uD83E\uDD14➧\uD83D\uDE24➧\uD83E\uDD2F", CANVAS_WIDTH / 2, 375);
    context.font = `120px ${FONT_FAMILY}`;
    context.fillText("\uD83D\uDDB1\u0298 / \u2611\uFE0E  \u27A0  \u2611\uFE0E\uD83D\uDC40\uFE0E",
        CANVAS_WIDTH / 2, 660);

    context.font = `30px ${FONT_FAMILY}`;

    const faceIconsText = "Use the face icons in the menu bar to set the difficulty.";
    const oppositeIconsText = "Use the icons on the opposite side to select a puzzle.";
    const middleMouseText = "Hold down the middle mouse button or toggle the";
    const iconText = "check mark icon";
    const showSolutionButtonText = "Show Solution Button";
    const solutionText = "to peek at a puzzle's solution.  Use this to help learn the puzzle!";
    const nowAvailableText = "Daily Challenge, Stats, & Puzzle Sharing - now available!";

    context.fillText(faceIconsText, CANVAS_WIDTH / 2, 455);
    context.fillText(oppositeIconsText, CANVAS_WIDTH / 2, 495);
    context.fillText(`${middleMouseText} ${iconText}`, CANVAS_WIDTH / 2, 720);
    context.fillText(solutionText, CANVAS_WIDTH / 2, 760);

    context.fillText(nowAvailableText, CANVAS_WIDTH / 2, 950);
    context.font = `60px ${FONT_FAMILY}`;
    context.fillText("🏆", CANVAS_WIDTH * 3 / 8, 890);
    context.fillText("📊", CANVAS_WIDTH / 2, 890);
    context.font = `100px ${FONT_FAMILY}`;
    context.fillText("\u2332", CANVAS_WIDTH * 5 / 8, 898);

    compiledText.push(faceIconsText, oppositeIconsText,
        `${middleMouseText} ${showSolutionButtonText} ${solutionText}`,
        nowAvailableText);

    canvas.ariaDescription = compiledText.join('\n');

    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.classList.remove('loading');
    canvasContainer.classList.add('started', 'home');

    // Hide puzzle controls
    document.getElementById('controls').classList.add('hidden');
    document.getElementById('puzzleGames').classList.remove('hidden');
    document.getElementById('homeSubmenu').classList.remove('hidden');
  }

  // Load puzzle page content
  async loadPuzzle(puzzleKey, startTutorial) {
    if (!this.seed || isNaN(parseInt(this.seed, 36))) {
      this.seed = generateSeed();
    }

    try {
      // Reset puzzle state
      this.puzzleState = {
        ...this.puzzleState,
        started: false,
        ended: false,
        interactive: false,
        showingInstructions: false,
        showingSolution: false,
        solutionPeeked: false,
        loaded: false,
        puzzleKey,
      };

      const canvasContainer = document.getElementById('canvasContainer');
      canvasContainer.classList.remove('started', 'home');

      // Dynamically import the puzzle module
      const puzzleModule = await import(`../puzzles/${puzzleKey}.js`);

      // Store reference to current puzzle
      this.currentPuzzle = puzzleModule;

      // Set seeded random function
      this.puzzleState.sRand = getSeededRandomFunction(this.seed);

      // Show puzzle controls
      document.getElementById('controls').classList.remove('hidden');
      document.getElementById('homeSubmenu').classList.add('hidden');
      document.getElementById('puzzleGames').classList.add('hidden');

      // Resume updates to the countdown once a puzzle has loaded
      dailyChallengeManager.stopUpdatesToCountdown = false;

      // Initialize puzzle
      if (typeof this.currentPuzzle.init === 'function') {
        canvasContainer.classList.add('loading');
        document.getElementById('startButton').disabled = true;

        if (this.puzzleState.tutorialStage) {
          this.puzzleState.tutorialStage++;
        }

        if (startTutorial) {
          this.puzzleState.tutorialStage = 1;
        }

        updateForTutorialRecommendation();

        this.currentPuzzle.init();
      } else {
        console.error(`init function not found for ${puzzleKey}`);
      }
    } catch (error) {
      console.error(`Error loading puzzle ${puzzleKey}:`, error);
    }
  }

  setDifficulty(value, updateHistory = true) {
    if (isNaN(value) || value < 1 || value > 4) {
      value = 1; // Default to easy if invalid
    }

    const oldValue = this.difficulty;
    this.difficulty = value;

    // Update difficulty in URL params
    if (updateHistory) {
      window.history.replaceState(
        { route: this.currentRoute },
        document.title,
        this.buildUrl(),
      );
    }

    if (value === oldValue) {
      return;
    }

    if (this.puzzleState?.tutorialStage || this.reloadPuzzle()) {
      // Update UI
      this.updateDifficultyUI();
    } else {
      this.difficulty = oldValue;
      const oldInput = document.querySelector(`#difficulty${oldValue} input`);

      oldInput.checked = true
      oldInput.focus();

      // Reset difficulty in URL params
      if (updateHistory) {
        window.history.replaceState(
          { route: this.currentRoute },
          document.title,
          this.buildUrl(),
        );
      }
    }
  }

  updateDifficultyUI() {
    // Update difficulty buttons
    for (let i = 1; i <= 4; i++) {
      const label = document.getElementById(`difficulty${i}`);

      if (label) {
        if (i === this.difficulty) {
          label.classList.add('selected');
          label.querySelector('input').checked = true;
        } else {
          label.classList.remove('selected');
          label.querySelector('input').checked = false;
        }
      }
    }
  }

  buildQueryString(includeSeed = false) {
    const params = new URLSearchParams();
    params.set('difficulty', this.difficulty);

    if (this.currentRoute !== 'home') {
      params.set('puzzle', this.currentRoute);
    }

    if (includeSeed && this.seed) {
      params.set('seed', this.seed);
    }

    const paramString = params.toString();
    return paramString ? `?${paramString}` : '';
  }

  buildUrl(includeSeed = false) {
    return `${window.location.origin}${window.location.pathname}${this.buildQueryString(includeSeed)}`;
  }

  getCurrentPuzzleKey() {
    return this.puzzleState.puzzleKey;
  }
}

// Create singleton instance
const router = new Router();
export default router;
