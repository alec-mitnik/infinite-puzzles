import { loadData, saveData } from "./utils.js";

const MUTED_KEY = 'muted';
const FADE_DURATION = 0.3;

class AudioManager {
  SoundEffects = {
    CLINK: 'clink',
    BOING: 'boing',
    CHIME: 'chime',
    CLICK: 'click',
    WARP: 'warp',
    WHIR: 'whir',
    TOGGLE: 'toggle',
    TOGGLE_OFF: 'toggle-off',
    GRADUATION: 'graduation',
    GAME_START: 'game-start',
    PUZZLE_START: 'puzzle-start',
  };

  loadedSounds;
  playingSounds;
  context;
  muted;
  initialized;
  soundFiles;

  constructor() {
    this.loadedSounds = {};
    this.playingSounds = [];
    this.context = null;
    this.muted = false;
    this.initialized = false;

    // List of sound files to preload.
    // Keep in sync with service worker cache!
    this.soundFiles = {
      [this.SoundEffects.CLINK]: 'sounds/AnvilImpact.mp3',
      [this.SoundEffects.BOING]: 'sounds/BoingSound.mp3',
      [this.SoundEffects.CHIME]: 'sounds/Chime_musical_BLASTWAVEFX_16367.mp3',
      [this.SoundEffects.CLICK]: 'sounds/Click.mp3',
      [this.SoundEffects.WARP]: 'sounds/Rollover_electronic_warp_BLASTWAVEFX_06209.mp3',
      [this.SoundEffects.WHIR]: 'sounds/space_beep_3.mp3',
      [this.SoundEffects.TOGGLE]: '/sounds/game-sounds-toggle.mp3',
      [this.SoundEffects.TOGGLE_OFF]: '/sounds/game-sounds-toggle-off.mp3',
      [this.SoundEffects.GRADUATION]: 'sounds/Graduation.mp3',
      [this.SoundEffects.GAME_START]: 'sounds/game-start-6104.mp3',
      [this.SoundEffects.PUZZLE_START]: '/sounds/click-buttons-ui-menu-sounds-effects-button-12-205395.mp3',
    };

    // Set up initialization handlers for different browsers
    this.setUpInitHandlers();

    this.loadMutedState();
  }

  // Setup event listeners to initialize audio on user interaction
  setUpInitHandlers() {
    const initEvents = ['click', 'touchstart', 'keydown'];

    const initFunction = async () => {
      if (!this.initialized) {
        try {
          await this.initialize();

          console.log('All sounds loaded successfully');
          this.initialized = true;

          // Remove the event listeners once initialized
          initEvents.forEach(event => {
            document.removeEventListener(event, initFunction);
          });
        } catch (error) {
          console.error('Error loading sounds:', error);
        }
      }
    };

    // Add listeners for events that can initialize audio
    initEvents.forEach(event => {
      document.addEventListener(event, initFunction, { once: true });
    });
  }

  loadMutedState() {
    this.setMuted(loadData(MUTED_KEY, 'false') === 'true');
  }

  // Initialize the audio context and load sounds
  initialize() {
    // Hack to ensure "unlock" of playback by playing a silent sound immediately after the user gesture
    const unlockAudio = () => {
      const buffer = this.context.createBuffer(1, 1, 22050);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start(0);
    };

    // Create audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContext();
    unlockAudio();

    // Load all the sounds
    const promises = Object.entries(this.soundFiles).map(([name, file]) => {
      return this.loadSound(name, file);
    });

    return Promise.all(promises);
  }

  // Load a single sound file
  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      this.loadedSounds[name] = {
        buffer: audioBuffer,
      };

      return audioBuffer;
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
      throw error;
    }
  }

  // Play a sound with optional volume adjustment
  play(name, volume = 1.0) {
    if (!this.initialized || this.muted) {
      return;
    }

    if (name === this.SoundEffects.CHIME && this.isSoundPlaying(this.SoundEffects.GRADUATION)) {
      return;
    }

    const sound = this.loadedSounds[name];
    if (!sound) {
      console.warn(`Sound '${name}' not found`);
      return;
    }

    try {
      // Resume the audio context (needed for Safari)
      if (this.context.state === 'suspended') {
        this.context.resume();
      }

      // Create source node
      const source = this.context.createBufferSource();
      source.buffer = sound.buffer;

      // Used for irreversibly stopping the sound (with a smooth fadeout)
      const fadeoutGain = this.context.createGain();
      fadeoutGain.gain.value = 1; // Always starts at full

      // Used for setting the volume and reversibly muting (with a smooth fadeout/in)
      const volumeGain = this.context.createGain();
      volumeGain.gain.value = volume;

      // Chain the gain nodes
      source.connect(fadeoutGain);
      fadeoutGain.connect(volumeGain);
      volumeGain.connect(this.context.destination);

      this.playingSounds.push({
        name,
        source,
        fadeoutGain,
        volumeGain,
        originalVolume: volume,
      });

      // Handle end of playback, also triggered when manually stopped
      source.onended = () => {
        const soundIndex = this.playingSounds.findIndex(s => s.source === source);

        if (soundIndex >= 0) {
          this.playingSounds.splice(soundIndex, 1);
        }
      }

      // Start playback
      source.start();
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
    }
  }

  isSoundPlaying(name) {
    return this.playingSounds.some(sound => sound.name === name);
  }

  fadeOutAllSounds() {
    for (const sound of this.playingSounds) {
      // Make an exception for the GAME_START sound
      if (sound.name !== this.SoundEffects.GAME_START) {
        this.fadeOutGainNode(sound.fadeoutGain);
      }
    }
  }

  stop(name) {
    const sounds = this.playingSounds.filter(s => s.name === name);

    for (const sound of sounds) {
      sound.source.stop();
    }
  }

  fadeOutGainNode(gainNode) {
    const currentTime = this.context.currentTime;

    // Prevents noise that can occur at the start of the fadeout
    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(0, currentTime + FADE_DURATION);

    // Don't stop the sound, since this is used for muting too,
    // and the confetti effect depends on the sound playing
  }

  fadeInGainNode(gainNode, targetVolume) {
    const currentTime = this.context.currentTime;

    gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, currentTime + FADE_DURATION);
  }

  // Less jarring than immediately stopping, and thus preferable
  // (unless cancelling a sound before it actually starts playing)
  fadeOut(name) {
    const sounds = this.playingSounds.filter(s => s.name === name);

    for (const sound of sounds) {
      this.fadeOutGainNode(sound.fadeoutGain);
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted);
  }

  setMuted(muted) {
    this.muted = muted;
    let muteButton = document.getElementById("muteButton");

    if (this.muted) {
      // Mute all playing sounds
      this.playingSounds.forEach(sound => {
        this.fadeOutGainNode(sound.volumeGain);
      });

      muteButton.classList.add("muted");
      muteButton.ariaLabel = "Unmute Sounds";
      saveData(MUTED_KEY, true);
    } else {
      // Unmute all playing sounds
      this.playingSounds.forEach(sound => {
        this.fadeInGainNode(sound.volumeGain, sound.originalVolume);
      });

      muteButton.classList.remove("muted");
      muteButton.ariaLabel = "Mute Sounds";
      saveData(MUTED_KEY, false);

      // Play a test sound to ensure audio is working,
      // stopping already playing instances to ensure one clean sound
      this.stop('chime');

      // In case unmuting is the first interaction since load
      if (this.initialized) {
        this.play('chime', 0.25);
      } else {
        setTimeout(() => this.play('chime', 0.25), 100);
      }
    }
  }

  isMuted() {
    return this.muted;
  }
}

// Create singleton instance
const audioManager = new AudioManager();
export default audioManager;
