import { BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import { getPuzzleCanvas, updateForTutorialRecommendation } from './utils.js';

/* TODO:
 * Complex logic grid puzzle generation stalls on narrowColumnPossibilities...
 * Improve circuit-grid tutorial?
 * Confetti or color bloom effect or something for solving puzzles, or at least for completing the tutorial?
 * Option to share and recreate a puzzle from a URL?
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
    document.getElementById('difficulty1')?.addEventListener('click', () => {
      this.setDifficulty(1);
    });
    document.getElementById('difficulty2')?.addEventListener('click', () => {
      this.setDifficulty(2);
    });
    document.getElementById('difficulty3')?.addEventListener('click', () => {
      this.setDifficulty(3);
    });
    document.getElementById('difficulty4')?.addEventListener('click', () => {
      this.setDifficulty(4);
    });

    // Handle canvas inputs
    let canvasContainer = document.getElementById('canvasContainer');
    canvasContainer?.addEventListener('touchstart', (event) => {
      if (typeof window.app.currentPuzzle?.onTouchStart === 'function') {
        window.app.currentPuzzle.onTouchStart(event);
      }

      // Prevent double-tap selection/magnification on mobile.
      // Any child elements will need to listen to touch events to still trigger on touch devices.
      event.preventDefault();
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

      document.getElementById('kofi-button').classList.add('hidden');
      document.getElementById('controls').classList.remove('solved');

      // Initialize the route
      this.routes[route].init(startTutorial);
    }
  }

  reloadPuzzle() {
    if (this.confirmAbandon()) {
      this.loadRoute(this.currentRoute);
      return true;
    }

    return false;
  }

  toggleTutorial() {
    if (this.confirmAbandon()) {
      const startTutorial = !window.app.puzzleState.tutorialStage;

      if (!startTutorial) {
        window.app.puzzleState.tutorialStage = 0;
      }

      this.loadRoute(this.currentRoute, false, false, startTutorial);
    }
  }

  getNavigationConfirmCondition() {
    return this.currentRoute !== 'home'
        && window.app.puzzleState && window.app.puzzleState.started && !window.app.puzzleState.ended;
  }

  confirmAbandon() {
    // Check if we need to confirm leaving current puzzle
    if (this.getNavigationConfirmCondition()) {
      // Navigating back at any point breaks confirmation dialogs in mobile iOS
      let startingTime = Date.now();
      const abandonConfirmed = confirm("Abandon Puzzle?");
      return abandonConfirmed || Date.now() - startingTime < 10;
    }

    return true;
  }

  navigate(route) {
    // Check if we need to confirm leaving current puzzle
    if (this.confirmAbandon()) {
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

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = "bold 100px Arial"
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText("\u221E Infinite Puzzles \u221E", CANVAS_WIDTH / 2, 140);
    context.font = "bold 40px Arial"
    context.fillText("\u223D By Alec Mitnik \u223C", CANVAS_WIDTH / 2, 220);

    context.font = "104px Arial"
    context.fillText("\uD83D\uDE0B➧\uD83E\uDD14➧\uD83D\uDE24➧\uD83E\uDD2F", CANVAS_WIDTH / 2, 410);
    context.font = "120px Arial"
    context.fillText("\uD83D\uDDB1\u0298 / \u2611\uFE0E  \u27A0  \u2611\uFE0E\uD83D\uDC40\uFE0E", CANVAS_WIDTH / 2, 730);

    context.font = "30px Arial"
    context.fillText("Use the face icons in the menu bar to set the difficulty.", CANVAS_WIDTH / 2, 490);
    context.fillText("Use the icons on the opposite side to select a puzzle.", CANVAS_WIDTH / 2, 540);
    context.fillText("Hold down the middle mouse button or toggle the check mark icon", CANVAS_WIDTH / 2, 790);
    context.fillText("to peek at a puzzle's solution.  Use this to help learn the puzzle!", CANVAS_WIDTH / 2, 840);

    const canvasContainer = document.getElementById('canvasContainer');
    canvasContainer.classList.remove('loading');
    canvasContainer.classList.add('started', 'home');

    // Hide puzzle controls
    document.getElementById('controls').classList.add('hidden');
    document.querySelectorAll('.puzzleLinks').forEach(linkSet => linkSet.classList.remove('hidden'));

    document.getElementById('kofi-button').classList.remove('hidden');
  }

  // Load puzzle page content
  async loadPuzzle(puzzleName, startTutorial) {
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

      // Show puzzle controls
      document.getElementById('controls').classList.remove('hidden');
      document.querySelectorAll('.puzzleLinks').forEach(linkSet => linkSet.classList.add('hidden'));

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
      const button = document.getElementById(`difficulty${i}`);
      if (button) {
        if (i === this.difficulty) {
          button.classList.add('selected');
          button.disabled = true;
        } else {
          button.classList.remove('selected');
          button.disabled = false;
        }
      }
    }
  }

  buildQueryString() {
    const params = new URLSearchParams();
    params.set('difficulty', this.difficulty);

    if (this.currentRoute !== 'home') {
      params.set('puzzle', this.currentRoute);
    }

    const paramString = params.toString();
    return paramString ? `?${paramString}` : '';
  }

  buildUrl() {
    return `${window.location.origin}/${this.buildQueryString()}`;
  }
}

// Create global app namespace and add router
window.app = window.app || {};
window.app.router = new Router();

export default window.app.router;
