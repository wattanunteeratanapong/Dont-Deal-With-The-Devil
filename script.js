// ======================
// AUDIO (BG + SFX)
// ======================
let bgMusic = new Audio("./Audio/BackgroundMusic.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play();
        document.getElementById('playPauseImage').src = './Assets/pause.png';
    } else {
        bgMusic.pause();
        document.getElementById('playPauseImage').src = './Assets/play.png';
    }
}

document.getElementById('backgroundmusic').addEventListener('click', toggleMusic);

const transitionSound = new Audio("./Audio/Transition.mp3");
const coinSound = new Audio("./Audio/Coin.mp3");
const cardSound = new Audio("./Audio/Card.mp3");

// ======================
// STARTING PAGE + ANIMATION
// ======================
let startingPage = true;
let isDealerCrossed = true;

const startText = document.getElementById('starttext');
let blinkInterval;
function toggleTextVisibility() {
    startText.style.display = startText.style.display === 'none' ? 'block' : 'none';
}
blinkInterval = setInterval(toggleTextVisibility, 500);

const voiceLines = [
    "Ah, so you've arrived. I’ve been expecting you.",
    "You’ve come to gamble, haven’t you? Be careful... the stakes are higher than you think.",
    "The stakes are high, but what’s life without a little risk?",
    "You’ve got the courage to play, but will you have the courage to face the outcome?",
    "So, you're here to test your luck? It’s not often I get visitors with such... boldness.",
    "What’s a little risk when the reward could be so... sweet? Come on, let’s see what you’ve got.",
    "A wise person knows when to take a chance. I’m curious if you’ll be that wise.",
    "I can sense your curiosity. But remember, not everything is as it seems here.",
    "The game’s simple, really. But sometimes, simplicity can hide the most... intriguing outcomes.",
    "Ah, the thrill of the gamble. It’s all about what you’re willing to risk... and what you might gain.",
    "It’s always fascinating, watching someone who thinks they know what’s at stake. Let's see how long that confidence lasts.",
    "I can tell you’ve got a spark. Let’s see if you can keep it burning through the game.",
    "Not everything is as it seems, and not every person either."
];

const voicediv = document.getElementById('voicediv');
voicediv.innerHTML = `<h1 id="voiceline">${voiceLines[0]}</h1>`;
voiceLines.shift();
setTimeout(() => { voicediv.innerHTML = ''; }, 9000);

function displayRandomVoiceLine() {
    if (!startingPage) return;
    const randomIndex = Math.floor(Math.random() * voiceLines.length);
    const randomVoiceLine = voiceLines[randomIndex];
    voicediv.innerHTML = `<h1 id="voiceline">${randomVoiceLine}</h1>`;
    setTimeout(() => { voicediv.innerHTML = ''; }, 10000);
}
if (startingPage) setInterval(displayRandomVoiceLine, 20000);

const frames = [];
for (let i = 1; i <= 6; i++) {
    let img = new Image();
    img.src = `./Animation/frame${i}.png`;
    frames.push(img);
}

const canvas = document.getElementById("canvas");
function updateCanvasBackground(frameIndex) {
    canvas.style.backgroundImage = `url(${frames[frameIndex].src})`;
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";
}

let imagesLoaded = 0;
frames.forEach((img) => {
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === frames.length) {
            updateCanvasBackground(0);
            startAnimationLoop();
        }
    };
});

let isTransitioningToGame = false;
let armInterval = null;

function crossArms(callback) {
    if (!startingPage) return;
    if (armInterval) return;
    let frameIndex = 0;
    armInterval = setInterval(() => {
        if (!startingPage) { clearInterval(armInterval); armInterval = null; return; }
        if (frameIndex >= frames.length) {
            clearInterval(armInterval); armInterval = null;
            isDealerCrossed = true;
            if (callback) callback();
        } else {
            updateCanvasBackground(frameIndex);
            frameIndex++;
        }
    }, 100);
}

function uncrossArms(callback) {
    if (!startingPage) return;
    if (armInterval) return;
    let frameIndex = frames.length - 1;
    armInterval = setInterval(() => {
        if (!startingPage) { clearInterval(armInterval); armInterval = null; return; }
        if (frameIndex < 0) {
            clearInterval(armInterval); armInterval = null;
            isDealerCrossed = false;
            if (callback) callback();
        } else {
            updateCanvasBackground(frameIndex);
            frameIndex--;
        }
    }, 100);
}

function getRandomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startAnimationLoop() {
    function loop() {
        if (!startingPage) return;
        crossArms(() => {
            setTimeout(() => {
                uncrossArms(() => {
                    setTimeout(loop, getRandomDelay(3000, 10000));
                });
            }, getRandomDelay(3000, 10000));
        });
    }
    loop();
}

// ======================
// GAME PAGE ELEMENTS & STATE
// ======================
const pentagram = document.getElementById('pentagram');
const coinstack = document.getElementById('coinstack');
const souldiv = document.getElementById('souldiv');
const soulvalue = document.getElementById('soulvalue');
const backcard = document.getElementById('backcard');
const cross = document.getElementById('cross');
const dialoguediv = document.getElementById('dialoguediv');
const warningText = document.getElementById('warning');

let soulpoints = 50000;
let displayedSoulPoints = soulpoints;
let playerBet = 0;

let betPhase = true;
let gameState = false;

let lockedBackDesign = false;
let cardBackPath = './Cards/backdesign_5.png';
let deckBackPath = './Assets/blueflipbackcard.png';

// ======================
// BLACKJACK STATE + HELPERS
// ======================
let numberOfDecks = 4;
let deck = [];
let playerCards = [];
let dealerCards = [];
let playerTurnActive = false;

class Card {
    constructor(number, symbol) {
        this.number = number;
        this.symbol = symbol;
    }
}
const symbols = ["spade", "heart", "diamond", "club"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function createShuffledDeck() {
    const newDeck = [];
    for (let i = 0; i < numberOfDecks; i++) {
        for (const s of symbols) for (const v of values) newDeck.push(new Card(v, s));
    }
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
}

function handValue(cards) {
    let total = 0, aces = 0;
    for (const c of cards) {
        if (["J", "Q", "K"].includes(c.number)) total += 10;
        else if (c.number === "A") { total += 11; aces++; }
        else total += parseInt(c.number, 10);
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function cardImagePath(card) {
    const suitMap = { spade: "spades", heart: "hearts", diamond: "diamonds", club: "clubs" };
    const v = String(card.number).toUpperCase();
    const s = suitMap[card.symbol] || card.symbol;
    return `./Cards/${v}_${s}.png`;
}

function makeCardDiv(card, faceDown = false) {
    const d = document.createElement('div');
    d.classList.add('card');
    d.style.width = '150px';
    d.style.height = '220px';
    d.style.margin = '10px';
    d.style.display = 'flex';
    d.style.alignItems = 'center';
    d.style.justifyContent = 'center';

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.draggable = false;
    img.src = faceDown ? cardBackPath : cardImagePath(card);

    img.onerror = () => {
        d.style.backgroundColor = 'black';
        d.style.color = 'white';
        d.style.fontFamily = '"Press Start 2P", monospace';
        d.style.fontSize = '16px';
        d.textContent = faceDown ? "🂠" : `${card.number} ${({ spade: "♠", heart: "♥", diamond: "♦", club: "♣" })[card.symbol]}`;
        img.remove();
    };

    d.appendChild(img);
    return d;
}

function clearHands() {
    playerCards = [];
    dealerCards = [];
    document.getElementById('playerhand').innerHTML = '';
    document.getElementById('dealerhand').innerHTML = '';
}

function updateScoresUI(showDealerHole = false) {
    const ph = document.getElementById('playerhand');
    const dh = document.getElementById('dealerhand');
    ph.setAttribute('data-score', handValue(playerCards));
    dh.setAttribute('data-score', showDealerHole ? handValue(dealerCards) : '?');
}

// ======================
// UI: VOICE + SOUL DISPLAY + BET BUTTONS
// ======================
function displayVoiceLine(voicelines, displayTime) {
    if (!gameState) return;
    dialoguediv.innerHTML = `${voicelines}`;
    setTimeout(() => { dialoguediv.innerHTML = ''; }, displayTime || 8000);
}

function updateSoulDisplay() {
    const start = displayedSoulPoints;
    const end = soulpoints;
    const duration = 300;
    const frameRate = 30;
    const stepTime = 1000 / frameRate;
    const steps = duration / stepTime;
    const diff = start - end;
    let step = 0;

    const interval = setInterval(() => {
        step++;
        displayedSoulPoints = Math.round(start - (diff * (step / steps)));
        soulvalue.innerHTML = displayedSoulPoints.toLocaleString();
        if (step >= steps) {
            clearInterval(interval);
            displayedSoulPoints = end;
            soulvalue.innerHTML = displayedSoulPoints.toLocaleString();
        }
    }, stepTime);
}

function updateBetButtons() {
    const betIds = ['bet500', 'bet1000', 'bet5000', 'bet10000', 'allin'];
    document.querySelectorAll('.betbutton').forEach(button => {
        if (!betIds.includes(button.id)) {
            button.style.display = 'none';
            return;
        }
        if (button.id === 'allin') {
            button.style.display = soulpoints > 0 ? 'block' : 'none';
        } else {
            const betValue = parseInt(button.textContent.replace(/,/g, ''), 10);
            button.style.display = (soulpoints < betValue) ? 'none' : 'block';
        }
    });
}

let isIntenseMusicPlaying = false;
function intenseMusicToggle() {
    bgMusic.pause();
    if (!isIntenseMusicPlaying) {
        bgMusic.src = "./Audio/Night.mp3";
        bgMusic.loop = true;
        bgMusic.volume = 0.5;
        bgMusic.play();
        isIntenseMusicPlaying = true;
    } else {
        bgMusic.src = "./Audio/BackgroundMusic.mp3";
        bgMusic.loop = true;
        bgMusic.volume = 1;
        bgMusic.play();
        isIntenseMusicPlaying = false;
    }
}

// ======================
// TRANSITION TO GAME
// ======================
function transitionToGame() {
    const canvasEl = document.getElementById('canvas');

    if (!bgMusic.paused) {
        bgMusic.pause();
        document.getElementById('playPauseImage').src = './Assets/play.png';
    }

    warningText.style.display = 'block';
    warningText.style.animation = 'fadeIn 3s ease-in-out forwards';
    canvasEl.style.animation = 'fadeOut 3s ease-in-out forwards';

    setTimeout(function () {
        document.getElementById('starttext').style.display = 'none';
        clearInterval(blinkInterval);

        canvasEl.style.backgroundImage = "url('./Assets/table.png')";
        canvasEl.style.animation = 'none';
        canvasEl.offsetHeight;
        pentagram.style.display = 'flex';
        souldiv.style.display = 'flex';
        backcard.style.display = 'flex';
        cross.style.display = 'flex';
        soulvalue.style.display = 'flex';

        backcard.style.backgroundImage = `url('${deckBackPath}')`;

        updateSoulDisplay();

        canvasEl.style.animation = 'fadeIn 3s ease-in-out forwards';
        warningText.style.animation = 'fadeOut 3s ease-in-out forwards';
        setTimeout(() => { warningText.style.display = 'none'; }, 3000);

        if (bgMusic.paused) {
            setTimeout(function () {
                bgMusic.play();
                document.getElementById('playPauseImage').src = './Assets/pause.png';

                const t = 5000;
                displayVoiceLine("Welcome to the game!", t);
                setTimeout(() => {
                    displayVoiceLine("You have already sign the contract.", t);
                    setTimeout(() => {
                        displayVoiceLine("There is no turning back now.", t);
                        setTimeout(() => {
                            displayVoiceLine("You must play until the end.", t);
                            setTimeout(() => {
                                displayVoiceLine("You have played Blackjack before, right?", t);
                                setTimeout(() => {
                                    displayVoiceLine("If you reach 100,000 points, you win.", t);
                                    setTimeout(() => {
                                        displayVoiceLine("If you have nothing to bet, you lose.", t);
                                        setTimeout(() => { displayVoiceLine("Simple, right?", t); setTimeout(updateBetButtons, t); }, t);
                                    }, t);
                                }, t);
                            }, t);
                        }, t);
                    }, t);
                }, t);
            }, 3000);
        }
    }, 3000);
}

function onStartKey(event) {
    if ((event.key === 'Enter' || event.key === ' ') && startingPage && !isTransitioningToGame) {
        isTransitioningToGame = true;
        try { transitionSound.currentTime = 0; transitionSound.play(); } catch (e) { }
        voicediv.innerHTML = '';

        const go = () => {
            startingPage = false;
            gameState = true;
            betPhase = true;
            if (armInterval) { clearInterval(armInterval); armInterval = null; }
            transitionToGame();
        };

        if (isDealerCrossed) uncrossArms(go); else go();
    }
}
document.addEventListener('keydown', onStartKey, { once: true });

// ======================
// BET PHASE
// ======================
function betFunction(betAmount) {
    if (betPhase === false) return;

    coinSound.currentTime = 0;
    coinSound.play();

    soulpoints -= betAmount;

    if (soulpoints === 0) {
        dialoguediv.style.color = 'red';
        intenseMusicToggle();
        lockedBackDesign = true;
        cardBackPath = './Cards/backdesign_7.png';
        deckBackPath = './Cards/backdesign_7.png';
        backcard.style.backgroundImage = "url('./Assets/redflipbackcard.png')";
        backcard.style.animation = 'fadeIn 1s ease-in-out forwards';

        displayVoiceLine("You're all in! You're not afraid to take risks, are you?", 5000);
        setTimeout(() => {
            displayVoiceLine("I have something to tell you.", 5000);
            setTimeout(() => {
                displayVoiceLine("What are you betting on is...", 5000);
                setTimeout(() => { displayVoiceLine("YOUR SOUL", 5000); }, 5000);
            }, 5000);
        }, 5000);
    } else if (soulpoints <= 10000) {
        displayVoiceLine("Your Soul... I mean, your money are running low. Be careful!", 3000);
    }

    updateSoulDisplay();
    updateBetButtons();

    coinstack.style.display = 'flex';
    pentagram.style.backgroundImage = "url('./Assets/redpentagram.png')";
    pentagram.style.animation = 'fadeIn 2s ease-in-out forwards';

    document.querySelectorAll('.betbutton').forEach(button => {
        button.disabled = true;
        button.style.display = 'none';
    });

    betPhase = false;
    setTimeout(dealthPhaseFunction, 800);
}

document.querySelectorAll('.betbutton').forEach(button => {
    button.addEventListener('click', function () {
        let betAmount = (this.id === 'allin') ? soulpoints : parseInt(this.textContent.replace(/,/g, ''), 10);
        if (soulpoints >= betAmount && betAmount > 0) {
            playerBet = betAmount;
            betFunction(betAmount);
        } else {
            alert("Not enough soul points for this bet!");
        }
    });
});

// ======================
// DEALING ANIMATION (fly from deck)
// ======================
const CARD_W = 120;
const CARD_H = 150;

function getDeckCenter() {
    const r = backcard.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function nextCardOffset(targetDiv) {
    const idx = targetDiv.querySelectorAll('.card').length;
    return { dx: idx * 16, dy: 0 };
}

function makeFlyingCardEl(card, faceDown = false) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.width = CARD_W + 'px';
    el.style.height = CARD_H + 'px';
    el.style.border = '2px solid white';
    el.style.backgroundColor = 'black';
    el.style.overflow = 'hidden';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';

    const img = document.createElement('img');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.src = faceDown ? deckBackPath : cardImagePath(card);
    el.appendChild(img);

    img.onerror = () => {
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontFamily = '"Press Start 2P", monospace';
        el.style.fontSize = '16px';
        el.textContent = faceDown ? "🂠" : `${card.number} ${({ spade: "♠", heart: "♥", diamond: "♦", club: "♣" })[card.symbol]}`;
        img.remove();
    };

    return el;
}

async function animateDealTo(targetDiv, card, faceDown = false) {
    const { x, y } = getDeckCenter();
    const fly = makeFlyingCardEl(card, faceDown);
    fly.style.left = (x - CARD_W / 2) + 'px';
    fly.style.top = (y - CARD_H / 2) + 'px';
    document.body.appendChild(fly);

    const tr = targetDiv.getBoundingClientRect();
    const { dx, dy } = nextCardOffset(targetDiv);

    const yOffsetMap = {
        dealerhand: -200,
        playerhand: 300
    };
    const yOffset = yOffsetMap[targetDiv.id] ?? 0;

    const endX = tr.left + 400 + dx;
    const endY = tr.top + yOffset + dy;

    fly.style.transition = 'left 300ms ease, top 300ms ease';
    requestAnimationFrame(() => {
        fly.style.left = endX + 'px';
        fly.style.top = endY + 'px';
    });

    cardSound.currentTime = 0; cardSound.play();

    await new Promise(res => fly.addEventListener('transitionend', res, { once: true }));
    fly.remove();

    targetDiv.appendChild(makeCardDiv(card, faceDown));
}

// ======================
// PLAYER/DEALER PHASES + PAYOUT
// ======================
function showActionButtons(show) {
    const wrap = document.getElementById('buttonsdiv');

    document.querySelectorAll('.betbutton').forEach(b => {
        if (!['hitBtn', 'standBtn', 'nextBtn'].includes(b.id)) b.style.display = 'none';
    });

    if (!document.getElementById('hitBtn')) {
        const hit = document.createElement('button');
        hit.id = 'hitBtn'; hit.className = 'betbutton'; hit.textContent = 'HIT';
        const stand = document.createElement('button');
        stand.id = 'standBtn'; stand.className = 'betbutton'; stand.textContent = 'STAND';
        hit.addEventListener('click', onHit);
        stand.addEventListener('click', onStand);
        wrap.appendChild(hit); wrap.appendChild(stand);
    }

    const hitBtn = document.getElementById('hitBtn');
    const standBtn = document.getElementById('standBtn');

    if (hitBtn) hitBtn.disabled = false;
    if (standBtn) standBtn.disabled = false;

    hitBtn.style.display = show ? 'block' : 'none';
    standBtn.style.display = show ? 'block' : 'none';
}

async function dealthPhaseFunction() {
    deck = createShuffledDeck();
    clearHands();

    const playerHandDiv = document.getElementById('playerhand');
    const dealerHandDiv = document.getElementById('dealerhand');

    async function dealTo(target, faceDown = false) {
        const card = deck.pop();
        if (target === 'player') {
            await animateDealTo(playerHandDiv, card, false);
            playerCards.push(card);
        } else {
            await animateDealTo(dealerHandDiv, card, faceDown);
            dealerCards.push(card);
        }
        updateScoresUI(false);
    }

    await dealTo('player', false); await sleep(120);
    await dealTo('dealer', false); await sleep(120);
    await dealTo('player', false); await sleep(120);
    await dealTo('dealer', true);

    updateScoresUI(false);
    playerdrawPhaseFunction();
}

function playerdrawPhaseFunction() {
    playerTurnActive = true;
    showActionButtons(true);

    const p = handValue(playerCards);
    if (p === 21) {
        playerTurnActive = false;
        showActionButtons(false);
        setTimeout(dealerdrawPhaseFunction, 400);
        return;
    }
}

async function onHit() {
    if (!playerTurnActive) return;
    const ph = document.getElementById('playerhand');
    const c = deck.pop();
    await animateDealTo(ph, c, false);
    playerCards.push(c);
    updateScoresUI(false);

    if (handValue(playerCards) > 21) {
        playerTurnActive = false;
        showActionButtons(false);
        displayVoiceLine("Bust. The devil smiles.", 2000);
        setTimeout(endPhaseFunction, 500);
    }
}

function onStand() {
    if (!playerTurnActive) return;
    playerTurnActive = false;
    showActionButtons(false);
    setTimeout(dealerdrawPhaseFunction, 400);
}

function revealDealerHole() {
    const dealerHandDiv = document.getElementById('dealerhand');
    dealerHandDiv.innerHTML = '';
    dealerCards.forEach((c) => dealerHandDiv.appendChild(makeCardDiv(c, false)));
    updateScoresUI(true);
}

async function dealerdrawPhaseFunction() {
    revealDealerHole();

    if (handValue(playerCards) > 21) {
        return setTimeout(endPhaseFunction, 500);
    }

    function isSoft17(cards) {
        let total = 0, aces = 0;
        for (const c of cards) {
            if (["J", "Q", "K"].includes(c.number)) total += 10;
            else if (c.number === "A") { total += 11; aces++; }
            else total += parseInt(c.number, 10);
        }
        return total === 17 && aces > 0;
    }

    const dealerHandDiv = document.getElementById('dealerhand');
    while (handValue(dealerCards) < 17 || isSoft17(dealerCards)) {
        const c = deck.pop();
        await animateDealTo(dealerHandDiv, c, false);
        dealerCards.push(c);
        updateScoresUI(true);
        await sleep(220);
    }

    setTimeout(endPhaseFunction, 500);
}

function removeBlackjackUI() {
    ['pentagram', 'coinstack', 'souldiv', 'backcard', 'cross', 'dialoguediv', 'buttonsdiv', 'soulvalue', 'warning']
        .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });

    clearHands?.();
    const ph = document.getElementById('playerhand');
    const dh = document.getElementById('dealerhand');
    if (ph) ph.setAttribute('data-score', '');
    if (dh) dh.setAttribute('data-score', '');
    const buttons = document.getElementById('buttonsdiv');
    if (buttons) buttons.innerHTML = '';

    const cs = document.getElementById('coinstack');
    if (cs) cs.innerHTML = '';

    betPhase = false;
    playerTurnActive = false;
    gameState = false;

    if (dialoguediv) dialoguediv.style.color = 'white';

    lockedBackDesign = false;
    cardBackPath = './Cards/backdesign_5.png';
    deckBackPath = './Assets/blueflipbackcard.png';
}

// ======================
// WIN FADE SEQUENCE (fade OUT → swap bg → fade IN)
// ======================
const winVoiceLines = [
    "Alright… you’ve won. Your soul shall be free from this hell… for now.",
    "But remember, this is just a revival, i'm not giving you an immortality.",
    "We will meet again… soon."
];

function playWinVoiceLines(onComplete) {
    let index = 0;
    function nextLine() {
        if (index >= winVoiceLines.length) {
            if (typeof onComplete === 'function') setTimeout(onComplete, 400);
            return;
        }
        voicediv.innerHTML = `<h1 id="voiceline" style="color:red;">${winVoiceLines[index]}</h1>`;
        setTimeout(() => {
            voicediv.innerHTML = '';
            index++;
            setTimeout(nextLine, 1000);
        }, 8000);
    }
    nextLine();
}

function playPostEscapeWinLines(onComplete, position = "center") {
    try { clearInterval(blinkInterval); } catch (_) { }

    startText.style.color = 'white';
    startText.style.position = 'absolute';
    startText.style.left = '50%';
    startText.style.transform = 'translate(-50%)';
    startText.style.textAlign = 'center';
    startText.style.lineHeight = '2em';
    startText.style.whiteSpace = 'pre-line';
    startText.style.display = 'block';
    startText.style.opacity = '0';
    startText.style.transition = 'opacity 400ms ease';

    if (position === "top") {
        startText.style.top = '20%';
        startText.style.bottom = '';
        startText.style.transform = 'translate(-50%, -0%)';
    } else if (position === "bottom") {
        startText.style.top = '';
        startText.style.bottom = '15%';
        startText.style.transform = 'translate(-50%, 0%)';
    } else {
        startText.style.top = '50%';
        startText.style.bottom = '';
        startText.style.transform = 'translate(-50%, -50%)';
    }

    const lines = [
        "You run out of the hell gate as fast as you can.",
        "You breathe heavily, and your heart races.",
        "You can feel the earth air around you.",
        "The warmth of the sun hits your skin.",
        "You can still sense the devil through that gate.",
        "Even though you are free, the devil's eyes may still be upon you.",
        "The deal is over... for now.",
        "THANK YOU FOR PLAYING"
    ];

    let i = 0;
    function showNext() {
        if (i >= lines.length) {
            if (typeof onComplete === 'function') setTimeout(onComplete, 300);
            return;
        }
        startText.textContent = lines[i];
        requestAnimationFrame(() => { startText.style.opacity = '1'; });
        if (i === lines.length - 1) return;
        setTimeout(() => {
            startText.style.opacity = '0';
            i++;
            setTimeout(showNext, 450);
        }, 8000);
    }
    showNext();
}

function showEscapePrompt() {
    startText.textContent = "Press Space to Escape Hell";
    startText.style.display = 'block';
    try { clearInterval(blinkInterval); } catch (_) { }
    blinkInterval = setInterval(toggleTextVisibility, 500);
}

function enableSpaceToEscape() {
    const onKeyDown = (e) => {
        if (e.key === ' ' || e.code === 'Space') {
            document.removeEventListener('keydown', onKeyDown);
            try { clearInterval(blinkInterval); } catch (_) { }
            startText.style.display = 'none';

            const canvasEl = document.getElementById('canvas');

            canvasEl.style.animation = 'none';
            canvasEl.offsetHeight;
            canvasEl.style.animation = 'fadeOut 1500ms ease-in-out forwards';
            bgMusic.pause();

            setTimeout(() => {
                try {
                    const run = new Audio("./Audio/Run.mp3");
                    run.volume = 0.8;
                    run.play();
                    run.onended = () => {
                        const breath = new Audio("./Audio/Breath.mp3");
                        breath.volume = 0.8;
                        breath.play();
                    };
                } catch (_) { }

                setTimeout(() => {
                    canvasEl.style.backgroundImage = "url('./Assets/humanworld.png')";
                    canvasEl.style.backgroundSize = 'cover';
                    canvasEl.style.backgroundPosition = 'center';

                    canvasEl.style.animation = 'none';
                    canvasEl.offsetHeight;
                    canvasEl.style.animation = 'fadeIn 1500ms ease-in-out forwards';

                    setTimeout(() => {
                        try {
                            bgMusic.pause();
                            bgMusic.src = "./Audio/Blue.mp3";
                            bgMusic.loop = true;
                            bgMusic.volume = 0.5;
                            bgMusic.play();
                        } catch (err) {
                            console.error("Could not play Blue.mp3:", err);
                        }

                        playPostEscapeWinLines(() => { }, "center");
                    }, 1600);

                }, 13000);

            }, 1500);
        }
    };
    document.addEventListener('keydown', onKeyDown, { once: true });
}

function triggerWinFadeSequence() {
    const canvasEl = document.getElementById('canvas');

    try {
        bgMusic.pause();
        bgMusic.src = "./Audio/Night.mp3";
        bgMusic.loop = true;
        bgMusic.volume = 0.5;
        bgMusic.play();
    } catch (err) {
        console.error("Could not switch music:", err);
    }

    try { transitionSound.currentTime = 0; transitionSound.play(); } catch (e) { }

    if (typeof removeBlackjackUI === 'function') removeBlackjackUI();

    canvasEl.style.animation = 'none';
    canvasEl.offsetHeight;
    canvasEl.style.animation = 'fadeOut 1500ms ease-in-out forwards';

    setTimeout(() => {
        canvasEl.style.backgroundImage = "url('./Assets/windealer.png')";
        canvasEl.style.backgroundSize = 'cover';
        canvasEl.style.backgroundPosition = 'center';

        canvasEl.style.animation = 'none';
        canvasEl.offsetHeight;
        canvasEl.style.animation = 'fadeIn 1500ms ease-in-out forwards';

        setTimeout(() => {
            playWinVoiceLines(() => {
                showEscapePrompt();
                enableSpaceToEscape();
            });
        }, 1600);
    }, 1500);
}

// ======================
// LOSE FADE SEQUENCE (fade OUT → swap bg → fade IN)
// ======================
const loseVoiceLines = [
    "YOUR SOUL IS MINE NOW!!!",
    "You gambled... and you lost.",
    "This is the fate of the foolish.",
    "Blackjack is a game that favors the house.",
    "Huh?",
    "You sign the contract the moment you press enter.",
    "Ha ha ha...",
    "Your soul will serve me for eternity.",
    "The contract is complete. Your soul belongs to the house."
];

function playLoseVoiceLines(onComplete) {
    let index = 0;
    function nextLine() {
        if (index >= loseVoiceLines.length) {
            if (typeof onComplete === 'function') setTimeout(onComplete, 400);
            return;
        }
        voicediv.innerHTML = `<h1 id="voiceline" style="color:red;">${loseVoiceLines[index]}</h1>`;
        setTimeout(() => {
            voicediv.innerHTML = '';
            index++;
            setTimeout(nextLine, 1000);
        }, 4000);
    }
    nextLine();
}

function triggerLoseFadeSequence() {
    const canvasEl = document.getElementById('canvas');

    try {
        bgMusic.pause();
        bgMusic.src = "./Audio/Night.mp3";
        bgMusic.loop = true;
        bgMusic.volume = 0.5;
        bgMusic.play();
    } catch (err) {
        console.error("Could not switch music:", err);
    }

    try { transitionSound.currentTime = 0; transitionSound.play(); } catch (e) { }

    if (typeof removeBlackjackUI === 'function') removeBlackjackUI();

    canvasEl.style.animation = 'none';
    canvasEl.offsetHeight;
    canvasEl.style.animation = 'fadeOut 1500ms ease-in-out forwards';

    setTimeout(() => {
        canvasEl.style.backgroundImage = "url('./Assets/losedealer.png')";
        canvasEl.style.backgroundSize = 'cover';
        canvasEl.style.backgroundPosition = 'center';

        canvasEl.style.animation = 'none';
        canvasEl.offsetHeight;
        canvasEl.style.animation = 'fadeIn 1500ms ease-in-out forwards';

        setTimeout(() => {
            playLoseVoiceLines(() => {
                let laughAudio = new Audio("./Audio/Laugh.mp3");
                laughAudio.volume = 0.7;
                laughAudio.play();
                bgMusic.pause();

                laughAudio.onended = () => {
                    setTimeout(() => {
                        let suckAudio = new Audio("./Audio/Suck.mp3");
                        suckAudio.volume = 0.6;
                        suckAudio.play();

                        canvasEl.style.animation = 'none';
                        canvasEl.offsetHeight;
                        canvasEl.style.animation = 'fadeOut 1500ms ease-in-out forwards';
                    }, 1000);
                };
            });
        }, 1600);

    }, 1500);
}

// ======================
// ROUND END + NEXT ROUND
// ======================
function endPhaseFunction() {
    const p = handValue(playerCards);
    const d = handValue(dealerCards);
    const playerBJ = (playerCards.length === 2 && p === 21);
    const dealerBJ = (dealerCards.length === 2 && d === 21);

    let payout = 0;
    let line = "";

    if (p > 21) {
        line = "You busted. A pity… for you.";
    } else if (dealerBJ && playerBJ) {
        payout = playerBet;
        line = "A tie. You live to sin—uh—play another hand.";
    } else if (dealerBJ) {
        line = "Dealer blackjack. The house feasts.";
    } else if (playerBJ) {
        payout = Math.floor(playerBet * 2.5);
        line = "Blackjack! Fortune—temporarily—favors you.";
    } else if (d > 21) {
        payout = playerBet * 2;
        line = "Dealer busts. You claw back a little fate.";
    } else if (p > d) {
        payout = playerBet * 2;
        line = "You win this round.";
    } else if (p === d) {
        payout = playerBet;
        line = "Push. The balance remains… for now.";
    } else {
        line = "Defeat. The contract tightens.";
    }

    if (payout > 0) soulpoints += payout;

    updateSoulDisplay();
    displayVoiceLine(line, 2500);

    setTimeout(() => {
        if (soulpoints >= 100000) {
            triggerWinFadeSequence();
            return;
        }
        if (soulpoints <= 0) {
            displayVoiceLine("No more to wager. Your soul is… collateral.", 5000);
            setTimeout(triggerLoseFadeSequence, 3200);
            return;
        }
        nextRoundPrompt();
    }, 600);
}

function nextRoundPrompt() {
    const wrap = document.getElementById('buttonsdiv');
    ['hitBtn', 'standBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    let next = document.getElementById('nextBtn');
    if (!next) {
        next = document.createElement('button');
        next.id = 'nextBtn';
        next.className = 'betbutton';
        next.textContent = 'NEXT ROUND';
        next.addEventListener('click', () => {
            next.style.display = 'none';
            startBetPhase();
        });
        wrap.appendChild(next);
    }

    next.disabled = false;
    next.style.display = 'block';
}

function startBetPhase() {
    coinstack.style.display = 'none';
    coinstack.innerHTML = '';

    pentagram.style.backgroundImage = "url('./Assets/blackpentagram.png')";

    if (!lockedBackDesign) {
        backcard.style.backgroundImage = "url('./Assets/blueflipbackcard.png')";
        cardBackPath = './Cards/backdesign_5.png';
        deckBackPath = './Assets/blueflipbackcard.png';
    } else {
        backcard.style.backgroundImage = "url('./Assets/redflipbackcard.png')";
    }

    dialoguediv.style.color = 'white';

    clearHands();

    ['hitBtn', 'standBtn', 'nextBtn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.disabled = false; el.style.display = 'none'; }
    });

    document.querySelectorAll('.betbutton').forEach(button => {
        if (['bet500', 'bet1000', 'bet5000', 'bet10000', 'allin'].includes(button.id)) {
            button.disabled = false;
            button.style.display = 'block';
        }
    });

    betPhase = true;
    updateBetButtons();
    displayVoiceLine("Place your bet… if you dare.", 2200);
}

// ======================
// END
// ======================
