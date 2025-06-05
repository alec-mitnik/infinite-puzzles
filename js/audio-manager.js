class AudioManager {
  constructor() {
    this.loadedSounds = {};
    this.playingSounds = [];
    this.context = null;
    this.muted = false;
    this.initialized = false;

    this.SoundEffects = {
      CLINK: 'clink',
      BOING: 'boing',
      CHIME: 'chime',
      CLICK: 'click',
      WARP: 'warp',
      WHIR: 'whir',
      GRADUATION: 'graduation',
    };

    // List of sound files to preload.
    // Keep in sync with service worker cache!
    this.soundFiles = {
      [this.SoundEffects.CLINK]: 'sounds/AnvilImpact.mp3',
      [this.SoundEffects.BOING]: 'sounds/BoingSound.mp3',
      [this.SoundEffects.CHIME]: 'sounds/Chime_musical_BLASTWAVEFX_16367.mp3',
      [this.SoundEffects.CLICK]: 'sounds/Click.mp3',
      [this.SoundEffects.WARP]: 'sounds/Rollover_electronic_warp_BLASTWAVEFX_06209.mp3',
      [this.SoundEffects.WHIR]: 'sounds/space_beep_3.mp3',
      [this.SoundEffects.GRADUATION]: 'sounds/Graduation.mp3',
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
    this.setMuted(localStorage.getItem('muted') === 'true');
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

      // Create gain node for volume control
      const gainNode = this.context.createGain();
      gainNode.gain.value = volume;

      // Connect nodes: source -> gain -> destination
      source.connect(gainNode);
      gainNode.connect(this.context.destination);

      this.playingSounds.push({
        name,
        source,
        gainNode,
        originalVolume: volume,
      });

      // Handle end of playback
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

  stopAllSounds() {
    this.playingSounds.forEach(sound => sound.source.stop());
    this.playingSounds = [];
  }

  stop(name) {
    const soundIndex = this.playingSounds.findIndex(s => s.name === name);

    if (soundIndex >= 0) {
      const sound = this.playingSounds[soundIndex];
      sound.source.stop();
      this.playingSounds.splice(soundIndex, 1);
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
        sound.gainNode.gain.value = 0;
      });

      muteButton.classList.add("muted");
      muteButton.ariaLabel = "Unmute Sounds";
      localStorage.setItem('muted', 'true');
    } else {
      // Unmute all playing sounds
      this.playingSounds.forEach(sound => {
        sound.gainNode.gain.value = sound.originalVolume;
      });

      muteButton.classList.remove("muted");
      muteButton.ariaLabel = "Mute Sounds";
      localStorage.removeItem('muted');

      // Play a test sound to ensure audio is working
      this.play('chime', 0.25);
    }
  }

  isMuted() {
    return this.muted;
  }
}

// Create singleton instance
const audioManager = new AudioManager();
export default audioManager;
