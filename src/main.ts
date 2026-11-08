import {
  countPossibleSecrets,
  createDigitValidator,
  generateSecret,
  isValidGuess,
} from './game.js';
import {
  formatDuration,
  isScoreRecord,
  rankRecords,
  type ScoreRecord,
} from './records.js';
import {
  createInitialGameState,
  startRound,
  submitGuess,
  type GameSettings,
  type GameState,
} from './state.js';

const BASE_OPTIONS = [
  { value: 2, label: 'Binary' },
  { value: 8, label: 'Octal' },
  { value: 10, label: 'Decimal' },
  { value: 16, label: 'Hexadecimal' },
] as const;
const RECORD_LIMIT = 10;
const RECORDS_KEY_PREFIX = 'bulls-and-cows:records';

const root = document.createElement('main');
root.className = 'app';
document.body.append(root);

let gameState = createInitialGameState();
let timerHandle: number | undefined;

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const created = document.createElement(tag);
  if (text !== undefined) created.textContent = text;
  if (className) created.className = className;
  return created;
}

function createHeader(): HTMLElement {
  const header = element('header', undefined, 'app-header');
  header.append(
    element('h1', 'Bulls & Cows'),
    element('p', 'Crack the secret code using logic and the bulls-and-cows clues.'),
  );
  return header;
}

function createButton(text: string, className = ''): HTMLButtonElement {
  const button = element('button', text, className);
  button.type = 'button';
  return button;
}

function createField(labelText: string, control: HTMLElement): HTMLLabelElement {
  const label = element('label', labelText, 'field');
  label.append(control);
  return label;
}

function recordsStorageKey(base: number, length: number): string {
  return `${RECORDS_KEY_PREFIX}:${base}:${length}`;
}

function loadRecords(base: number, length: number): ScoreRecord[] {
  try {
    const rawRecords = window.localStorage.getItem(recordsStorageKey(base, length));
    if (rawRecords === null) return [];

    const parsedRecords: unknown = JSON.parse(rawRecords);
    if (!Array.isArray(parsedRecords)) return [];

    return parsedRecords
      .filter(isScoreRecord)
      .filter((record) => record.base === base && record.length === length);
  } catch {
    return [];
  }
}

function saveWinningRecord(state: GameState): void {
  if (state.startedAt === null || state.finishedAt === null) return;

  const { base, length } = state.settings;
  const record: ScoreRecord = {
    base,
    length,
    attempts: state.attempts.length,
    timeMs: Math.max(0, state.finishedAt - state.startedAt),
    achievedAt: state.finishedAt,
  };
  const records = rankRecords([...loadRecords(base, length), record], RECORD_LIMIT);

  try {
    window.localStorage.setItem(recordsStorageKey(base, length), JSON.stringify(records));
  } catch {
    // The round remains playable when browser storage is disabled or full.
  }
}

function createRecordsSection(base: number, length: number): HTMLElement {
  const section = element('section', undefined, 'section-block');
  section.append(element('h3', `Best results · ${length} digits · base ${base}`));

  const records = rankRecords(loadRecords(base, length), RECORD_LIMIT);
  if (records.length === 0) {
    section.append(element('p', 'No wins recorded for these settings yet.', 'muted'));
    return section;
  }

  const list = element('ol', undefined, 'records-list');
  records.forEach((record) => {
    list.append(
      element(
        'li',
        `${record.attempts} guesses · ${formatDuration(record.timeMs)} · ${new Date(record.achievedAt).toLocaleDateString()}`,
      ),
    );
  });
  section.append(list);
  return section;
}

function renderSettings(): void {
  stopTimer();

  const panel = element('section', undefined, 'panel');
  panel.append(
    element('h2', 'New round'),
    element(
      'p',
      'Choose a numeral system and a secret length. Settings are locked once the round begins.',
      'muted',
    ),
  );

  const form = element('form');
  const formGrid = element('div', undefined, 'form-grid');
  const baseSelect = element('select');
  baseSelect.id = 'number-base';
  BASE_OPTIONS.forEach(({ value, label }) => {
    const option = element('option', `${label} (base ${value})`);
    option.value = String(value);
    baseSelect.append(option);
  });
  baseSelect.value = String(gameState.settings.base);

  const lengthSelect = element('select');
  lengthSelect.id = 'secret-length';
  [2, 3, 4, 5, 6].forEach((length) => {
    const option = element('option', `${length} digits`);
    option.value = String(length);
    lengthSelect.append(option);
  });
  lengthSelect.value = String(gameState.settings.length);

  formGrid.append(
    createField('Number system', baseSelect),
    createField('Secret length', lengthSelect),
  );
  const possibleCount = element('p', undefined, 'muted');
  const startButton = element('button', 'Start game');
  startButton.type = 'submit';
  form.append(formGrid, possibleCount, startButton);

  const recordsSlot = element('div');
  const updateSettingsDetails = (): void => {
    const base = Number(baseSelect.value);
    Array.from(lengthSelect.options).forEach((option) => {
      option.disabled = Number(option.value) > base;
    });
    if (Number(lengthSelect.value) > base) lengthSelect.value = '2';

    const length = Number(lengthSelect.value);
    possibleCount.textContent = `Possible secret codes: ${countPossibleSecrets(length, base).toLocaleString()}`;
    recordsSlot.replaceChildren(createRecordsSection(base, length));
  };

  baseSelect.addEventListener('change', updateSettingsDetails);
  lengthSelect.addEventListener('change', updateSettingsDetails);
  updateSettingsDetails();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings: GameSettings = {
      base: Number(baseSelect.value),
      length: Number(lengthSelect.value),
    };
    const secret = generateSecret(settings.length, settings.base);
    gameState = startRound(settings, secret, Date.now());
    renderGame();
  });

  panel.append(form);
  root.replaceChildren(createHeader(), panel, recordsSlot);
}

function stopTimer(): void {
  if (timerHandle !== undefined) {
    window.clearInterval(timerHandle);
    timerHandle = undefined;
  }
}

function renderGame(message = ''): void {
  stopTimer();

  const { base, length } = gameState.settings;
  const panel = element('section', undefined, 'panel');
  panel.append(
    element('h2', gameState.status === 'won' ? 'Round complete' : 'Make a guess'),
  );

  const summary = element('div', undefined, 'game-summary');
  summary.append(
    element('p', `System: base ${base} · Secret length: ${length}`),
    element('p', `Attempts: ${gameState.attempts.length}`),
  );
  const timerText = element('p');
  const updateTimer = (): void => {
    const startedAt = gameState.startedAt ?? Date.now();
    const endedAt = gameState.finishedAt ?? Date.now();
    timerText.textContent = `Time: ${formatDuration(endedAt - startedAt)}`;
  };
  summary.append(timerText);
  updateTimer();
  panel.append(summary);

  if (gameState.status === 'won') {
    panel.append(
      element(
        'p',
        `You cracked the code in ${gameState.attempts.length} guesses and ${formatDuration((gameState.finishedAt ?? 0) - (gameState.startedAt ?? 0))}.`,
        'win-message',
      ),
    );
  } else {
    const form = element('form', undefined, 'guess-form');
    const guessInput = element('input');
    guessInput.id = 'guess-input';
    guessInput.type = 'text';
    guessInput.autocomplete = 'off';
    guessInput.spellcheck = false;
    guessInput.maxLength = length;
    guessInput.inputMode = base === 16 ? 'text' : 'numeric';
    guessInput.setAttribute('aria-describedby', 'guess-help');

    const guessLabel = element('label', `Enter ${length} unique digits`);
    guessLabel.htmlFor = guessInput.id;
    const helpText = element(
      'p',
      `Allowed digits: ${'0123456789abcdef'.slice(0, base).toUpperCase()}`,
      'muted',
    );
    helpText.id = 'guess-help';

    const statusLine = element('p', message, 'status-line');
    statusLine.setAttribute('role', 'status');
    statusLine.setAttribute('aria-live', 'polite');

    const submitButton = element('button', 'Check guess');
    submitButton.type = 'submit';
    const digitIsAllowed = createDigitValidator(base);

    guessInput.addEventListener('input', () => {
      const filteredGuess = Array.from(guessInput.value)
        .map((character) => character.toLowerCase())
        .filter(digitIsAllowed)
        .slice(0, length)
        .join('');
      if (filteredGuess !== guessInput.value) guessInput.value = filteredGuess;
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const guess = guessInput.value.toLowerCase();

      if (!isValidGuess(guess, length, base)) {
        statusLine.textContent = `Enter exactly ${length} different valid digits.`;
        return;
      }

      const alreadyTried = gameState.attempts.some((attempt) => attempt.guess === guess);
      if (alreadyTried) {
        statusLine.textContent = 'You have already tried that code.';
        return;
      }

      const previousState = gameState;
      gameState = submitGuess(gameState, guess, Date.now());
      if (gameState === previousState) return;

      if (gameState.status === 'won') saveWinningRecord(gameState);
      renderGame();
    });

    form.append(guessLabel, guessInput, submitButton, helpText, statusLine);
    panel.append(form);
  }

  const historySection = element('section', undefined, 'section-block');
  historySection.append(element('h3', 'Guess history'));
  if (gameState.attempts.length === 0) {
    historySection.append(element('p', 'Your guesses will appear here.', 'muted'));
  } else {
    const historyList = element('ol', undefined, 'history-list');
    gameState.attempts.forEach((attempt) => {
      historyList.append(
        element(
          'li',
          `${attempt.guess.toUpperCase()} · ${attempt.bulls} bulls · ${attempt.cows} cows`,
        ),
      );
    });
    historySection.append(historyList);
  }
  panel.append(historySection, createRecordsSection(base, length));

  if (gameState.status === 'won') {
    const newGameButton = createButton('New game', 'secondary-button');
    newGameButton.addEventListener('click', () => {
      gameState = createInitialGameState(gameState.settings);
      renderSettings();
    });
    const buttonRow = element('div', undefined, 'button-row');
    buttonRow.append(newGameButton);
    panel.append(buttonRow);
  }

  root.replaceChildren(createHeader(), panel);
  updateTimer();
  if (gameState.status === 'playing') {
    timerHandle = window.setInterval(updateTimer, 1000);
  }
}

renderSettings();
