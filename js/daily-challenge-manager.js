import audioManager from "./audio-manager.js";
import { PUZZLE_CONFIGS } from "./config.js";
import router from "./router.js";
import statsManager from "./stats-manager.js";
import {
  generateSeed, generateSeeds, getPuzzleIconElement, getSeededRandomFunction,
  getTutorialDone, hasLevelBeenCompleted, loadData, openDialogWithTransition,
  randomEl, saveData
} from "./utils.js";

const DAILY_CHALLENGES_KEY = 'dailyChallenges';
const SHOW_DAILY_CHALLENGE_TIMER_KEY = 'showDailyChallengeTimer';
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const UTC_OFFSET = -5; // EST
const CHALLENGE_PUZZLE_COUNT = 3;
const TIMING_BUFFER = 10;

class DailyChallengeManager {
  activeDailyChallenge;
  activeDailyChallengePuzzleIndex;
  difficultyToRestoreTo;
  challengeCountdownTimeoutId;
  challengeTimerTimeoutId;
  stopUpdatesToCountdown;

  constructor() {
    // Will want to make this more robust if the data format ever changes
    this.dailyChallenges = JSON.parse(loadData(DAILY_CHALLENGES_KEY, '{}'));
    this.activeDailyChallenge = {};
    this.activeDailyChallengePuzzleIndex = -1;
    this.stopUpdatesToCountdown = false;
  }

  init() {
    // Ensure an ongoing timer is immediately reflected when loading from the home screen
    // (Refreshing a daily challenge puzzle screen will load a non-daily challenge instance,
    // so setting the active daily challenge to today's on init shouldn't be an issue)
    this.activeDailyChallenge = this.getDailyChallengeForToday();

    document.getElementById('startDailyChallengeButton')?.addEventListener('click', () => {
      this.activeDailyChallenge = this.getDailyChallengeForToday();
      this.startDailyChallenge();
    });

    const dailyChallengeShareResultButton = document.getElementById('dailyChallengeShareResultButton');
    const dailyChallengeDialogPuzzles = document.getElementById('dailyChallengeDialogPuzzles');

    if (!navigator.share) {
      dailyChallengeShareResultButton.style.display = 'none';
    } else {
      dailyChallengeShareResultButton.addEventListener('click', () => {
        const dailyChallenge = this.getDailyChallengeForToday();

        navigator.share({
          text: `Infinite Puzzles
Daily Challenge for ${this.formatDateId(dailyChallenge.id)}
${dailyChallengeDialogPuzzles.textContent}
Completed in ${this.formatTimerForText(dailyChallenge.startTime, dailyChallenge.endTime)}!`,
        });
      });
    }

    const showDailyChallengeTimerCheckbox = document.getElementById('showDailyChallengeTimerCheckbox');
    showDailyChallengeTimerCheckbox.checked = this.loadShowDailyChallengeTimerValue();
    showDailyChallengeTimerCheckbox.addEventListener('change', () => {
      this.saveShowDailyChallengeTimerValue(showDailyChallengeTimerCheckbox.checked);

      if (this.activeDailyChallenge.startTime && this.activeDailyChallenge.endTime == null) {
        this.updateDailyChallengeTimer();
      }
    });

    document.getElementById('dailyChallengeButton')?.addEventListener('click', () => {
      document.getElementById('dailyChallengeAdditionalDetails').open = false;
      const dailyChallengeDialog = document.getElementById('dailyChallengeDialog');
      dailyChallengeDialog.classList.remove('just-completed');
      openDialogWithTransition(dailyChallengeDialog);
    });

    // Call this last.  It then triggers an immediate update
    // which sets the daily challenge display data.
    this.startNextChallengeCountdown();
  }

  saveDailyChallengeData() {
    saveData(DAILY_CHALLENGES_KEY, JSON.stringify(this.dailyChallenges));
  }

  saveShowDailyChallengeTimerValue(value) {
    saveData(SHOW_DAILY_CHALLENGE_TIMER_KEY, value);
  }

  loadShowDailyChallengeTimerValue() {
    return loadData(SHOW_DAILY_CHALLENGE_TIMER_KEY, 'false') === 'true';
  }

  getShowDailyChallengeTimerValue() {
    return document.getElementById('showDailyChallengeTimerCheckbox').checked;
  }

  // Create a date-only ID that always represents the same day everywhere
  getDateIdFromDate(date) {
    const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    return d.getTime();
  }

  // Convert date ID to a readable label
  formatDateId(dateId, locale = navigator.language) {
    // 'e.g. Fri, Oct 17'
    return new Date(dateId).toLocaleDateString(locale, {
      weekday: 'short', // e.g. Fri
      month: 'short', // e.g. Oct
      day: 'numeric', // e.g. 17
      // year: 'numeric', // e.g. 2025

      // Keep in UTC space to stay as a "date concept" regardless of local timezone
      timeZone: 'UTC',
    });
  }

  getDateCutoff(daysOffset = 0) {
    const now = new Date();

    // Compute today's cutoff directly.  Date.UTC handles overflow/underflow.
    let cutoff = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      -UTC_OFFSET, // For midnight UTC-5, we would add 5 hours to get 5am UTC
    );

    // Uncomment to test cutoffs at different times
    // cutoff += 2 * MS_PER_HOUR + 56 * MS_PER_MINUTE;

    // If it's before today's cutoff, we’re still on the previous day's period
    if (now.getTime() < cutoff) {
      cutoff -= MS_PER_DAY;
    }

    // Apply optional offset (e.g. +1 for next cutoff)
    cutoff += daysOffset * MS_PER_DAY;

    return cutoff;
  }

  isDoingDailyChallenge() {
    return this.activeDailyChallengePuzzleIndex >= 0
        && this.activeDailyChallenge?.puzzles?.length > 0;
  }

  isDoingRecordedDailyChallengePuzzle() {
    return this.isDoingDailyChallenge()
        && !this.activeDailyChallenge.puzzles[this.activeDailyChallengePuzzleIndex].completed
        && this.activeDailyChallenge.endTime == null
        && this.getDailyChallengeDateId() === this.activeDailyChallenge.id;
  }

  getDailyChallengeDateId(offset = 0) {
    return this.getDateIdFromDate(new Date(this.getDateCutoff(offset)));
  }

  getDailyChallengeForToday() {
    const dateId = this.getDailyChallengeDateId();

    if (!this.dailyChallenges[dateId]) {
      this.createDailyChallengeForToday();
    }

    return this.dailyChallenges[dateId];
  }

  getMsUntilNextDate() {
    const nextCutoff = this.getDateCutoff(1);
    return nextCutoff - Date.now();
  }

  formatMsCountdown(ms) {
    // Round up to nearest second
    const totalSec = Math.max(0, Math.ceil(ms / MS_PER_SECOND));
    let timeText;

    if (totalSec < 60) {
      // Under a minute, so show live seconds
      timeText = `${totalSec}s`;
    } else {
      const totalMin = Math.floor(totalSec / 60);
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;

      if (h === 0) {
        // Less than an hour, so show minutes only
        timeText = `${m}m`;
      } else {
        // Otherwise, show hours and minutes
        timeText = `${h}h ${m.toString().padStart(2, '0')}m`;
      }
    }

    return timeText;
  }

  // Show as `mm:ss`, or `h:mm:ss` if over an hour
  formatTimerForText(startTime, endTime = Date.now()) {
    const totalSec = Math.floor((endTime - startTime) / MS_PER_SECOND);
    const totalMin = Math.floor(totalSec / 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;

    // Don't pad hours, already tight on space
    const hString = h.toString();
    const mString = m.toString().padStart(2, '0');
    const sString = (totalSec % 60).toString().padStart(2, '0');

    if (h === 0) {
      return `${mString}:${sString}`;
    } else {
      return `${hString}:${mString}:${sString}`;
    }
  }


  // The <wbr /> HTML element is needed for controlled word breaking
  formatTimerForHtml(startTime, endTime = Date.now()) {
    return this.formatTimerForText(startTime, endTime).replace(/:/g, '<wbr />:');
  }

  resetDailyChallengePuzzleRandomness(dateId) {
    const dailyChallenge = this.dailyChallenges[dateId];

    if (!dailyChallenge?.puzzles) {
      console.error(`No daily challenge with puzzles found for ${dateId}`);
      return;
    }

    const seeds = generateSeeds(String(dateId), CHALLENGE_PUZZLE_COUNT + 1);

    for (let i = 0; i < dailyChallenge.puzzles.length; i++) {
      const puzzle = dailyChallenge.puzzles[i];

      // Skip the first seed, which is used for puzzle generation
      puzzle.sRand = getSeededRandomFunction(seeds[i + 1]);
    }
  }

  generateDailyChallengePuzzles(dateId) {
    const sRand = getSeededRandomFunction(generateSeed(String(dateId)));

    // Important to use a stable order, unlike say the button elements,
    // which change based on orientation
    const allPuzzles = Object.keys(PUZZLE_CONFIGS).map(puzzleKey => {
      return {
        key: puzzleKey,
        completed: false,
      };
    });
    const challengePuzzles = [];

    for (let i = 0; i < CHALLENGE_PUZZLE_COUNT; i++) {
      const puzzle = randomEl(allPuzzles, true, sRand);
      puzzle.difficulty = i + 1;
      challengePuzzles.push(puzzle);
    }

    return challengePuzzles;
  }

  // Gets the latest daily challenge to have been attempted
  getLatestAttemptedDailyChallengeId() {
    // Filter for only dailyChallenges with a startTime.
    // Needs to return number, not string, to match other ID handling.
    return Number(Object.keys(this.dailyChallenges ?? {})
        .filter(id => this.dailyChallenges[id].startTime != null).sort().pop());
  }

  handleNewDailyChallengeAvailable() {
    // Ensure new daily challenge data has been created
    const newDailyChallenge = this.getDailyChallengeForToday();
    const currentId = newDailyChallenge.id;
    const lastId = this.getLatestAttemptedDailyChallengeId();
    const previousId = this.getDailyChallengeDateId(-1);
    const challengeDate = this.formatDateId(currentId);
    const latestDailyChallenge = this.dailyChallenges[lastId] ?? {};

    const dailyChallengeDialog = document.getElementById('dailyChallengeDialog');
    dailyChallengeDialog.close();
    dailyChallengeDialog.classList.remove('completed');

    document.getElementById('startDailyChallengeButton').textContent = "Start Daily Challenge!";
    document.getElementById('dailyChallengeDialogDate').textContent = challengeDate;
    document.getElementById("dailyChallengeIcon").classList.remove("faded");

    if (!this.isDoingDailyChallenge()) {
      // Ensure the active daily challenge is always the latest one
      // when not doing a daily challenge
      this.activeDailyChallenge = newDailyChallenge;
    }

    this.setDailyChallengePuzzlesForDialog();

    // If the previous day's challenge was not completed, reset the streak
    if (lastId !== previousId || latestDailyChallenge.endTime == null
        || latestDailyChallenge.endTime < 0) {
      statsManager.stats.dailyChallenges.currentStreak = 0;
      statsManager.saveStatsData()
    }
  }

  createDailyChallengeForToday() {
    const currentId = this.getDailyChallengeDateId();

    if (this.dailyChallenges[currentId]) {
      console.error(`Daily challenge already exists for today: ${currentId}`);
      return;
    }

    this.dailyChallenges[currentId] = {
      id: currentId,
      puzzles: this.generateDailyChallengePuzzles(currentId),
    };

    const yearAgoDateId = this.getDailyChallengeDateId(-365);

    // Only keep a year's worth of daily challenge data
    for (const dateId in this.dailyChallenges) {
      if (Number(dateId) <= yearAgoDateId) {
        delete this.dailyChallenges[dateId];
      }
    }

    this.resetDailyChallengePuzzleRandomness(currentId);
    this.saveDailyChallengeData();
  }

  startNextChallengeCountdown() {
    this.stopNextChallengeCountdown();
    this.stopDailyChallengeTimer();

    const countdownElement = document.getElementById('dailyChallengeCountdown');
    const timerElement = document.getElementById('dailyChallengeTimer');
    const dailyChallengeDialog = document.getElementById('dailyChallengeDialog');
    const startDailyChallengeButton = document.getElementById('startDailyChallengeButton');
    const dailyChallengeDialogDateElement = document.getElementById('dailyChallengeDialogDate');
    dailyChallengeDialogDateElement.textContent = this.formatDateId(this.activeDailyChallenge.id);

    this.setDailyChallengePuzzlesForDialog();
    this.updateDailyChallengeCompletedContent();

    // Use arrow function to retain reference to this
    const update = () => {
      const lastId = this.getLatestAttemptedDailyChallengeId();
      const dailyChallenge = this.getDailyChallengeForToday();
      const currentId = dailyChallenge.id;
      const ms = this.getMsUntilNextDate();

      // Replaying a past challenge, or today's challenge hasn't been attempted yet
      if ((this.isDoingDailyChallenge() && dailyChallenge.id !== this.activeDailyChallenge.id)
            || currentId !== lastId) {
        if (currentId !== lastId) {
          // Creates the new daily challenge, updates the active one
          // (if not in still playing one), and updates the displays,
          // so important to do this first
          this.handleNewDailyChallengeAvailable();
        }

        const challengeDate = this.formatDateId(this.activeDailyChallenge.id);
        timerElement.textContent = challengeDate;
        timerElement.classList.remove('timer');

        if (!this.stopUpdatesToCountdown) {
          countdownElement.textContent = challengeDate;
          countdownElement.classList.remove('timer');
        }

        // Set the next update for just after the next challenge becomes available
        this.challengeCountdownTimeoutId = setTimeout(update, ms + TIMING_BUFFER);
        return;
      }

      // Is the current daily challenge in progress (and we're not currently replaying a past one)?
      if (dailyChallenge.startTime && dailyChallenge.endTime == null
          && dailyChallenge.id === this.activeDailyChallenge.id) {
        this.startDailyChallengeTimer();
        return;
      }

      // Daily challenge already attempted today
      dailyChallengeDialog.classList.add('completed');
      startDailyChallengeButton.textContent = "Replay Daily Challenge";
      const countdown = this.formatMsCountdown(ms);
      const countdownHtml = `<span class="small-text">Next challenge in:</span><br />${countdown}`;
      countdownElement.innerHTML = countdownHtml;
      timerElement.innerHTML = countdownHtml;
      countdownElement.classList.remove('timer');
      timerElement.classList.remove('timer');

      // Figure out when to update next
      let delay;

      if (ms < MS_PER_SECOND) {
        // Under 1 second (raised to show "1s"), so update after the remaining time
        // (ensuring we reach just after the start of the new date)
        delay = ms + TIMING_BUFFER;
      } else if (ms < MS_PER_MINUTE) {
        // Under 1 minute, so update every second (just past the second mark)
        delay = (ms % MS_PER_SECOND) + TIMING_BUFFER;
      } else {
        // Otherwise, update every minute (just past the minute mark)
        delay = (ms % MS_PER_MINUTE) + TIMING_BUFFER;
      }

      this.challengeCountdownTimeoutId = setTimeout(update, delay);
    }

    // This immediate call handles stopping the timer
    update();
  }
  stopNextChallengeCountdown() {
    if (this.challengeCountdownTimeoutId) {
      clearTimeout(this.challengeCountdownTimeoutId);
      this.challengeCountdownTimeoutId = null;
    }
  }

  generateDailyChallengePuzzlesDisplay(puzzles, showCompleted = false) {
    const displayElement = document.createElement('div');

    for (let i = 0; i < puzzles?.length; i++) {
      if (i > 0) {
        const separatorElement = document.createElement('span');
        separatorElement.textContent = ' ➧ ';
        separatorElement.ariaHidden = true;
        displayElement.appendChild(separatorElement);
      }

      const puzzle = puzzles[i];
      const puzzleElement = getPuzzleIconElement(puzzle.key);
      puzzleElement.classList.add('puzzle-icon');

      if (showCompleted && puzzle.completed) {
        puzzleElement.classList.add('completed');
        puzzleElement.ariaLabel += ' (Completed)';
      }

      displayElement.appendChild(puzzleElement);
    }

    return displayElement;
  }

  setDailyChallengePuzzlesForDialog() {
    // Ensure that today's daily challenge is created before setting the puzzles
    const dateId = this.getDailyChallengeForToday().id;
    const dailyChallenge = this.dailyChallenges[dateId];

    if (!dailyChallenge?.puzzles) {
      console.error(`No daily challenge with puzzles found for ${dateId}`);
      return;
    }

    const dailyChallengeDialogPuzzlesElement = document.getElementById('dailyChallengeDialogPuzzles');
    dailyChallengeDialogPuzzlesElement.innerHTML =
        this.generateDailyChallengePuzzlesDisplay(dailyChallenge.puzzles, true).innerHTML;
  }

  updateDailyChallengeTimer() {
    const countdownElement = document.getElementById('dailyChallengeCountdown');
    const timerElement = document.getElementById('dailyChallengeTimer');

    const showTimer = this.getShowDailyChallengeTimerValue();

    // If not showing the timer, just show the challenge date like for past challenge replays,
    // but it might be good to give some indication that the timer is going, even if it's not shown...
    const content = showTimer ? this.formatTimerForHtml(this.activeDailyChallenge.startTime)
        // : "You got this!";
        : this.formatDateId(this.getDailyChallengeDateId());

    if (!this.stopUpdatesToCountdown) {
      countdownElement.innerHTML = content;
    }

    timerElement.innerHTML = content;

    if (showTimer) {
      if (!this.stopUpdatesToCountdown) {
        countdownElement.classList.add('timer');
      }

      timerElement.classList.add('timer');
    } else {
      if (!this.stopUpdatesToCountdown) {
        countdownElement.classList.remove('timer');
      }

      timerElement.classList.remove('timer');
    }
  }
  startDailyChallengeTimer() {
    this.stopNextChallengeCountdown();
    this.stopDailyChallengeTimer();

    if (this.activeDailyChallenge.endTime == null
        && this.activeDailyChallenge.id === this.getDailyChallengeDateId()) {
      document.getElementById('dailyChallengeDialog').classList.remove('completed');
      document.getElementById("dailyChallengeIcon").classList.remove("faded");
      document.getElementById('startDailyChallengeButton').textContent = "Resume Daily Challenge";
    }

    // Use arrow function to retain reference to this
    const update = () => {
      if (this.activeDailyChallenge.endTime != null
          || this.activeDailyChallenge.id !== this.getDailyChallengeDateId()) {
        this.stopDailyChallengeTimer();
        this.startNextChallengeCountdown();
        return;
      }

      this.updateDailyChallengeTimer();

      // Update every second, just past the second mark
      const ms = Date.now() - this.activeDailyChallenge.startTime;
      const delay = MS_PER_SECOND - (ms % MS_PER_SECOND) + TIMING_BUFFER;
      this.challengeTimerTimeoutId = setTimeout(update, delay);
    }

    // This immediate call handles stopping the countdown
    update();
  }
  stopDailyChallengeTimer() {
    if (this.challengeTimerTimeoutId) {
      clearTimeout(this.challengeTimerTimeoutId);
      this.challengeTimerTimeoutId = null;
    }
  }

  exitDailyChallenge() {
    router.navigate('home');
    router.setDifficulty(this.difficultyToRestoreTo, false);
    this.difficultyToRestoreTo = undefined;

    // Should already get reset when the puzzle loads, but here too as a failsafe
    this.stopUpdatesToCountdown = false;

    // If we were replaying a past challenge, ensure the display gets updated
    this.startNextChallengeCountdown();
  }

  goToNextDailyChallengePuzzle() {
    this.calculateNextChallengePuzzleIndex();

    if (this.activeDailyChallengePuzzleIndex < 0) {
      this.exitDailyChallenge();
      return;
    }

    const activePuzzle = this.activeDailyChallenge.puzzles[this.activeDailyChallengePuzzleIndex];

    // Avoid triggering a reload for the difficulty
    router.difficulty = activePuzzle.difficulty;
    router.updateDifficultyUI();
    router.navigate(activePuzzle.key);
  }

  calculateNextChallengePuzzleIndex() {
    // If this is a replay, just increment the puzzle index
    if (this.activeDailyChallenge.endTime != null
        || this.getDailyChallengeDateId() !== this.activeDailyChallenge.id) {
      this.activeDailyChallengePuzzleIndex++;

      if (this.activeDailyChallengePuzzleIndex >= this.activeDailyChallenge.puzzles.length) {
        this.activeDailyChallengePuzzleIndex = -1;
      }

      return;
    }

    // If not a replay, skip any completed puzzles
    for (let i = this.activeDailyChallengePuzzleIndex + 1;
        i < this.activeDailyChallenge.puzzles.length; i++) {
      if (this.activeDailyChallenge.puzzles[i].completed) {
        continue;
      }

      this.activeDailyChallengePuzzleIndex = i;
      return;
    }

    this.activeDailyChallengePuzzleIndex = -1;
  }

  // The activeDailyChallenge should have already been set before calling this function
  startDailyChallenge() {
    if (!this.activeDailyChallenge.startTime
        && this.getDailyChallengeDateId() === this.activeDailyChallenge.id) {
      const familiarWithChallengePuzzles = this.activeDailyChallenge.puzzles.every(puzzle =>
          hasLevelBeenCompleted(puzzle.key) || getTutorialDone(puzzle.key));

      if (!familiarWithChallengePuzzles && !router.getConfirmation(
        `It looks like you're not yet familiar with all the puzzles in this challenge.
Start it anyway?`
      )) {
        return;
      }

      this.activeDailyChallenge.startTime = Date.now();
      this.saveDailyChallengeData();
    }

    audioManager.play(audioManager.SoundEffects.GAME_START);
    document.getElementById("dailyChallengeDialog").close();
    document.getElementById("statsDialog").close();

    // Recalculate the puzzles each time to reset their sRand functions
    this.resetDailyChallengePuzzleRandomness(this.activeDailyChallenge.id);

    this.difficultyToRestoreTo = router.difficulty;
    this.goToNextDailyChallengePuzzle();

    // Prevent the countdown from suddenly changing before the first puzzle loads
    // (Needs to go before starting the countdown/timer)
    this.stopUpdatesToCountdown = true;

    // Ensure the display gets updated immediately after starting the
    // challenge puzzle, in case we are replaying a past challenge.
    // Will also start the timer if starting today's challenge.
    this.startNextChallengeCountdown();
  }

  // Get an element that shows the result of the daily challenge and an option to replay it
  getPastDailyChallengeElement(dateId) {
    this.dailyChallenges[dateId] ??= {
      id: dateId,
      puzzles: this.generateDailyChallengePuzzles(dateId)
    };

    this.resetDailyChallengePuzzleRandomness(dateId);

    const dailyChallenge = this.dailyChallenges[dateId];
    const pastChallengeElement = document.createElement('div');
    pastChallengeElement.classList.add('past-daily-challenge');

    const title = document.createElement('h3');
    const formattedDate = this.formatDateId(dateId);
    title.textContent = formattedDate;
    pastChallengeElement.appendChild(title);

    const puzzlesDisplay = this.generateDailyChallengePuzzlesDisplay(dailyChallenge.puzzles);
    pastChallengeElement.appendChild(puzzlesDisplay);

    const time = document.createElement('p');
    time.classList.add('time');

    if (dailyChallenge.endTime >= 0) {
      pastChallengeElement.classList.add('completed');
      time.innerHTML = this.formatTimerForHtml(dailyChallenge.startTime, dailyChallenge.endTime);
    } else {
      const missed = dailyChallenge.startTime == null;
      time.textContent = missed ? "Missed" : "Unsuccessful";

      if (missed) {
        pastChallengeElement.classList.add('missed');
      }
    }

    pastChallengeElement.appendChild(time);

    const replayButton = document.createElement('button');
    replayButton.textContent = "Replay";
    replayButton.ariaLabel = `Replay daily challenge for ${formattedDate}`;
    replayButton.addEventListener('click', () => {
      this.activeDailyChallenge = dailyChallenge;
      this.startDailyChallenge();
    });
    pastChallengeElement.appendChild(replayButton);

    return pastChallengeElement;
  }

  updateDailyChallengeCompletedContent() {
    const dailyChallenge = this.getDailyChallengeForToday();
    const completed = dailyChallenge.endTime >= 0;
    document.getElementById('dailyChallengeCompletedMessage').innerHTML =
        completed ? `Completed in ${this.formatTimerForHtml(
      dailyChallenge.startTime, dailyChallenge.endTime,
    )}` : "Unsuccessful today.  Better luck tomorrow!";

    const dailyChallengeShareResultButton = document.getElementById('dailyChallengeShareResultButton');

    if (completed) {
      dailyChallengeShareResultButton.classList.remove('hidden');
    } else {
      dailyChallengeShareResultButton.classList.add('hidden');
    }
  }
}

// Create singleton instance
const dailyChallengeManager = new DailyChallengeManager();
export default dailyChallengeManager;
