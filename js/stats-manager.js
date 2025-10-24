import { PUZZLE_CONFIGS } from "./config.js";
import dailyChallengeManager from "./daily-challenge-manager.js";
import router from "./router.js";
import { clearData, getPuzzleIconElement, loadData, openDialogWithTransition, saveData } from "./utils.js";

const STATS_KEY = 'stats';

class StatsManager {
  constructor() {
    const stats = JSON.parse(loadData(STATS_KEY, '{}'));

    this.stats = {
      puzzles: {},
      dailyChallenges: {
        currentStreak: stats.dailyChallenges?.currentStreak ?? 0,
        longestStreak: stats.dailyChallenges?.longestStreak ?? 0,
        fastestCompletion: stats.dailyChallenges?.fastestCompletion,
        totalCompleted: stats.dailyChallenges?.totalCompleted ?? 0,
      },
    };

    for (const puzzleKey of Object.keys(PUZZLE_CONFIGS)) {
      this.stats.puzzles[puzzleKey] = {
        completions: {},
        tutorialDone: stats.puzzles?.[puzzleKey]?.tutorialDone ?? false,
      };

      for (let i = 1; i <= 4; i++) {
        this.stats.puzzles[puzzleKey].completions[i] =
            stats.puzzles?.[puzzleKey]?.completions[i] ?? 0;
      }
    }

    this.saveStatsData();
  }

  init() {
    const statsDialog = document.getElementById('statsDialog');

    document.getElementById('statsButton')?.addEventListener('click', () => {
      this.updateDisplayedStats();
      document.getElementById('dailyChallengeArchiveDetails').open = false;
      openDialogWithTransition(statsDialog);
    });

    document.getElementById('markTutorialsCompletedButton')?.addEventListener('click', async () => {
      if (await router.getConfirmation('This option is intended for if you lost your data or switched to a new platform.',
          'Immediately set all tutorials as completed?')) {
        for (const puzzleKey of Object.keys(PUZZLE_CONFIGS)) {
          this.stats.puzzles[puzzleKey].tutorialDone = true;
        }

        this.saveStatsData();
        this.updateDisplayedStats();
      }
    })

    document.getElementById('resetDataButton')?.addEventListener('click', async () => {
      if (await router.getConfirmation('This cannot be undone.', 'Reset All Data?')) {
        clearData();
        statsDialog.close();
        document.body.classList.add('loading');
        window.location.reload();
      }
    })
  }

  saveStatsData() {
    saveData(STATS_KEY, JSON.stringify(this.stats));
  }

  getRankAccountingForTies(sortedEntries, index) {
    const value = sortedEntries[index][1];
    return index + 2 -
        sortedEntries.slice(0, index + 1).filter(entry => entry[1] === value).length;
  }

  updateDisplayedStats() {
    // Tutorials Completed
    document.getElementById('statTutorialsCompletedValue').innerHTML =
        Object.entries(this.stats.puzzles).map(([key, value]) => {
          const tutorialDone = value.tutorialDone;
          const fadedClass = !tutorialDone ? ' faded' : '';
          const ariaHidden = !tutorialDone ? ' aria-hidden="true"' : '';
          const iconElement = getPuzzleIconElement(key, `puzzle-icon${fadedClass}`);

          return `<li${ariaHidden}>${iconElement.outerHTML}</li>`;
        }).join(' ');

    // Combine completion of all difficulties
    const puzzlesSortedByCompletion = Object.entries(this.stats.puzzles).map(([key, value]) =>
        [key, Object.values(value.completions).reduce((a, b) => a + b, 0)]).filter(entry =>
        entry[1] > 0).sort((a, b) => {
      return b[1] - a[1];
    }).slice(0, 3);

    // Most Played
    document.getElementById('statFavoritePuzzlesValue').innerHTML = puzzlesSortedByCompletion.length ?
        puzzlesSortedByCompletion.map(([puzzleKey, _value], i) => {
          const rank = this.getRankAccountingForTies(puzzlesSortedByCompletion, i);
          const prefix = puzzlesSortedByCompletion.length > 1 ? `${rank}.&nbsp;` : '';
          return `${prefix}${getPuzzleIconElement(puzzleKey, `puzzle-icon ranked rank-${rank}`).outerHTML}`;
        }).join('&nbsp; ') : "None yet";

    // Find the puzzles completed at the highest difficulties,
    // counting each completion and weighing by the difficulty level
    const puzzlesSortedByMastery = Object.entries(this.stats.puzzles).map(([key, value]) =>
        [key, Object.entries(value.completions).reduce((a, b) =>
        a + b[1] * (10 ** b[0]), 0)]).filter(entry =>
        entry[1] > 0).sort((a, b) => {
      return b[1] - a[1];
    }).slice(0, 3);

    // Greatest Mastery
    document.getElementById('statGreatestMasteryValue').innerHTML = puzzlesSortedByMastery.length ?
        puzzlesSortedByMastery.map(([puzzleKey, _value], i) => {
          const rank = this.getRankAccountingForTies(puzzlesSortedByMastery, i);
          const prefix = puzzlesSortedByMastery.length > 1 ? `${rank}.&nbsp;` : '';
          return `${prefix}${getPuzzleIconElement(puzzleKey, `puzzle-icon ranked rank-${rank}`).outerHTML}`;
        }).join('&nbsp; ') : "None yet";

    document.getElementById('statDailyChallengeStreakValue').textContent =
        this.stats.dailyChallenges.currentStreak.toLocaleString();
    document.getElementById('statLongestDailyChallengeStreakValue').textContent =
        this.stats.dailyChallenges.longestStreak.toLocaleString();
    document.getElementById('statFastestDailyChallengeCompletionValue').innerHTML =
        this.stats.dailyChallenges.fastestCompletion?.endTime != null
        && this.stats.dailyChallenges.fastestCompletion?.startTime != null
        && this.stats.dailyChallenges.fastestCompletion?.id ?
            `<span class="smaller-text">${dailyChallengeManager.formatDateId(
              this.stats.dailyChallenges.fastestCompletion.id
            )}</span>${dailyChallengeManager.generateDailyChallengePuzzlesDisplay(
              this.stats.dailyChallenges.fastestCompletion.puzzles
            ).outerHTML}${dailyChallengeManager.formatTimerForHtml(0,
                this.stats.dailyChallenges.fastestCompletion.endTime
                - this.stats.dailyChallenges.fastestCompletion.startTime)}`
            : "None yet";
    document.getElementById('statTotalDailyChallengesCompletedValue').textContent =
        this.stats.dailyChallenges.totalCompleted?.toLocaleString();

    const dailyChallengeArchiveList = document.getElementById('dailyChallengeArchiveList');
    dailyChallengeArchiveList.textContent = '';

    // Cover a full week of daily challenges by showing the past 6 days
    for (let i = 1; i <= 6; i++) {
      const id = dailyChallengeManager.getDailyChallengeDateId(-i);
      const li = document.createElement('li');
      const pastDailyChallengeElement = dailyChallengeManager.getPastDailyChallengeElement(id);
      li.appendChild(pastDailyChallengeElement);
      dailyChallengeArchiveList.appendChild(li);
    }

    // Hide the button to mark tutorials as completed if they have all been completed
    if (Object.values(this.stats.puzzles).every(puzzle => puzzle.tutorialDone)) {
      document.getElementById('markTutorialsCompletedButton').classList.add('hidden');
    }
  }
}

// Create singleton instance
const statsManager = new StatsManager();
export default statsManager;
