class KeyboardManager {
  constructor() {}

  isRightDirKey(event) {
    return event.code === "ArrowRight" || event.code === "KeyD" || event.code === "Numpad6";
  }

  isLeftDirKey(event) {
    return event.code === "ArrowLeft" || event.code === "KeyA" || event.code === "Numpad4";
  }

  isUpDirKey(event) {
    return event.code === "ArrowUp" || event.code === "KeyW" || event.code === "Numpad8";
  }

  isDownDirKey(event) {
    return event.code === "ArrowDown" || event.code === "KeyS" || event.code === "Numpad5"
        || event.code === "KeyX" || event.code === "Numpad2";
  }

  isUpLeftDirKey(event) {
    return event.code === "Numpad7" || event.code === "KeyQ";
  }

  isUpRightDirKey(event) {
    return event.code === "Numpad9" || event.code === "KeyE";
  }

  isDownLeftDirKey(event) {
    return event.code === "Numpad1" || event.code === "KeyZ";
  }

  isDownRightDirKey(event) {
    return event.code === "Numpad3" || event.code === "KeyC";
  }

  isOrthogonalDirKey(event) {
    return this.isRightDirKey(event) || this.isLeftDirKey(event)
        || this.isUpDirKey(event) || this.isDownDirKey(event);
  }

  isDirKey(event) {
    return this.isOrthogonalDirKey(event)
        || this.isUpLeftDirKey(event) || this.isUpRightDirKey(event)
        || this.isDownLeftDirKey(event) || this.isDownRightDirKey(event);
  }

  isRotateClockwiseKey(event) {
    return !this.hasModifierKeys(event) && (event.code === "KeyE"
        || event.code === "Numpad9");
  }

  isRotateCounterClockwiseKey(event) {
    return !this.hasModifierKeys(event) && (event.code === "KeyQ"
        || event.code === "Numpad7");
  }

  hasModifierKeys(event) {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  isSaveStateKey(event) {
    return event.code === "KeyS" && (event.ctrlKey || event.metaKey)
          && !event.altKey && !event.shiftKey;
  }

  isLoadStateKey(event) {
    return event.code === "KeyL" && (event.ctrlKey || event.metaKey)
          && !event.altKey && !event.shiftKey;
  }

  isUndoKey(event) {
    return event.code === "KeyZ" && (event.ctrlKey || event.metaKey)
          && !event.altKey && !event.shiftKey
          || !this.hasModifierKeys(event) && event.code === "Backspace";
  }

  isRestartKey(event) {
    return !this.hasModifierKeys(event) && event.code === "KeyR";
  }

  isActivationKey(event) {
    return !this.hasModifierKeys(event) && (event.code === "Space"
        || event.code === "Enter" || event.code === "NumpadEnter");
  }

  // Shift is no good because of tabbing backwards to/from the canvas (such as from the volume button).
  // CMD/CTRL is no good because of save and other shortcuts using it.
  // Alt is no good because it moves focus to the browser menu and can't be prevented.
  isModeToggleKey(event) {
    return !this.hasModifierKeys(event) && (event.code === "Backquote"
        || event.code === "Slash" || event.code === "Numpad0");
  }
}

// Create singleton instance
const keyboardManager = new KeyboardManager();
export default keyboardManager;
