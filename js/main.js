import audioManager from './audio-manager.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config.js';
import dailyChallengeManager from './daily-challenge-manager.js';
import router from './router.js';
import statsManager from './stats-manager.js';
import {
  isLocalStorageAvailable, openDialogWithTransition, solutionToggle,
  startButtonClick
} from './utils.js';

// Register service worker and online status
if ('serviceWorker' in navigator) {
  if (navigator.onLine) {
    document.getElementById('portfolio-link').style.display = null;
    document.getElementById('callToAction').style.display = null;
  }

  console.log('App loaded as ' + (navigator.onLine ? 'online' : 'offline'));

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);

        // Setup update handling
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            document.body.classList.add('loading');

            // Need to make sure to preserve the seed
            window.location.href = router.buildUrl(true);
          }
        });

        // Check for updates on page load
        void registration.update();
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
}

function updateLayoutForOrientation(isPortrait) {
  const primaryMenus = document.querySelectorAll('.menu-primary');
  const secondaryMenus = document.querySelectorAll('.menu-secondary');

  // Ensure tab order matches visual order
  if (isPortrait) {
    for (const primaryMenu of primaryMenus) {
      document.body.insertBefore(primaryMenu, document.body.firstElementChild);
      const primarySubmenu = primaryMenu.querySelector('.submenu-primary');
      const secondarySubmenu = primaryMenu.querySelector('.submenu-secondary');

      if (primarySubmenu && secondarySubmenu) {
        // In portrait mode, primary submenus go first
        primaryMenu.insertBefore(primarySubmenu, secondarySubmenu);
      }
    }

    for (const secondaryMenu of secondaryMenus) {
      document.body.appendChild(secondaryMenu);
      const primarySubmenu = secondaryMenu.querySelector('.submenu-primary');
      const secondarySubmenu = secondaryMenu.querySelector('.submenu-secondary');

      if (primarySubmenu && secondarySubmenu) {
        // In portrait mode, primary submenus go first
        secondaryMenu.insertBefore(primarySubmenu, secondarySubmenu);
      }
    }
  } else {
    for (const primaryMenu of primaryMenus) {
      document.body.appendChild(primaryMenu);
      const primarySubmenu = primaryMenu.querySelector('.submenu-primary');
      const secondarySubmenu = primaryMenu.querySelector('.submenu-secondary');

      if (primarySubmenu && secondarySubmenu) {
        // In landscape mode, primary submenus go last
        primaryMenu.insertBefore(secondarySubmenu, primarySubmenu);
      }
    }

    for (const secondaryMenu of secondaryMenus) {
      document.body.insertBefore(secondaryMenu, document.body.firstElementChild);
      const primarySubmenu = secondaryMenu.querySelector('.submenu-primary');
      const secondarySubmenu = secondaryMenu.querySelector('.submenu-secondary');

      if (primarySubmenu && secondarySubmenu) {
        // In landscape mode, primary submenus go last
        secondaryMenu.insertBefore(secondarySubmenu, primarySubmenu);
      }
    }
  }
}

// The orientationchange event fires before the viewport updates, so use a matchMedia listener
window.matchMedia("(orientation: portrait)").addEventListener('change',
    (event) => updateLayoutForOrientation(event.matches));

// Set up app initialization
document.addEventListener('DOMContentLoaded', async () => {
  updateLayoutForOrientation(window.matchMedia("(orientation: portrait)").matches);

  if (!isLocalStorageAvailable()) {
    for (const warning of document.querySelectorAll('.local-storage')) {
      warning.classList.remove('hidden');
    }
  }

  const canvas = document.getElementById("puzzleCanvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // Handle Puzzle Sharing dialog
  const sharePuzzleSeedWithNavigatorButton = document.getElementById('sharePuzzleSeedWithNavigatorButton');
  const sharePuzzleLinkWithNavigatorButton = document.getElementById('sharePuzzleLinkWithNavigatorButton');

  if (!navigator.share) {
    sharePuzzleSeedWithNavigatorButton.style.display = 'none';
    sharePuzzleLinkWithNavigatorButton.style.display = 'none';
  } else {
    sharePuzzleSeedWithNavigatorButton.addEventListener('click', () => {
      void navigator.share({
        title: document.title,
        text: router.seed,
      });
    });

    sharePuzzleLinkWithNavigatorButton.addEventListener('click', () => {
      void navigator.share({
        title: document.title,
        text: 'I want to share this puzzle with you!',
        url: document.getElementById('sharePuzzleUrl').textContent,
      });
    });
  }

  const generatePuzzleFromSeedForm = document.getElementById('generatePuzzleFromSeedForm');
  const newSeedInput = generatePuzzleFromSeedForm.newSeed;

  generatePuzzleFromSeedForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const newSeed = newSeedInput.value;
    router.seed = newSeed;

    if (await router.reloadPuzzle(newSeed)) {
      generatePuzzleFromSeedForm.reset();
      document.getElementById('puzzleSharingDialog').close();
    }
  });

  newSeedInput.addEventListener('input', (event) => {
    // Remove non-alphanumeric characters
    let seedValue = event.currentTarget.value.replace(/[^a-z0-9]/gi, '');

    // Normalize to lowercase, to not give the impression that
    // base-36 conversion is case sensitive
    seedValue = seedValue.toLowerCase();

    // Limit seed length for practicality.  Anything over the largest 32-bit signed integer
    // (which is 7 characters in base-36) will just be wrapped around by the algorithm.
    if (seedValue.length > 14) {
      seedValue = seedValue.slice(0, 14);
    }

    // Apply sanitized value
    event.currentTarget.value = seedValue;
  });

  // Add Puzzle Navigation
  const puzzleMenu = document.getElementById('puzzleGames');
  const puzzleButtons = [...puzzleMenu.querySelectorAll('button')];

  for (const puzzleButton of puzzleButtons) {
    // Get the key by removing all whitespace from the label
    const puzzleKey = puzzleButton.ariaLabel.replace(/\s/g, '');

    puzzleButton.addEventListener('click', () => {
      void router.navigate(puzzleKey);
    });
  }

  // Handle puzzle start button
  document.getElementById('startButton')?.addEventListener('click', () => {
    startButtonClick();
  });
  document.getElementById('startButton')?.addEventListener('touchend', (event) => {
    startButtonClick();
    event.preventDefault();
  });

  // Handle puzzle controls

  // Home
  document.getElementById('homeButton')?.addEventListener('click', () => {
    if (dailyChallengeManager.isDoingDailyChallenge()) {
      void dailyChallengeManager.exitDailyChallenge();
    } else {
      void router.navigate('home');
    }
  });
  // Toggle Tutorial
  document.getElementById('tutorialButton')?.addEventListener('click', () => {
    void router.toggleTutorial();
  });
  // Instructions
  document.getElementById('instructionsButton')?.addEventListener('click', () => {
    router.currentPuzzle.drawInstructions();
  });
  // Show Solution
  document.getElementById('solutionButton')?.addEventListener('click', () => {
    void solutionToggle();
  });
  // Generate New Puzzle
  document.getElementById('generateNewPuzzleButton')?.addEventListener('click', () => {
    void router.reloadPuzzle();
  });
  // Next Tutorial Puzzle
  document.getElementById('nextTutorialPuzzleButton')?.addEventListener('click', () => {
    void router.reloadPuzzle();
  });
  // Next Daily Challenge Puzzle
  document.getElementById('nextDailyChallengePuzzleButton')?.addEventListener('click', () => {
    dailyChallengeManager.goToNextDailyChallengePuzzle();
  });
  // Open Puzzle Sharing Dialog
  document.getElementById('sharePuzzleButton')?.addEventListener('click', () => {
    const sharePuzzleOptions = document.getElementById('sharePuzzleOptions');
    const sharePuzzleTutorialMessage = document.getElementById('sharePuzzleTutorialMessage');

    if (router.puzzleState.tutorialStage) {
      sharePuzzleOptions.style.display = 'none';
      sharePuzzleTutorialMessage.style.display = null;
    } else {
      sharePuzzleOptions.style.display = null;
      sharePuzzleTutorialMessage.style.display = 'none';

      document.getElementById('sharePuzzleSeedDirectlyDetails').open = false;
      document.getElementById('generatePuzzleFromSeedForm').reset();

      const sharePuzzleSeed = document.getElementById('sharePuzzleSeed');
      sharePuzzleSeed.textContent = router.seed;

      const url = router.buildUrl(true);

      const sharePuzzleUrl = document.getElementById('sharePuzzleUrl');
      sharePuzzleUrl.textContent = url;

      const difficulty = router.difficulty;
      const difficultyLabelElement = document.getElementById(`difficulty${difficulty}`);
      const difficultyEmoji = difficultyLabelElement.querySelector('span').textContent;
      const difficultyAriaLabel = difficultyLabelElement.querySelector('input').ariaLabel;

      document.getElementById('seedInstructionsTitles').textContent =
          document.title.replace(' - ', ' in ');
      document.getElementById('seedInstructionsDifficultyEmoji').textContent = difficultyEmoji;
      document.getElementById('seedInstructionsDifficultyLabel').textContent = difficultyAriaLabel;
    }

    const puzzleSharingDialog = document.getElementById('puzzleSharingDialog');
    openDialogWithTransition(puzzleSharingDialog);
  });

  // Handle fullscreen toggling
  let fullScreenEnabled = document.fullscreenEnabled
      || document.webkitFullscreenEnabled
      || document.mozFullscreenEnabled
      || document.msFullscreenEnabled;

  let fullScreenButton = document.getElementById("fullScreenButton");

  if (!fullScreenEnabled) {
    fullScreenButton.classList.add("hidden");
  } else {
    fullScreenButton.addEventListener('click', (event) => {
      toggleFullScreen(event.currentTarget);
    });
  }

  // Handle mute toggling
  document.getElementById('muteButton')?.addEventListener('click', () => {
    audioManager.toggleMuted();
  });

  // Initialize routing
  await router.init();

  // Initialize stats
  statsManager.init();

  // Initialize daily challenge
  dailyChallengeManager.init();
});

// Fullscreen API helpers
function isFullScreen() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
}

function toggleFullScreen(button) {
  if (isFullScreen()) {
    exitFullScreen();
    button.ariaLabel = "Enter Fullscreen Mode";
  } else {
    requestFullScreen(document.documentElement);
    button.ariaLabel = "Exit Fullscreen Mode";
  }
}

function requestFullScreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullScreen() {
  if (document.exitFullscreen) {
    void document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function updateFullscreenButtonState() {
  const fullScreenButton = document.getElementById('fullScreenButton');
  if (fullScreenButton) {
    if (isFullScreen()) {
      fullScreenButton.classList.add('fullScreen');
    } else {
      fullScreenButton.classList.remove('fullScreen');
    }
  }
}

// Update fullscreen button state when fullscreen state changes
document.addEventListener('fullscreenchange', updateFullscreenButtonState);
document.addEventListener('webkitfullscreenchange', updateFullscreenButtonState);
document.addEventListener('mozfullscreenchange', updateFullscreenButtonState);
document.addEventListener('MSFullscreenChange', updateFullscreenButtonState);
