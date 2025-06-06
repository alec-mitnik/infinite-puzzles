import audioManager from "../js/audio-manager.js";
import { ALERT_COLOR, BACKGROUND_COLOR, CANVAS_HEIGHT, CANVAS_WIDTH, SUCCESS_COLOR } from "../js/config.js";
import { deepCopy, drawInstructionsHelper, endPuzzle, finishedLoading, getPuzzleCanvas, onMiddleMouseDown, onMiddleMouseUp, randomIndex, updateForTutorialRecommendation, updateForTutorialState } from "../js/utils.js";

const GRID_SIZE = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 3 / 5;
const RULES_SIZE = 40;
const LINE_THICKNESS = 6;

//  const GREEK_LETTERS = "αβγδεζηθικλμνξοπρσςτυφχψω";
const GREEK_LETTERS = "δζξλπφσςβψ";
const SHAPE_SYMBOLS = "▲\uFE0E;◼\uFE0E;◆\uFE0E;▼\uFE0E;⬟\uFE0E;⬣\uFE0E";
const CHESS_SYMBOLS = "♚\uFE0E;♛\uFE0E;♜\uFE0E;♞\uFE0E;♝\uFE0E;♟\uFE0E;♔\uFE0E;♕\uFE0E;♖\uFE0E;♘\uFE0E;♗\uFE0E;♙\uFE0E";
const DIGITS = "1234567890";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SYMBOL_SETS = [DIGITS, LETTERS, SHAPE_SYMBOLS, CHESS_SYMBOLS, GREEK_LETTERS];

const CLINK_SOUND = audioManager.SoundEffects.CLINK;
const SNAP_SOUND = audioManager.SoundEffects.CLICK;
const CHIME_SOUND = audioManager.SoundEffects.CHIME;

const tutorials = [
  {
    rows: 2,
    cols: 3,
    nodes: [
      {
        id: SYMBOL_SETS[0].charAt(0),
        fixed: true,
        // CELL_SIZE = GRID_SIZE / Math.max(ROWS, COLS);
        // x: (i + 0.5) * CELL_SIZE,
        // y: (j + 0.5) * CELL_SIZE,
        x: 0.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(1),
        fixed: true,
        x: 1.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(2),
        fixed: true,
        x: 2.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[0],
        fixed: true,
        x: 0.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[2],
        fixed: false,
        x: 1.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[1],
        fixed: false,
        x: 2.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {
          // Turns out these aren't necessary after generation
          [0]: SYMBOL_SETS[0].charAt(2),
        },
      },
    ],
    displayedRules: [
      {
        node: getRowSymbols(1, 3)[1],
        negation: false,
        row: 1, // Only seems to be used for XOR rules
        value: SYMBOL_SETS[0].charAt(2),
        offset: 0, // Only seems to be used for XOR rules
      },
    ],
  },
  {
    rows: 2,
    cols: 3,
    nodes: [
      {
        id: SYMBOL_SETS[0].charAt(0),
        fixed: true,
        x: 0.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(1),
        fixed: true,
        x: 1.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(2),
        fixed: true,
        x: 2.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[0],
        fixed: true,
        x: 0.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[1],
        fixed: false,
        x: 1.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {
          ['not' + 0]: [SYMBOL_SETS[0].charAt(2)],
        },
      },
      {
        id: getRowSymbols(1, 3)[2],
        fixed: false,
        x: 2.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
    ],
    displayedRules: [
      {
        node: getRowSymbols(1, 3)[1],
        negation: true,
        row: 1,
        value: SYMBOL_SETS[0].charAt(2),
        offset: 0,
      },
    ],
  },
  {
    rows: 3,
    cols: 3,
    nodes: [
      {
        id: SYMBOL_SETS[0].charAt(0),
        fixed: true,
        x: 0.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(1),
        fixed: true,
        x: 1.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(2),
        fixed: true,
        x: 2.5 * GRID_SIZE / 3,
        y: 0.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[2],
        fixed: true,
        x: 0.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[1],
        fixed: false,
        x: 1.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(1, 3)[0],
        fixed: false,
        x: 2.5 * GRID_SIZE / 3,
        y: 1.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {
          [0]: SYMBOL_SETS[0].charAt(2),
        },
      },
      {
        id: getRowSymbols(2, 3)[0],
        fixed: true,
        x: 0.5 * GRID_SIZE / 3,
        y: 2.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(2, 3)[1],
        fixed: false,
        x: 1.5 * GRID_SIZE / 3,
        y: 2.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {
          [1]: getRowSymbols(1, 3)[1],
        },
      },
      {
        id: getRowSymbols(2, 3)[2],
        fixed: false,
        x: 2.5 * GRID_SIZE / 3,
        y: 2.5 * GRID_SIZE / 3,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
    ],
    displayedRules: [
      {
        node: getRowSymbols(1, 3)[0],
        negation: false,
        row: 1,
        value: SYMBOL_SETS[0].charAt(2),
        offset: 0,
      },
      {
        node: getRowSymbols(2, 3)[1],
        negation: false,
        row: 1,
        value: getRowSymbols(1, 3)[1],
        offset: 0,
      },
    ],
  },
  {
    rows: 3,
    cols: 4,
    nodes: [
      {
        id: SYMBOL_SETS[0].charAt(0),
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(1),
        fixed: true,
        x: 1.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(2),
        fixed: true,
        x: 2.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(3),
        fixed: true,
        x: 3.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[2],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[3],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[0],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[1],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[0],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[2],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[3],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[1],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
    ],
    displayedRules: [
      {
        node: getRowSymbols(2, 4)[2],
        negation: false,
        row: 1,
        value: SYMBOL_SETS[0].charAt(1),
        offset: 0,
      },
      {
        node: getRowSymbols(2, 4)[2],
        negation: false,
        row: 1,
        value: getRowSymbols(1, 4)[3],
        offset: 0,
      },
      {
        node: getRowSymbols(1, 4)[0],
        negation: true,
        row: 1,
        value: SYMBOL_SETS[0].charAt(3),
        offset: 0,
      },
      {
        node: getRowSymbols(2, 4)[1],
        negation: false,
        row: 1,
        value: getRowSymbols(1, 4)[1],
        offset: 0,
      },
    ],
  },
  {
    rows: 3,
    cols: 4,
    nodes: [
      {
        id: SYMBOL_SETS[0].charAt(0),
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(1),
        fixed: true,
        x: 1.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(2),
        fixed: true,
        x: 2.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(3),
        fixed: true,
        x: 3.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[0],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[2],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[3],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[1],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[3],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[0],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[1],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[2],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
    ],
    displayedRules: [
      {
        node: getRowSymbols(1, 4)[2],
        negation: true,
        row: 1,
        value: SYMBOL_SETS[0].charAt(3),
        offset: 0,
      },
      {
        node: getRowSymbols(1, 4)[3],
        negation: true,
        row: 1,
        value: SYMBOL_SETS[0].charAt(3),
        offset: 0,
      },
      {
        node: getRowSymbols(1, 4)[3],
        negation: true,
        row: 1,
        value: SYMBOL_SETS[0].charAt(1),
        offset: 0,
      },
      {
        node: getRowSymbols(2, 4)[0],
        negation: true,
        row: 1,
        value: getRowSymbols(1, 4)[3],
        offset: 0,
      },
      {
        node: getRowSymbols(2, 4)[2],
        negation: true,
        row: 1,
        value: getRowSymbols(1, 4)[3],
        offset: 0,
      },
      {
        node: getRowSymbols(2, 4)[2],
        negation: true,
        row: 1,
        value: SYMBOL_SETS[0].charAt(1),
        offset: 0,
      },
    ],
  },
  {
    rows: 4,
    cols: 4,
    nodes: [
      {
        id: SYMBOL_SETS[0].charAt(0),
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(1),
        fixed: true,
        x: 1.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(2),
        fixed: true,
        x: 2.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: SYMBOL_SETS[0].charAt(3),
        fixed: true,
        x: 3.5 * GRID_SIZE / 4,
        y: 0.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[0],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[3],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[0],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {
          [0]: SYMBOL_SETS[0].charAt(1),
        },
      },
      {
        id: getRowSymbols(1, 4)[1],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {},
      },
      {
        id: getRowSymbols(1, 4)[2],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 1.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[1],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[2],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[3],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {},
      },
      {
        id: getRowSymbols(2, 4)[0],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {
          [0]: SYMBOL_SETS[0].charAt(2),
        },
      },
      {
        id: getRowSymbols(2, 4)[1],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 2.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[2],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {
          [1]: getRowSymbols(1, 4)[2],
        },
      },
      {
        id: getRowSymbols(3, 4)[1],
        fixed: true,
        x: 0.5 * GRID_SIZE / 4,
        y: 3.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[3],
        col: SYMBOL_SETS[0].charAt(0),
        rules: {},
      },
      {
        id: getRowSymbols(3, 4)[2],
        fixed: false,
        x: 1.5 * GRID_SIZE / 4,
        y: 3.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[3],
        col: SYMBOL_SETS[0].charAt(1),
        rules: {
          [2]: getRowSymbols(2, 4)[3],
        },
      },
      {
        id: getRowSymbols(3, 4)[0],
        fixed: false,
        x: 2.5 * GRID_SIZE / 4,
        y: 3.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[3],
        col: SYMBOL_SETS[0].charAt(2),
        rules: {
          [1]: getRowSymbols(1, 4)[1],
        },
      },
      {
        id: getRowSymbols(3, 4)[3],
        fixed: false,
        x: 3.5 * GRID_SIZE / 4,
        y: 3.5 * GRID_SIZE / 4,
        row: SYMBOL_SETS[3],
        col: SYMBOL_SETS[0].charAt(3),
        rules: {
          [0]: SYMBOL_SETS[0].charAt(3),
        },
      },
    ],
    displayedRules: [
      {
        node: getRowSymbols(2, 4)[0],
        negation: false,
        row: 1,
        value: SYMBOL_SETS[0].charAt(2),
        offset: 0,
      },
      {
        node: getRowSymbols(3, 4)[0],
        negation: false,
        row: 1,
        value: getRowSymbols(1, 4)[1],
        offset: 0,
      },
      {
        node: getRowSymbols(3, 4)[3],
        negation: false,
        row: 1,
        value: SYMBOL_SETS[0].charAt(3),
        offset: 0,
      },
      {
        node: getRowSymbols(1, 4)[0],
        negation: false,
        row: 1,
        value: SYMBOL_SETS[0].charAt(1),
        offset: 0,
      },
      {
        node: getRowSymbols(3, 4)[2],
        negation: false,
        row: 1,
        value: getRowSymbols(2, 4)[3],
        offset: 0,
      },
    ],
  },
];

let DIFFICULTY;
let ROWS;
let COLS;
let USE_XOR;
let CELL_SIZE;
let GRID_WIDTH;
let GRID_HEIGHT;
let NODE_SIZE;

let solution;
let dragging = null;
let previousTouch = null;
let displayedRules = [];
let nodes = [];
let queuedSounds = [];
let isGenerating = false;
let timeoutForAbortingGeneration = null;
let generationStepCount = 0;

function getRowSymbols(rowIndex, cols = COLS) {
  let splitChar = SYMBOL_SETS[rowIndex].indexOf(';') > -1;
  let sliceIndex = cols;

  if (splitChar) {
    let n = cols;
    sliceIndex = -1;

    while (n-- && sliceIndex++ < SYMBOL_SETS[rowIndex].length) {
      sliceIndex = SYMBOL_SETS[rowIndex].indexOf(';', sliceIndex);
      if (sliceIndex < 0) {
        sliceIndex = SYMBOL_SETS[rowIndex].length;
        break;
      }
    }
  }

  return SYMBOL_SETS[rowIndex].slice(0, sliceIndex).split(splitChar ? ';' : '');
}

function generateLogic() {
  for (let j = 0; j < ROWS; j++) {
    let symbolSet = getRowSymbols(j);
    let orderedNodes = [];

    for (let i = 0; i < COLS; i++) {
      let symbol = j > 0 ? symbolSet.splice(randomIndex(symbolSet), 1)[0]
          : SYMBOL_SETS[0].charAt(i);
      let rules = {};

      for (let k = 0; k < ROWS; k++) {
        rules[k] = null;
        rules['not'+k] = [];
      }

      if (j > 0 && i > 0) {
        rules[0] = SYMBOL_SETS[0].charAt(i);
      }

      orderedNodes.push({
        id: symbol,
        fixed: j === 0 || i === 0,
        x: (i + 0.5) * CELL_SIZE,
        y: (j + 0.5) * CELL_SIZE,
        row: SYMBOL_SETS[j],
        col: SYMBOL_SETS[0].charAt(i),
        rules,
      })
    }

    // Shuffle the data order so the draw order won't reveal the solution
    while (orderedNodes.length > 0) {
      nodes.push(orderedNodes.splice(randomIndex(orderedNodes), 1)[0]);
    }
  }

  let nodesToObscure = nodes.filter(node => !node.fixed);

  setTimeout(() => {
    if (timeoutForAbortingGeneration) {
      return;
    }

    obscureNodes(nodesToObscure);
  });
}

async function obscureNodes(nodesToObscure, tries = 0) {
  // console.log("Obscuring...");

  if (nodesToObscure.length > 0 && tries < 100) {
    tries++;
    let idsChecked = {};
    let index = randomIndex(nodesToObscure);
    let node = nodesToObscure[index];

//      let pos = await narrowColumnPossibilities(node);
//      console.log(node.id, pos);
//
//      if (pos.length > 1) {
//        console.error("ERROR");
//      }

    node.rules[0] = null;

    let colPossibilities = await narrowColumnPossibilities(node, idsChecked);
    idsChecked[node.id] = colPossibilities;

    let derived = colPossibilities.length === 1;

    // If the node has two possible columns, and a node in the
    // wrong column can be derived, add a not rule for that node
    if (colPossibilities.length === 2) {
      let notCol = colPossibilities.filter(id => id !== node.col)[0];
      let notColNodes = nodes.filter(oNode => {
        return notCol === oNode.col && !oNode.fixed;
      });

      while (notColNodes.length > 0) {
        let notNode = notColNodes.splice(randomIndex(notColNodes), 1)[0];

        let notPos = await narrowColumnPossibilities(notNode, idsChecked);
        idsChecked[notNode.id] = notPos;

        if (notPos.length === 1) {
          node.rules['not'+SYMBOL_SETS.indexOf(notNode.row)]
              .push(notNode.id);
          //console.log("Z");
          derived = true;
          break;
        }
      }

      //if (derived) {
      //  let pos = await narrowColumnPossibilities(node);
      //  console.log(node.id, pos);
//
      //  if (pos.length > 1) {
      //    console.error("ERROR");
      //  }
      //}
    }

    if (!derived) {
      if (Math.random() < 0.5) {
        // Gather all the row neighbors
        let rowNeighbors = nodes.filter(otherNode => {
          return otherNode.id !== node.id && otherNode.row === node.row
              && !otherNode.fixed;
        });

        derived = true;

        while (rowNeighbors.length > 0) {
          let rowNeighbor = rowNeighbors.splice(randomIndex(rowNeighbors), 1)[0];

          let rowPos = await narrowColumnPossibilities(rowNeighbor, idsChecked);
          idsChecked[rowNeighbor.id] = rowPos;

          // For any row neighbor that can't exclude the node's column,
          // gather its column neighbors
          if (rowPos.indexOf(node.col) > -1) {
            let colNeighbors = nodes.filter(oNode => {
              return rowNeighbor.id !== oNode.id
                  && rowNeighbor.col === oNode.col
                  && !oNode.fixed;
            });

            let colDerived = false;

            // Try to find a column neighbor that can exclude the
            // node's column, and add a rule to the row neighbor for it
            while (colNeighbors.length > 0) {
              let colNeighbor = colNeighbors.splice(randomIndex(colNeighbors), 1)[0];
              let colPos = await narrowColumnPossibilities(colNeighbor, idsChecked);

              idsChecked[colNeighbor.id] = colPos;

              if (colPos.indexOf(node.col) < 0) {
                let rowIndex = SYMBOL_SETS.indexOf(colNeighbor.row);
                rowNeighbor.rules[rowIndex] = colNeighbor.id;
                // Make sure to remove now redundant not rules
                // TODO - there are more than just these!!!
                rowNeighbor.rules['not'+rowIndex] = [];
                colDerived = true;
                break;
              }
            }

            // If no column neighbor can be derived, just add
            // a not rule for the node column to the row neighbor
            if (!colDerived) {
              rowNeighbor.rules['not0'].push(node.col);
            }
          }
        }

        //console.log("A");
//          let pos = await narrowColumnPossibilities(node);
//          console.log(node.id, pos);
//
//          if (pos.length > 1) {
//            console.error("ERROR");
//          }
      } else {
        let colNeighbors = nodes.filter(oNode => {
          return node.id !== oNode.id && node.col === oNode.col
              && !oNode.fixed;
        });

        derived = false;

        let col2Pos = [];

        // Try to find a column neighbor that can eliminate all wrong
        // possibilities, and add a rule for it to the node
        while (colNeighbors.length > 0) {
          let colNeighbor = colNeighbors.splice(randomIndex(colNeighbors), 1)[0];
          let oRowIndex = SYMBOL_SETS.indexOf(colNeighbor.row);

          let colPos = await narrowColumnPossibilities(colNeighbor, idsChecked);
          idsChecked[colNeighbor.id] = colPos;

          let filteredColPos = colPos.filter(id => colPos.indexOf(id) > -1);

          if (filteredColPos.length === 1) {
            node.rules[oRowIndex] = colNeighbor.id;
            // Make sure to remove now redundant not rules
            // TODO - there are more than just these!!!
            node.rules['not'+oRowIndex] = [];
            //console.log("D");
            derived = true;
            break;
          } else if (colPos.length === 2) {
            // Store column nodes that have 2 total possibilities
            // so we can fall back on them later
            col2Pos.push([colNeighbor, colPos]);
          }
        }

        // If no column neighbor can eliminate all wrong possibilities,
        // then if any have just two total possibilities, search the nodes
        // in the other column
        if (!derived && col2Pos.length > 0) {
          let colNeighbor = col2Pos[0][0];
          let colPos = col2Pos[0][1];
          let notCol = colPos.filter(id => id !== colNeighbor.col)[0];
          let notColNodes = nodes.filter(oNode => {
            return notCol === oNode.col && !oNode.fixed;
          });

          // If any node in the other column can be derived,
          // add a not rule for it to the column neighbor, and a rule
          // for the original column node to the original node
          while (notColNodes.length > 0) {
            let notNode = notColNodes.splice(randomIndex(notColNodes), 1)[0];

            let notPos = await narrowColumnPossibilities(notNode, idsChecked);
            idsChecked[notNode.id] = notPos;

            if (notPos.length === 1) {
              let oRowIndex = SYMBOL_SETS.indexOf(colNeighbor.row);

              colNeighbor.rules['not'+SYMBOL_SETS.indexOf(notNode.row)].push(notNode.id);

              // TODO - this sometimes might not be needed after the not rule above...
              node.rules[oRowIndex] = colNeighbor.id;
              // Make sure to remove now redundant not rules
              // TODO - there are more than just these!!!
              node.rules['not'+oRowIndex] = [];
              //console.log("C");
              //console.log(colNeighbor, "NOT", notNode.id);
              derived = true;
              break;
            }
          }
        }

        if (!derived) {
          // If no column neighbor could be derived, add the original
          // rule for the node back in, and add the node back to the list
          // to try again later
          node.rules[0] = node.col;
//            nodesToObscure.push(node);
        } else {
//            let pos = await narrowColumnPossibilities(node);
//            console.log(node.id, pos);
//
//            if (pos.length > 1) {
//              console.error("ERROR");
//            }
        }
      }
    }

    nodesToObscure.splice(index, 1);

    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      obscureNodes(nodesToObscure/* , tries */);
    });
  } else {
    //console.log("Tries:", tries);
    //console.log(nodesToObscure);

    let nodesToSimplify = nodes.filter(node => !node.fixed);

    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      simplifyNodes(nodesToSimplify);
    });
  }
}

async function simplifyNodes(nodesToSimplify) {
  // console.log("Simplifying...");

  let topLeft = getRowSymbols(0)[0];
  let firstColumnNodeIds = nodes.filter(node => node.col === topLeft).map(node => node.id);

  if (nodesToSimplify.length > 0) {
    let node = nodesToSimplify.splice(randomIndex(nodesToSimplify), 1)[0];

    let rows = Array.from({length: ROWS}, (_arr, index) => index);

    while (rows.length > 0) {
      let row = rows.splice(randomIndex(rows), 1)[0];

      /*let rule = node.rules[row];

      if (rule != null) {
        let valueNode = getNodeWithValue(rule, nodes);
        node.rules[row] = null;

        if (!(await canColumnBeDerivedForNode(node))
            || !(await canColumnBeDerivedForNode(valueNode))) {
//            node.rules['not'+row] = getRowSymbols(row).filter(symbol => symbol !== rule);
          node.rules[row] = rule;
        }
      }*/

      let notRules = node.rules['not'+row];

      for (let i = 0; i < notRules.length; i++) {
        let notRule = notRules.splice(i, 1)[0];
        let notValueNode = getNodeWithValue(notRule, nodes);
        i--;

        if (!(await canColumnBeDerivedForNode(node))
            || !(await canColumnBeDerivedForNode(notValueNode))) {
          notRules.splice(i, 0, notRule);
          i++;
        }
      }

      if (node.rules['not'+row].length >= COLS - 2) {
        //console.log("TEST", node.rules['not'+row]);
        let ruleValue = getRowSymbols(row).filter(symbol => firstColumnNodeIds.indexOf(symbol) < 0 && node.rules['not'+row].indexOf(symbol) < 0)[0];
        node.rules[row] = ruleValue;
        node.rules['not'+row] = [];
      }
    }

    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      simplifyNodes(nodesToSimplify);
    });
  } else {
    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      organizeRules();
    });
  }
}

function organizeRules() {
  // console.log("Organizing rules...");
  let rulesList = [];

  nodes.filter(node => !node.fixed).forEach(node => {
    for (let k = 0; k < ROWS; k++) {
      if (node.rules[k] !== null) {
        rulesList.push({
          node: node.id,
          negation: false,
          row: k,
          value: node.rules[k],
          offset: 0,
          });
      }

      if (node.rules['not'+k].length > 0) {
        node.rules['not'+k].forEach(rowValue => {
          rulesList.push({
            node: node.id,
            negation: true,
            row: k,
            value: rowValue,
            offset: 0,
          });
        });
      }
    }
  });

  let xorList = [];

  if (USE_XOR) {
    // Add false rules that contradict the remaining simple rules, but have to
    // ensure at least one simple rule remains that references the column
    let colRules = rulesList.filter(rule => rule.row === 0);
    let colRule = colRules[randomIndex(colRules)];
    rulesList.splice(rulesList.indexOf(colRule), 1);

    let convertList = [];

    // Make half the rules xor - limited by space and computation...
    while (convertList.length < rulesList.length) {
      let rule = rulesList.splice(randomIndex(rulesList), 1)[0];
      let node = getNodeWithValue(rule.node, nodes);

      // Remove the xor rules from the nodes so that possibilities
      // without them can be calculated
      if (rule.negation) {
        let notValues = node.rules['not'+rule.row];
        notValues.splice(notValues.indexOf(rule.value), 1);
      } else {
        node.rules[rule.row] = null;
      }

      convertList.push(rule);
    }

    rulesList.push(colRule);

    // Prevent duplicates
    let falseRules = [];
    let nonFixedNodes = nodes.filter(node => !node.fixed);

    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      generateXorRules(convertList, falseRules, rulesList, xorList, nonFixedNodes);
    });
  } else {
    finishRules(rulesList, xorList);
  }
}

async function generateXorRules(convertList, falseRules, rulesList, xorList, nonFixedNodes, idsChecked = {}) {
  //console.log("Generating xor rules...");

  if (convertList.length > 0 && nonFixedNodes.length > 0) {
    let falseRule;
    let negation = false;
    let falsePos;

    let nodeIndex = randomIndex(nonFixedNodes);
    let randomNode = nonFixedNodes[nodeIndex];
    let nodeRow = SYMBOL_SETS.indexOf(randomNode.row);
    let pos = await narrowColumnPossibilities(randomNode, idsChecked);
    idsChecked[randomNode.id] = pos;

    if (pos.length === 1) {
      negation = true;
      falsePos = pos;
    } else {
      let possibilities = getRowSymbols(0);
      possibilities.shift(); // Remove the first (fixed) column

      falsePos = possibilities.filter(col => pos.indexOf(col) < 0);
    }

    while (falsePos.length > 0) {
      let falseCol = falsePos.splice(randomIndex(falsePos), 1)[0];
      let rows = Array.from({length: ROWS}, (arr, index) => index);

      while (rows.length > 0) {
        let randomRow = rows.splice(randomIndex(rows), 1)[0];
        if (randomRow === nodeRow) {
          continue;
        }

        let valueNode = nodes.filter(node => node.col === falseCol
            && SYMBOL_SETS.indexOf(node.row) === randomRow)[0];
        let valuePos = await narrowColumnPossibilities(valueNode, idsChecked);
        idsChecked[valueNode.id] = valuePos;

        if (valuePos.length === 1) {
          // Prevent duplicates
          let duplicateRules = falseRules.filter(rule => {
            return (rule.node === randomNode.id || rule.node === valueNode.id)
              && (rule.value === valueNode.id || rule.value === randomNode.id);
          });

          if (duplicateRules.length === 0) {
            // Prevent direct contradictions with simple rules giving away falsehood
            let giveawayRules = rulesList.filter(rule => {
              return (rule.node === randomNode.id || rule.node === valueNode.id
                  || rule.value === randomNode.id || rule.value === valueNode.id)
                  && (rule.row === randomRow || rule.row === nodeRow);
            });

            if (giveawayRules.length === 0) {
              //console.log(randomNode.id, valueNode.id, negation, pos, valuePos, idsChecked);
              falseRule = {
                node: randomNode.id,
                negation: negation,
                row: randomRow,
                value: valueNode.id,
                offset: 0,
              };
              falseRules.push(falseRule);
              break;
            } else {
              //console.log("giveaway");
            }
          } else {
            //console.log("duplicate");
          }
        }
      }

      if (falseRule) {
        break;
      }
    }

    if (falseRule) {
      let rule = convertList.splice(randomIndex(convertList), 1)[0];
      let firstRule;
      let secondRule;

      if (Math.random() < 0.5) {
        firstRule = rule;
        secondRule = falseRule;
      } else {
        firstRule = falseRule;
        secondRule = rule;
      }

      xorList.push([firstRule, secondRule]);
    } else {
      // Exclude the unusable node from future attempts
      nonFixedNodes.splice(nodeIndex, 1);
      //console.log("discarding unusable node", randomNode.id);
    }

    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      generateXorRules(convertList, falseRules, rulesList, xorList, nonFixedNodes, idsChecked);
    });
  } else {
    rulesList = rulesList.concat(convertList);

    rulesList.forEach(rule => {
      if (rule.row > 0 && !rule.negation) {
        let node = getNodeWithValue(rule.node);

        let rowNeighbors = nodes.filter(otherNode => {
          return otherNode.id !== rule.value
              && SYMBOL_SETS.indexOf(otherNode.row) === rule.row
              && !otherNode.fixed;
        });

        let randomNeighbor = rowNeighbors[randomIndex(rowNeighbors)];
        rule.value = randomNeighbor.id;
        rule.offset = SYMBOL_SETS[0].indexOf(node.col)
            - SYMBOL_SETS[0].indexOf(randomNeighbor.col);
      }
    });

    finishRules(rulesList, xorList);
  }
}

function finishRules(rulesList, xorList) {
  while (xorList.length > 0) {
    displayedRules.push(xorList.splice(randomIndex(xorList), 1)[0]);
  }

  while (rulesList.length > 0) {
    displayedRules.push(rulesList.splice(randomIndex(rulesList), 1)[0]);
  }

  solution = deepCopy(nodes);

  finishInit();
}

function step() {
  return new Promise(resolve => {
    setTimeout(resolve);
  });
}

async function narrowColumnPossibilities(node, idsChecked = {}) {
  let possibilities = getRowSymbols(0);
  possibilities.shift(); // Remove the first (fixed) column

  if (!node || timeoutForAbortingGeneration) {
    return possibilities;
  }

  if (idsChecked[node.id] !== undefined) {
    return idsChecked[node.id].filter(id => possibilities.indexOf(id) > -1);
  } else if (node.fixed || node.rules[0] !== null) {
    idsChecked[node.id] = [node.col];
    return [node.col];
  } else {
    generationStepCount++;

    if (generationStepCount % 5000 === 0) {
      generationStepCount = 0;
      await step();
    }

    possibilities = possibilities.filter(id => node.rules['not0'].indexOf(id) < 0);

    if (possibilities.length > 1) {
      idsChecked[node.id] = possibilities;

      for (let i = 0; i < ROWS; i++) {
        let notRules = node.rules['not'+i] ?? [];

        for (let j = 0; j < notRules.length; j++) {
          let notNode = getNodeWithValue(notRules[j], nodes);
          let notPoss = await narrowColumnPossibilities(notNode, idsChecked);

          if (notPoss.length === 1) {
            let index = possibilities.indexOf(notPoss[0]);

            if (index > -1) {
              possibilities.splice(index, 1);

              if (possibilities.length < 2) {
                break;
              }
            }
          }
        }

        if (possibilities.length < 2) {
          break;
        }
      }
    }

    if (possibilities.length > 1) {
      idsChecked[node.id] = possibilities;

      let notNodes = nodes.filter(notNode => {
        return possibilities.indexOf(notNode.col) > -1
            && notNode.rules['not'+SYMBOL_SETS.indexOf(node.row)].indexOf(node.id) > -1;
      });

      for (let i = 0; i < notNodes.length; i++) {
        let notNode = notNodes[i];
        let notPoss = await narrowColumnPossibilities(notNode, idsChecked);

        if (notPoss.length === 1) {
          let index = possibilities.indexOf(notPoss[0]);

          if (index > -1) {
            possibilities.splice(index, 1);

            if (possibilities.length < 2) {
              break;
            }
          }
        }
      }
    }

    if (possibilities.length > 1) {
      idsChecked[node.id] = possibilities;

      let columnNeighbors = nodes.filter(oNode => {
        return node.id !== oNode.id && node.col === oNode.col && !oNode.fixed;
      });

      for (let i = 0; i < columnNeighbors.length; i++) {
        let oNode = columnNeighbors[i];
        let oRowIndex = SYMBOL_SETS.indexOf(oNode.row);
        let nodeRowIndex = SYMBOL_SETS.indexOf(node.row);

        if ((oNode.rules[nodeRowIndex] === node.id
            || node.rules[oRowIndex] === oNode.id)) {
          let oPoss = await narrowColumnPossibilities(oNode, idsChecked);
          possibilities = possibilities.filter(id => oPoss.indexOf(id) > -1);

          if (possibilities.length < 2) {
            break;
          }
        }
      }
    }

    if (possibilities.length > 1) {
      idsChecked[node.id] = possibilities;

      let rowNeighbors = nodes.filter(oNode => {
        return node.id !== oNode.id && node.row === oNode.row && !oNode.fixed;
      });

      let allNeighborPossibilities = [];

      for (let i = 0; i < rowNeighbors.length; i++) {
        let oNode = rowNeighbors[i];
        let oPossibilities = await narrowColumnPossibilities(oNode, idsChecked);

        if (oPossibilities.length === 1) {
          possibilities = possibilities.filter(id => id !== oPossibilities[0]);

          if (possibilities.length < 2) {
            break;
          }
        }

        allNeighborPossibilities = allNeighborPossibilities.concat(oPossibilities);
      }

      if (possibilities.length > 1) {
        let uniquePos = possibilities.filter(id => allNeighborPossibilities.indexOf(id) < 0);

        if (uniquePos.length > 0) {
          possibilities = possibilities.filter(id => uniquePos.indexOf(id) > -1);
        }
      }
    }

    idsChecked[node.id] = possibilities.length < 2 ? possibilities : undefined;
    return possibilities;
  }
}

async function canColumnBeDerivedForNode(node) {
  return await narrowColumnPossibilities(node).length < 2;
}

export function drawInstructions() {
  drawInstructionsHelper("Logic Grid Puzzle", "💭\uFE0E",
      ["Place each token in the grid row for its symbol set",
          "and the column which follows the stated logic rules."],
      ["Drag tokens to move them."],
      window.app.puzzleState.tutorialStage, tutorials.length);
}

export function drawPuzzle() {
  let canvas = getPuzzleCanvas();
  let context = canvas.getContext("2d");

  context.fillStyle = BACKGROUND_COLOR;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

  context.font = "bold " + (NODE_SIZE * 1.5) + "px Arial"
  context.textAlign = "center";
  context.fillStyle = "#808080";

  context.strokeStyle = "#808080";
  context.lineWidth = LINE_THICKNESS;

  for (let i = 0; i < ROWS - 1; i++) {
    context.beginPath();
    context.moveTo(0, (i + 1) * CELL_SIZE);
    context.lineTo(COLS * CELL_SIZE, (i + 1) * CELL_SIZE);
    context.stroke();
  }

  for (let i = 0; i < COLS - 1; i++) {
    context.beginPath();
    context.moveTo((i + 1) * CELL_SIZE, 0);
    context.lineTo((i + 1) * CELL_SIZE, ROWS * CELL_SIZE);
    context.stroke();
  }

  let solved = !dragging;
  let rowCorrectness = {};
  let rowIncorrectness = {};

  let nodesToDraw = window.app.puzzleState.showingSolution ? solution : nodes;

  for (let i = nodesToDraw.length - 1; i >= 0; i--) {
    let node = nodesToDraw[i];

    if (!node.fixed) {
      let inGrid = isNodeInGrid(node);
      let aligned = false;

      if (inGrid) {
        aligned = isNodeAlignedWithRow(node, nodesToDraw);
        let rowPlacement = Math.floor(node.y / CELL_SIZE);
        let correctness = rowIncorrectness[rowPlacement];
        rowIncorrectness[rowPlacement] = correctness !== false && aligned;
      }

      let correctness = rowCorrectness[node.row];
      rowCorrectness[node.row] = correctness !== false
          && (!inGrid || aligned);

      if (!rowCorrectness[node.row]) {
        solved = false;
      }

      if (solved && (!inGrid || isOverlapping(node, nodesToDraw))) {
        solved = false;
      }
    }
  }

  // Draw rules
  context.font = "bold " + (RULES_SIZE * 1.1) + "px Arial"
  context.textAlign = "center";
  let yPos = CELL_SIZE / 2 + NODE_SIZE * 2 / 3;
  let index = 0;

  displayedRules.forEach((ruleObj) => {
    // Xor rule
    if (Array.isArray(ruleObj)) {
      let ruleText = "";
      let rule1 = ruleObj[0];
      let node1 = getNodeWithValue(rule1.node, nodesToDraw);
      let rule2 = ruleObj[1];
      let node2 = getNodeWithValue(rule2.node, nodesToDraw);

      let offsetValue1 = "";

      if (!rule1.negation && rule1.offset !== 0) {
        offsetValue1 = rule1.offset > 0 ? "+" + rule1.offset : rule1.offset;
      }

      let offsetValue2 = "";

      if (!rule2.negation && rule2.offset !== 0) {
        offsetValue2 = rule2.offset > 0 ? "+" + rule2.offset : rule2.offset;
      }

      ruleText += rule1.node + "⇒" + (rule1.negation ? "¬" : "") + rule1.value + offsetValue1;
      ruleText += " ⊕ ";
      ruleText += rule2.node + "⇒" + (rule2.negation ? "¬" : "") + rule2.value + offsetValue2;

      context.fillStyle = "#ffffff";

      let valueNode1 = getNodeWithValue(rule1.value, nodesToDraw);
      let aligned1 = isNodeAlignedWithValue(node1, rule1.value, rule1.offset, nodesToDraw);
      let validAligned1 = rule1.negation ? aligned1 === false : aligned1;
      let nodeAtPos1 = getNodeAlignedAtRow(node1, SYMBOL_SETS.indexOf(valueNode1.row), rule1.offset, nodesToDraw);

      let valueNode2 = getNodeWithValue(rule2.value, nodesToDraw);
      let aligned2 = isNodeAlignedWithValue(node2, rule2.value, rule2.offset, nodesToDraw);
      let validAligned2 = rule2.negation ? aligned2 === false : aligned2;
      let nodeAtPos2 = getNodeAlignedAtRow(node2, SYMBOL_SETS.indexOf(valueNode2.row), rule2.offset, nodesToDraw);

      let nodeInGrid1 = isNodeInGrid(node1);
      let valueInGrid1 = isNodeInGrid(valueNode1);

      let nodeInGrid2 = isNodeInGrid(node2);
      let valueInGrid2 = isNodeInGrid(valueNode2);

      if (nodeInGrid1 && nodeInGrid2
          && (!validAligned1 && !validAligned2 || validAligned1 && validAligned2)) {
        solved = false;

        if ((valueInGrid1 || nodeAtPos1 !== null)
            && (valueInGrid2 || nodeAtPos2 !== null)) {
          context.fillStyle = ALERT_COLOR;
        }
      }

      if (node1 === dragging || node2 === dragging
          || valueNode1 === dragging || valueNode2 === dragging) {
        context.fillStyle = SUCCESS_COLOR;
      }

      context.fillText(ruleText, GRID_WIDTH + (CANVAS_WIDTH - GRID_WIDTH) / 2, yPos);
      yPos += RULES_SIZE * 1.5;

    // Simple rule
    } else {
      let ruleText = "";
      let rule = ruleObj;
      let node = getNodeWithValue(rule.node, nodesToDraw);

      let offsetValue = "";

      if (!rule.negation && rule.offset !== 0) {
        offsetValue = rule.offset > 0 ? "+" + rule.offset : rule.offset;
      }

      ruleText += rule.node + "⇒" + (rule.negation ? "¬" : "") + rule.value + offsetValue;
      context.fillStyle = "#ffffff";

      let valueNode = getNodeWithValue(rule.value, nodesToDraw);
      let nodeAligned = isNodeAlignedWithRow(node, nodesToDraw);
      let valueAligned = isNodeAlignedWithRow(valueNode, nodesToDraw);
      let aligned = isNodeAlignedWithValue(node, rule.value, rule.offset, nodesToDraw);
      let validAligned = rule.negation ? aligned === false : aligned;
      let nodeAtPos = getNodeAlignedAtRow(valueNode, SYMBOL_SETS.indexOf(node.row), -rule.offset, nodesToDraw);
      let valueAtPos = getNodeAlignedAtRow(node, SYMBOL_SETS.indexOf(valueNode.row), rule.offset, nodesToDraw);
      let nodeInGrid = isNodeInGrid(node);
      let valueInGrid = isNodeInGrid(valueNode);

      if (!validAligned || nodeInGrid && !nodeAligned
          || valueInGrid && !valueAligned) {
        solved = false;
        let showError = false;

        if (rule.negation) {
          if (nodeInGrid && nodeAligned && valueInGrid && valueAligned) {
            showError = true;
          }
        } else if (valueInGrid && valueAligned
            && ((nodeInGrid && nodeAligned) || nodeAtPos !== null)
            || nodeInGrid && nodeAligned
            && ((valueInGrid && valueAligned) || valueAtPos !== null)) {
          showError = true;
        }

        if (showError) {
          context.fillStyle = ALERT_COLOR;
        }
      }

      if (node === dragging || valueNode === dragging) {
        context.fillStyle = SUCCESS_COLOR;
      }

      context.fillText(ruleText, GRID_WIDTH + (CANVAS_WIDTH - GRID_WIDTH) / 4 * (1 + 2 * (index % 2)), yPos);
      yPos += (index % 2) * RULES_SIZE * 1.5;
      index++;
    }
  });

  // Draw all the fixed nodes first so they show behind the rest
  let fixedNodes = nodesToDraw.filter(node => node.fixed);

  fixedNodes.forEach(node => {
    let nodeColor = solved ? SUCCESS_COLOR
        : (rowIncorrectness[SYMBOL_SETS.indexOf(node.row)] === false ? ALERT_COLOR : "#808080");

    context.font = "bold " + (NODE_SIZE * 1.5) + "px Arial"
    context.textAlign = "center";
    context.fillStyle = nodeColor;
    context.fillText(node.id, node.x, node.y + NODE_SIZE / 2);
  });

  let moveableNodes = nodesToDraw.filter(node => !node.fixed);

  moveableNodes.forEach(node => {
    let nodeColor = solved ? SUCCESS_COLOR : (isOverlapping(node, nodesToDraw) ? ALERT_COLOR : "#808080");

    context.beginPath();
    context.strokeStyle = nodeColor;
    context.fillStyle = "#000000";
    context.arc(node.x, node.y, NODE_SIZE, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();

    context.font = "bold " + (NODE_SIZE * 1.5) + "px Arial"
    context.textAlign = "center";
    context.fillStyle = nodeColor;
    context.fillText(node.id, node.x, node.y + NODE_SIZE / 2);
  });

  if (solved && window.app.puzzleState.interactive) {
    endPuzzle(window.app.puzzleState.tutorialStage === tutorials.length);
    audioManager.play(CHIME_SOUND);
  } else {
    queuedSounds.forEach(sound => audioManager.play(sound));
  }

  queuedSounds = [];
}

function isNodeInGrid(node) {
  return node.fixed || (dragging !== node
      && node.x > CELL_SIZE && node.x < COLS * CELL_SIZE
      && node.y > CELL_SIZE && node.y < ROWS * CELL_SIZE);
}

function getNodeWithValue(value, nodeList = nodes) {
  return nodeList.filter(oNode => oNode.id === value)[0];
}

function isNodeAlignedWithValue(node, value, offset, nodeList) {
  if (dragging === node || !isNodeInGrid(node)) {
    return null;
  }

  let valueCol = SYMBOL_SETS[0].indexOf(value);

  if (valueCol < 0) {
    let valueNode = nodeList.filter(oNode => oNode.id === value)[0];

    if (dragging === valueNode || !isNodeInGrid(valueNode)) {
      return null;
    }

    valueCol = Math.floor(valueNode.x / CELL_SIZE) + offset;
  } else {
    valueCol += offset;
  }

  return Math.floor(node.x / CELL_SIZE) === valueCol;
}

function isNodeAlignedWithRow(node, nodeList) {
  if (dragging === node || !isNodeInGrid(node)) {
    return false;
  }

  let rowPlacement = Math.floor(node.y / CELL_SIZE);
  return rowPlacement === SYMBOL_SETS.indexOf(node.row);
}

function getNodeAlignedAtRow(node, row, offset, nodeList) {
  if (node !== dragging) {
    for (let i = 0; i < nodeList.length; i++) {
      let oNode = nodeList[i];

      if (oNode !== dragging && oNode.x === node.x - offset * CELL_SIZE
          && Math.floor(oNode.y / CELL_SIZE) === row) {
        return oNode;
      }
    }
  }

  return null;
}

function isOverlapping(node, nodeList) {
  if (!node.fixed) {
    for (let i = 0; i < nodeList.length; i++) {
      let otherNode = nodeList[i];
      if (!otherNode.fixed && otherNode.id !== node.id) {
        let distance = Math.sqrt(Math.pow(otherNode.x - node.x, 2)
            + Math.pow(otherNode.y - node.y, 2));

        if (distance <= NODE_SIZE * 2) {
          return true;
        }
      }
    }
  }

  return false;
}

/***********************************************
 * INIT
 ***********************************************/
export function init() {
  if (isGenerating) {
    clearTimeout(timeoutForAbortingGeneration);

    timeoutForAbortingGeneration = setTimeout(() => {
      isGenerating = false;
      timeoutForAbortingGeneration = null;
      init();
    }, 100);

    return;
  }

  isGenerating = true;
  generationStepCount = 0

  if (window.app.puzzleState.tutorialStage > tutorials.length) {
    window.app.puzzleState.tutorialStage = 0;
    updateForTutorialRecommendation();
  }

  dragging = null;
  previousTouch = null;
  displayedRules = [];
  nodes = [];
  queuedSounds = [];

  if (window.app.puzzleState.tutorialStage) {
    const tutorial = tutorials[window.app.puzzleState.tutorialStage - 1];

    ROWS = tutorial.rows;
    COLS = tutorial.cols;

    USE_XOR = false;
    CELL_SIZE = GRID_SIZE / Math.max(ROWS, COLS);
    GRID_WIDTH = CELL_SIZE * COLS;
    GRID_HEIGHT = CELL_SIZE * ROWS;
    NODE_SIZE = CELL_SIZE / 3;

    nodes = deepCopy(tutorial.nodes);
    displayedRules = deepCopy(tutorial.displayedRules);
    solution = deepCopy(nodes);

    finishInit();
  } else {
    DIFFICULTY = window.app.router.difficulty;

    // Above 5/5 takes too much computation!
    // Quick: 4/4, Casual: 5/4, Challenging: 4/5, Intense: 5/5
    ROWS = DIFFICULTY % 2 === 0 ? 5 : 4;
    COLS = DIFFICULTY <= 2 ? 4 : 5;
    USE_XOR = false;
    // Quick: 4/4/simple, Casual: 5/5/simple, Challenging: 4/4/xor, Intense: 5/5/xor
    // ROWS = 4 + ((DIFFICULTY + 1) % 2);
    // COLS = 4 + ((DIFFICULTY + 1) % 2);
    // USE_XOR = DIFFICULTY > 2;

    CELL_SIZE = GRID_SIZE / Math.max(ROWS, COLS);
    GRID_WIDTH = CELL_SIZE * COLS;
    GRID_HEIGHT = CELL_SIZE * ROWS;
    NODE_SIZE = CELL_SIZE / 3;

    // Allow opportunity for loading screen to show
    setTimeout(() => {
      if (timeoutForAbortingGeneration) {
        return;
      }

      generateLogic();
    }, 100);
  }
}

function finishInit() {
  // let puzzleSolved = true;
  const moveableNodes = nodes.filter(node => !node.fixed);
  const moveableNodesPerSet = COLS - 1;

//    while (puzzleSolved) {
  moveableNodes.forEach((node, i) => {
    const setIndex = Math.floor(i / moveableNodesPerSet);
    node.x = (moveableNodesPerSet > 2 ? i - setIndex : i) * (CELL_SIZE / 2) + CELL_SIZE / 2;
    node.y = CANVAS_HEIGHT - CELL_SIZE / 2 - ((i % moveableNodesPerSet) * CELL_SIZE / 2);
  });

    /*for (let i = 0; i < moveableNodes.length && puzzleSolved; i++) {
      let node = moveableNodes[i];
      // Don't bother checking rules, since all the nodes being in
      // separate grid cells is unlikely enough
      puzzleSolved = puzzleSolved && isNodeInGrid(node) && !isOverlapping(node, moveableNodes);
    }*/
//    }

  updateForTutorialState();

  drawInstructions();

  isGenerating = false;

  finishedLoading();
}

export function onMouseDown(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let mouseX = event.offsetX * CANVAS_WIDTH / canvasRect.width;
      let mouseY = event.offsetY * CANVAS_HEIGHT / canvasRect.height;

      let moveableNodes = nodes.filter(node => !node.fixed);

      for (let i = moveableNodes.length - 1; i >= 0; i--) {
        let node = moveableNodes[i];

        if (Math.sqrt(Math.pow(mouseX - node.x, 2)
            + Math.pow(mouseY - node.y, 2)) < NODE_SIZE + LINE_THICKNESS) {
          dragging = node;
          return;
        }
      }
    }

  // Middle click
  } else if (event.button === 1) {
    if (dragging) {
      releaseNode(dragging);
      dragging = null;
    }

    onMiddleMouseDown();
  }
}

export function onTouchStart(event) {
  if (window.app.puzzleState.interactive && !dragging && event.changedTouches.length === 1) {
    let touch = event.changedTouches[0];
    let canvasRect = getPuzzleCanvas().getBoundingClientRect();
    let touchX = (touch.clientX - canvasRect.left) * CANVAS_WIDTH / canvasRect.width;
    let touchY = (touch.clientY - canvasRect.top) * CANVAS_HEIGHT / canvasRect.height;

    let moveableNodes = nodes.filter(node => !node.fixed);

    for (let i = moveableNodes.length - 1; i >= 0; i--) {
      let node = moveableNodes[i];

      if (Math.sqrt(Math.pow(touchX - node.x, 2)
          + Math.pow(touchY - node.y, 2)) < NODE_SIZE * 1.5) {
        previousTouch = touch;
        dragging = node;
        return;
      }
    }
  }
}

export function onMouseMove(event) {
  if (window.app.puzzleState.interactive && dragging) {
    // Can happen if mouse down triggered from touch end...
    if (!isNaN(event.movementX) && !isNaN(event.movementY)) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();

      dragging.x += event.movementX / window.devicePixelRatio * CANVAS_WIDTH / canvasRect.width;
      dragging.y += event.movementY / window.devicePixelRatio * CANVAS_HEIGHT / canvasRect.height;

      drawPuzzle();
    }
  }
}

export function onTouchMove(event) {
  if (window.app.puzzleState.interactive && dragging && previousTouch) {
    let movedTouch;
    let changedTouches = [...event.changedTouches];

    for (let i = 0; i < changedTouches.length; i++) {
      if (changedTouches[i].identifier === previousTouch.identifier) {
        movedTouch = changedTouches[i];
        break;
      }
    }

    if (movedTouch) {
      let canvasRect = getPuzzleCanvas().getBoundingClientRect();
      let movementX = movedTouch.clientX - previousTouch.clientX;
      let movementY = movedTouch.clientY - previousTouch.clientY;

      previousTouch = movedTouch;

      dragging.x += movementX * CANVAS_WIDTH / canvasRect.width;
      dragging.y += movementY * CANVAS_HEIGHT / canvasRect.height;

      drawPuzzle();
    }
  }
}

export function onMouseUp(event) {
  // Left click
  if (event.button === 0) {
    if (window.app.puzzleState.interactive && dragging) {
      releaseNode(dragging);
      dragging = null;

      drawPuzzle();
    }

    dragging = null;

  // Middle click
  } else if (event.button === 1) {
    onMiddleMouseUp();
  }
}

export function onTouchEnd(event) {
  if (window.app.puzzleState.interactive && dragging && previousTouch) {
    let changedTouches = [...event.changedTouches];

    for (let i = 0; i < changedTouches.length; i++) {
      if (changedTouches[i].identifier === previousTouch.identifier) {
        previousTouch = null;
        releaseNode(dragging);
        dragging = null;

        drawPuzzle();

        return;
      }
    }
  }
}

export function onMouseOut() {
  if (window.app.puzzleState.interactive && dragging) {
    releaseNode(dragging);
    dragging = null;

    drawPuzzle();
  }

  dragging = null;
}

/*function randomizeNodePosition(node) {
  node.x = Math.random() * (CANVAS_WIDTH - NODE_SIZE * 4) + NODE_SIZE * 2;
  node.y = Math.random() * (CANVAS_HEIGHT - GRID_HEIGHT - NODE_SIZE * 4) + NODE_SIZE * 2 + GRID_HEIGHT;
//    node.y = Math.random() * (CANVAS_HEIGHT - NODE_SIZE * 4) + NODE_SIZE * 2;
}*/

function releaseNode(node, playSound = true) {
  let xPos = Math.max(NODE_SIZE, Math.min(CANVAS_WIDTH - NODE_SIZE, node.x));
  let yPos = Math.max(NODE_SIZE, Math.min(CANVAS_HEIGHT - NODE_SIZE, node.y));

  if (xPos > CELL_SIZE && xPos < COLS * CELL_SIZE
      && yPos > CELL_SIZE && yPos < ROWS * CELL_SIZE) {
    xPos = Math.floor(xPos / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;
    yPos = Math.floor(yPos / CELL_SIZE) * CELL_SIZE + CELL_SIZE / 2;

    if (playSound) {
      queuedSounds.push(SNAP_SOUND);
    }
  } else if (playSound) {
    audioManager.play(CLINK_SOUND);
  }

  node.x = xPos;
  node.y = yPos;

  previousTouch = null;
}
