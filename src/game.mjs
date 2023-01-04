/* eslint-disable */
import './style.css';
import { differenceInDays } from 'date-fns';
import { keysArray, validLetters, colorKeys, darkStyle, darkContrastStyle, lightStyle, lightContrastStyle } from './variables.mjs';
import { validAnswers, validAbbreviations, abbreviationsObjects } from './abbreviations.mjs';

export default class Game {

  constructor() {
    this.day = this.wordleNumber();
    this.wordle = validAnswers[this.day]['abbreviation'];
    this.definition = validAnswers[this.day]['definition'];
    this.l = this.wordle.length;
    this.guesses = this.makeGuessesArray(this.l)
    this.gameWon = false;
    this.gameOver = false;
    this.hardMode = false;
    this.darkTheme = true;
    this.contrastTheme = false;
    this.currentRow = 0;
    this.currentTile = 0;
    this.greenLetters = [];
    this.yellowLetters = [];
    this.missingGreenLetter = [];
    this.missingYellowLetter = [];
    this.emojiCopyPaste = '';
  }

  // Call functions to start game
  play() {
    console.log(this.wordle);
    console.log(this.day);
    this.createUI();
    this.addListeners();
    this.loadLocalStorage();
    this.afterLoad();
  }

  // On page load, do the following to set create UI
  createUI() {
    this.makeRows();
    this.makeTiles();
    this.makeKeyboardRows();
    this.makeKeyboardKeys();
    this.makePopUp();
    this.displayCountdown();
    this.populateWordleNumber();
  }

  // On page load, do the following to set event listeners
  addListeners() {
    this.keyPressListener();
    this.scoreboardButtonListener();
    this.scoreboardCloseListener();
    this.shareButtonListener();
    this.settingsButtonListener();
    this.switchHardModeListener();
    this.lightDarkThemeListener();
    this.contrastThemeListener();
    this.disabledCheckboxListener();
  }

  // On page load, do the following to set variables as those stored locally
  loadLocalStorage() {
    this.getStoredGameWon();
    this.getStoredGameOver();
    this.getStoredHardMode();
    this.getStoredDarkTheme();
    this.getStoredContrastTheme();
    this.getStoredCurrentRow();
    this.getStoredCurrentTile();
    this.getStoredLastWinRow();
    this.verifyStoredGuess();
    this.copyStoredResults();
  }

  // On page load, do the following to the UI
  afterLoad() {
    this.disableHardModeCheckbox();
  }

  // Function to create tile row divs
  makeRows() {
    const tileContainer = document.getElementById('tile-container');
    for (let i = 0; i < 6; i++) {
      const addRow = document.createElement('div');
      addRow.setAttribute('id', 'row' + i);
      tileContainer.appendChild(addRow);
    }
  }

  // Function to create tile divs
  makeTiles() {
    for (let i = 0; i < 6; i++) {
      const rowContainer = document.getElementById('row' + i);
      for (let x = 0; x < this.l; x++) {
        const addTile = document.createElement('div');
        addTile.setAttribute('id', 'row' + i + 'tile' + x);
        rowContainer.appendChild(addTile);
      }
    }
  }

  // Function to create keyboard rows
  makeKeyboardRows() {
    const keyboardContainer = document.getElementById('keyboard-container');
    for (let i = 0; i < 3; i++) {
      const addKeyboardRow = document.createElement('div');
      addKeyboardRow.setAttribute('id', 'keyboard-row' + i);
      keyboardContainer.appendChild(addKeyboardRow)
    }
  }

  // Function to create keyboard keys
  makeKeyboardKeys() {
    const that = this;
    keysArray.forEach((array, index) => {
      const keyboardRow = document.getElementById('keyboard-row' + index);
      array.forEach((key) => {
        const addKey = document.createElement('div');
        const letter = document.createElement('span');
        letter.textContent = key;
        addKey.appendChild(letter);
        addKey.setAttribute('data-key', key);
        addKey.setAttribute('id', key);
        addKey.classList.add('lightgrey-color-key');
        addKey.addEventListener('click', () => that.click(key));
        keyboardRow.appendChild(addKey);
      });
    });
  }

  // Function to create and insert the popup div
  makePopUp() {
    const popUpContainer = document.getElementById('tile-container')
    const popUp = document.createElement('div');
    popUp.setAttribute('id', 'popup');
    popUpContainer.appendChild(popUp);
  }

  // Function to create guesses array
  makeGuessesArray(length) {
    const array = [];
    for (let i = 0; i < 6; i++) {
      array.push(Array(length).fill(''))
    }
    return array;
  }

  // Function to handle key onscreen keyboard being clicked
  click(letter) {
    if (this.gameOver) return;
    if (letter === 'ENTER') {
      this.hardMode ? this.checkGuessHard() : this.checkGuess();
    } else if (letter === 'BACK') {
      this.removeLetter();
    } else {
      this.addLetter(letter)
    }
  }

  // Function to handle keyboard being clicked
  keyPressed(event, that) {
    if (this.gameOver) return;
    const letter = event.key.toUpperCase();
    if (validLetters.includes(letter)) {
      that.click(letter);
    } else if (letter == 'ENTER') {
      this.hardMode ? this.checkGuessHard() : this.checkGuess();
    } else if (letter == 'BACKSPACE') {
      this.removeLetter();
    }
  }

  // Function to add event listener to keyboard keydowns
  keyPressListener() {
    const that = this;
    document.addEventListener('keydown', () => {
      that.keyPressed(event, that);
    });
  }

  // Function to add a letter to the current tile & row
  addLetter(letter) {
    const currentTile = this.currentTile;
    const currentRow = this.currentRow;
    if (currentRow < 6 && currentTile < this.l) {
      this.guesses[currentRow][currentTile] = letter;
      this.renderTile(letter, currentRow, currentTile)
      this.addToCurrentTile();
    }
  }

  // Function to remove a letter from the previous tile
  removeLetter() {
    let currentRow = this.currentRow;
    let currentTile = this.currentTile;
    if (currentTile > 0) {
      this.removeFromCurrentTile();
      currentTile = this.currentTile;
      this.guesses[currentRow][currentTile] = '';
      this.renderEmptyTile(currentRow, currentTile);
    }
  }

  // Function to check guess
  checkGuess() {
    const currentRow = this.currentRow;
    const currentTile = this.currentTile;
    const currentGuess = this.guesses[currentRow].join('').toUpperCase();

    if (currentTile < this.l) {
      this.shake();
      this.setPopUpMessage('Not enough letters');
      this.togglePopUp();
      return;
    }

    if (!(validAbbreviations.includes(currentGuess)) && currentGuess !== this.wordle) {
      this.shake();
      this.setPopUpMessage('Not a valid answer');
      this.togglePopUp();
      return;
    }

    if (currentGuess === this.wordle) {
      this.setGameWon(true);
      this.setGameOver(true);
      this.disableHardModeCheckbox();
      this.updateStatsOnWin();
      this.colorTiles();
      this.jump();
      this.saveGuess();
      this.copyResults();
      this.storeLastWinRow();
      setTimeout(() => {
        this.setPopUpMessage('Well Done!');
        this.togglePopUp();
      }, 3500);
      setTimeout(() => {
        this.setPopUpMessage(this.definition);
        this.togglePopUpSuperLong();
      }, 4750);
      setTimeout(() => {
        this.toggleAndLoadScoreboard();
      }, 8000);
      return;
    }

    if (currentTile === this.l && currentRow > 4) {
      this.setGameOver(true);
      this.disableHardModeCheckbox();
      this.updateStatsOnLoss();
      this.colorTiles();
      this.saveGuess();
      this.copyResults();
      setTimeout(() => {
        this.setPopUpMessage(`${this.wordle}: ${this.definition}`);
        this.togglePopUpSuperLong();
      }, 2000);
      setTimeout(() => {
        this.toggleAndLoadScoreboard();
      }, 5250);
    } else {
      this.colorTiles();
      this.saveGuess();
      this.addToCurrentRow();
      this.resetCurrentTile();
      this.disableHardModeCheckbox();
      setTimeout(() => {
        this.setPopUpMessage(this.getDefinition(currentGuess));
        this.togglePopUpLong();
      }, 2000);
    }
  }

  // Get Definition
  getDefinition(guess) {
    let abbreviation = abbreviationsObjects.find(obj => obj.abbreviation === guess);
    return abbreviation['definition'];
  }

  // CheckGuess for Hard Mode
  checkGuessHard() {
    const currentRow = this.currentRow;
    const currentTile = this.currentTile;
    const currentGuess = this.guesses[currentRow].join('').toUpperCase();

    if (currentTile < this.l) {
      this.shake();
      this.setPopUpMessage('Not enough letters');
      this.togglePopUp();
      return;
    }

    if (!(validAbbreviations.includes(currentGuess)) && currentGuess !== this.wordle) {
      this.shake();
      this.setPopUpMessage('Not a valid answer');
      this.togglePopUp();
      return;
    }

    if (!this.hardModeColor()) {
      this.missingGreenLetter.length > 0 ? this.setPopUpMessage(`${this.greenMissingPosition()} letter must be ${this.missingGreenLetter[0].letter}`) : this.setPopUpMessage(`<p>Guess must contain ${this.missingYellowLetter[0]}<p>`);
      this.shake();
      this.togglePopUp();
      return;
    }

    if (currentGuess === this.wordle) {
      this.setGameWon(true);
      this.setGameOver(true);
      this.disableHardModeCheckbox();
      this.updateStatsOnWin();
      this.colorTiles();
      this.jump();
      this.saveGuess();
      this.copyResults();
      this.storeLastWinRow();
      setTimeout(() => {
        this.setPopUpMessage('Well Done!');
        this.togglePopUp();
      }, 3500);
      setTimeout(() => {
        this.setPopUpMessage(this.definition);
        this.togglePopUpSuperLong();
      }, 4750);
      setTimeout(() => {
        this.toggleAndLoadScoreboard();
      }, 8000);
      return;
    }

    if (currentTile === this.l && currentRow > 4) {
      this.setGameOver(true);
      this.disableHardModeCheckbox();
      this.updateStatsOnLoss();
      this.colorTiles();
      this.saveGuess();
      this.copyResults();
      setTimeout(() => {
        this.setPopUpMessage(`${this.wordle}: ${this.definition}`);
        this.togglePopUpSuperLong();
      }, 2000);
      setTimeout(() => {
        this.toggleAndLoadScoreboard();
      }, 5250);
    } else {
      this.colorTiles();
      this.saveGuess();
      this.addToCurrentRow();
      this.resetCurrentTile();
      this.disableHardModeCheckbox();
      setTimeout(() => {
        this.setPopUpMessage(this.getDefinition(currentGuess));
        this.togglePopUpLong();
      }, 2000);
    }
  }

  // Function to color tiles and run function to color keys once answer is checked
  colorTiles() {
    const tiles = document.querySelector('#row' + this.currentRow).childNodes;
    let checkWordle = this.wordle;
    const guess = [];
    const guessOuter = [];
    this.greenLetters = [];

    tiles.forEach((tile) => {
      guess.push({ letter: tile.getAttribute('data'), color: 'darkgrey-color', num: 1 });
      guessOuter.push({ letter: tile.getAttribute('data'), color: 'darkgrey-color', num: 1 });
    });

    guess.forEach((guess, index) => {
      const letter = guess.letter.toUpperCase();
      if (letter === this.wordle[index]) {
        guess.color = 'green-color';
        guess.num = 3;
        checkWordle = checkWordle.replace(letter, '');
        guessOuter[index] = ' ';
        this.greenLetters.push({ letter: guess.letter, position: index });
      }
    });

    guessOuter.forEach((outer, index) => {
      if (!(guess[index].color === 'green-color')) {
        const letter = outer.letter.toUpperCase();
        if (checkWordle.includes(letter)) {
          guess[index].color = 'yellow-color';
          guess[index].num = 2;
          checkWordle = checkWordle.replace(letter, '');
          this.yellowLetters.push(outer.letter);
        }
      }
    })

    tiles.forEach((tile, index) => {
      tile.dataset.color = guess[index].color;
      setTimeout(() => {
        tile.classList.toggle('flip');
      }, 400 * index);
      setTimeout(() => {
        tile.classList.add(guess[index].color);
      }, 400 * index + 400);
      setTimeout(() => {
        tile.classList.toggle('flip');
      }, 1000 + 400 * index);
    });

    setTimeout(() => {
      this.colorEachKey(guess);
    }, 1700);
  }

  // Function to color onscreen keys
  colorEachKey(guess) {
    guess.forEach((g) => {
      const key = document.getElementById(g.letter);
      if (key.className === 'green-color-key') {
        return;
      } else if (key.className === 'yellow-color-key') {
        if (g.color === 'green-color') key.className = 'green-color-key';
      } else {
        if (g.color === 'green-color') {
          key.className = 'green-color-key';
        } else if (g.color === 'yellow-color') {
          key.className = 'yellow-color-key';
        } else if (g.color === 'darkgrey-color') {
          key.className = 'darkgrey-color-key';
        }
      }
    });
  }

  // Function for Hard Mode to check that yellow and green letters from previous guesses are used in ths guess and returns true or false
  hardModeColor() {
    const tiles = document.querySelector('#row' + this.currentRow).childNodes;
    let greenTotal = 0;
    let yellowTotal = 0;
    const guess = [];
    const yellowGuess = [];
    this.missingGreenLetter = [];
    this.missingYellowLetter = [];

    tiles.forEach((tile, i) => {
      guess.push({ letter: tile.getAttribute('data'), position: i });
      yellowGuess.push(tile.getAttribute('data'));
    })

    this.greenLetters.forEach((letter) => {
      const letterPosition = letter.position;
      const enteredLetter = guess[letterPosition].letter
      if (this.greenLetters.length === 0) {
        return;
      } else if (letter.letter === enteredLetter) {
        greenTotal += 1;
      } else {
        this.missingGreenLetter.push({letter: letter.letter, position: letterPosition + 1});
      }
    });

    this.yellowLetters.forEach((yellowletter) => {
      if (yellowGuess.includes(yellowletter)) {
        yellowTotal += 1;
      } else {
        this.missingYellowLetter.push(yellowletter);
      }
    });

    if (greenTotal === this.greenLetters.length && yellowTotal === this.yellowLetters.length) {
      return true;
    } else {
      return false;
    }
  }

  // Function to render value into a tile element
  renderTile(letter, row, tile) {
    const tileElement = document.getElementById('row' + row + 'tile' + tile);
    tileElement.textContent = letter;
    tileElement.setAttribute('data', letter);
    tileElement.classList.add('on-row');
  }

  // Function to tile element empty
  renderEmptyTile(row, tile) {
    const tileElement = document.getElementById('row' + row + 'tile' + tile);
    tileElement.textContent = '';
    tileElement.removeAttribute('data');
    tileElement.classList.remove('on-row');
  }

  // Function to set popup message text
  setPopUpMessage(message) {
    const popUpMessage = document.getElementById('popup');
    popUpMessage.innerHTML = `<p>${message}</p>`;
  }

  // Function to make pop up message to appear temporarily
  togglePopUp() {
    const popUpMessage = document.getElementById('popup');
    popUpMessage.classList.toggle('popup-hide');
    setTimeout(() => {
      popUpMessage.classList.toggle('popup-hide');
    }, 1000);
  }

  // Function to make pop up message to appear temporarily but for longer
  togglePopUpLong() {
    const popUpMessage = document.getElementById('popup');
    popUpMessage.classList.toggle('popup-hide');
    setTimeout(() => {
      popUpMessage.classList.toggle('popup-hide');
    }, 2000);
  }

  // Function to make pop up message to appear temporarily but for longer
  togglePopUpSuperLong() {
    const popUpMessage = document.getElementById('popup');
    popUpMessage.classList.toggle('popup-hide');
    setTimeout(() => {
      popUpMessage.classList.toggle('popup-hide');
    }, 3000);
  }

  // Function to shake current row of tiles when guess is invalid
  shake() {
    const shakeRow = document.getElementById('row' + this.currentRow);
    shakeRow.classList.toggle('shake')
    setTimeout(() => {
      shakeRow.classList.toggle('shake');
    }, 500);
  }

  // Function to jump current row of tiles when guess is correct
  jump() {

    const currentRow = this.currentRow;

    function jumpArg(tile, row) {
      const tileElement = document.getElementById('row' + row + 'tile' + tile);
      tileElement.classList.toggle('jump');
    }
    if (this.l <= 0) return;
    setTimeout(() => {
      jumpArg(0, currentRow);
    }, 2000);

    if (this.l <= 1) return;
    setTimeout(() => {
      jumpArg(1, currentRow);
    }, 2300);

    if (this.l <= 2) return;
    setTimeout(() => {
      jumpArg(2, currentRow);
    }, 2600);

    if (this.l <= 3) return;
    setTimeout(() => {
      jumpArg(3, currentRow);
    }, 2900);

    if (this.l <= 4) return;
    setTimeout(() => {
      jumpArg(4, currentRow);
    }, 3200);

  }

  // Function to add to number of games completed
  addToWordlesCount() {
    let totalGames = Number(localStorage.getItem('TotalGames'));
    totalGames++;
    localStorage.setItem('TotalGames', totalGames);
  }

  // Function to add to number of wins
  addToWinsCount() {
    let totalWins = Number(localStorage.getItem('TotalWins'));
    totalWins++;
    localStorage.setItem('TotalWins', totalWins);
  }

  // Function to add to current streak count
  addToStreakCount() {
    let currentStreak = Number(localStorage.getItem('CurrentStreak'));
    currentStreak++;
    localStorage.setItem('CurrentStreak', currentStreak);
  }

  // Function to update max streak
  updateMaxStreak() {
    const currentStreak = Number(localStorage.getItem('CurrentStreak'));
    const maxStreak = Number(localStorage.getItem('MaxStreak'));
    if (currentStreak > maxStreak) localStorage.setItem('MaxStreak', currentStreak);
  }

  // Function to set streak to 0 without condition (to be used upon loss)
  endStreak() {
    localStorage.setItem('CurrentStreak', 0);
  }

  // Code to track stats for how many guesses each win took
  trackWinRowStats() {
    const row = 'Row' + (this.currentRow + 1) + 'Wins';
    let currentScore = Number(localStorage.getItem(row));
    currentScore++;
    localStorage.setItem(row, currentScore);
  }

  // Function to make the row won on green in stats bar chart. Its winRow is either passed in from localStorage upon page load or is currentRow upon win
  makeWinRowGreen(winRow = this.currentRow) {
    for (let i = 1; i < 7; i++) {
      const bar = document.getElementById(`bar-chart-` + i);
      bar.classList.remove('green-bar');
    }
    const bar = document.getElementById(`bar-chart-${winRow + 1}`);
    bar.classList.add('green-bar');
  }

  // Function to store the row that the game was won on in localStorage
  storeLastWinRow() {
    const storedLastWinRow = {
      value: this.currentRow,
      expiry: this.getNowZeroTime(),
    };
    localStorage.setItem('LastWinRow', JSON.stringify(storedLastWinRow));
  }

  // Function to get lastWinRow stored value upon page load if it isnt expired and call makeWinRowGreen
  getStoredLastWinRow() {
    const now = this.getNowZeroTime();
    const storedLastWinRow = JSON.parse(localStorage.getItem('LastWinRow'));
    if (storedLastWinRow === null) return;
    if (storedLastWinRow.expiry !== now) return;
    const winRow = Number(storedLastWinRow.value);
    this.makeWinRowGreen(winRow);
  }

  // Function to update stats upon win
  updateStatsOnWin() {
    this.addToWordlesCount();
    this.addToWinsCount();
    this.addToStreakCount();
    this.updateMaxStreak();
    this.trackWinRowStats();
    this.makeWinRowGreen();
  }

  // Function to update stats upon loss
  updateStatsOnLoss() {
    this.addToWordlesCount();
    this.endStreak();
  }

  // Function to toggle scoreboard
  toggleAndLoadScoreboard() {
    this.addScoreValues();
    this.barChartLength();
    const scoreboard = document.getElementById('scoreboard');
    const clockShareContainer = document.getElementById('clock-share-container');
    scoreboard.classList.remove('scoreboard-hide');
    if (this.gameOver) {
      clockShareContainer.classList.remove('hide-clock-share');
    } else {
      clockShareContainer.classList.add('hide-clock-share');
    }
  }

  // Function to add event listener to scoreboard button
  scoreboardButtonListener() {
    const that = this;
    const scoreboardButton = document.getElementById('scoreboard-button');
    scoreboardButton.addEventListener('click', () => {
      that.toggleAndLoadScoreboard();
    });
  }

  // Function to set listener for closing scoreboard
  scoreboardCloseListener() {
    const scoreboard = document.getElementById('scoreboard');
    const scoreboardContainer = document.getElementById('scoreboard-container');
    const scoreboardCloseButton = document.getElementById('close-scoreboard-button');
    scoreboard.addEventListener('click', (e) => {
      if (scoreboardCloseButton.contains(e.target) || !(scoreboardContainer.contains(e.target))) {
        scoreboard.classList.add('scoreboard-hide');
      }
    });
  }

  // Function to set event listener for share button allowing wordle to be copied to clipboard
  shareButtonListener() {
    const popUpMessage = document.getElementById('popup');
    const shareButton = document.getElementById('scoreboard-share-button');
    shareButton.addEventListener('click', () => {
      if ('clipboard' in navigator) {
        navigator.clipboard
        .writeText(this.emojiCopyPaste)
        .then(() => {
          popUpMessage.innerHTML = '<p>Copied results to clipboard</p>';
          this.togglePopUp();
        })
      }
      // } else {
      //   try {
      //     const textarea = document.getElementById('hidden-textarea');
      //     textarea.value = this.emojiCopyPaste;
      //     textarea.select();
      //     document.execCommand('copy');
      //     popUpMessage.innerHTML = '<p>Copied results to clipboard</p>';
      //     this.togglePopUp();
      //   } catch (err) {
      //   }
      // }
    });
  }

  // Code to toggle settings when clicked etc
  settingsButtonListener() {
    const settingsButton = document.getElementById('settings-button');
    const settingsClose = document.getElementById('close-settings-button');
    const settingsContainer = document.getElementById('settings-container');
    const settingsInnerContainer = document.getElementById('settings-inner-container');

    settingsButton.addEventListener('click', () => {
      settingsContainer.classList.remove('settings-hide');
    });

    settingsContainer.addEventListener('click', (e) => {
      if (settingsClose.contains(e.target) || !(settingsInnerContainer.contains(e.target))) {
        settingsContainer.classList.add('settings-hide');
      }
    });
  }

  // Code to populate scoreboard with current scores
  addScoreValues() {
    const playedValue = document.getElementById('played-value');
    const winPercentageValue = document.getElementById('win-percentage-value');
    const currentStreakValue = document.getElementById('current-streak-value');
    const maxStreakValue = document.getElementById('max-streak-value');
    const played = Number(localStorage.getItem('TotalGames'));
    const wins = Number(localStorage.getItem('TotalWins'));
    let winPercentage = Math.floor(wins / played * 100);
    if (isNaN(winPercentage)) winPercentage = 0;
    const currentStreak = Number(localStorage.getItem('CurrentStreak'));
    const maxStreak = Number(localStorage.getItem('MaxStreak'));
    playedValue.textContent = `${played}`;
    winPercentageValue.textContent = `${winPercentage}`;
    currentStreakValue.textContent = `${currentStreak}`;
    maxStreakValue.textContent = `${maxStreak}`;
  }

  // Code to define and calculate bar chart bar lengths
  barChartLength() {
    const barChartOne = Number(localStorage.getItem('Row1Wins'));
    const barChartTwo = Number(localStorage.getItem('Row2Wins'));
    const barChartThree = Number(localStorage.getItem('Row3Wins'));
    const barChartFour = Number(localStorage.getItem('Row4Wins'));
    const barChartFive = Number(localStorage.getItem('Row5Wins'));
    const barChartSix = Number(localStorage.getItem('Row6Wins'));

    const barCharts = [barChartOne, barChartTwo, barChartThree, barChartFour, barChartFive, barChartSix];

    const maxBar = Math.max.apply(Math.max, barCharts);

    const barChartLengths = barCharts.map((bar) => Math.floor(bar / maxBar * 100));

    for (let i = 0; i < 6; i++) {
      const bar = document.getElementById(`bar-chart-${i + 1}`);
      bar.classList.remove('zero');
      bar.innerHTML = `<p>${barCharts[i]}</p>`;
      if (barCharts[i] === 0) {
        bar.classList.add('zero');
        bar.style.width = '';
      } else {
        bar.style.width = `${barChartLengths[i]}%`;
      }
    }
  }

  // Function to create countdown clock for scoreboard
  makeCountdown() {
    const date = new Date();
    date.setDate(date.getDate() + 1)
    date.setHours(0, 0, 0);
    const total = Date.parse(date) - Date.parse(new Date());
    let seconds = Math.floor((total / 1000) % 60);
    let minutes = Math.floor((total / 1000 / 60) % 60);
    let hours = Math.floor((total / (1000 * 60 * 60)) % 24);

    hours = '0' + hours;
    minutes = '0' + minutes
    seconds = '0' + seconds;

    if (this.gameOver) {
      const countdown = document.getElementById('countdown-container');
      countdown.innerHTML = `<h5>NEXT MEDICLE</h5><span> ${hours.slice(-2)} : ${minutes.slice(-2)} : ${seconds.slice(-2)}`;
    }
  }

  // Function to update and display the countdown every second
  displayCountdown() {
    const that = this;
    setInterval(() => { that.makeCountdown() }, 1000);
  }

  // Code to populate wordle number at bottom right of settings
  populateWordleNumber() {
    const wordleNumberParagraph = document.getElementById('wordle-number');
    wordleNumberParagraph.textContent = `#${this.wordleNumber()}`;
  }

  // Function to return the position of earliest missing green letter for hard mode in necessary vocab (1st, 2nd...)
  greenMissingPosition() {
    switch(this.missingGreenLetter[0].position) {
      case 1:
        return '1st';
        break;
      case 2:
        return '2nd';
        break;
      case 3:
        return '3rd';
        break;
      case 4:
        return '4th';
        break;
      case 5:
        return '5th';
        break;
    }
  }

  // Code to copy the results of the users daily wordle to the clipboard upon them clicking on the Share button in thr scoreboard
  copyResults() {
    if (this.gameWon === true) {
      if (this.hardMode) {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} ${this.currentRow + 1}/6*  \n`;
      } else {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} ${this.currentRow + 1}/6  \n`;
      }
    } else {
      if (this.hardMode) {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} X/6*  \n`
      } else {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} X/6  \n`
      }
    }

    for (let i = 0; i <= this.currentRow; i++) {
      const thisGuessRow = this.guesses[i];
      let checkWordle = this.wordle;
      const guess = [];
      const guessOuter = [];

      thisGuessRow.forEach((guessLetter) => {
        guess.push({ letter: guessLetter, color: 'darkgrey' });
        guessOuter.push({ letter: guessLetter, color: 'darkgrey' });
      });

      guess.forEach((guessLetter, index) => {
        const thisLetter = guessLetter.letter.toUpperCase();
        if (thisLetter === this.wordle[index]) {
          guessLetter.color = 'green';
          checkWordle = checkWordle.replace(thisLetter, '');
          guessOuter[index] = ' ';
        }
      });

      guessOuter.forEach((outer, index) => {
        if (!(guess[index].color === 'green')) {
          const thisLetter = outer.letter.toUpperCase();
          if (checkWordle.includes(thisLetter)) {
            guess[index].color = 'yellow';
            checkWordle = checkWordle.replace(thisLetter, '');
          }
        }
      });

      for (let x = 0; x < guess.length; x++) {
        if (guess[x].color === 'green') {
          this.emojiCopyPaste += String.fromCodePoint(0x1F7E9);
        } else if (guess[x].color === 'yellow') {
          this.emojiCopyPaste += String.fromCodePoint(0x1F7E8);
        } else if (guess[x].color === 'darkgrey') {
          this.emojiCopyPaste += String.fromCodePoint(0x2B1B);
        }
      }

      this.emojiCopyPaste += '  \n';
    }
    this.emojiCopyPaste += 'www.medicle.org';
  }

  // Function to add 1 to currentTile and save it to localStorage
  addToCurrentTile() {
    this.currentTile++;
    this.storeCurrentTile(this.currentTile);
  }

  // Function to remove 1 from currentTile and save it to localStorage
  removeFromCurrentTile() {
    this.currentTile--;
    this.storeCurrentTile(this.currentTile);
  }

  // Function to set currentTile to a value and save it to localStorage
  setCurrentTile(value) {
    this.currentTile = value;
    this.storeCurrentTile(this.currentTile);
  }

  // Function to set currentTile to 0 and save it to localStorage
  resetCurrentTile() {
    this.currentTile = 0;
    this.storeCurrentTile(this.currentTile);
  }

  // Function to store currentTile value in localStorage
  storeCurrentTile(currentTile) {
    const storedCurrentTile = {
      value: currentTile,
      expiry: this.getNowZeroTime()
    }
    localStorage.setItem('CurrentTile', JSON.stringify(storedCurrentTile));
  }

  // Function to add 1 to currentRow value and save it to localStorage
  addToCurrentRow() {
    this.currentRow++;
    this.storeCurrentRow(this.currentRow);
  }

  // Function to set currentRow to a value and save it to localStorage
  setCurrentRow(value) {
    this.currentRow = value;
    this.storeCurrentTile(this.currentTile);
  }

  // Function to set currentRow to 0 and save it to localStorage
  resetCurrentRow() {
    this.currentRow = 0;
    this.storeCurrentRow(this.currentRow);
  }

  // Function to store currentRow value in localStorage
  storeCurrentRow(currentRow) {
    const storedCurrentRow = {
      value: currentRow,
      expiry: this.getNowZeroTime()
    }
    localStorage.setItem('CurrentRow', JSON.stringify(storedCurrentRow));
  }

  // Code to populate previous guesses of that day upon page reload
  saveGuess() {
    const currentRow = this.currentRow;
    for (let tile = 0; tile < this.guesses[currentRow].length; tile++) {
      const guess = this.guesses[currentRow][tile];
      const key = 'row' + currentRow + 'tile' + tile;
      const color = document.getElementById(key).dataset.color;
      this.setGuessWithExpiry(key, guess, color);
    }
  }

  // Save each letter of a entered guess alongside the time(day) and color
  setGuessWithExpiry(key, value, color) {
    const valueWithExpiry = {
  		value: value,
      color: color,
      expiry: this.getNowZeroTime()
  	}
    localStorage.setItem(key, JSON.stringify(valueWithExpiry));
  }

  // Function to set gameWon along with date
  setGameWon(value) {
    this.gameWon = value;
    const storedGameWon = {
      value: value,
      expiry: this.getNowZeroTime()
    }
    localStorage.setItem('GameWon', JSON.stringify(storedGameWon))
  }

  // Function to set gameOver along with date
  setGameOver(value) {
    this.gameOver = value;
    const storedGameOver = {
      value: value,
      expiry: this.getNowZeroTime()
    }
    localStorage.setItem('GameOver', JSON.stringify(storedGameOver))
  }

  // Code to change to and from Hard Mode when switch is clicked
  switchHardModeListener() {
    const hardModeCheckbox = document.getElementById('hard-mode-checkbox');
    hardModeCheckbox.addEventListener('click', () => {
      hardModeCheckbox.checked === true ? this.hardMode = true : this.hardMode = false;
      this.storeHardMode();
    });
  }

  // Function to disable Hard Mode checkbox
  disableHardModeCheckbox() {
    const hardModeCheckbox = document.getElementById('hard-mode-checkbox');
    if (this.gameOver || this.currentRow === 0) {
      hardModeCheckbox.disabled = false;
    } else {
      hardModeCheckbox.disabled = true;
    }
  }

  // Function to set and trigger pop up message of hard mode switch is clicked while disabled (during game)
  disabledCheckboxListener() {
    const that = this;
    const hardModeSwitch = document.getElementById('hard-mode-switch');
    const hardModeCheckbox = document.getElementById('hard-mode-checkbox');
    hardModeSwitch.addEventListener('click', () => {
      if (hardModeCheckbox.disabled) {
        hardModeCheckbox.checked ? that.setPopUpMessage('Hard mode can only be disabled at the start of a round') : that.setPopUpMessage('Hard mode can only be enabled at the start of a round');
        that.togglePopUpLong();
      }
    });
  }

  // Code to store hardMode value in localStorage
  storeHardMode() {
    this.hardMode ? localStorage.setItem('HardMode', true) : localStorage.setItem('HardMode', false);
  }

  // Function to get stored Darktheme, apply it and set checkbox to match it
  getStoredDarkTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === null) return;
    this.darkTheme = (theme === 'true');
    this.darkTheme ? this.makeDark() : this.makeLight();
    this.checkThemeCheckbox();
  }

  // Function to set theme checkbox
  checkThemeCheckbox() {
    const lightDarkThemeCheckbox = document.getElementById('dark-theme-checkbox');
    lightDarkThemeCheckbox.checked = this.darkTheme;
  }

  // Function to get stored contrastTheme, apply it and set checkbox to match it
  getStoredContrastTheme() {
    const contrast = localStorage.getItem('contrast');
    if (contrast === null) return;
    this.contrastTheme = (contrast === 'true');
    this.contrastTheme ? this.addContrast() : this.removeContrast();
    this.checkContrastCheckbox();
  }

  // Function to set contrast checkbox
  checkContrastCheckbox() {
    const contrastThemeCheckbox = document.getElementById('contrast-theme-checkbox');
    contrastThemeCheckbox.checked = this.contrastTheme;
  }

  // Code to change set darkTheme and change theme when switch is clicked
  lightDarkThemeListener() {
    const that = this;
    const lightDarkThemeSwitch = document.getElementById('dark-theme-switch');
    const lightDarkThemeCheckbox = document.getElementById('dark-theme-checkbox');
    lightDarkThemeSwitch.addEventListener('click', () => {
      if (lightDarkThemeCheckbox.checked) {
        that.setDarkTheme(true);
        that.makeDark();
      } else {
        that.setDarkTheme(false);
        that.makeLight();
      }
    });
  }

  // Code to change set contrastTheme and change theme when switch is clicked
  contrastThemeListener() {
    const that = this;
    const contrastThemeSwitch = document.getElementById('contrast-switch');
    const contrastThemeCheckbox = document.getElementById('contrast-theme-checkbox');
    contrastThemeSwitch.addEventListener('click', () => {
      if (contrastThemeCheckbox.checked) {
        that.setContrastTheme(true);
        that.addContrast();
      } else {
        that.setContrastTheme(false);
        that.removeContrast();
      }
    });
  }

  // Function to set and store darkTheme
  setDarkTheme(value) {
    this.darkTheme = value;
    localStorage.setItem('theme', value);
  }

  // Function to set and store contrastTheme
  setContrastTheme(value) {
    this.contrastTheme = value;
    localStorage.setItem('contrast', value);
  }

  // Function to apply dark theme
  makeDark() {
    const stylesheet = document.getElementById('rootStylesheet');
    if (this.contrastTheme) {
      stylesheet.textContent = darkContrastStyle;
    } else {
      stylesheet.textContent = darkStyle;
    }
  }

  // Function to apply light theme
  makeLight() {
    const stylesheet = document.getElementById('rootStylesheet');
    if (this.contrastTheme) {
      stylesheet.textContent = lightContrastStyle;
    } else {
      stylesheet.textContent = lightStyle;
    }
  }

  // Function to apply contrast theme
  addContrast() {
    const stylesheet = document.getElementById('rootStylesheet');
    if (this.darkTheme) {
      stylesheet.textContent = darkContrastStyle;
    } else {
      stylesheet.textContent = lightContrastStyle;
    }
  }

  // Function to apply contrast theme
  removeContrast() {
    const stylesheet = document.getElementById('rootStylesheet');
    if (this.darkTheme) {
      stylesheet.textContent = darkStyle;
    } else {
      stylesheet.textContent = lightStyle;
    }
  }

  // Function to get currentRow stored value upon page load if it isnt expired
  getStoredCurrentRow() {
    const now = this.getNowZeroTime();
    const storedCurrentRow = JSON.parse(localStorage.getItem('CurrentRow'));
    if (storedCurrentRow === null) return;
    if (storedCurrentRow.expiry !== now) return;
    this.currentRow = Number(storedCurrentRow.value);
  }

  // Function to get currentTile stored value upon page load if it isnt expired
  getStoredCurrentTile() {
    const now = this.getNowZeroTime();
    const storedCurrentTile = JSON.parse(localStorage.getItem('CurrentTile'));
    if (storedCurrentTile === null) return;
    if (storedCurrentTile.expiry !== now) return;
    this.currentTile = Number(storedCurrentTile.value);
  }

  // Function to get gameWon stored value upon page load if it isnt expired
  getStoredGameWon() {
    const now = this.getNowZeroTime();
    const storedGameWon = JSON.parse(localStorage.getItem('GameWon'));
    if (storedGameWon === null) return;
    if (storedGameWon.expiry !== now) return;
    this.gameWon = storedGameWon.value;
  }

  // Function to get gameOver stored value upon page load if it isnt expired
  getStoredGameOver() {
    const now = this.getNowZeroTime();
    const storedGameOver = JSON.parse(localStorage.getItem('GameOver'));
    if (storedGameOver === null) return;
    if (storedGameOver.expiry !== now) return;
    this.gameOver = storedGameOver.value;
  }

  // Function to get hardMode stored value upon page load
  getStoredHardMode() {
    const mode = localStorage.getItem('HardMode');
    this.hardMode = (mode === 'true');
    this.checkHardModeCheckbox();
  }

  // Function to check/uncheck hardMode checkbox upon load
  checkHardModeCheckbox() {
    const hardModeCheckbox = document.getElementById('hard-mode-checkbox');
    hardModeCheckbox.checked = this.hardMode;
  }

  // Populate tiles and rows with stored guesses and color keys upon page load
  verifyStoredGuess() {
    const now = this.getNowZeroTime();
    for (let row = 0; row < 6; row++) {
      for (let tile = 0; tile < this.l; tile++) {
        const thisTile = 'row' + row + 'tile' + tile;
        if (localStorage.getItem(thisTile) === null) {
          this.setCurrentRow(row);
          this.setCurrentTile(0);
          return;
        }

        const storedGuess = JSON.parse(localStorage.getItem(thisTile));
        const tileElement = document.getElementById(thisTile);
        const letter = storedGuess.value;

        if (storedGuess.expiry !== now) {
          localStorage.removeItem(thisTile);
          this.setCurrentRow(row);
          this.setCurrentTile(0);
          return;
        }

        this.guesses[row][tile] = letter;

        tileElement.textContent = letter;
        tileElement.setAttribute('data', letter);
        tileElement.classList.add(storedGuess.color);

        const key = document.getElementById(letter);

        if (storedGuess.color === 'green-color') {
          this.greenLetters.push({ letter: letter, position: tile });
          key.className = 'green-color-key';
        }

        if (storedGuess.color === 'yellow-color') {
          this.yellowLetters.push(letter);
          if (!(key.className === 'green-color-key')) {
            key.className = 'yellow-color-key';
          }
        }

        if (!(key.className === 'green-color-key') && !(key.className === 'yellow-color-key')) {
          key.className = 'darkgrey-color-key';
        }
      }
      this.setCurrentRow(row + 1);
      this.setCurrentTile(0);
    }
  }

  // Code to copy the results of the users daily wordle upon page reload if game is over
  copyStoredResults() {
    if (!this.gameOver) return;
    if (this.gameWon === true) {
      if (this.hardMode) {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} ${this.currentRow}/6*  \n`;
      } else {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} ${this.currentRow}/6  \n`;
      }
    } else {
      if (this.hardMode) {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} X/6*  \n`;
      } else {
        this.emojiCopyPaste += `Medicle ${this.wordleNumber()} X/6  \n`;
      }
    }

    for (let i = 0; i < this.currentRow; i++) {
      const thisGuessRow = this.guesses[i];
      let checkWordle = this.wordle;
      const guess = [];
      const guessOuter = [];

      thisGuessRow.forEach(guessLetter => {
        guess.push({ letter: guessLetter, color: 'darkgrey' });
        guessOuter.push({ letter: guessLetter, color: 'darkgrey' });
      })

      guess.forEach((guessLetter, index) => {
        const thisLetter = guessLetter.letter.toUpperCase();
        if (thisLetter === this.wordle[index]) {
          guessLetter.color = 'green';
          checkWordle = checkWordle.replace(thisLetter, '');
          guessOuter[index] = ' ';
        }
      });

      guessOuter.forEach((outer, index) => {
        if (!(guess[index].color === 'green')) {
          const thisLetter = outer.letter.toUpperCase();
          if (checkWordle.includes(thisLetter)) {
            guess[index].color = 'yellow';
            checkWordle = checkWordle.replace(thisLetter, '');
          }
        }
      });

      for (let x = 0; x < guess.length; x++) {
        if (guess[x].color === 'green') {
          this.emojiCopyPaste += String.fromCodePoint(0x1F7E9);
        } else if (guess[x].color === 'yellow') {
          this.emojiCopyPaste += String.fromCodePoint(0x1F7E8);
        } else if (guess[x].color === 'darkgrey') {
          this.emojiCopyPaste += String.fromCodePoint(0x2B1B);
        }
      }

      this.emojiCopyPaste += '  \n';
    }
    this.emojiCopyPaste += 'www.medicle.org';
  }

  // Code to define which day it is
  wordleNumber() {
    const days = differenceInDays(
      new Date(),
      new Date(2022, 8, 20) //Day 0
    );
    return days;
  }

  // Function to return the getTime of today at 00:00:00
  getNowZeroTime() {
    const now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0, 0);
    return now.getTime();
  }

}

// Fix copy to clipboard on RIF embedded browser

// Make unlimited version (seperately in different repo )


// Wrong answer appearing


// DOLE
