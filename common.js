"use strict";

// Also tied to canvas container styles
const BACKGROUND_COLOR = "#333366";
const SUCCESS_COLOR = "#80ccaa";
const ALERT_COLOR = "#ccaa80";

// Keep in sync with service worker cache!
const SOUND_FILES = {
  clink: 'AnvilImpact.mp3',
  boing: 'BoingSound.mp3',
  chime: 'Chime_musical_BLASTWAVEFX_16367.mp3',
  click: 'Click.mp3',
  warp: 'Rollover_electronic_warp_BLASTWAVEFX_06209.mp3',
  whir: 'space_beep_3.mp3'
};

const SOUNDS = {};

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1000;
const URL_PARAMS = new URLSearchParams(window.location.search);
const DIFFICULTY = parseInt(URL_PARAMS.get("difficulty")) || 1;

/*let AudioContext;
let audioCtx;*/

let muted = URL_PARAMS.get("muted") || false;
let lastTouchEnd = 0;
//let soundPromisePairs = [];
let queuedSounds = [];
let interactive = false;
let showingSolution = false;
let showingInstructions = false;
let puzzleStarted = false;
let puzzleEnded = false;
let abandonConfirmed = false;
let loaded = false;
let permaLoading = URL_PARAMS.get("loading") || false;
let update = URL_PARAMS.get("update") || false;

/***********************************************
 * INIT
 ***********************************************/
function commonInit() {
  if (update) {
    setTimeout(() => {
      console.log('ServiceWorker update installed');
      
      // Note that the index.html file itself will not update until later reloaded
      window.location.reload(true);
    })
  } else {
    window.addEventListener('beforeunload', function (event) {
      if (puzzleStarted && !puzzleEnded && !abandonConfirmed) {
        event.preventDefault();
        event.returnValue = "Abandon Puzzle?";
      } else {
        delete event['returnValue'];
      }
    });

    // Apple audio performance hack
    /*let audioFunction = function (event) {
      AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
      audioCtx.resume();
      document.removeEventListener('click', audioFunction,
          { passive: false, capture: true });
    };
    document.addEventListener('click', audioFunction,
        { passive: false, capture: true });*/

    // Prevent scaling/navigation from touch gestures
    //let canvasContainer = document.getElementById("canvasContainer");

    /*canvasContainer.addEventListener('touchstart', function (event) {
      for (let i = 0; i < event.changedTouches.length; i++) {
        let touch = event.changedTouches[i];
        if (touch.pageX <= 30 || touch.pageX >= window.innerWidth - 30) {
          event.preventDefault();
        }
      }
    }, { passive: false, capture: true });*/

    /*canvasContainer.addEventListener('touchmove', function (event) {
      if (event.scale !== 1) {
        event.preventDefault();
      }
    }, { passive: false, capture: true });*/

    /*document.addEventListener('touchend', function (event) {
      let now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
      event.preventDefault();
      }

      lastTouchEnd = now;
    }, { passive: false, capture: true });*/
    
    
    /***************
     * SOUNDS
     ***************/
    SOUNDS.clink = new sound(SOUND_FILES.clink);
    SOUNDS.boing = new sound(SOUND_FILES.boing);
    SOUNDS.chime = new sound(SOUND_FILES.chime);
    SOUNDS.click = new sound(SOUND_FILES.click);
    SOUNDS.warp = new sound(SOUND_FILES.warp);
    SOUNDS.whir = new sound(SOUND_FILES.whir);
    
    // Volume adjustment from original WAV files
    /*SOUNDS.clink = new sound(SOUND_FILES.clink, 0.05);
    SOUNDS.boing = new sound(SOUND_FILES.boing, 0.05);
    SOUNDS.chime = new sound(SOUND_FILES.chime, 0.5);
    SOUNDS.click = new sound(SOUND_FILES.click, 0.1);
    SOUNDS.warp = new sound(SOUND_FILES.warp, 0.05);
    SOUNDS.whir = new sound(SOUND_FILES.whir, 0.1);*/
    

    let canvas = document.getElementById("puzzleCanvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    let difficultyLink = document.getElementById("difficulty" + DIFFICULTY);
    difficultyLink.classList.add("selected");
    difficultyLink.disabled = true;

    if (muted) {
      let muteButton = document.getElementById("muteButton");
      muteButton.classList.add("muted");
    }

    let fullScreenEnabled = document.fullscreenEnabled
          || document.webkitFullscreenEnabled
          || document.mozFullscreenEnabled
          || document.msFullscreenEnabled;

    let fullScreenButton = document.getElementById("fullScreenButton");

    if (!fullScreenEnabled) {
      fullScreenButton.classList.add("hidden");
    } else {
      window.top.document.onfullscreenchange = event => {
        let fullScreenButton = document.getElementById("fullScreenButton");

        if (isFullScreen()) {
          fullScreenButton.classList.add("fullScreen");
        } else {
          fullScreenButton.classList.remove("fullScreen");
        }
      };
    }

    if (isFullScreen()) {
      let fullScreenButton = document.getElementById("fullScreenButton");
      fullScreenButton.classList.add("fullScreen");
    }

    if (!permaLoading) {
      document.documentElement.classList.remove("loading");
    }
  }
}

function finishedLoading() {
  if (!permaLoading) {
    document.getElementById("canvasContainer").classList.remove("loading");
    loaded = true;

    // Add delay so pending clicks don't end up succeeding
    setTimeout(() => {
      document.getElementById("startButton").disabled = false;
      showingInstructions = true;
    })
  }
}
  
function sound(src, volume = 1) {
  this.sound = document.createElement("audio");
  this.sound.src = "sounds/" + src;
  this.sound.volume = volume;
  this.sound.muted = muted;
  this.sound.setAttribute("preload", "auto");
  this.sound.setAttribute("controls", "none");
  this.sound.style.display = "none";
  document.body.appendChild(this.sound);

  this.play = function(stopExisting = false) {
    //if (stopExisting) {
    //  cancelSounds = true;
    //  stopExistingSounds();
    //}
    
    //setTimeout(() => {
      //if (stopExisting) {
      //  cancelSounds = false;
      //}
      
      //if (!cancelSounds) {
        this.sound.currentTime = 0;
        this.sound.muted = muted;
        /*let soundPromise = */this.sound.play();
        /*soundPromise.then(() => {
          for (let i = 0; i < soundPromisePairs.length; i++) {
            let pair = soundPromisePairs[i];
            if (pair[0] === soundPromise) {
              soundPromisePairs.splice(i, 1);
              return;
            }
          }
        });*/
        /*soundPromise.catch(err => {
          alert(err);
        });*/

        //soundPromisePairs.push([soundPromise, this]);
      //}
    //}, 100);
  }

  this.stop = function() {
    this.sound.pause();
  }
}

function stopExistingSounds() {
  let sounds = [...document.getElementsByTagName("audio")];
  
  // Cancel pending sounds
  /*for (let i = 0; i < soundPromisePairs.length; i++) {
    let pair = soundPromisePairs[i];
    let promiseObj = pair[0];
    let soundObj = pair[1];
    
    promiseObj.then(() => {
      soundObj.stop();
    })
    
    soundPromisePairs.splice(i, 1);
    
    let index = sounds.indexOf(soundObj.sound);
    if (index > -1) {
      sounds.splice(index, 1);
    }
  }*/
  
  // Stop all other possibly playing sounds
  sounds.forEach(audio => {
    audio.pause();
  });
}

function isFullScreen() {
  let requestProperty = window.top.document.fullscreenElement
      || window.top.document.webkitFullscreenElement
      || window.top.document.mozFullscreenElement
      || window.top.document.msFullscreenElement;
  
  return requestProperty;
}

function exitFullScreen() {
  let requestMethod = window.top.document.exitFullscreen.bind(window.top.document)
        || window.top.document.webkitExitFullscreen.bind(window.top.document)
        || window.top.document.mozExitFullscreen.bind(window.top.document)
        || window.top.document.msExitFullscreen.bind(window.top.document);

  return requestMethod();
}

function goFullScreen() {
  let requestMethod = window.top.document.documentElement.requestFullscreen.bind(window.top.document.documentElement)
        || window.top.document.documentElement.webkitRequestFullscreen.bind(window.top.document.documentElement)
        || window.top.document.documentElement.mozRequestFullscreen.bind(window.top.document.documentElement)
        || window.top.document.documentElement.msRequestFullscreen.bind(window.top.document.documentElement);
    
  return requestMethod();
}

function toggleFullScreen() {
  if (isFullScreen()) {
    exitFullScreen();
  } else {
    goFullScreen();
  }
}

function toggleMuted() {
  muted = !muted;
  
  let sounds = [...document.getElementsByTagName("audio")];
  
  sounds.forEach(audio => {
     audio.muted = muted;
  });
  
  let muteButton = document.getElementById("muteButton");
  
  if (muted) {
    muteButton.classList.add("muted");
    URL_PARAMS.set('muted', true);
  } else {
    muteButton.classList.remove("muted");
    URL_PARAMS.delete('muted');
  }
  
  window.history.replaceState(null, null, window.location.href.split('?')[0] + addURLParams());
}

function setDifficultyWithoutNavigating(value) {
  let difficultyButtons = [...document.querySelectorAll("button[id^='difficulty']")];
  
  difficultyButtons.forEach(difficultyLink => {
    if (difficultyLink.id.slice(-1) === value.toString()) {
      difficultyLink.classList.add("selected");
      difficultyLink.disabled = true;
    } else {
      difficultyLink.classList.remove("selected");
      difficultyLink.disabled = false;
    }
  });
  
  URL_PARAMS.set("difficulty", value);
  
  window.history.replaceState(null, null, window.location.href.split('?')[0] + addURLParams());
}

function startButtonClick() {
  if (loaded) {
    showingInstructions = false;
    
    let sounds = [...document.getElementsByTagName("audio")];

    // Somehow this gets the user interaction to stick and allow all future audio
    sounds.forEach(audio => {
       audio.muted = !muted;
       audio.muted = muted;
    });
    
    drawPuzzle();

    document.getElementById('canvasContainer').classList.add('started');
    document.getElementById('instructionsButton').classList.remove('active');
    
    if (!puzzleEnded) {
      interactive = true;
      puzzleStarted = true;
    }
  }
}
  
function solutionToggle() {
  if (showingInstructions) {
    startButtonClick();
  }

  let solutionButton = document.getElementById("solutionButton");

  if (!showingSolution) {
    solutionButton.classList.add("active");
    showingSolution = true;
    interactive = false;

    drawPuzzle();
  } else {
    solutionButton.classList.remove("active");
    showingSolution = false;

    drawPuzzle();

    if (!puzzleEnded) {
      interactive = true;
    }
  }
}

function onMiddleMouseDown() {
  if (showingInstructions) {
    startButtonClick();
  }

  let solutionButton = document.getElementById("solutionButton");
  solutionButton.classList.add("active");
  showingSolution = true;
  interactive = false;

  drawPuzzle();
}

function onMiddleMouseUp() {
  if (showingSolution) {
      let solutionButton = document.getElementById("solutionButton");
      solutionButton.classList.remove("active");
      showingSolution = false;

      drawPuzzle();

      if (!puzzleEnded) {
        interactive = true;
      }
    }
}
  
function drawInstructionsHelper(puzzleTitle, descriptionLines, controlLines) {
  if (!showingInstructions) {
    let instructionsButton = document.getElementById("instructionsButton");
    instructionsButton.classList.add("active");
    showingInstructions = true;

    let solutionButton = document.getElementById("solutionButton");
    solutionButton.classList.remove("active");
    showingSolution = false;

    document.getElementById('canvasContainer').classList.remove('started');
    interactive = false;

    let canvas = document.getElementById("puzzleCanvas");
    let context = canvas.getContext("2d");

    context.fillStyle = BACKGROUND_COLOR;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.font = "bold 60px Arial"
    context.textAlign = "center";
    context.fillStyle = "#ffffff";
    context.fillText(puzzleTitle, CANVAS_WIDTH / 2, 150);
    
    context.font = "40px Arial"
    let yPos = 295;
    
    descriptionLines.forEach(line => {
      yPos += 60;
      context.fillText(line, CANVAS_WIDTH / 2, yPos);
    });
    
    yPos += 135;

    controlLines.forEach(line => {
      yPos += 60;
      context.fillText(line, CANVAS_WIDTH / 2, yPos);
    });

    context.font = "bold 50px Arial"
    context.fillStyle = "#F9B70F";
    context.fillText("Click or tap to " + (puzzleStarted ? "resume!" : "start!"), CANVAS_WIDTH / 2, 830);
  } else {
    startButtonClick();
  }
}

function addURLParams() {
  // Include update param if added through top window and not since removed
  let updateVal = new URLSearchParams(window.location.search).get("update");
  
  if (updateVal) {
    URL_PARAMS.set("update", updateVal);
  }
  
  let params = URL_PARAMS.toString();
  return params.length > 0 ? '?' + params : '';
}

function confirmAbandon() {
  // Navigating back at any point breaks confirmation dialogs in mobile iOS
  if (puzzleStarted && !puzzleEnded) {
    let startingTime = Date.now();
    abandonConfirmed = confirm("Abandon Puzzle?");
    return abandonConfirmed || Date.now() - startingTime < 10;
  } else {
    return true;
  }
}

function reloadPuzzle() {
  if (confirmAbandon()) {
    window.location.reload();
  }
}

function navigateHome() {
  if (confirmAbandon()) {
    window.location = 'home.html' + addURLParams();
  }
}

function setDifficulty(value) {
  if (confirmAbandon()) {
    URL_PARAMS.set('difficulty', value);
    window.location =  window.location.href.split('?')[0] + addURLParams();
  }
}

function containsCoord(array, coord) {
  return array.some(val => {
    return val[0] === coord[0] && val[1] === coord[1];
  });
}

function removeCoord(array, coord) {
  for (let i = 0; i < array.length; i++) {
    let val = array[i];

    if (val[0] === coord[0] && val[1] === coord[1]) {
      array.splice(i, 1);
      return;
    }
  }
}

function randomIndex(array) {
  return Math.floor(Math.random() * array.length);
}

function randomEl(array, remove = false) {
  if (remove) {
    return array.splice(randomIndex(array), 1)[0];
  } else {
    return array[randomIndex(array)];
  }
}

function peek(array) {
  return array[array.length - 1];
}

function deepCopy(inObject) {
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
