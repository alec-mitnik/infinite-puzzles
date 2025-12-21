import router from "./router.js";
import {
  deleteData, formatArrayAsCommaSeparatedString, loadData,
  openDialogWithTransition, saveData
} from "./utils.js";

const KEYBOARD_COMMAND_MAPPING_KEY = "keyboardCommandMapping";
const KEYBOARD_COMMAND_DEFAULT_MAPPING = {
  // Puzzle Directional Actions
  dirUp: {
    displayName: 'Direction: Up',
    commands: [
      {
        code: 'ArrowUp',
      },
      {
        code: 'KeyW',
      },
      {
        code: 'Numpad8',
      },
    ],
  },
  dirLeft: {
    displayName: 'Direction: Left',
    commands: [
      {
        code: 'ArrowLeft',
      },
      {
        code: 'KeyA',
      },
      {
        code: 'Numpad4',
      },
    ],
  },
  dirDown: {
    displayName: 'Direction: Down',
    commands: [
      {
        code: 'ArrowDown',
      },
      {
        code: 'KeyS',
      },
      {
        code: 'KeyX',
      },
      {
        code: 'Numpad5',
      },
      {
        code: 'Numpad2',
      },
    ],
  },
  dirRight: {
    displayName: 'Direction: Right',
    commands: [
      {
        code: 'ArrowRight',
      },
      {
        code: 'KeyD',
      },
      {
        code: 'Numpad6',
      },
    ],
  },
  dirUpLeft: {
    displayName: 'Direction: Up-Left',
    commands: [
      {
        code: 'KeyQ',
      },
      {
        code: 'Numpad7',
      },
    ],
  },
  dirUpRight: {
    displayName: 'Direction: Up-Right',
    commands: [
      {
        code: 'KeyE',
      },
      {
        code: 'Numpad9',
      },
    ],
  },
  dirDownLeft: {
    displayName: 'Direction: Down-Left',
    commands: [
      {
        code: 'KeyZ',
      },
      {
        code: 'Numpad1',
      },
    ],
  },
  dirDownRight: {
    displayName: 'Direction: Down-Right',
    commands: [
      {
        code: 'KeyC',
      },
      {
        code: 'Numpad3',
      },
    ],
  },

  // Puzzle Main Actions
  select: {
    displayName: 'Select',
    description: '(to fill a cell, for swapping, etc.)',
    commands: [
      {
        code: 'Space',
      },
      {
        code: 'Enter',
      },
      {
        code: 'NumpadEnter',
      },
    ],
  },
  rotateClockwise: {
    displayName: 'Rotate Clockwise',
    commands: [
      {
        code: 'KeyE',
      },
      {
        code: 'Numpad9',
      },
    ],
  },
  rotateCounterClockwise: {
    displayName: 'Rotate Counterclockwise',
    commands: [
      {
        code: 'KeyQ',
      },
      {
        code: 'Numpad7',
      },
    ],
  },
  undo: {
    displayName: 'Undo',
    commands: [
      {
        code: 'KeyZ',
        ctrlKey: true,
      },
      {
        code: 'KeyZ',
        metaKey: true,
      },
      {
        code: 'Backspace',
      },
    ],
  },
  reset: {
    displayName: 'Reset Puzzle',
    commands: [
      {
        code: 'KeyR',
      },
    ],
  },
  saveState: {
    displayName: 'Save State',
    commands: [
      {
        code: 'KeyS',
        ctrlKey: true,
      },
      {
        code: 'KeyS',
        metaKey: true,
      },
    ],
  },
  loadState: {
    displayName: 'Load State',
    commands: [
      {
        code: 'KeyL',
        ctrlKey: true,
      },
      {
        code: 'KeyL',
        metaKey: true,
      },
    ],
  },
  toggleInputMode: {
    displayName: 'Toggle Directional Input Mode',
    description: '(e.g. move the cursor vs. move a piece)',

    // Shift is no good because of tabbing backwards to/from the canvas (such as from the volume button).
    // CMD/CTRL is no good because of save and other shortcuts using it.
    // Alt is no good because it moves focus to the browser menu and can't be prevented.
    commands: [
      {
        code: 'Backquote',
      },
      {
        code: 'Slash',
      },
      {
        code: 'Numpad0',
      },
    ],
  },

  // Puzzle Page Actions
  backToHome: {
    displayName: 'Back to Home Page',
    commands: [
      {
        // Should be okay to have this, because the command is disabled while dialogs are open,
        // and since the binding key code field is editable (so that it can be required),
        // it's possible to manually type "Escape" anyway...
        code: 'Escape',
      },
      {
        code: 'KeyH',
      },
    ],
  },
  tutorial: {
    displayName: 'Tutorial',
    commands: [
      {
        code: 'KeyT',
      },
    ],
  },
  instructions: {
    displayName: 'Instructions',
    commands: [
      {
        code: 'KeyI',
      },
    ],
  },
  peekAtSolution: {
    displayName: 'Peek at Solution',
    commands: [
      {
        code: 'KeyP',
      },
    ],
  },
  newPuzzle: {
    displayName: 'New/Next Puzzle',
    commands: [
      {
        code: 'KeyN',
      },
    ],
  },
  puzzleSharingDialog: {
    displayName: 'Puzzle Sharing Dialog',
    commands: [
      {
        code: 'KeyL',
      },
    ],
  },

  // General Actions
  keyboardControlsDialog: {
    displayName: 'Keyboard Controls Dialog',
    commands: [
      {
        code: 'KeyK',
      },
    ],
  },
  mute: {
    displayName: 'Mute/Unmute Sounds',
    commands: [
      {
        code: 'KeyM',
      },
    ],
  },
  setDifficultyTo1: {
    displayName: 'Set Difficulty to <span aria-hidden="true">😋</span> (Quick)',
    commands: [
      {
        code: 'Digit1',
      },
    ],
  },
  setDifficultyTo2: {
    displayName: 'Set Difficulty to <span aria-hidden="true">🤔</span> (Casual)',
    commands: [
      {
        code: 'Digit2',
      },
    ],
  },
  setDifficultyTo3: {
    displayName: 'Set Difficulty to <span aria-hidden="true">😤</span> (Challenging)',
    commands: [
      {
        code: 'Digit3',
      },
    ],
  },
  setDifficultyTo4: {
    displayName: 'Set Difficulty to <span aria-hidden="true">🤯</span> (Intense)',
    commands: [
      {
        code: 'Digit4',
      },
    ],
  },
};

const PUZZLE_MAIN_ACTIONS = [
  "reset", "undo", "saveState", "loadState",
  "rotateClockwise", "rotateCounterClockwise",
  "select", "toggleInputMode",
];

const PUZZLE_DIRECTIONAL_ACTIONS = [
  "dirUp", "dirLeft", "dirDown", "dirRight",
  "dirUpLeft", "dirUpRight", "dirDownLeft", "dirDownRight",
];

const PUZZLE_PAGE_ACTIONS = [
  "backToHome", "tutorial", "instructions", "peekAtSolution",
  "newPuzzle", "puzzleSharingDialog",
];

const GENERAL_ACTIONS = [
  "keyboardControlsDialog", "mute", "setDifficultyTo1", "setDifficultyTo2",
  "setDifficultyTo3", "setDifficultyTo4",
];

function getLabelForKeyCode(keyCode) {
  // Add spaces between terms
  return keyCode.replace(/([A-Z|0-9])/g, ' $1').trim();
}

function getLabelForCommandInputs(command) {
  if (!command) {
    return 'NO MAPPED COMMAND';
  }

  const components = [];

  if (command.ctrlKey) {
    components.push('Control');
  }
  if (command.metaKey) {
    components.push('Command/Windows');
  }
  if (command.altKey) {
    components.push('Alt/Option');
  }
  if (command.shiftKey) {
    components.push('Shift');
  }

  components.push(getLabelForKeyCode(command.code));
  return components.join(' + ');
}

function makeFallbackKeyboardControlsDialogBindingDisplay() {
  const command = KEYBOARD_COMMAND_DEFAULT_MAPPING.keyboardControlsDialog.commands[0];
  const commandDetails = document.createElement('dd');
  commandDetails.textContent = `${getLabelForCommandInputs(command)} (fallback to prevent lockout)`;
  return commandDetails;
}

function makeNoBindingsDisplay() {
  const noCommands = document.createElement('dd');
  noCommands.textContent = 'No Key Bindings';
  return noCommands;
}

class KeyboardManager {
  #hasKeyboardInputBeenDetected;
  #keyboardCommandMapping;
  #isCapturingKeyInput;

  constructor() {
    this.#hasKeyboardInputBeenDetected = false;
    this.updateCapturingState(false);
    this.setDefaultMappingAndLoad();
  }

  setDefaultMappingAndLoad() {
    this.#keyboardCommandMapping = structuredClone(KEYBOARD_COMMAND_DEFAULT_MAPPING);
    this.loadKeyboardCommandMapping();
  }

  updateCapturingState(newState) {
    this.#isCapturingKeyInput = newState;
    const captureButton = document.getElementById('addKeyBindingCaptureButton');
    captureButton.ariaLive = newState ? 'polite' : 'off';
    captureButton.textContent = newState ? 'Capturing...' : 'Capture Next Pressed Key';
    captureButton.ariaLabel = newState ? 'Capturing. Click again to cancel.' : null;
  }

  updateKeyBindingWarnings() {
    const nativeFunctionalityKeyCodes = ['Escape', 'ControlLeft', 'ControlRight',
        'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'Tab'];

    const alreadyInUseWarning = document.getElementById('addKeyBindingAlreadyInUseWarning');
    const notRecommendedWarning = document.getElementById('addKeyBindingNotRecommendedWarning');
    const form = document.getElementById('addKeyBindingForm');
    const formData = new FormData(form);
    const actionsAlreadyUsingBinding = [];

    for (const action of Object.values(this.#keyboardCommandMapping)) {
      for (const command of action.commands) {
        if (command.code === formData.get('code')
            && !!command.ctrlKey === !!formData.get('ctrlKey')
            && !!command.altKey === !!formData.get('altKey')
            && !!command.metaKey === !!formData.get('metaKey')
            && !!command.shiftKey === !!formData.get('shiftKey')) {
          actionsAlreadyUsingBinding.push(action);
        }
      }
    }

    if (actionsAlreadyUsingBinding.length) {
      // Binding already in use
      const actionNames = actionsAlreadyUsingBinding.map(action => action.displayName);
      const uniqueActionNames = Array.from(new Set(actionNames));
      document.getElementById('addKeyBindingAlreadyInUseWarningAction').textContent =
          formatArrayAsCommaSeparatedString(uniqueActionNames);
      alreadyInUseWarning.classList.remove('hidden');
    } else {
      alreadyInUseWarning.classList.add('hidden');
    }

    if (nativeFunctionalityKeyCodes.includes(formData.get('code'))) {
      // Not recommended
      notRecommendedWarning.classList.remove('hidden');
    } else {
      notRecommendedWarning.classList.add('hidden');
    }
  }

  init() {
    const remapButton = document.getElementById('keyboardControlsRemapButton');
    const doneRemappingButton = document.getElementById('keyboardControlsDoneRemappingButton');
    const keyboardControlsDialog = document.getElementById('keyboardControlsDialog');

    // Ensure a details summary stays in view when expanded
    // even if it causes another details section to collapse
    keyboardControlsDialog.querySelectorAll('details').forEach(details => {
      const summary = details.querySelector('summary');

      details.addEventListener('toggle', () => {
        if (details.open) {
          requestAnimationFrame(() => {
            summary.scrollIntoView({
              block: 'nearest',
            });
          });
        }
      });
    });

    remapButton.addEventListener('click', () => {
      this.populateAllKeyboardControls(true);

      // Make sure at least one section is expanded to show that the remapping buttons are now available
      const allDetails = [...keyboardControlsDialog.querySelectorAll('details')];

      if (allDetails.every(details => !details.open)) {
        allDetails[0].open = true;
      }

      requestAnimationFrame(() => doneRemappingButton.focus());
    });

    doneRemappingButton.addEventListener('click', () => {
      this.populateAllKeyboardControls(false);
      requestAnimationFrame(() => remapButton.focus());
    })

    document.getElementById('keyboardControlsResetButton').addEventListener('click', async () => {
      if (await router.getConfirmation('This cannot be undone.', 'Reset Keyboard Controls?')) {
        deleteData(KEYBOARD_COMMAND_MAPPING_KEY);

        // Match the constructor logic
        this.setDefaultMappingAndLoad();

        this.populateAllKeyboardControls(false);
        this.updatePuzzleInstructionsIfShowing();
      }
    });

    const captureKey = event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const input = document.getElementById("addKeyBindingCodeInput");
      input.value = event.code;

      this.updateCapturingState(false);
      this.updateKeyBindingWarnings();
      input.focus();
    }

    const addKeyBindingDialog = document.getElementById('addKeyBindingDialog');

    addKeyBindingDialog.addEventListener('close', () => {
      this.updateCapturingState(false);
      addKeyBindingDialog.removeEventListener('keydown', captureKey);
    });

    document.getElementById('addKeyBindingCaptureButton').addEventListener('click', () => {
      if (!this.#isCapturingKeyInput) {
        this.updateCapturingState(true);
        addKeyBindingDialog.addEventListener('keydown', captureKey, { once: true });
      } else {
        addKeyBindingDialog.removeEventListener('keydown', captureKey);
        this.updateCapturingState(false);
      }
    });

    document.getElementById('addKeyBindingCodeInput').addEventListener('input', () => {
      this.updateKeyBindingWarnings();
    });

    document.getElementById('addKeyBindingModifierKeysFieldset')
        .querySelectorAll('input[type=checkbox]').forEach(input => {
      input.addEventListener('change', () => {
        this.updateKeyBindingWarnings();
      });
    });
  }

  updatePuzzleInstructionsIfShowing() {
    // Do this in case a change to the Keyboard Controls Dialog binding
    // needs to be reflected in the puzzle instructions
    if (this.shouldShowKeyboardControls() && router.currentPuzzle
        && router.puzzleState.showingInstructions) {
      router.currentPuzzle.drawInstructions(true);
    }
  }

  keyboardInputDetected() {
    this.#hasKeyboardInputBeenDetected = true;
  }

  shouldShowKeyboardControls() {
    // Use a threshold that's larger than phones in landscape orientation
    return this.#hasKeyboardInputBeenDetected || screen.width >= 1024;
  }

  loadKeyboardCommandMapping() {
    // Load the defaults initially in the constructor and when resetting,
    // but use the existing values as the fallbacks in case local storage fails
    const loadedMapping = JSON.parse(loadData(KEYBOARD_COMMAND_MAPPING_KEY,
        JSON.stringify(this.#keyboardCommandMapping)));

    for (const actionKey in loadedMapping) {
      if (this.#keyboardCommandMapping[actionKey]) {
        this.#keyboardCommandMapping[actionKey].commands = loadedMapping[actionKey].commands;
      }
    }
  }

  saveKeyboardCommandMapping() {
    saveData(KEYBOARD_COMMAND_MAPPING_KEY, JSON.stringify(this.#keyboardCommandMapping));
  }

  populateControlsList(controlsListId, actionNames, inEditMode) {
    const controlsList = document.getElementById(controlsListId);

    if (!controlsList || !actionNames?.length) {
      return;
    }

    controlsList.innerText = '';

    for (let j = 0; j < actionNames.length; j++) {
      const actionName = actionNames[j];
      const descriptionItemContainer = document.createElement('div');
      descriptionItemContainer.classList.add('descriptions-container');
      controlsList.appendChild(descriptionItemContainer);

      const action = this.#keyboardCommandMapping[actionName];

      if (!action) {
        console.error('No action found for action name:', actionName);
        continue;
      }

      const actionTerm = document.createElement('dt');
      actionTerm.innerHTML = action.displayName;
      descriptionItemContainer.appendChild(actionTerm);

      if (action.description) {
        actionTerm.textContent += ' ';

        const actionDescription = document.createElement('span');
        actionDescription.classList.add('action-description');
        actionDescription.textContent = action.description;
        actionTerm.appendChild(actionDescription);
      }

      if (action.commands.length) {
        for (const command of action.commands) {
          const commandDetails = document.createElement('dd');
          commandDetails.textContent = getLabelForCommandInputs(command);
          descriptionItemContainer.appendChild(commandDetails);

          if (inEditMode) {
            const removeCommandButton = document.createElement('button');
            removeCommandButton.classList.add('remove-command-button');
            removeCommandButton.innerHTML =
`<svg aria-hidden="true" viewBox="-0 0 100 100" class="remove-icon">
  <use href="#remove-icon" />
</svg>`;
            removeCommandButton.ariaLabel = `Remove Key Binding "${
                commandDetails.textContent}" for ${action.displayName}.`;
            removeCommandButton.addEventListener('click', () => {
              // Can't use loop index, because it becomes outdated after a removal
              action.commands.splice(action.commands.indexOf(command), 1);
              this.saveKeyboardCommandMapping();

              // This causes focus to be lost
              // this.populateAllKeyboardControls(inEditMode);

              if (action.displayName === KEYBOARD_COMMAND_DEFAULT_MAPPING
                  .keyboardControlsDialog.displayName) {
                this.updatePuzzleInstructionsIfShowing();

                if (!action.commands.length) {
                  // Show that the default command is used as a fallback
                  const fallbackCommandDetails = makeFallbackKeyboardControlsDialogBindingDisplay();
                  descriptionItemContainer.insertBefore(fallbackCommandDetails, commandDetails);
                }
              } else if (!action.commands.length) {
                const noCommands = makeNoBindingsDisplay();
                descriptionItemContainer.insertBefore(noCommands, commandDetails);
              }

              commandDetails.remove();
              this.updateResetButton();
            });

            commandDetails.appendChild(removeCommandButton);
          }
        }
      } else if (action.displayName === KEYBOARD_COMMAND_DEFAULT_MAPPING
          .keyboardControlsDialog.displayName) {
        // Show that the default command is used as a fallback
        const fallbackCommandDetails = makeFallbackKeyboardControlsDialogBindingDisplay();
        descriptionItemContainer.appendChild(fallbackCommandDetails);
      } else {
        const noCommands = makeNoBindingsDisplay();
        descriptionItemContainer.appendChild(noCommands);
      }

      if (inEditMode) {
        const addCommandButtonDetails = document.createElement('dd');
        descriptionItemContainer.appendChild(addCommandButtonDetails);

        // Call it "Key Bindings" so as not to be confused with the "Command" key
        const addCommandButton = document.createElement('button');
        addCommandButton.classList.add('add-command-button');
        addCommandButton.textContent = 'Add Key Binding';
        addCommandButton.ariaLabel = `Add Key Binding for ${action.displayName}.`;
        addCommandButton.addEventListener('click', () => {
          this.openAddKeyBindingDialog(actionName, controlsListId, j);
        });
        addCommandButtonDetails.appendChild(addCommandButton);
      }
    }

    const remapButton = document.getElementById('keyboardControlsRemapButton');
    const doneRemappingButton = document.getElementById('keyboardControlsDoneRemappingButton');

    if (inEditMode) {
      remapButton.classList.add('hidden');
      doneRemappingButton.classList.remove('hidden');
    } else {
      remapButton.classList.remove('hidden');
      doneRemappingButton.classList.add('hidden');
    }

    this.updateResetButton();
  }

  updateResetButton() {
    // Only show the reset button if the current mapping is different from the default
    const resetButton = document.getElementById('keyboardControlsResetButton');
    const changedFromDefault = JSON.stringify(this.#keyboardCommandMapping)
        !== JSON.stringify(KEYBOARD_COMMAND_DEFAULT_MAPPING);

    if (changedFromDefault) {
      resetButton.classList.remove('hidden');
    } else {
      resetButton.classList.add('hidden');
    }
  }

  populateAllKeyboardControls(inEditMode = false) {
    this.populateControlsList('keyboardControlsGeneralControlsContent', GENERAL_ACTIONS, inEditMode);
    this.populateControlsList('keyboardControlsPuzzlePageControlsContent', PUZZLE_PAGE_ACTIONS, inEditMode);
    this.populateControlsList('keyboardControlsPuzzleControlsContent', PUZZLE_MAIN_ACTIONS, inEditMode);
    this.populateControlsList('keyboardControlsPuzzleDirectionalControlsContent', PUZZLE_DIRECTIONAL_ACTIONS, inEditMode);
  }

  toggleKeyboardControlsDialog() {
    const keyboardControlsDialog = document.getElementById('keyboardControlsDialog');

    if (!keyboardControlsDialog.open) {
      this.populateAllKeyboardControls();
      keyboardControlsDialog.querySelectorAll('details').forEach(details => details.open = false);
      openDialogWithTransition(keyboardControlsDialog);
    } else {
      keyboardControlsDialog.close();
    }
  }

  openAddKeyBindingDialog(actionName, controlsListId, actionIndex) {
    const action = this.#keyboardCommandMapping[actionName];

    if (!action) {
      console.error('No action found for:', actionName);
      return;
    }

    const onAddKeyBindingSubmit = event => {
      const form = event.currentTarget;
      const formData = new FormData(form);

      this.#keyboardCommandMapping[actionName].commands.push(Object.fromEntries(
        [...formData.entries()].map(([key, val]) =>
          [key, key === 'code' ? val : true]
        )
      ));

      this.saveKeyboardCommandMapping();
      this.populateAllKeyboardControls(true);

      // Restore focus to the reconstructed Add Key Binding opener button
      requestAnimationFrame(() => {
        document.getElementById(controlsListId)
            .querySelectorAll('.descriptions-container')[actionIndex]
            .querySelector('.add-command-button').focus();
      });

      if (action.displayName === KEYBOARD_COMMAND_DEFAULT_MAPPING
          .keyboardControlsDialog.displayName) {
        this.updatePuzzleInstructionsIfShowing();
      }
    }

    const addKeyBindingDialog = document.getElementById('addKeyBindingDialog');
    document.getElementById('addKeyBindingDescription').textContent =
        `for ${action.displayName}`;

    addKeyBindingDialog.querySelectorAll('.warning').forEach(warning => {
      warning.classList.add('hidden')
    });

    const addKeyBindingForm = document.getElementById('addKeyBindingForm');
    addKeyBindingForm.reset();
    addKeyBindingForm.addEventListener('submit', onAddKeyBindingSubmit, { once: true });
    addKeyBindingDialog.addEventListener('close', () => {
      addKeyBindingForm.removeEventListener('submit', onAddKeyBindingSubmit);
    }, { once: true });

    openDialogWithTransition(addKeyBindingDialog);
  }

  doesKeydownEventMatchActionMapping(event, action) {
    return action?.commands?.some(command => {
      return command.code === event.code
          && !!command.ctrlKey === event.ctrlKey
          && !!command.altKey === event.altKey
          && !!command.metaKey === event.metaKey
          && !!command.shiftKey === event.shiftKey;
    });
  }

  // Used for showing Keyboard Controls Dialog binding in the puzzle instructions
  getLabelForFirstActionCommandInputs(actionName, require = false) {
    let command = this.#keyboardCommandMapping[actionName]?.commands?.[0];

    if (!command && require) {
      command = KEYBOARD_COMMAND_DEFAULT_MAPPING[actionName]?.commands?.[0];

      if (!command) {
        console.error('No default command found for action:', actionName);
      }
    }

    return getLabelForCommandInputs(command);
  }

  // Key Binding Checks

  hasModifierKeys(event) {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  isRightDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirRight);
  }

  isLeftDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirLeft);
  }

  isUpDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirUp);
  }

  isDownDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirDown);
  }

  isUpLeftDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirUpLeft);
  }

  isUpRightDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirUpRight);
  }

  isDownLeftDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirDownLeft);
  }

  isDownRightDirKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.dirDownRight);
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
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.rotateClockwise);
  }

  isRotateCounterClockwiseKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.rotateCounterClockwise);
  }

  isSaveStateKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.saveState);
  }

  isLoadStateKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.loadState);
  }

  isUndoKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.undo);
  }

  isRestartKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.reset);
  }

  isSelectKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.select);
  }

  isModeToggleKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.toggleInputMode);
  }

  isBackToHomeKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.backToHome)
        && !document.querySelector('dialog[open]');
  }

  isTutorialKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.tutorial)
        && !document.querySelector('dialog[open]');
  }

  isInstructionsKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.instructions)
        && !document.querySelector('dialog[open]');
  }

  isPeekAtSolutionKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.peekAtSolution)
        && !document.querySelector('dialog[open]');
  }

  isNewPuzzleKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.newPuzzle)
        && !document.querySelector('dialog[open]');
  }

  isPuzzleSharingDialogKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.puzzleSharingDialog)
        && !document.querySelector('dialog[open]');
  }

  isKeyboardControlsDialogKey(event) {
    // Disable this command while a dialog is open (especially the Add Key Binding dialog)
    if (document.querySelector('dialog[open]')) {
      return false;
    }

    let action = this.#keyboardCommandMapping.keyboardControlsDialog;

    if (!action?.commands?.length) {
      // No other way to open the keyboard controls dialog,
      // so apply the default command as a fallback
      action = KEYBOARD_COMMAND_DEFAULT_MAPPING.keyboardControlsDialog;
    }

    return this.doesKeydownEventMatchActionMapping(event, action);
  }

  isMuteKey(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.mute);
  }

  isSetDifficultyTo1Key(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.setDifficultyTo1)
        && !document.querySelector('dialog[open]');
  }
  isSetDifficultyTo2Key(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.setDifficultyTo2)
        && !document.querySelector('dialog[open]');
  }
  isSetDifficultyTo3Key(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.setDifficultyTo3)
        && !document.querySelector('dialog[open]');
  }
  isSetDifficultyTo4Key(event) {
    return this.doesKeydownEventMatchActionMapping(event, this.#keyboardCommandMapping.setDifficultyTo4)
        && !document.querySelector('dialog[open]');
  }
}

// Create singleton instance
const keyboardManager = new KeyboardManager();
export default keyboardManager;
