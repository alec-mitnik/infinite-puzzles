import audioManager from './audio-manager.js';
import { BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import {
  generateSeed, getPuzzleCanvas, getSeededRandomFunction, stopConfetti,
  updateForTutorialRecommendation
} from './utils.js';

/* TODO:
 * Option to share and recreate a puzzle from a URL?
 * Keep an updated list of preset seeds to serve as daily challenges
 * Share times/scores, leaderboard?  Requires emphasis on speed, though...
 * Keep stats of puzzles completed?
 */

class Router {
  constructor() {
    this.routes = {
      'home': {
        init: () => this.loadHome(),
        title: 'Infinite Puzzles'
      }
    };

    // Store current state
    this.currentParams = new URLSearchParams(window.location.search);
    this.difficulty = parseInt(this.currentParams.get('difficulty')) || 1;
    this.currentRoute = this.currentParams.get('puzzle') || 'home';
    this.seed = this.currentParams.get('seed');
    this.cancelingNavigation = false;

    // Setup puzzle routes
    const puzzles = [
      'MarkedLoopPuzzle', 'SliderPathPuzzle', 'TetrominoGridPuzzle',
      'TangledGraphPuzzle', 'LightSwitchesPuzzle', 'ColorPiecesGridPuzzle',
      'CircuitGridPuzzle', 'GridMirrorPuzzle', 'ShiftingGridPuzzle',
      'EmittersGridPuzzle', 'ArithmeticGridPuzzle', 'LogicGridPuzzle'
    ];

    puzzles.forEach(puzzle => {
      this.routes[puzzle] = {
        init: (startTutorial) => this.loadPuzzle(puzzle, startTutorial),
        title: `${puzzle.replace(/([A-Z])/g, ' $1').trim()} - Infinite Puzzles`
      };
    });
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

    // Handle difficulty controls
    document.querySelector('#difficulty1 input')?.addEventListener('change', () => {
      this.setDifficulty(1);
    });
    document.querySelector('#difficulty2 input')?.addEventListener('change', () => {
      this.setDifficulty(2);
    });
    document.querySelector('#difficulty3 input')?.addEventListener('change', () => {
      this.setDifficulty(3);
    });
    document.querySelector('#difficulty4 input')?.addEventListener('change', () => {
      this.setDifficulty(4);
    });

    // Handle canvas inputs
    let canvasContainer = document.getElementById('canvasContainer');
    canvasContainer?.addEventListener('touchstart', (event) => {
      if (typeof window.app.currentPuzzle?.onTouchStart === 'function') {
        window.app.currentPuzzle.onTouchStart(event);
      }

      if (event.target.tagName !== 'A') {
        // Prevent double-tap selection/magnification on mobile.
        // Any child elements will need to listen to touch events to still trigger on touch devices.
        event.preventDefault();
      }
    }, { passive: false });
    canvasContainer?.addEventListener('touchmove', (event) => {
      if (typeof window.app.currentPuzzle?.onTouchMove === 'function') {
        window.app.currentPuzzle.onTouchMove(event);
      }
    }, { passive: false });
    canvasContainer?.addEventListener('touchend', (event) => {
      if (typeof window.app.currentPuzzle?.onTouchEnd === 'function') {
        window.app.currentPuzzle.onTouchEnd(event);
      }
    }, { passive: false });

    let puzzleCanvas = getPuzzleCanvas();
    puzzleCanvas?.addEventListener('mousedown', (event) => {
      if (typeof window.app.currentPuzzle?.onMouseDown === 'function') {
        window.app.currentPuzzle.onMouseDown(event);
      }
    });
    puzzleCanvas?.addEventListener('mousemove', (event) => {
      if (typeof window.app.currentPuzzle?.onMouseMove === 'function') {
        window.app.currentPuzzle.onMouseMove(event);
      }
    });
    puzzleCanvas?.addEventListener('mouseup', (event) => {
      if (typeof window.app.currentPuzzle?.onMouseUp === 'function') {
        window.app.currentPuzzle.onMouseUp(event);
      }
    });

    // Touch end is triggered even if outside the target, but mouse up is only triggered on the target,
    // so need to handle mouse out as cancelling the action
    puzzleCanvas?.addEventListener('mouseout', (event) => {
      if (typeof window.app.currentPuzzle?.onMouseOut === 'function') {
        window.app.currentPuzzle.onMouseOut(event);
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
    audioManager.stopAllSounds();

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
    const startTutorial = !window.app.puzzleState.tutorialStage;

    if (startTutorial && !this.confirmAbandon()) {
      return;
    }

    if (!startTutorial && !this.getConfirmation(
        "Exit Tutorial?\nYou can try again at any time and skip through any of its levels.")) {
      return;
    }

    if (!startTutorial) {
      window.app.puzzleState.tutorialStage = 0;
    }

    this.loadRoute(this.currentRoute, false, false, startTutorial);
  }

  getNavigationConfirmCondition() {
    return this.currentRoute !== 'home'
        && window.app.puzzleState && window.app.puzzleState.started && !window.app.puzzleState.ended;
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
      this.loadRoute(route);
    }
  }

  // Load home page content
  async loadHome() {
    window.app.currentPuzzle = null;

    if (window.app.puzzleState) {
      window.app.puzzleState.tutorialStage = 0;
    }

    let canvas = getPuzzleCanvas();
    let context = canvas.getContext("2d");
    const compiledText = [];

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = "bold 100px Arial"
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText("\u221E Infinite Puzzles \u221E", CANVAS_WIDTH / 2, 140);
    context.font = "bold 40px Arial"
    context.fillText("\u223D By Alec Mitnik \u223C", CANVAS_WIDTH / 2, 220);
    compiledText.push("Infinite Puzzles: By Alec Mitnik.");

    context.font = "104px Arial"
    context.fillText("\uD83D\uDE0B➧\uD83E\uDD14➧\uD83D\uDE24➧\uD83E\uDD2F", CANVAS_WIDTH / 2, 380);
    context.font = "120px Arial"
    context.fillText("\uD83D\uDDB1\u0298 / \u2611\uFE0E  \u27A0  \u2611\uFE0E\uD83D\uDC40\uFE0E",
        CANVAS_WIDTH / 2, 690);

    context.font = "30px Arial"

    const faceIconsText = "Use the face icons in the menu bar to set the difficulty.";
    const oppositeIconsText = "Use the icons on the opposite side to select a puzzle.";
    const middleMouseText = "Hold down the middle mouse button or toggle the";
    const iconText = "check mark icon";
    const showSolutionButtonText = "Show Solution Button";
    const solutionText = "to peek at a puzzle's solution.  Use this to help learn the puzzle!";

    context.fillText(faceIconsText, CANVAS_WIDTH / 2, 460);
    context.fillText(oppositeIconsText, CANVAS_WIDTH / 2, 510);
    context.fillText(`${middleMouseText} ${iconText}`, CANVAS_WIDTH / 2, 750);
    context.fillText(solutionText, CANVAS_WIDTH / 2, 800);
    compiledText.push(faceIconsText, oppositeIconsText,
        `${middleMouseText} ${showSolutionButtonText} ${solutionText}`);

    canvas.ariaDescription = compiledText.join('\n');

    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.classList.remove('loading');
    canvasContainer.classList.add('started', 'home');

    // Hide puzzle controls
    document.getElementById('controls').classList.add('hidden');
    document.getElementById('puzzleGames').classList.remove('hidden');
    document.getElementById('portfolio-link').classList.remove('hidden');
  }

  // Load puzzle page content
  async loadPuzzle(puzzleName, startTutorial) {
    if (!this.seed || isNaN(parseInt(this.seed, 36))) {
      this.seed = generateSeed();
    }

    try {
      // Reset puzzle state
      window.app.puzzleState = {
        ...window.app.puzzleState,
        started: false,
        ended: false,
        interactive: false,
        showingInstructions: false,
        showingSolution: false,
        loaded: false,
        puzzleName,
      };

      const canvasContainer = document.getElementById('canvasContainer');
      canvasContainer.classList.remove('started', 'home');

      // Dynamically import the puzzle module
      const puzzleModule = await import(`../puzzles/${puzzleName}.js`);

      // Store reference to current puzzle
      window.app.currentPuzzle = puzzleModule;

      // Set seeded random function
      window.app.sRand = getSeededRandomFunction(this.seed);

      // Show puzzle controls
      document.getElementById('controls').classList.remove('hidden');
      document.getElementById('portfolio-link').classList.add('hidden');
      document.getElementById('puzzleGames').classList.add('hidden');

      // Initialize puzzle
      if (typeof window.app.currentPuzzle.init === 'function') {
        canvasContainer.classList.add('loading');
        document.getElementById('startButton').disabled = true;

        if (window.app.puzzleState.tutorialStage) {
          window.app.puzzleState.tutorialStage++;
        }

        if (startTutorial) {
          window.app.puzzleState.tutorialStage = 1;
        }

        updateForTutorialRecommendation();

        window.app.currentPuzzle.init();
      } else {
        console.error(`init function not found for ${puzzleName}`);
      }
    } catch (error) {
      console.error(`Error loading puzzle ${puzzleName}:`, error);
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

    if (window.app.puzzleState?.tutorialStage || this.reloadPuzzle()) {
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

    if (includeSeed) {
      params.set('seed', this.seed);
    }

    const paramString = params.toString();
    return paramString ? `?${paramString}` : '';
  }

  buildUrl(includeSeed = false) {
    return `${window.location.origin}${window.location.pathname}${this.buildQueryString(includeSeed)}`;
  }
}

// Create global app namespace and add router
window.app = window.app || {};
window.app.router = new Router();

export default window.app.router;
