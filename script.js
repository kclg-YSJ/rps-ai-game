document.addEventListener('DOMContentLoaded', () => {
    const MOVES = {
        ROCK: 'rock',
        PAPER: 'paper',
        SCISSORS: 'scissors'
    };
    const MOVE_EMOJI = {
        rock: '✊',
        paper: '✋',
        scissors: '✌️'
    };
    const RESULTS = {
        PLAYER_WIN: 'player',
        AI_WIN: 'ai',
        TIE: 'tie'
    };

    // --- Game State Variables ---
    let currentLevelIndex = 0;
    let gameData = {
        playerMoveHistory: [],
        aiMoveHistory: [],
        resultHistory: [], 
        currentRound: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        aiState: {}, 
        gameLog: [],
        levelStartTime: 0, 
    };
    let bossTimerInterval = null;
    let bossTimerValue = 0;
    let isGameInputDisabled = false;

    // --- UI Elements ---
    const mainMenuScreen = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const levelSelectContainer = document.getElementById('level-select-container');
    const unlockAllBtn = document.getElementById('unlock-all-btn');
    const clearAllDataBtn = document.getElementById('clear-all-data-btn'); 

    const levelTitleEl = document.getElementById('level-title');
    const aiNameEl = document.getElementById('ai-name');
    const aiDescriptionEl = document.getElementById('ai-description');
    const currentBossRuleDisplay = document.getElementById('current-boss-rule-display');
    const hintBtn = document.getElementById('hint-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const playerChoiceDisplay = document.getElementById('player-choice-display');
    const aiChoiceDisplay = document.getElementById('ai-choice-display');
    const roundResultText = document.getElementById('round-result-text');
    const timerDisplay = document.getElementById('timer-display');

    const gameStatsEl = document.getElementById('game-stats'); 
    const currentRoundEl = document.getElementById('current-round');
    const totalRoundsEl = document.getElementById('total-rounds');
    const winsCountEl = document.getElementById('wins-count');
    const tiesCountEl = document.getElementById('ties-count');
    const lossesCountEl = document.getElementById('losses-count');
    const winConditionTextEl = document.getElementById('win-condition-text');
    const currentRulesDisplay = document.getElementById('current-rules-display');

    const historyLogContainer = document.getElementById('history-log-container');
    const historyLogEl = document.getElementById('history-log');

    const levelCompleteModal = document.getElementById('level-complete-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalWins = document.getElementById('modal-wins');
    const modalTies = document.getElementById('modal-ties');
    const modalLosses = document.getElementById('modal-losses');
    const timeTakenValueEl = document.getElementById('time-taken-value'); 
    const nextLevelBtn = document.getElementById('next-level-btn');
    const replayLevelBtn = document.getElementById('replay-level-btn');
    
    const hintModal = document.getElementById('hint-modal');
    const hintTextContent = document.getElementById('hint-text-content');

    // --- Helper Functions ---
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);
    
    const getStandardCounterMove = (move) => {
        if (move === MOVES.ROCK) return MOVES.PAPER;
        if (move === MOVES.PAPER) return MOVES.SCISSORS;
        if (move === MOVES.SCISSORS) return MOVES.ROCK;
    };

    const getStandardWeakness = (move) => {
        if (move === MOVES.ROCK) return MOVES.SCISSORS;
        if (move === MOVES.PAPER) return MOVES.ROCK;
        if (move === MOVES.SCISSORS) return MOVES.PAPER;
    };
    
    const determineWinner = (playerMove, aiMove, rules = null) => {
        if (playerMove === aiMove) return RESULTS.TIE;
        if (!rules) { 
            if (
                (playerMove === MOVES.ROCK && aiMove === MOVES.SCISSORS) ||
                (playerMove === MOVES.PAPER && aiMove === MOVES.ROCK) ||
                (playerMove === MOVES.SCISSORS && aiMove === MOVES.PAPER)
            ) {
                return RESULTS.PLAYER_WIN;
            }
            return RESULTS.AI_WIN;
        } else {
            if (playerMove === MOVES.ROCK && aiMove === MOVES.SCISSORS) {
                return rules.scissorsBeatsRock ? RESULTS.AI_WIN : RESULTS.PLAYER_WIN;
            }
            if (playerMove === MOVES.SCISSORS && aiMove === MOVES.ROCK) { // 反向情况
                return rules.scissorsBeatsRock ? RESULTS.PLAYER_WIN : RESULTS.AI_WIN;
            }
    
            if (playerMove === MOVES.PAPER && aiMove === MOVES.ROCK) {
                return rules.rockBeatsPaper ? RESULTS.AI_WIN : RESULTS.PLAYER_WIN;
            }
            if (playerMove === MOVES.ROCK && aiMove === MOVES.PAPER) { // 反向情况
                return rules.rockBeatsPaper ? RESULTS.PLAYER_WIN : RESULTS.AI_WIN;
            }
    
            if (playerMove === MOVES.SCISSORS && aiMove === MOVES.PAPER) {
                return rules.paperBeatsScissors ? RESULTS.AI_WIN : RESULTS.PLAYER_WIN;
            }
            if (playerMove === MOVES.PAPER && aiMove === MOVES.SCISSORS) { // 反向情况
                return rules.paperBeatsScissors ? RESULTS.PLAYER_WIN : RESULTS.AI_WIN;
            }
        }
    };

    // --- AI Definitions ---
    const aiFunctions = {
        // Chapter 1
        "1-1": (gameData, levelConfig) => { // 固执的AI
            if (!gameData.aiState.fixedMove) {
                gameData.aiState.fixedMove = getRandomElement(Object.values(MOVES));
            }
            return gameData.aiState.fixedMove;
        },
        "1-2": (gameData, levelConfig) => { // 双面手
            if (!gameData.aiState.allowedMoves) {
                const allMoves = Object.values(MOVES);
                gameData.aiState.allowedMoves = shuffleArray([...allMoves]).slice(0, 2);
            }
            return getRandomElement(gameData.aiState.allowedMoves);
        },
        "1-3": (gameData, levelConfig) => { // 循环的AI
            if (!gameData.aiState.cycle) {
                gameData.aiState.cycle = shuffleArray(Object.values(MOVES));
                gameData.aiState.cycleIndex = 0;
            }
            const move = gameData.aiState.cycle[gameData.aiState.cycleIndex];
            gameData.aiState.cycleIndex = (gameData.aiState.cycleIndex + 1) % gameData.aiState.cycle.length;
            return move;
        },
        "1-4": (gameData, levelConfig) => { // 连击选手
            if (!gameData.aiState.currentMove || gameData.aiState.streakCount >= gameData.aiState.streakLength) {
                gameData.aiState.currentMove = getRandomElement(Object.values(MOVES));
                gameData.aiState.streakLength = getRandomInt(2, 4);
                gameData.aiState.streakCount = 0;
            }
            gameData.aiState.streakCount++;
            return gameData.aiState.currentMove;
        },
        "1-5": (gameData, levelConfig) => { // 长循环大师
            if (!gameData.aiState.cycle) {
                const cycleLength = getRandomInt(6, 8);
                gameData.aiState.cycle = Array.from({ length: cycleLength }, () => getRandomElement(Object.values(MOVES)));
                gameData.aiState.cycleIndex = 0;
            }
            const move = gameData.aiState.cycle[gameData.aiState.cycleIndex];
            gameData.aiState.cycleIndex = (gameData.aiState.cycleIndex + 1) % gameData.aiState.cycle.length;
            return move;
        },
        // Chapter 2
        "2-1": (gameData, levelConfig) => { // 模仿者
            if (gameData.playerMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            return gameData.playerMoveHistory[gameData.playerMoveHistory.length - 1];
        },
        "2-2": (gameData, levelConfig) => { // 克制者
            if (gameData.playerMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const lastPlayerMove = gameData.playerMoveHistory[gameData.playerMoveHistory.length - 1];
            return getStandardCounterMove(lastPlayerMove);
        },
        "2-3": (gameData, levelConfig) => { // 多变者 (different from its own last move)
            if (gameData.aiMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const lastAiMove = gameData.aiMoveHistory[gameData.aiMoveHistory.length - 1];
            const possibleMoves = Object.values(MOVES).filter(m => m !== lastAiMove);
            return getRandomElement(possibleMoves.length > 0 ? possibleMoves : Object.values(MOVES)); // Fallback if only one move
        },
        "2-4": (gameData, levelConfig) => { // 双重否定 (different from player's last AND AI's last)
            if (gameData.playerMoveHistory.length === 0 || gameData.aiMoveHistory.length === 0) {
                return getRandomElement(Object.values(MOVES));
            }
            const lastPlayerMove = gameData.playerMoveHistory[gameData.playerMoveHistory.length - 1];
            const lastAiMove = gameData.aiMoveHistory[gameData.aiMoveHistory.length - 1];
            let possibleMoves = Object.values(MOVES).filter(m => m !== lastPlayerMove && m !== lastAiMove);
            if (possibleMoves.length === 0) { 
                 possibleMoves = Object.values(MOVES).filter(m => m !== lastPlayerMove); 
                 if (possibleMoves.length === 0) possibleMoves = Object.values(MOVES); 
            }
            return getRandomElement(possibleMoves);
        },
        "2-5": (gameData, levelConfig) => { // 克制回忆者 (counters one of player's last two)
            if (gameData.playerMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const movesToCounter = [];
            if (gameData.playerMoveHistory.length >= 1) {
                movesToCounter.push(getStandardCounterMove(gameData.playerMoveHistory[gameData.playerMoveHistory.length - 1]));
            }
            if (gameData.playerMoveHistory.length >= 2) {
                movesToCounter.push(getStandardCounterMove(gameData.playerMoveHistory[gameData.playerMoveHistory.length - 2]));
            }
             if (movesToCounter.length === 0) return getRandomElement(Object.values(MOVES));
            return getRandomElement(movesToCounter);
        },
        "2-6": (gameData, levelConfig) => { // k步棋圣
            if (!gameData.aiState.k && gameData.aiState.k !== 0) { 
                 gameData.aiState.k = getRandomInt(2,5);
            }
            const k = gameData.aiState.k;
            if (gameData.playerMoveHistory.length < k) return getRandomElement(Object.values(MOVES));
            
            const targetPlayerMove = gameData.playerMoveHistory[gameData.playerMoveHistory.length - k];
            if (Math.random() < 0.5) { // Counter
                return getStandardCounterMove(targetPlayerMove);
            } else { // Copy
                return targetPlayerMove;
            }
        },
        // Chapter 3
        "3-1": (gameData, levelConfig) => { // 从众者 (counters player's most frequent move)
            if (gameData.playerMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const counts = { rock: 0, paper: 0, scissors: 0 };
            gameData.playerMoveHistory.forEach(move => counts[move]++);
            
            let maxCount = -1; 
            let mostFrequentMoves = [];
            for (const move in counts) {
                if (counts[move] > maxCount) {
                    maxCount = counts[move];
                    mostFrequentMoves = [move];
                } else if (counts[move] === maxCount) {
                    mostFrequentMoves.push(move);
                }
            }
            if (mostFrequentMoves.length === 0 || maxCount === 0 && mostFrequentMoves.length === 3) {
                 return getRandomElement(Object.values(MOVES));
            }
            const playerMostFrequent = getRandomElement(mostFrequentMoves);
            return getStandardCounterMove(playerMostFrequent);
        },
        "3-2": (gameData, levelConfig) => { // 胜者为王
            if (!gameData.aiState.moveWinCounts) {
                gameData.aiState.moveWinCounts = { rock: 0, paper: 0, scissors: 0 };
            }
            const counts = gameData.aiState.moveWinCounts; // This state is updated in handlePlayerChoice
            let maxWins = -1; 
            let bestMoves = [];
            for (const move in counts) {
                if (counts[move] > maxWins) {
                    maxWins = counts[move];
                    bestMoves = [move];
                } else if (counts[move] === maxWins) {
                    bestMoves.push(move);
                }
            }
            if (bestMoves.length === 0 || (maxWins <= 0 && Object.values(counts).every(c => c === 0))) {
                return getRandomElement(Object.values(MOVES));
            }
            return getRandomElement(bestMoves);
        },
        "3-3": (gameData, levelConfig) => { // 循环破壁者
            if (!gameData.aiState.detection) {
                gameData.aiState.detection = {
                    foundCycle: false,
                    playerCycle: [],
                    counterCycle: [],
                    counterIndex: 0
                };
            }
        
            if (gameData.aiState.detection.foundCycle) {
                const move = gameData.aiState.detection.counterCycle[gameData.aiState.detection.counterIndex];
                gameData.aiState.detection.counterIndex = (gameData.aiState.detection.counterIndex + 1) % gameData.aiState.detection.counterCycle.length;
                return move;
            }
        
            const history = gameData.playerMoveHistory; 
            if (history.length >= 9) { 
                for (let len = 3; len <= 5; len++) { 
                    if (history.length < len * 3) continue;
        
                    const potentialCycle = history.slice(history.length - len);
                    if (new Set(potentialCycle).size === 1) continue;

                    let occurrences = 1;
                    for (let i = 2; i <=3; i++) { 
                        if (history.length - (len * i) < 0) break; 
                        const prevSegment = history.slice(history.length - (len * i), history.length - (len * (i-1)));
                        if (potentialCycle.every((val, index) => val === prevSegment[index])) {
                            occurrences++;
                        } else {
                            break;
                        }
                    }
        
                    if (occurrences >= 3) {
                        gameData.aiState.detection.foundCycle = true;
                        gameData.aiState.detection.playerCycle = potentialCycle;
                        gameData.aiState.detection.counterCycle = potentialCycle.map(m => getStandardCounterMove(m));
                        gameData.aiState.detection.counterIndex = 0;
                        const move = gameData.aiState.detection.counterCycle[gameData.aiState.detection.counterIndex];
                        gameData.aiState.detection.counterIndex = (gameData.aiState.detection.counterIndex + 1) % gameData.aiState.detection.counterCycle.length;
                        return move;
                    }
                }
            }
            return getRandomElement(Object.values(MOVES));
        },
        "3-4": (gameData, levelConfig) => { // 概率操纵师 - Logic updated for AI's own move net wins
            // gameData.aiState.netWins is updated in handlePlayerChoice
            if (!gameData.aiState.netWins) {
                gameData.aiState.netWins = { rock: 0, paper: 0, scissors: 0 }; // Should be initialized by rule change or start
            }

            const netWins = gameData.aiState.netWins;
            const dominantMoves = [];
            for (const move in netWins) {
                if (netWins[move] >= 4) {
                    dominantMoves.push(move);
                }
            }

            if (dominantMoves.length === 1) {
                return dominantMoves[0];
            } else if (dominantMoves.length > 1) {
                return getRandomElement(dominantMoves);
            }

            const getProb = (netWin) => {
                if (netWin === 3) return 4/5;  // 0.8
                if (netWin === 2) return 3/4;  // 0.75
                if (netWin === 1) return 1/2;  // 0.5
                if (netWin === 0) return 1/3;  // ~0.333
                if (netWin === -1) return 1/4; // 0.25
                if (netWin === -2) return 1/6; // ~0.167
                if (netWin === -3) return 1/10;// 0.1
                if (netWin <= -4) return 0;   // Probability is 0
                return 1/3; 
            };

            let probs = {
                rock: getProb(netWins.rock),
                paper: getProb(netWins.paper),
                scissors: getProb(netWins.scissors)
            };

            const totalProb = probs.rock + probs.paper + probs.scissors;

            if (totalProb <= 0) { 
                return getRandomElement(Object.values(MOVES));
            }
            
            probs.rock /= totalProb;
            probs.paper /= totalProb;
            probs.scissors /= totalProb;
            
            const rand = Math.random();
            if (rand < probs.rock) return MOVES.ROCK;
            if (rand < probs.rock + probs.paper) return MOVES.PAPER;
            
            if (probs.scissors > 0) return MOVES.SCISSORS; // Only if it has some probability
            
            const availableMoves = [];
            if (probs.rock > 0) availableMoves.push(MOVES.ROCK);
            if (probs.paper > 0) availableMoves.push(MOVES.PAPER);

            if (availableMoves.length > 0) return getRandomElement(availableMoves);
            return getRandomElement(Object.values(MOVES)); // Absolute last resort
        },
        // Chapter 4
        "4-1": (gameData, levelConfig) => { // 失忆者
            if (gameData.aiMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const lastAiMove = gameData.aiMoveHistory[gameData.aiMoveHistory.length - 1];
            const possibleMoves = Object.values(MOVES).filter(m => m !== lastAiMove);
            return getRandomElement(possibleMoves.length > 0 ? possibleMoves : Object.values(MOVES));
        },
        "4-2": (gameData, levelConfig) => { // 规则变幻师
            if (!gameData.aiState.ruleState) { 
                gameData.aiState.ruleState={
                    ruleKeys: ['scissorsBeatsRock', 'paperBeatsScissors', 'rockBeatsPaper'],
                    currentRules: {
                        scissorsBeatsRock: false,
                        paperBeatsScissors: false,
                        rockBeatsPaper: false
                    },
                    lastInvertedKey: null,
                    cycleIndex:0,
                    cycle:[MOVES.ROCK,MOVES.PAPER,MOVES.SCISSORS]
                }
            }
            const keyToInvert=getRandomElement(gameData.aiState.ruleState.ruleKeys.filter(k=>k!==gameData.aiState.ruleState.lastInvertedKey));
            gameData.aiState.ruleState.currentRules[keyToInvert]=!gameData.aiState.ruleState.currentRules[keyToInvert];
            gameData.aiState.ruleState.lastInvertedKey=keyToInvert;
            const move = gameData.aiState.ruleState.cycle[gameData.aiState.ruleState.cycleIndex];
            gameData.aiState.ruleState.cycleIndex = (gameData.aiState.ruleState.cycleIndex + 1) % gameData.aiState.ruleState.cycle.length;
            return move;
        },
        "4-3": (gameData, levelConfig) => { // 嘲讽篡改者
            if (gameData.playerMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const lastPlayerMove = gameData.playerMoveHistory[gameData.playerMoveHistory.length - 1];
            return getStandardCounterMove(lastPlayerMove);
        },
        "4-4": (gameData, levelConfig) => { // 历史复现者
            if (!gameData.aiState.historicCycle) {
                gameData.aiState.historicCycle = [];
                gameData.aiState.cycleIndex = 0;
                const completedGames = gameData.gameLog.filter(log => log.levelId !== levelConfig.id && log.rounds && log.rounds.length > 0);
                if (completedGames.length > 0) {
                    const randomPastGame = getRandomElement(completedGames);
                    gameData.aiState.historicCycle = randomPastGame.rounds.map(r => r.ai); 
                }
                
                if (gameData.aiState.historicCycle.length === 0) { 
                    gameData.aiState.historicCycle = Array.from({length: getRandomInt(5,10)}, () => getRandomElement(Object.values(MOVES)));
                }
            }

            if (gameData.aiState.historicCycle.length === 0) return getRandomElement(Object.values(MOVES)); 

            const move = gameData.aiState.historicCycle[gameData.aiState.cycleIndex];
            gameData.aiState.cycleIndex = (gameData.aiState.cycleIndex + 1) % gameData.aiState.historicCycle.length;
            return move;
        },
        // Chapter 5
        "5-1": (gameData, levelConfig) => { // Boss
            if (!gameData.aiState.bossLogic) {
                gameData.aiState.bossLogic = {
                    ruleChangeCounter: 0, 
                    currentRuleAiKey: null,
                    currentRuleAiFn: null,
                    currentRuleAiName: null, 
                    timerActive: false,
                    availableAiKeys: Object.keys(aiFunctions).filter(key => key !== "4-4" && key !== "5-1") 
                };
                gameData.aiState.subAiState = {}; 
            }
            
            const bossState = gameData.aiState.bossLogic;
            
            if (bossState.ruleChangeCounter % 30 === 0 || !bossState.currentRuleAiFn) {
                const newAiKey = getRandomElement(bossState.availableAiKeys);
                bossState.currentRuleAiKey = newAiKey;
                bossState.currentRuleAiFn = aiFunctions[newAiKey];
                const subAiLevelConfig = levels.find(l => l.id === newAiKey);
                bossState.currentRuleAiName = subAiLevelConfig ? subAiLevelConfig.name : `规则 (${newAiKey})`; 
                
                currentBossRuleDisplay.textContent = `当前AI规则: ${bossState.currentRuleAiName}`; 
                currentBossRuleDisplay.style.display = 'block';
                
                gameData.aiState.subAiState = {}; 
                if (newAiKey === "3-2") { 
                    gameData.aiState.subAiState.moveWinCounts = { rock: 0, paper: 0, scissors: 0 };
                }
                if (newAiKey === "3-3") { 
                     gameData.aiState.subAiState.detection = undefined; 
                }
                if (newAiKey === "3-4") { 
                    gameData.aiState.subAiState.netWins = { rock: 0, paper: 0, scissors: 0 };
                }
            }
            bossState.ruleChangeCounter++;

            const roundsRemainingInGame = levelConfig.totalRounds - gameData.currentRound;
            if (roundsRemainingInGame <= 30 && !bossState.timerActive) {
                bossState.timerActive = true;
                startBossTimer(30); 
            }
            if (bossState.timerActive && roundsRemainingInGame < 30 && roundsRemainingInGame >=0) { 
                 const roundIntoTimerPhase = 30 - roundsRemainingInGame; 
                 const newTime = Math.max(5, Math.round(30 - (25/29) * roundIntoTimerPhase));
                 if (bossTimerValue !== newTime && gameData.currentRound > (levelConfig.totalRounds - 30)) {
                    startBossTimer(newTime);
                 }
            }
            
            const subGameDataForAI = {
                playerMoveHistory: gameData.playerMoveHistory, 
                aiMoveHistory: gameData.aiMoveHistory,         
                resultHistory: gameData.resultHistory,       
                aiState: gameData.aiState.subAiState,         
            };
            const subAiOriginalConfig = levels.find(l => l.id === bossState.currentRuleAiKey) || levelConfig;

            const move = bossState.currentRuleAiFn(subGameDataForAI, subAiOriginalConfig);
            
            gameData.aiState.subAiState = subGameDataForAI.aiState; 
            return move;
        }
    };
    // --- AI Definitions END ---
    
    const startBossTimer = (seconds) => {
        clearInterval(bossTimerInterval);
        bossTimerValue = seconds;
        timerDisplay.textContent = `⏰ ${bossTimerValue}s`;
        timerDisplay.style.display = 'block';
        isGameInputDisabled = false; 

        bossTimerInterval = setInterval(() => {
            bossTimerValue--;
            timerDisplay.textContent = `⏰ ${bossTimerValue}s`;
            if (bossTimerValue <= 0) {
                clearInterval(bossTimerInterval);
                timerDisplay.textContent = "时间到!";
                isGameInputDisabled = true; 
                choiceBtns.forEach(btn => btn.disabled = true);
            }
        }, 1000);
    };

    // --- Level Definitions ---
    const initialLevels = [
        // Chapter 1: 新手试炼
        { 
            id: "1-1", chapter: "第一章：新手试炼", name: "固执的石头", 
            description: "它似乎有特别的偏好。", 
            hint: "这个AI只会出同一种手势，在关卡开始时随机决定是哪一种。观察几轮就能发现规律。",
            totalRounds: 5, 
            winCondition: (s) => s.wins >= 4, 
            winText: "5局4胜",
            ai: aiFunctions["1-1"] 
        },
        { 
            id: "1-2", chapter: "第一章：新手试炼", name: "双面手", 
            description: "它的选择范围有限。", 
            hint: "这个AI在开局时会随机选择两种手势，之后只会从这两种手势中出拳。",
            totalRounds: 5, 
            winCondition: (s) => (s.wins + s.ties) >= 4,
            winText: "5局4平(胜+平)",
            ai: aiFunctions["1-2"] 
        },
        { 
            id: "1-3", chapter: "第一章：新手试炼", name: "循环的节奏", 
            description: "它的行动有迹可循。", 
            hint: "这个AI会按照一个固定的3手势循环出拳，例如 石头-布-剪刀-石头... 循环的顺序是随机的。",
            totalRounds: 7, 
            winCondition: (s) => s.wins >= 5,
            winText: "7局5胜",
            ai: aiFunctions["1-3"] 
        },
        { 
            id: "1-4", chapter: "第一章：新手试炼", name: "连击选手", 
            description: "它喜欢在一段时间内保持一致。", 
            hint: "这个AI会连续出同一个手势几次（2到4次之间），然后随机换一个手势再继续连击。",
            totalRounds: 9, 
            winCondition: (s) => s.wins >= 6,
            winText: "9局6胜",
            ai: aiFunctions["1-4"] 
        },
        { 
            id: "1-5", chapter: "第一章：新手试炼", name: "长循环大师", 
            description: "它的模式比较复杂，需要耐心观察。", 
            hint: "这个AI会按照一个随机长度（6到8之间）的循环节出拳。",
            totalRounds: 24, 
            winCondition: (s) => s.wins >= 16,
            winText: "24局16胜",
            ai: aiFunctions["1-5"] 
        },
        // Chapter 2: 进阶之路
        { 
            id: "2-1", chapter: "第二章：进阶之路", name: "模仿者", 
            description: "它似乎在学习你的行为。", 
            hint: "这个AI会模仿你上一把出的手势。",
            totalRounds: 7, 
            winCondition: (s) => s.wins >= 6,
            winText: "7局6胜",
            ai: aiFunctions["2-1"] 
        },
        { 
            id: "2-2", chapter: "第二章：进阶之路", name: "克制者", 
            description: "它总想胜过你。", 
            hint: "这个AI会专门出克制你上一把手势的拳。",
            totalRounds: 7, 
            winCondition: (s) => s.wins >= 6,
            winText: "7局6胜",
            ai: aiFunctions["2-2"] 
        },
        { 
            id: "2-3", chapter: "第二章：进阶之路", name: "多变者", 
            description: "它不喜欢重复自己。", 
            hint: "这个AI每一把出的手势都和它自己上一把出的不同。",
            totalRounds: 10, 
            winCondition: (s) => (s.wins + s.ties) >= 9,
            winText: "10局9平(胜+平)",
            ai: aiFunctions["2-3"] 
        },
        { 
            id: "2-4", chapter: "第二章：进阶之路", name: "双重否定", 
            description: "它试图避开最近的模式。", 
            hint: "这个AI出的手势，既和你上一把出的不同，也和它自己上一把出的不同。",
            totalRounds: 10, 
            winCondition: (s) => s.wins >= 9,
            winText: "10局9胜",
            ai: aiFunctions["2-4"] 
        },
        { 
            id: "2-5", chapter: "第二章：进阶之路", name: "克制回忆者", 
            description: "它会参考你更早之前的选择。", 
            hint: "这个AI会随机选择克制你前两把出拳中的一个。",
            totalRounds: 12, 
            winCondition: (s) => (s.wins + s.ties) >= 11,
            winText: "12局11平(胜+平)",
            ai: aiFunctions["2-5"] 
        },
        { 
            id: "2-6", chapter: "第二章：进阶之路", name: "K步棋圣", 
            description: "它会回顾你某一特定历史回合的行动。", 
            hint: "开局时，这个AI会随机一个2到5之间的整数K。之后每次出拳，它会查看你倒数第K局（即向前第K局）的手势，然后随机决定是复制还是克制那个手势。",
            totalRounds: 24, 
            winCondition: (s) => (s.wins + s.ties) >= 19,
            winText: "24局19平(胜+平)",
            ai: aiFunctions["2-6"] 
        },
        // Chapter 3: 策略大师
        { 
            id: "3-1", chapter: "第三章：策略大师", name: "从众者", 
            description: "它关注你的整体偏好。", 
            hint: "这个AI会统计你到目前为止出过的所有手势，然后出克制你最常出手势的拳。如果最常出的手势有多个（数量相同），它会从中随机选择一个来克制。",
            totalRounds: 20, 
            winCondition: (s) => (s.wins + s.ties) >= 17 && s.wins >=12 ,
            winText: "20局, (胜+平)≥17, 且胜≥12",
            ai: aiFunctions["3-1"] 
        },
        { 
            id: "3-2", chapter: "第三章：策略大师", name: "胜者为王", 
            description: "它倾向于使用成功的策略。", 
            hint: "这个AI会统计自己用哪种手势在本关卡中获胜的次数最多，然后倾向于出那种手势。如果多种手势获胜次数相同，或者还没有用任何手势赢过，则随机出拳。",
            totalRounds: 20, 
            winCondition: (s) => (s.wins + s.ties) >= 19,
            winText: "20局19平(胜+平)",
            ai: aiFunctions["3-2"] 
        },
        { 
            id: "3-3", chapter: "第三章：策略大师", name: "循环破壁者", 
            description: "它在寻找你的习惯。", 
            hint: "这个AI一开始会随机出拳。它会持续分析你的出拳记录，尝试找到你长度在3到5之间的循环节（并且循环节不能全是一种手势）。一旦它认为找到了（即某个循环节从最新局往前至少出现了3次），之后将一直按照克制你那个循环节的顺序循环出拳。",
            totalRounds: 24, 
            winCondition: (s) => s.wins >= 17,
            winText: "24局17胜",
            ai: aiFunctions["3-3"] 
        },
        { 
            id: "3-4", chapter: "第三章：策略大师", name: "概率操纵师", 
            description: "它的自信与否，会显著影响其出拳选择的倾向性。", 
            hint: "这个AI会根据它用每种手势获得的净胜局数（AI胜 - 玩家胜）来调整该手势的出拳概率。具体规则：1. 若有手势净胜场>=4，AI会优先考虑（若只有一个则必出，多个则随机）。2. 若无绝对优势手势，则：净胜0局基础概率1/3；净胜1局概率1/2；净胜2局为3/4；净胜3局为4/5。3. 净胜场为负数时，概率会降低：-1局1/4，-2局1/6，-3局1/10，小于等于-4局时该手势概率为0（除非所有手势均如此，则随机）。所有手势的概率最终会进行归一化处理。", 
            totalRounds: 40, 
            winCondition: (s) => s.wins >= 19, 
            winText: "40局19胜",             
            ai: aiFunctions["3-4"] 
        },
        // Chapter 4: 诡道高手
        { 
            id: "4-1", chapter: "第四章：诡道高手", name: "失忆者", 
            description: "有些信息似乎被刻意隐藏了。", 
            hint: "这个AI每一把出的手势都和它自己上一把出的不同。关键在于：你将无法看到刚刚结束的上一局AI出了什么手势、以及该局的胜负结果。同时，当前的总胜、平、负局数和总轮数信息也将被隐藏。历史记录中，也只有在更新的回合（即非刚刚结束的那一回合），信息才会完整显示。",
            totalRounds: 32, 
            winCondition: (s) => (s.wins + s.ties) >= 24 && s.wins >=16, 
            winText: "32局, (胜+平)≥24, 且胜≥16",
            ai: aiFunctions["4-1"],
            uiModifiers: { hideRoundInfo: true } 
        },
        { 
            id: "4-2", chapter: "第四章：诡道高手", name: "规则变幻师", 
            description: "这里的常识不一定适用。", 
            hint: "这个AI的出拳方式是固定的石头-布-剪刀循环。但是！每一把都会有一条猜拳克制规则被反转，并且反转的规则一定与上一把的不同。界面上会显示刚刚结束的上一局所应用的克制规则。",
            totalRounds: 30, 
            winCondition: (s) => (s.wins + s.ties) >= 29 && s.wins >=15, 
            winText: "30局, (胜+平)≥29, 且胜≥15",
            ai: aiFunctions["4-2"],
            uiModifiers: { showPreviousRules: true }
        },
        { 
            id: "4-3", chapter: "第四章：诡道高手", name: "嘲讽篡改者", 
            description: "不要相信你看到的一切。", 
            hint: "这个AI每一把都会出克制你上一把手势的拳。但它非常狡猾，会在记录面板里说垃圾话，并且“偷偷”篡改历史记录的显示来干扰你（当然，这不会影响到真实的胜负局数统计）。",
            totalRounds: 20, 
            winCondition: (s) => s.wins >= 19,
            winText: "20局19胜",
            ai: aiFunctions["4-3"],
            featureFlags: { tamperHistory: true }
        },
        { 
            id: "4-4", chapter: "第四章：诡道高手", name: "历史复现者", 
            description: "它好像在哪里见过你的套路。", 
            hint: "这个AI会从你之前所有已通过的关卡（必须不是本关自身）的完整对局中，随机选取一整局AI当时的出拳记录，作为它在本关卡的出拳循环节。",
            totalRounds: 30, 
            winCondition: (s) => s.wins >= 1 && (s.wins + s.ties) === s.totalRounds,
            winText: "30局, (胜+平)=30, 且胜≥1",
            ai: aiFunctions["4-4"] 
        },
        // Chapter 5: 最终挑战
        { 
            id: "5-1", chapter: "第五章：最终挑战", name: "千面智械", 
            description: "终极考验，集大成之作。", 
            hint: "终极Boss！它会从之前所有AI（除了历史复现者AI 4-4 和它自己）的规则中随机选择一个来行动，并且每30轮更换一次规则。当规则更换时，如果新的子AI依赖历史统计数据（如出拳频率、胜率等），这些统计量会为该子AI基于当前的完整对局历史重新评估或初始化（例如，“从众者”会基于当前完整历史，“胜者为王”的胜局计数会从0开始，“概率操纵师”的AI手势净胜场会从0开始）。最后30轮，你将面临出拳时间限制，从初始的30秒逐渐缩减到最终的5秒！",
            totalRounds: 300, 
            winCondition: (s) => s.wins >= 200,
            winText: "300局200胜",
            ai: aiFunctions["5-1"],
            featureFlags: { bossTimer: true }
        },
    ];

    let levels = []; 

    // --- Game Logic Functions ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }
    
    function formatTime(milliseconds) {
        if (milliseconds === null || typeof milliseconds === 'undefined' || milliseconds < 0) return 'N/A';
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}分 ${seconds.toString().padStart(2, '0')}秒`;
    }

    function resetLevelsToInitial() {
        levels = initialLevels.map(initialLevel => ({
            ...initialLevel, 
            unlocked: false,  
            bestScore: null,  
            played: false     
        }));
        if (levels.length > 0) {
            levels[0].unlocked = true;
        }
    }


    function loadProgress() {
        const savedLevels = localStorage.getItem('rpsGameLevels');
        resetLevelsToInitial(); 

        if (savedLevels) {
            const parsedLevels = JSON.parse(savedLevels); 
            levels.forEach((level, index) => { 
                const savedLevel = parsedLevels.find(sl => sl.id === level.id);
                if (savedLevel) {
                    levels[index].unlocked = savedLevel.unlocked;
                    levels[index].bestScore = savedLevel.bestScore === null ? null : { ...savedLevel.bestScore };
                    levels[index].played = savedLevel.played || (savedLevel.bestScore !== null); 
                }
            });
        }
        if (levels.length > 0 && !levels[0].unlocked) { 
            levels[0].unlocked = true;
        }

        const savedGameLog = localStorage.getItem('rpsGameLog');
        if (savedGameLog) {
            gameData.gameLog = JSON.parse(savedGameLog);
        } else {
            gameData.gameLog = [];
        }
    }

    function saveProgress() {
        const levelStatesToSave = levels.map(l => ({ 
            id: l.id, 
            unlocked: l.unlocked, 
            bestScore: l.bestScore, 
            played: l.played 
        }));
        localStorage.setItem('rpsGameLevels', JSON.stringify(levelStatesToSave));
        localStorage.setItem('rpsGameLog', JSON.stringify(gameData.gameLog));
    }
    
    function saveCompletedGame(levelConfig, roundsHistory) {
        const existingLogEntryIndex = gameData.gameLog.findIndex(log => log.levelId === levelConfig.id);
        const newLogEntry = { levelId: levelConfig.id, rounds: roundsHistory };
        if (existingLogEntryIndex > -1) {
            gameData.gameLog[existingLogEntryIndex] = newLogEntry;
        } else {
            gameData.gameLog.push(newLogEntry);
        }
    }


    function populateLevelSelect() {
        levelSelectContainer.innerHTML = '';
        let currentChapter = "";
        levels.forEach((level) => {
            if (level.chapter !== currentChapter) {
                currentChapter = level.chapter;
                const chapterHeader = document.createElement('h2');
                chapterHeader.textContent = currentChapter;
                chapterHeader.style.gridColumn = "1 / -1"; 
                chapterHeader.style.marginTop = (levelSelectContainer.children.length > 0) ? "25px" : "0";
                chapterHeader.style.marginBottom = "5px";
                chapterHeader.style.paddingBottom = "5px";
                chapterHeader.style.borderBottom = "2px solid var(--primary-color)";
                chapterHeader.style.color = "var(--primary-color)";
                levelSelectContainer.appendChild(chapterHeader);
            }

            const card = document.createElement('div');
            card.className = 'level-card';
            
            if (!level.unlocked) {
                card.classList.add('locked');
            } else if (level.bestScore) { 
                card.classList.add('beaten');
            } else if (level.played) { 
                card.classList.add('played-not-beaten');
            }

            let bestScoreHtml = '未挑战';
            if (level.bestScore) {
                bestScoreHtml = `胜: <strong>${level.bestScore.wins}</strong> | 平: <strong>${level.bestScore.ties}</strong> | 负: <strong>${level.bestScore.losses}</strong>`;
                if (typeof level.bestScore.time === 'number') { 
                     bestScoreHtml += `<br><span class="best-time-display">最快用时: ${formatTime(level.bestScore.time)}</span>`;
                }
            } else if (level.played && level.unlocked) { 
                bestScoreHtml = '未通过';
            }


            card.innerHTML = `
                <h3>${level.name} <span style="font-size:0.8em; color:#777;">(${level.id})</span></h3>
                <p>${level.description}</p> 
                <p class="win-req">要求: ${level.winText}</p>
                <div class="best-score-display">最佳: ${bestScoreHtml}</div>
            `;
            card.addEventListener('click', () => {
                if (level.unlocked) {
                    startLevel(levels.findIndex(l => l.id === level.id));
                } else {
                    alert('请先完成前面的关卡！');
                }
            });
            levelSelectContainer.appendChild(card);
        });
    }

    function resetGameData() {
        gameData.playerMoveHistory = [];
        gameData.aiMoveHistory = [];
        gameData.resultHistory = [];
        gameData.currentRound = 0;
        gameData.wins = 0;
        gameData.ties = 0;
        gameData.losses = 0;
        gameData.aiState = {}; 
        gameData.levelStartTime = Date.now(); 
        isGameInputDisabled = false;
        choiceBtns.forEach(btn => btn.disabled = false);
        clearInterval(bossTimerInterval);
        timerDisplay.style.display = 'none';
        currentRulesDisplay.style.display = 'none';
        currentRulesDisplay.textContent = '';
        currentBossRuleDisplay.style.display = 'none'; 
        currentBossRuleDisplay.textContent = '';       
        
        playerChoiceDisplay.textContent = '?';
        aiChoiceDisplay.textContent = '?';
        roundResultText.textContent = 'VS'; 
    }

    function startLevel(levelIdx) {
        currentLevelIndex = levelIdx;
        const levelConfig = levels[currentLevelIndex];
        resetGameData(); 

        levelTitleEl.textContent = `${levelConfig.chapter} - ${levelConfig.name}`;
        aiNameEl.textContent = levelConfig.name;
        aiDescriptionEl.textContent = levelConfig.description; 
        winConditionTextEl.textContent = `过关条件: ${levelConfig.winText}`;
        totalRoundsEl.textContent = levelConfig.totalRounds;

        if (levelConfig.uiModifiers?.hideRoundInfo) { 
            gameStatsEl.classList.add('hidden-for-level'); 
            aiChoiceDisplay.textContent = '?'; 
            roundResultText.textContent = "请出拳"; 
        } else {
            gameStatsEl.classList.remove('hidden-for-level');
            roundResultText.textContent = 'VS'; 
        }
        
        if (levelConfig.id === "5-1") {
            if (gameData.aiState.bossLogic && gameData.aiState.bossLogic.currentRuleAiName) {
                 currentBossRuleDisplay.textContent = `当前AI规则: ${gameData.aiState.bossLogic.currentRuleAiName}`;
                 currentBossRuleDisplay.style.display = 'block';
            } else {
                currentBossRuleDisplay.style.display = 'none'; 
            }
        } else {
            currentBossRuleDisplay.style.display = 'none'; 
        }
        
        updateUI(); 
        historyLogEl.innerHTML = ''; 
        showScreen('game-screen');
        if(!levels[currentLevelIndex].played) { 
            levels[currentLevelIndex].played = true;
            saveProgress(); 
        }
    }

    function updateUI() { 
        const levelConfig = levels[currentLevelIndex];
        
        if (!levelConfig.uiModifiers?.hideRoundInfo) {
            currentRoundEl.textContent = gameData.currentRound;
            winsCountEl.textContent = gameData.wins;
            tiesCountEl.textContent = gameData.ties;
            lossesCountEl.textContent = gameData.losses;
        }
    }

    function updateHistoryLog() {
        historyLogEl.innerHTML = ''; 
        const levelConfig = levels[currentLevelIndex];
        const isLevel41 = levelConfig.id === "4-1" && levelConfig.uiModifiers?.hideRoundInfo;
    
        gameData.resultHistory.forEach((round, index) => {
            const li = document.createElement('li');
            let playerMoveText = MOVE_EMOJI[round.playerMove] || 'N/A';
            let aiMoveToDisplay = MOVE_EMOJI[round.aiMove] || 'N/A'; 
            let resultString = ''; 
            let resultDisplayClass = ''; 
    
            if (round.result === RESULTS.PLAYER_WIN) { resultString = '你赢了'; resultDisplayClass = 'history-win'; }
            else if (round.result === RESULTS.AI_WIN) { resultString = 'AI赢了'; resultDisplayClass = 'history-loss'; }
            else { resultString = '平局'; resultDisplayClass = 'history-tie'; }

            let finalDisplayText;

            if (levelConfig.featureFlags?.tamperHistory && round.tamperedText) {
                li.classList.add('history-tampered');
                const fakeAiWinMove = getRandomElement(Object.values(MOVES));
                const fakePlayerLosingMove = getStandardWeakness(fakeAiWinMove);
                finalDisplayText = `回合 ${index + 1}: 你 ${MOVE_EMOJI[fakePlayerLosingMove]} - AI ${MOVE_EMOJI[fakeAiWinMove]} => <span class="history-loss">${round.tamperedText || 'AI又赢了!'}</span>`;
            } else if (isLevel41 && index === gameData.resultHistory.length - 1 && gameData.currentRound < levelConfig.totalRounds) {
                finalDisplayText = `回合 ${index + 1}: 你 ${playerMoveText} - AI <span class="history-hidden-outcome">?</span> => <span class="history-hidden-outcome">结果隐藏</span>`;
            } else {
                finalDisplayText = `回合 ${index + 1}: 你 ${playerMoveText} - AI ${aiMoveToDisplay} => <span class="${resultDisplayClass}">${resultString}</span>`;
            }
    
            li.innerHTML = finalDisplayText;
            historyLogEl.appendChild(li);
        });
        historyLogContainer.scrollTop = historyLogContainer.scrollHeight; 
    }
    
    function handlePlayerChoice(playerMove) {
        if (isGameInputDisabled) return;

        const levelConfig = levels[currentLevelIndex];
        if (!levelConfig || typeof levelConfig.ai !== 'function') { 
            console.error("Error: levelConfig or levelConfig.ai is not properly defined.", levelConfig);
            alert("发生了一个严重错误，请尝试刷新或清除数据。");
            return;
        }

        if (gameData.currentRound >= levelConfig.totalRounds) return; 

        if (levelConfig.featureFlags?.bossTimer && bossTimerInterval) {
            clearInterval(bossTimerInterval);
        }

        let currentRulesForThisTurn = null; 
        const aiMove = levelConfig.ai(gameData, levelConfig); 
        
        if (levelConfig.id === "4-2") {
            currentRulesForThisTurn = gameData.aiState.ruleState.currentRules; 
                if(currentRulesForThisTurn){
                    let ruleText = "上局规则: ";
                    const ruleEntries = Object.entries(currentRulesForThisTurn).map(([key, value]) => {
                        let text="";
                        if (key === 'scissorsBeatsRock') text=`${MOVE_EMOJI.rock} ${value ? '负' : '胜'} ${MOVE_EMOJI.scissors}`;
                        if (key === 'rockBeatsPaper') text=`${MOVE_EMOJI.paper} ${value ? '负' : '胜'} ${MOVE_EMOJI.rock}`;
                        if (key === 'paperBeatsScissors') text=`${MOVE_EMOJI.scissors} ${value ? '负' : '胜'} ${MOVE_EMOJI.paper}`;
                        if(key===gameData.aiState.ruleState.lastInvertedKey) return `<span style="background-color: #f39c12; padding: 2px 6px; border-radius: 4px;">${text}</span>`;
                        return text;
                    }).filter(Boolean);

                    currentRulesDisplay.innerHTML = ruleText + ruleEntries.join(', ');
                    currentRulesDisplay.style.display = 'block';
                } else {
                    currentRulesDisplay.style.display = 'none';
                }
        } else {
            currentRulesDisplay.style.display = 'none';
        }

        const result = determineWinner(playerMove, aiMove, currentRulesForThisTurn);

        gameData.currentRound++;
        gameData.playerMoveHistory.push(playerMove);
        gameData.aiMoveHistory.push(aiMove);
        
        // --- MODIFIED SECTION for AI stat updates ---
        const currentActiveLevelConfig = levels[currentLevelIndex]; // Get current level config again (or use levelConfig)
        let activeAiIdForStats = currentActiveLevelConfig.id;
        let stateToUpdateForStats = gameData.aiState;

        if (currentActiveLevelConfig.id === "5-1" && gameData.aiState.bossLogic?.currentRuleAiKey) {
            activeAiIdForStats = gameData.aiState.bossLogic.currentRuleAiKey;
            stateToUpdateForStats = gameData.aiState.subAiState;
        }

        // For AI 3-2 "胜者为王": based on AI's winning move
        if (activeAiIdForStats === "3-2") {
            if (!stateToUpdateForStats.moveWinCounts) stateToUpdateForStats.moveWinCounts = { rock: 0, paper: 0, scissors: 0 };
            if (result === RESULTS.AI_WIN) {
                stateToUpdateForStats.moveWinCounts[aiMove]++; // aiMove is the move AI just played
            }
        }

        // For AI 3-4 "概率操纵师": based on net wins of AI's own played move
        if (activeAiIdForStats === "3-4") {
            if (!stateToUpdateForStats.netWins) stateToUpdateForStats.netWins = { rock: 0, paper: 0, scissors: 0 };
            if (result === RESULTS.AI_WIN) {
                stateToUpdateForStats.netWins[aiMove]++; 
            } else if (result === RESULTS.PLAYER_WIN) {
                stateToUpdateForStats.netWins[aiMove]--;
            }
        }

        let roundRecord = { playerMove, aiMove, result };
        if (currentRulesForThisTurn) roundRecord.rules = {...currentRulesForThisTurn}; 

        if (levelConfig.featureFlags?.tamperHistory) {
            const taunts = ["太弱了!", "不堪一击!", "菜鸟~", "你行不行啊？", "我又赢啦!"];
            if (Math.random() < 0.7) { 
                roundRecord.tamperedText = getRandomElement(taunts);
            }
        }
        gameData.resultHistory.push(roundRecord);

        if (result === RESULTS.PLAYER_WIN) gameData.wins++;
        else if (result === RESULTS.AI_WIN) gameData.losses++;
        else gameData.ties++;

        playerChoiceDisplay.textContent = MOVE_EMOJI[playerMove];

        if (levelConfig.uiModifiers?.hideRoundInfo && levelConfig.id === "4-1") {
            aiChoiceDisplay.textContent = '?'; 
            roundResultText.textContent = "回合结束";
        } else {
            aiChoiceDisplay.textContent = MOVE_EMOJI[aiMove]; 
            if (result === RESULTS.PLAYER_WIN) roundResultText.textContent = "你赢了!";
            else if (result === RESULTS.AI_WIN) roundResultText.textContent = "AI赢了!";
            else roundResultText.textContent = "平局!";
        }
        
        updateUI(); 
        updateHistoryLog(); 

        if (gameData.currentRound >= levelConfig.totalRounds) {
            endLevel();
        } else {
             if (levelConfig.featureFlags?.bossTimer && gameData.aiState.bossLogic?.timerActive) {
                const roundsRemainingInGame = levelConfig.totalRounds - gameData.currentRound;
                if (roundsRemainingInGame <= 30 && roundsRemainingInGame > 0) { 
                    const roundIntoTimerPhase = 30 - roundsRemainingInGame;
                    const newTime = Math.max(5, Math.round(30 - (25/29) * roundIntoTimerPhase));
                    startBossTimer(newTime);
                } else if (roundsRemainingInGame <= 0) { 
                     clearInterval(bossTimerInterval);
                     timerDisplay.style.display = 'none';
                }
            }
        }
    }

    function endLevel() {
        clearInterval(bossTimerInterval); 
        timerDisplay.style.display = 'none';
        isGameInputDisabled = true;
        choiceBtns.forEach(btn => btn.disabled = true);

        const levelConfig = levels[currentLevelIndex];
        const stats = { wins: gameData.wins, ties: gameData.ties, losses: gameData.losses, totalRounds: levelConfig.totalRounds };
        const playerWon = levelConfig.winCondition(stats);
        const timeTakenMs = Date.now() - gameData.levelStartTime;

        modalTitle.textContent = playerWon ? "关卡通过!" : "挑战失败";
        modalMessage.textContent = playerWon ? `恭喜你战胜了 ${levelConfig.name}!` : `再接再厉，下次一定能打败 ${levelConfig.name}!`;
        modalWins.textContent = gameData.wins;
        modalTies.textContent = gameData.ties;
        modalLosses.textContent = gameData.losses;
        timeTakenValueEl.textContent = formatTime(timeTakenMs);

        const roundPlays = gameData.resultHistory.map(r => ({player: r.playerMove, ai: r.aiMove}));
        saveCompletedGame(levelConfig, roundPlays);


        if (playerWon) {
            const currentBest = levels[currentLevelIndex].bestScore;
            if (!currentBest || 
                gameData.wins > currentBest.wins || 
                (gameData.wins === currentBest.wins && gameData.ties > currentBest.ties) ||
                (gameData.wins === currentBest.wins && gameData.ties === currentBest.ties && (typeof currentBest.time !== 'number' || timeTakenMs < currentBest.time))
            ) {
                levels[currentLevelIndex].bestScore = { 
                    wins: gameData.wins, 
                    ties: gameData.ties, 
                    losses: gameData.losses,
                    time: timeTakenMs 
                };
            }


            if (currentLevelIndex + 1 < levels.length) {
                levels[currentLevelIndex + 1].unlocked = true;
                nextLevelBtn.style.display = 'inline-block';
                nextLevelBtn.onclick = () => {
                    levelCompleteModal.classList.remove('active');
                    startLevel(currentLevelIndex + 1);
                };
            } else {
                nextLevelBtn.style.display = 'none'; 
                modalMessage.textContent += " 你已经完成了所有挑战！太棒了！";
            }
        } else {
            nextLevelBtn.style.display = 'none';
        }
        
        replayLevelBtn.onclick = () => {
            levelCompleteModal.classList.remove('active');
            startLevel(currentLevelIndex); 
        };

        saveProgress(); 
        levelCompleteModal.classList.add('active');
        updateHistoryLog(); 
    }

    // --- Event Listeners ---
    choiceBtns.forEach(button => {
        button.addEventListener('click', () => handlePlayerChoice(button.dataset.move));
    });

    window.addEventListener('keydown', (e) => {
        if (gameScreen.classList.contains('active') && !isGameInputDisabled && !levelCompleteModal.classList.contains('active') && !hintModal.classList.contains('active')) {
            let move = null;
            if (e.key.toLowerCase() === 'r') move = MOVES.ROCK;
            else if (e.key.toLowerCase() === 'p') move = MOVES.PAPER;
            else if (e.key.toLowerCase() === 's') move = MOVES.SCISSORS;
            
            if (move) {
                e.preventDefault(); 
                const btn = document.querySelector(`.choice-btn[data-move="${move}"]`);
                if (btn) btn.focus(); 
                handlePlayerChoice(move);
            }
        }
    });

    backToMenuBtn.addEventListener('click', () => {
        clearInterval(bossTimerInterval); 
        populateLevelSelect();
        showScreen('main-menu');
    });
    
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            modal.classList.remove('active');
            if(modal.id === 'level-complete-modal'){ 
                 populateLevelSelect();
                 showScreen('main-menu');
            }
        });
    });

    hintBtn.addEventListener('click', () => {
        const levelConfig = levels[currentLevelIndex];
        hintTextContent.innerHTML = levelConfig.hint; 
        hintModal.classList.add('active');
    });

    unlockAllBtn.addEventListener('click', () => {
        if (confirm("确定要一键解锁所有关卡吗？这将无法撤销。")) {
            levels.forEach(level => level.unlocked = true);
            saveProgress();
            populateLevelSelect();
            alert("所有关卡已解锁！");
        }
    });

    clearAllDataBtn.addEventListener('click', () => {
        if (confirm("警告：这将清除所有关卡进度、最佳记录和游戏日志！此操作无法撤销。确定要继续吗？")) {
            localStorage.removeItem('rpsGameLevels');
            localStorage.removeItem('rpsGameLog');
            resetLevelsToInitial(); 
            gameData.gameLog = []; 
            populateLevelSelect(); 
            showScreen('main-menu');
            alert("所有数据已清除。游戏将重置为初始状态。");
        }
    });

    // --- Initialization ---
    loadProgress(); 
    populateLevelSelect();
    showScreen('main-menu');

});
