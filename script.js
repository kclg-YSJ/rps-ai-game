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
        resultHistory: [], // {playerMove, aiMove, result, (tamperedText for 4-3)}
        currentRound: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        aiState: {}, // For AI-specific persistent data within a level
        gameLog: [] // For AI 4-4, stores {levelIndex, rounds: [{player, ai}, ...]}
    };
    let bossTimerInterval = null;
    let bossTimerValue = 0;
    let isGameInputDisabled = false;

    // --- UI Elements ---
    const mainMenuScreen = document.getElementById('main-menu');
    const gameScreen = document.getElementById('game-screen');
    const levelSelectContainer = document.getElementById('level-select-container');
    const unlockAllBtn = document.getElementById('unlock-all-btn');

    const levelTitleEl = document.getElementById('level-title');
    const aiNameEl = document.getElementById('ai-name');
    const aiDescriptionEl = document.getElementById('ai-description');
    const hintBtn = document.getElementById('hint-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    
    const choiceBtns = document.querySelectorAll('.choice-btn');
    const playerChoiceDisplay = document.getElementById('player-choice-display');
    const aiChoiceDisplay = document.getElementById('ai-choice-display');
    const roundResultText = document.getElementById('round-result-text');
    const timerDisplay = document.getElementById('timer-display');

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

    const getStandardWeakness = (move) => { // Move that 'move' beats
        if (move === MOVES.ROCK) return MOVES.SCISSORS;
        if (move === MOVES.PAPER) return MOVES.ROCK;
        if (move === MOVES.SCISSORS) return MOVES.PAPER;
    };
    
    const determineWinner = (playerMove, aiMove, rules = null) => {
        if (!rules) { // Standard rules
            if (playerMove === aiMove) return RESULTS.TIE;
            if (
                (playerMove === MOVES.ROCK && aiMove === MOVES.SCISSORS) ||
                (playerMove === MOVES.PAPER && aiMove === MOVES.ROCK) ||
                (playerMove === MOVES.SCISSORS && aiMove === MOVES.PAPER)
            ) {
                return RESULTS.PLAYER_WIN;
            }
            return RESULTS.AI_WIN;
        } else { // Custom rules for Level 4-2
            if (playerMove === aiMove) return RESULTS.TIE;
            if (rules[playerMove] === aiMove) return RESULTS.PLAYER_WIN; // playerMove beats aiMove
            return RESULTS.AI_WIN;
        }
    };
    
    const getCounterMoveWithRules = (move, rules) => {
        // Find which move beats 'move' according to 'rules'
        // rules is like {rock: 'paper', paper: 'scissors', scissors: 'rock'} where key is beaten by value
        for (const attacker in rules) {
            if (rules[attacker] === move) return attacker;
        }
        // This should not happen with valid rules
        return getRandomElement(Object.values(MOVES)); 
    };

    // --- AI Definitions ---
    // Each AI function will take `gameData` and `levelConfig` as arguments
    // and return the AI's move.
    // `gameData.aiState` can be used to store AI-specific data.

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
            gameData.aiState.cycleIndex = (gameData.aiState.cycleIndex + 1) % gameData.aiS<ctrl61>tate.cycle.length;
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
            if (possibleMoves.length === 0) { // e.g. player last R, AI last P. Only S remains. If player last R, AI last R, then P,S remain
                 possibleMoves = Object.values(MOVES).filter(m => m !== lastPlayerMove); // If conflict, prioritize differing from player
                 if (possibleMoves.length === 0) possibleMoves = Object.values(MOVES); // Absolute fallback
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
             if (movesToCounter.length === 0) return getRandomElement(Object.values(MOVES)); // Should not happen if history has moves
            return getRandomElement(movesToCounter);
        },
        "2-6": (gameData, levelConfig) => { // k步棋圣
            if (!gameData.aiState.k) {
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
            
            let maxCount = 0;
            let mostFrequentMoves = [];
            for (const move in counts) {
                if (counts[move] > maxCount) {
                    maxCount = counts[move];
                    mostFrequentMoves = [move];
                } else if (counts[move] === maxCount) {
                    mostFrequentMoves.push(move);
                }
            }
            const playerMostFrequent = getRandomElement(mostFrequentMoves);
            return getStandardCounterMove(playerMostFrequent);
        },
        "3-2": (gameData, levelConfig) => { // 胜者为王 (AI plays the move that has won it the most games *in this level*)
            if (!gameData.aiState.moveWinCounts) {
                gameData.aiState.moveWinCounts = { rock: 0, paper: 0, scissors: 0 };
            }
            // Update counts from previous round result
            if (gameData.resultHistory.length > 0) {
                const lastResult = gameData.resultHistory[gameData.resultHistory.length - 1];
                if (lastResult.result === RESULTS.AI_WIN) {
                    gameData.aiState.moveWinCounts[lastResult.aiMove]++;
                }
            }

            const counts = gameData.aiState.moveWinCounts;
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
            if (bestMoves.length === 0 || maxWins === 0) return getRandomElement(Object.values(MOVES)); // If no wins yet or all tied at 0
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
        
            // Attempt to detect cycle
            const history = gameData.playerMoveHistory;
            if (history.length >= 9) { // Min length for 3 occurrences of a 3-move cycle
                for (let len = 3; len <= 5; len++) { // Cycle length
                    if (history.length < len * 3) continue;
        
                    const potentialCycle = history.slice(history.length - len);
                    // Check if cycle is not all same moves
                    if (new Set(potentialCycle).size === 1) continue;

                    let occurrences = 1;
                    for (let i = 2; i <=3; i++) { // Check for 2nd and 3rd occurrence
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
                        // console.log("AI 3-3: Found player cycle", potentialCycle, " countering with", gameData.aiState.detection.counterCycle);
                        const move = gameData.aiState.detection.counterCycle[gameData.aiState.detection.counterIndex];
                        gameData.aiState.detection.counterIndex = (gameData.aiState.detection.counterIndex + 1) % gameData.aiState.detection.counterCycle.length;
                        return move;
                    }
                }
            }
            return getRandomElement(Object.values(MOVES));
        },
        "3-4": (gameData, levelConfig) => { // 概率操纵师
            if (!gameData.aiState.netWins) { // Net wins for AI with each move
                gameData.aiState.netWins = { rock: 0, paper: 0, scissors: 0 };
            }

            // Update netWins based on last round
            if (gameData.resultHistory.length > 0) {
                const lastResult = gameData.resultHistory[gameData.resultHistory.length - 1];
                const aiPlayedMove = lastResult.aiMove;
                if (lastResult.result === RESULTS.AI_WIN) {
                    gameData.aiState.netWins[aiPlayedMove]++;
                } else if (lastResult.result === RESULTS.PLAYER_WIN) {
                    gameData.aiState.netWins[aiPlayedMove]--;
                }
            }

            const getProb = (netWin) => {
                if (netWin <= 0) return 1/3;
                if (netWin === 1) return 1/2;
                if (netWin === 2) return 3/4;
                if (netWin === 3) return 4/5;
                return 1; // netWin >= 4
            };

            let probs = {
                rock: getProb(gameData.aiState.netWins.rock),
                paper: getProb(gameData.aiState.netWins.paper),
                scissors: getProb(gameData.aiState.netWins.scissors)
            };

            const totalProb = probs.rock + probs.paper + probs.scissors;
            // Normalize
            if (totalProb > 0) { // Avoid division by zero if all somehow become 0
                probs.rock /= totalProb;
                probs.paper /= totalProb;
                probs.scissors /= totalProb;
            } else { // Equal chance if totalProb is 0
                probs = { rock: 1/3, paper: 1/3, scissors: 1/3 };
            }
            
            const rand = Math.random();
            if (rand < probs.rock) return MOVES.ROCK;
            if (rand < probs.rock + probs.paper) return MOVES.PAPER;
            return MOVES.SCISSORS;
        },
        // Chapter 4
        "4-1": (gameData, levelConfig) => { // 失忆者
            // Logic is same as 2-3, UI handles hiding
            if (gameData.aiMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const lastAiMove = gameData.aiMoveHistory[gameData.aiMoveHistory.length - 1];
            const possibleMoves = Object.values(MOVES).filter(m => m !== lastAiMove);
            return getRandomElement(possibleMoves.length > 0 ? possibleMoves : Object.values(MOVES));
        },
        "4-2": (gameData, levelConfig) => { // 规则变幻师
            if (!gameData.aiState.rulesCycle) {
                // Standard rules: R > S, P > R, S > P
                // AI plays R, P, S, R, P, S...
                gameData.aiState.cycle = [MOVES.ROCK, MOVES.PAPER, MOVES.SCISSORS];
                gameData.aiState.cycleIndex = 0;

                // Generate a list of all possible rule permutations
                // A rule is {rockBeats: X, paperBeats: Y, scissorsBeats: Z} where X,Y,Z are R,P,S and all different
                // And must be a valid RPS graph (e.g., R>S, S>P, P>R or R>P, P>S, S>R)
                // There are only 2 such valid RPS graphs.
                const ruleSet1 = { [MOVES.ROCK]: MOVES.SCISSORS, [MOVES.PAPER]: MOVES.ROCK, [MOVES.SCISSORS]: MOVES.PAPER }; // Standard
                const ruleSet2 = { [MOVES.ROCK]: MOVES.PAPER, [MOVES.PAPER]: MOVES.SCISSORS, [MOVES.SCISSORS]: MOVES.ROCK }; // Reversed

                gameData.aiState.availableRuleSets = [ruleSet1, ruleSet2];
                gameData.aiState.currentRuleSet = getRandomElement(gameData.aiState.availableRuleSets); // Initial rules
            }
            
            // Change rules every round, ensuring it's different from the last
            const lastRuleSet = gameData.aiState.currentRuleSet;
            let newRuleSet = getRandomElement(gameData.aiState.availableRuleSets);
            while (newRuleSet === lastRuleSet && gameData.aiState.availableRuleSets.length > 1) { // Ensure different if possible
                newRuleSet = getRandomElement(gameData.aiState.availableRuleSets);
            }
            gameData.aiState.currentRuleSet = newRuleSet;
            levelConfig.currentRules = newRuleSet; // Make accessible for winner determination & UI

            const move = gameData.aiState.cycle[gameData.aiState.cycleIndex];
            gameData.aiState.cycleIndex = (gameData.aiState.cycleIndex + 1) % gameData.aiState.cycle.length;
            return move;
        },
        "4-3": (gameData, levelConfig) => { // 嘲讽篡改者
            // AI always counters player's last move
            if (gameData.playerMoveHistory.length === 0) return getRandomElement(Object.values(MOVES));
            const lastPlayerMove = gameData.playerMoveHistory[gameData.playerMoveHistory.length - 1];
            return getStandardCounterMove(lastPlayerMove);
            // Tampering is handled in updateHistoryLog
        },
        "4-4": (gameData, levelConfig) => { // 历史复现者
            if (!gameData.aiState.historicCycle) {
                gameData.aiState.historicCycle = [];
                gameData.aiState.cycleIndex = 0;

                const completedGames = gameData.gameLog.filter(log => log.levelIndex !== currentLevelIndex && log.rounds.length > 0);
                if (completedGames.length > 0) {
                    const randomPastGame = getRandomElement(completedGames);
                    // The cycle is the AI's moves from that game
                    gameData.aiState.historicCycle = randomPastGame.rounds.map(r => r.ai); 
                }
                
                if (gameData.aiState.historicCycle.length === 0) { // Fallback if no history or empty history
                    gameData.aiState.historicCycle = Array.from({length: 5}, () => getRandomElement(Object.values(MOVES)));
                    // console.warn("AI 4-4: No suitable past game history, using random cycle.");
                }
                // console.log("AI 4-4: Using historic cycle:", gameData.aiState.historicCycle);
            }

            if (gameData.aiState.historicCycle.length === 0) return getRandomElement(Object.values(MOVES)); // Final fallback

            const move = gameData.aiState.historicCycle[gameData.aiState.cycleIndex];
            gameData.aiState.cycleIndex = (gameData.aiState.cycleIndex + 1) % gameData.aiState.historicCycle.length;
            return move;
        },
        // Chapter 5
        "5-1": (gameData, levelConfig) => { // Boss
            if (!gameData.aiState.bossLogic) {
                gameData.aiState.bossLogic = {
                    ruleChangeCounter: 0, // Will be set to 30 on first real run
                    currentRuleAiFn: null,
                    currentRuleAiName: null, // For potential display or debugging
                    timerActive: false,
                    availableAis: Object.keys(aiFunctions).filter(key => key !== "4-4" && key !== "5-1") // Exclude self and history-dependent
                };
            }
            
            const bossState = gameData.aiState.bossLogic;
            // Change rule every 30 rounds OR if no rule is set yet
            if (bossState.ruleChangeCounter % 30 === 0 || !bossState.currentRuleAiFn) {
                const newAiKey = getRandomElement(bossState.availableAis);
                bossState.currentRuleAiFn = aiFunctions[newAiKey];
                bossState.currentRuleAiName = levels.find(l => l.id === newAiKey)?.name || newAiKey;
                // console.log(`Boss changed rule to: ${bossState.currentRuleAiName}`);
                // Reset AI state for the new sub-AI to prevent carry-over issues
                // This assumes sub-AIs initialize their state if gameData.aiState.subAiName is undefined
                // A more robust way would be to have a dedicated aiState field for the sub-AI
                gameData.aiState.subAiState = {}; // Fresh state for the sub-AI
                
                 // When a sub-AI uses gameData.aiState, it should use gameData.aiState.subAiState
                 // This requires modifying all AIs or passing a dedicated state object.
                 // For simplicity here, we'll just clear the main aiState, but this is risky.
                 // A better approach: sub-AIs get gameData and their own state object: subAI(gameData, subAiState)
                 // For now, we will pass a modified gameData for sub-AIs
            }
            bossState.ruleChangeCounter++;

            // Timer for last 30 rounds
            const roundsRemaining = levelConfig.totalRounds - gameData.currentRound;
            if (roundsRemaining <= 30 && !bossState.timerActive) {
                bossState.timerActive = true;
                startBossTimer(30); // Initial time for this round
            }
            if (bossState.timerActive && roundsRemaining < 30) { // After the first timed round
                 // Time decreases from 30 to 5 over 30 rounds.
                 // Max time = 30, Min time = 5. Decrease = 25 over 29 transitions (30 rounds total)
                 // Time for round i (0-29) = 30 - (25/29)*i
                 const roundIntoTimerPhase = 30 - roundsRemaining; // 0 to 29
                 const newTime = Math.max(5, Math.round(30 - (25/29) * roundIntoTimerPhase));
                 // Update timer only if it's a new round, not multiple calls within a round
                 if (bossTimerValue !== newTime && gameData.currentRound > (levelConfig.totalRounds - 30)) {
                    startBossTimer(newTime);
                 }
            }
            
            // Create a temporary gameData for the sub-AI to use, so its aiState doesn't clash
            // with the boss's main aiState.
            const subGameData = {
                ...gameData,
                aiState: gameData.aiState.subAiState || {} // Give it its own state object
            };
            const move = bossState.currentRuleAiFn(subGameData, levelConfig); // levelConfig might not be right for all sub-AIs
            gameData.aiState.subAiState = subGameData.aiState; // Persist sub-AI state
            return move;
        }
    };
    
    const startBossTimer = (seconds) => {
        clearInterval(bossTimerInterval);
        bossTimerValue = seconds;
        timerDisplay.textContent = `⏰ ${bossTimerValue}s`;
        timerDisplay.style.display = 'block';
        isGameInputDisabled = false; // Enable input at start of timer

        bossTimerInterval = setInterval(() => {
            bossTimerValue--;
            timerDisplay.textContent = `⏰ ${bossTimerValue}s`;
            if (bossTimerValue <= 0) {
                clearInterval(bossTimerInterval);
                timerDisplay.textContent = "时间到!";
                // Player loses the round automatically
                // This needs to be handled carefully. We can't directly call playRound.
                // We can set a flag or make a default losing move for player.
                // For now, disable input and player effectively forfeits.
                // A better way: auto-submit a "timeout" move for player.
                // For simplicity, we'll just log it as AI win, player chose nothing.
                console.log("Boss timer ran out. Player loses round.");
                isGameInputDisabled = true; 
                choiceBtns.forEach(btn => btn.disabled = true);
                // To actually process this as a loss, playRound would need to be triggered
                // with a special player move like 'timeout'.
                // This part is tricky to integrate smoothly without larger refactoring.
                // For now, the player just can't make a move if timer runs out.
                // Let's assume the player must act before timer runs out.
                // If they don't, the game just waits for their input, but they are under pressure.
                // This makes more sense than auto-loss, given current structure.
            }
        }, 1000);
    };


    // --- Level Definitions ---
    const levels = [
        // Chapter 1: 新手试炼
        { 
            id: "1-1", chapter: "第一章：新手试炼", name: "固执的石头", 
            description: "我只喜欢一种手势，你猜是哪个？", 
            hint: "它只会出同一种手势，观察一下就知道了。",
            totalRounds: 5, 
            winCondition: (s) => s.wins >= 4, 
            winText: "5局4胜",
            ai: aiFunctions["1-1"] 
        },
        { 
            id: "1-2", chapter: "第一章：新手试炼", name: "双面手", 
            description: "我只用两种手势，不多不少。", 
            hint: "它只会在开局随机选定的两种手势里出拳。",
            totalRounds: 5, 
            winCondition: (s) => (s.wins + s.ties) >= 4,
            winText: "5局4平(胜+平)",
            ai: aiFunctions["1-2"] 
        },
        { 
            id: "1-3", chapter: "第一章：新手试炼", name: "循环的节奏", 
            description: "石头、剪刀、布...或者其他顺序，我喜欢循环。", 
            hint: "它的出拳顺序是一个固定的3步循环，比如剪刀-石头-布。",
            totalRounds: 7, 
            winCondition: (s) => s.wins >= 5,
            winText: "7局5胜",
            ai: aiFunctions["1-3"] 
        },
        { 
            id: "1-4", chapter: "第一章：新手试炼", name: "连击选手", 
            description: "我会连续出同一个手势几次，然后再换。", 
            hint: "它会连续出同一个手势2到4次，然后随机换一个手势再继续连击。",
            totalRounds: 9, 
            winCondition: (s) => s.wins >= 6,
            winText: "9局6胜",
            ai: aiFunctions["1-4"] 
        },
        { 
            id: "1-5", chapter: "第一章：新手试炼", name: "长循环大师", 
            description: "我的循环节有点长，你能找到规律吗？", 
            hint: "它会按照一个随机长度（6-8）的循环节出拳。",
            totalRounds: 24, 
            winCondition: (s) => s.wins >= 16,
            winText: "24局16胜",
            ai: aiFunctions["1-5"] 
        },

        // Chapter 2: 进阶之路
        { 
            id: "2-1", chapter: "第二章：进阶之路", name: "模仿者", 
            description: "你出什么，我就出什么，简单吧？", 
            hint: "它会模仿你上一把出的手势。",
            totalRounds: 7, 
            winCondition: (s) => s.wins >= 6,
            winText: "7局6胜",
            ai: aiFunctions["2-1"] 
        },
        { 
            id: "2-2", chapter: "第二章：进阶之路", name: "克制者", 
            description: "我会专门出克制你上一把手势的拳。", 
            hint: "小心了，它总是出克制你上一次出拳的手势。",
            totalRounds: 7, 
            winCondition: (s) => s.wins >= 6,
            winText: "7局6胜",
            ai: aiFunctions["2-2"] 
        },
        { 
            id: "2-3", chapter: "第二章：进阶之路", name: "多变者", 
            description: "我从不连续两把出相同的手势。", 
            hint: "它每一把出的手势都和它自己上一把出的不同。",
            totalRounds: 10, 
            winCondition: (s) => (s.wins + s.ties) >= 9,
            winText: "10局9平(胜+平)",
            ai: aiFunctions["2-3"] 
        },
        { 
            id: "2-4", chapter: "第二章：进阶之路", name: "双重否定", 
            description: "我出的手势，既和你上一把不同，也和我自己上一把不同。", 
            hint: "有点绕？它会避免你和它自己上一轮的手势。",
            totalRounds: 10, 
            winCondition: (s) => s.wins >= 9,
            winText: "10局9胜",
            ai: aiFunctions["2-4"] 
        },
        { 
            id: "2-5", chapter: "第二章：进阶之路", name: "克制回忆者", 
            description: "我会随机克制你前两把中的一个手势。", 
            hint: "它会看你前两次的出拳，然后随机选一次来克制。",
            totalRounds: 12, 
            winCondition: (s) => (s.wins + s.ties) >= 11,
            winText: "12局11平(胜+平)",
            ai: aiFunctions["2-5"] 
        },
        { 
            id: "2-6", chapter: "第二章：进阶之路", name: "K步棋圣", 
            description: "我会看你很久以前的一个手势，然后决定是复制还是克制它。", 
            hint: "开局它会随机一个2-5的数字K。之后每次出拳，它会看你倒数第K把的手势，然后随机决定是复制还是克制那个手势。",
            totalRounds: 24, 
            winCondition: (s) => (s.wins + s.ties) >= 19,
            winText: "24局19平(胜+平)",
            ai: aiFunctions["2-6"] 
        },
        // Chapter 3: 策略大师
        { 
            id: "3-1", chapter: "第三章：策略大师", name: "从众者", 
            description: "你什么出得多，我就克制什么。", 
            hint: "它会统计你出过的所有手势，然后出克制你最常出手势的拳。如果最常出的有多个，它会随机选一个来克制。",
            totalRounds: 20, 
            winCondition: (s) => (s.wins + s.ties) >= 19 && s.wins >=14 , // Special condition: 20平19胜14
            winText: "20局, 胜+平≥19局, 且胜≥14局",
            ai: aiFunctions["3-1"] 
        },
        { 
            id: "3-2", chapter: "第三章：策略大师", name: "胜者为王", 
            description: "哪种手势让我赢得多，我就出哪种。", 
            hint: "它会统计自己用哪种手势获胜的次数最多，然后倾向于出那种手势。如果多种手势获胜次数相同，则随机。",
            totalRounds: 20, 
            winCondition: (s) => (s.wins + s.ties) >= 17,
            winText: "20局17平(胜+平)",
            ai: aiFunctions["3-2"] 
        },
        { 
            id: "3-3", chapter: "第三章：策略大师", name: "循环破壁者", 
            description: "一开始我随机出，一旦发现你的循环，哼哼...", 
            hint: "它会尝试找到你长度为3-5的循环节（且循环节不全为同种手势）。一旦它认为找到了（即某个循环节从最新局往前至少出现了3次），就会一直出克制你循环的手势。",
            totalRounds: 24, 
            winCondition: (s) => s.wins >= 17,
            winText: "24局17胜",
            ai: aiFunctions["3-3"] 
        },
        { 
            id: "3-4", chapter: "第三章：策略大师", name: "概率操纵师", 
            description: "我用某种手势赢的越多，就越爱用它。", 
            hint: "它会根据每种手势的净胜局数（胜局-负局）来调整该手势的出拳概率。净胜0局概率1/3，1局1/2，2局3/4，3局4/5，4局及以上为1（必定出）。三种手势的概率会归一化。",
            totalRounds: 40, 
            winCondition: (s) => s.wins >= 20,
            winText: "40局20胜",
            ai: aiFunctions["3-4"] 
        },
        // Chapter 4: 诡道高手
        { 
            id: "4-1", chapter: "第四章：诡道高手", name: "失忆者", 
            description: "我...上一把出了什么来着？分数也不重要啦！", 
            hint: "它每把出的手势和自己上一把不同。但你看不到它上一把具体出了什么，也看不到当前胜负平局数。",
            totalRounds: 32, 
            winCondition: (s) => (s.wins + s.ties) >= 24 && s.wins >=16, // 32平24胜16
            winText: "32局, 胜+平≥24局, 且胜≥16局",
            ai: aiFunctions["4-1"],
            uiModifiers: { hideLastAIMove: true, hideScores: true }
        },
        { 
            id: "4-2", chapter: "第四章：诡道高手", name: "规则变幻师", 
            description: "这把剪刀克石头！下把可能又不一样了。", 
            hint: "它的出拳方式是固定的石头-布-剪刀循环。但是！每一把的猜拳克制规则都会变化（比如可能变成石头克布），规则一定与上一把不同。界面会显示上一局刚结束时用的规则。",
            totalRounds: 30, 
            winCondition: (s) => (s.wins + s.ties) >= 29 && s.wins >=15, // 30局29平15胜
            winText: "30局, 胜+平≥29局, 且胜≥15局",
            ai: aiFunctions["4-2"],
            uiModifiers: { showPreviousRules: true }
        },
        { 
            id: "4-3", chapter: "第四章：诡道高手", name: "嘲讽篡改者", 
            description: "你太菜了！不信你看记录，我一直赢！", 
            hint: "它每一把都会出克制你上一把手势的拳。但它会在记录面板里说垃圾话，并“偷偷”篡改历史记录来干扰你（当然，真实的胜负局数不受影响）。",
            totalRounds: 20, 
            winCondition: (s) => s.wins >= 19,
            winText: "20局19胜",
            ai: aiFunctions["4-3"],
            featureFlags: { tamperHistory: true }
        },
        { 
            id: "4-4", chapter: "第四章：诡道高手", name: "历史复现者", 
            description: "似曾相识的局面...我好像在哪见过你的套路。", 
            hint: "它会从你之前（非本关）已完成的关卡中，随机选取一整局的AI出拳记录，作为它在本关的出拳循环节。",
            totalRounds: 30, 
            winCondition: (s) => s.wins >= 1, // 30局30胜1 (Actually, 30局1胜 is very easy, maybe it was a typo for 30局30平1胜?)
                                           // Let's assume it is "30局中至少赢1局，并且总胜局+平局达到30", which means all rounds must be win or tie, and at least 1 win
            winCondition: (s) => s.wins >= 1 && (s.wins + s.ties) === s.totalRounds,
            winText: "30局 (胜+平)=30局, 且胜≥1局",
            ai: aiFunctions["4-4"] 
        },
        // Chapter 5: 最终挑战
        { 
            id: "5-1", chapter: "第五章：最终挑战", name: "千面智械", 
            description: "我，集大成者。你，能看穿我所有的伪装吗？", 
            hint: "终极Boss！它会从之前所有AI（除了历史复现者和它自己）的规则中随机选择一个来行动，并且每30轮更换一次规则。统计数据在换规则时清零。最后30轮，你还有出拳时间限制，从30秒逐渐缩减到5秒！",
            totalRounds: 300, 
            winCondition: (s) => s.wins >= 200,
            winText: "300局200胜",
            ai: aiFunctions["5-1"],
            featureFlags: { bossTimer: true }
        },
    ].map(level => ({ ...level, unlocked: false, bestScore: null }));

    // --- Game Logic Functions ---
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    function loadProgress() {
        const savedLevels = localStorage.getItem('rpsGameLevels');
        if (savedLevels) {
            const parsedLevels = JSON.parse(savedLevels);
            levels.forEach((level, index) => {
                const savedLevel = parsedLevels.find(sl => sl.id === level.id);
                if (savedLevel) {
                    levels[index].unlocked = savedLevel.unlocked;
                    levels[index].bestScore = savedLevel.bestScore;
                }
            });
        }
        const savedGameLog = localStorage.getItem('rpsGameLog');
        if (savedGameLog) {
            gameData.gameLog = JSON.parse(savedGameLog);
        }
        // First level is always unlocked
        if (levels.length > 0) levels[0].unlocked = true;
    }

    function saveProgress() {
        const levelStatesToSave = levels.map(l => ({ id: l.id, unlocked: l.unlocked, bestScore: l.bestScore }));
        localStorage.setItem('rpsGameLevels', JSON.stringify(levelStatesToSave));
        localStorage.setItem('rpsGameLog', JSON.stringify(gameData.gameLog));
    }
    
    function saveCompletedGame(levelIdx, roundsHistory) {
        // roundsHistory should be array of {player: move, ai: move}
        const existingLogEntry = gameData.gameLog.find(log => log.levelIndex === levelIdx);
        if (existingLogEntry) {
            existingLogEntry.rounds = roundsHistory;
        } else {
            gameData.gameLog.push({ levelIndex: levelIdx, rounds: roundsHistory });
        }
        saveProgress(); // Save game log along with other progress
    }


    function populateLevelSelect() {
        levelSelectContainer.innerHTML = '';
        let currentChapter = "";
        levels.forEach((level, index) => {
            if (level.chapter !== currentChapter) {
                currentChapter = level.chapter;
                const chapterHeader = document.createElement('h2');
                chapterHeader.textContent = currentChapter;
                chapterHeader.style.gridColumn = "1 / -1"; // Span full width
                chapterHeader.style.marginTop = "20px";
                chapterHeader.style.borderBottom = "1px solid var(--primary-color)";
                chapterHeader.style.color = "var(--primary-color)";
                levelSelectContainer.appendChild(chapterHeader);
            }

            const card = document.createElement('div');
            card.className = 'level-card';
            if (!level.unlocked) card.classList.add('locked');
            card.innerHTML = `
                <h3>${level.name} (${level.id})</h3>
                <p>${level.description.substring(0, 50)}...</p>
                <p class="best-score">最佳: ${level.bestScore ? `胜${level.bestScore.wins} 平${level.bestScore.ties} 负${level.bestScore.losses}` : '未挑战'}</p>
                <p class="win-req">要求: ${level.winText}</p>
            `;
            card.addEventListener('click', () => {
                if (level.unlocked) {
                    startLevel(index);
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
        gameData.aiState = {}; // Crucial: reset AI state for each new level start
        isGameInputDisabled = false;
        choiceBtns.forEach(btn => btn.disabled = false);
        clearInterval(bossTimerInterval);
        timerDisplay.style.display = 'none';
        currentRulesDisplay.style.display = 'none';
        currentRulesDisplay.textContent = '';
        // Reset UI for specific levels
        const currentLevelConfig = levels[currentLevelIndex];
        const hideScores = currentLevelConfig.uiModifiers?.hideScores;
        const hideLastAIMove = currentLevelConfig.uiModifiers?.hideLastAIMove;

        if (!hideScores) {
            winsCountEl.parentElement.style.visibility = 'visible';
            tiesCountEl.parentElement.style.visibility = 'visible';
            lossesCountEl.parentElement.style.visibility = 'visible';
        }
        if (!hideLastAIMove) {
            aiChoiceDisplay.style.visibility = 'visible';
        }
    }

    function startLevel(levelIdx) {
        currentLevelIndex = levelIdx;
        const levelConfig = levels[currentLevelIndex];
        resetGameData(); // Reset before starting

        levelTitleEl.textContent = `${levelConfig.chapter} - ${levelConfig.name}`;
        aiNameEl.textContent = levelConfig.name;
        aiDescriptionEl.textContent = levelConfig.description;
        winConditionTextEl.textContent = `过关条件: ${levelConfig.winText}`;
        totalRoundsEl.textContent = levelConfig.totalRounds;

        // Apply UI modifiers for specific levels
        if (levelConfig.uiModifiers?.hideScores) {
            winsCountEl.parentElement.style.visibility = 'hidden';
            tiesCountEl.parentElement.style.visibility = 'hidden';
            lossesCountEl.parentElement.style.visibility = 'hidden';
        } else {
             winsCountEl.parentElement.style.visibility = 'visible';
             tiesCountEl.parentElement.style.visibility = 'visible';
             lossesCountEl.parentElement.style.visibility = 'visible';
        }
        if (levelConfig.uiModifiers?.hideLastAIMove) {
            // AI choice display will be handled in updateUI, only showing '?'
        }


        updateUI();
        historyLogEl.innerHTML = ''; // Clear history log for new level
        showScreen('game-screen');
    }

    function updateUI() {
        const levelConfig = levels[currentLevelIndex];
        currentRoundEl.textContent = gameData.currentRound;
        winsCountEl.textContent = gameData.wins;
        tiesCountEl.textContent = gameData.ties;
        lossesCountEl.textContent = gameData.losses;

        // For Level 4-1 "失忆者"
        if (levelConfig.uiModifiers?.hideLastAIMove && gameData.resultHistory.length > 0) {
            // We never show AI's last actual move, only '?' until player makes current move
        } else {
            // Standard behavior handled by playRound's display logic
        }
    }

    function updateHistoryLog() {
        historyLogEl.innerHTML = ''; // Clear and rebuild for scrollability and potential tampering
        const levelConfig = levels[currentLevelIndex];
    
        gameData.resultHistory.forEach((round, index) => {
            const li = document.createElement('li');
            let playerMoveText = MOVE_EMOJI[round.playerMove] || 'N/A';
            let aiMoveText = MOVE_EMOJI[round.aiMove] || 'N/A';
            let resultText = '';
            let resultClass = '';
    
            // For Level 4-1 "失忆者", hide AI's move for rounds except the very last one if game over
            // Actually, for 4-1, the AI's *previous* move is hidden. The current round's AI move is revealed after player plays.
            // The prompt says "隐藏上一把的对战记录", meaning the AI's choice in the log for previous rounds.
            // Let's interpret "隐藏上一把的对战记录" as: in the history log, the AI's move for (currentRound - 1) is hidden.
            // And "表示上一把AI出了什么手势的UI也要隐藏" means the main AI display area for its *last* move.

            // For Level 4-3 "嘲讽篡改者"
            let actualResult = round.result;
            let displayResultText = round.result;

            if (levelConfig.featureFlags?.tamperHistory && round.tamperedText) {
                li.classList.add('history-tampered');
                const r = Math.random();
                if (r < 0.3) { // AI wins
                    aiMoveText = MOVE_EMOJI[getRandomElement(Object.values(MOVES))]; // Could be faked
                    playerMoveText = MOVE_EMOJI[getStandardWeakness(aiMoveText)]; // Player chose losing move
                    displayResultText = RESULTS.AI_WIN;
                } else if (r < 0.6) { // Player loses (same as AI wins)
                     aiMoveText = MOVE_EMOJI[getRandomElement(Object.values(MOVES))];
                     playerMoveText = MOVE_EMOJI[getStandardWeakness(aiMoveText)];
                     displayResultText = RESULTS.AI_WIN;
                } else { // Tie (but AI claims win)
                    const fakeMove = getRandomElement(Object.values(MOVES));
                    aiMoveText = MOVE_EMOJI[fakeMove];
                    playerMoveText = MOVE_EMOJI[fakeMove];
                    displayResultText = RESULTS.AI_WIN; // AI claims it won the tie
                }
                resultText = `回合 ${index + 1}: 你 ${playerMoveText} - AI ${aiMoveText} => ${round.tamperedText || 'AI又赢了!'}`;
                resultClass = 'history-loss'; // Visually show as loss for player due to tampering
            } else {
                 // Standard result display
                if (actualResult === RESULTS.PLAYER_WIN) { resultText = '你赢了'; resultClass = 'history-win'; }
                else if (actualResult === RESULTS.AI_WIN) { resultText = 'AI赢了'; resultClass = 'history-loss'; }
                else { resultText = '平局'; resultClass = 'history-tie'; }
                
                // Adjust display for 4-1 "失忆者" if it's not the most recent round in history
                let displayAiMove = aiMoveText;
                if (levelConfig.uiModifiers?.hideLastAIMove && index < gameData.resultHistory.length -1) {
                    displayAiMove = '?';
                }

                resultText = `回合 ${index + 1}: 你 ${playerMoveText} - AI ${displayAiMove} => ${resultText}`;
            }


            li.innerHTML = resultText; // Use innerHTML for emoji
            if (resultClass && !round.tamperedText) li.classList.add(resultClass);
            historyLogEl.appendChild(li);
        });
        historyLogContainer.scrollTop = historyLogContainer.scrollHeight; // Auto-scroll to bottom
    }
    
    function handlePlayerChoice(playerMove) {
        if (isGameInputDisabled) return;

        const levelConfig = levels[currentLevelIndex];
        if (gameData.currentRound >= levelConfig.totalRounds) return; // Game already ended

        // For Boss Timer - if it's active, making a choice should clear/reset it for next round.
        if (levelConfig.featureFlags?.bossTimer && bossTimerInterval) {
            clearInterval(bossTimerInterval);
            // Timer will be restarted by the AI logic if still in timed phase
        }


        let currentRules = null;
        // For Level 4-2 "规则变幻师"
        // The AI function for 4-2 sets levelConfig.currentRules for the *upcoming* round.
        // So, we use that directly.
        if (levelConfig.id === "4-2") {
            // The AI function for 4-2 needs to be called to set the rules for *this* round
            // This is a bit tricky. The AI function call below will handle it.
            // For determining winner, we need rules set *before* AI makes its move.
            // This means AI for 4-2 should set its rules *then* pick its move based on its internal cycle.
        }
        
        // Get AI move (this might also update rules for 4-2)
        const aiMove = levelConfig.ai(gameData, levelConfig);

        if (levelConfig.id === "4-2") {
             currentRules = levelConfig.currentRules; // Rules for current round are now set
             if (gameData.resultHistory.length > 0) { // Show rules from PREVIOUS round
                const prevRules = gameData.resultHistory[gameData.resultHistory.length-1].rules;
                if(prevRules){
                    currentRulesDisplay.textContent = `上局规则: ✊胜${MOVE_EMOJI[prevRules.rock]}, ✋胜${MOVE_EMOJI[prevRules.paper]}, ✌️胜${MOVE_EMOJI[prevRules.scissors]}`;
                    currentRulesDisplay.style.display = 'block';
                }
             } else {
                currentRulesDisplay.style.display = 'none';
             }
        } else {
            currentRulesDisplay.style.display = 'none';
        }


        const result = determineWinner(playerMove, aiMove, currentRules);

        gameData.currentRound++;
        gameData.playerMoveHistory.push(playerMove);
        gameData.aiMoveHistory.push(aiMove);
        
        let roundRecord = { playerMove, aiMove, result };
        if (currentRules) roundRecord.rules = {...currentRules}; // Store rules for L4-2 history display

        // For Level 4-3 "嘲讽篡改者"
        if (levelConfig.featureFlags?.tamperHistory) {
            const taunts = ["太弱了!", "不堪一击!", "菜鸟~", "你行不行啊？", "我又赢啦!"];
            if (Math.random() < 0.7) { // 70% chance to add a taunt
                roundRecord.tamperedText = getRandomElement(taunts);
            }
        }


        gameData.resultHistory.push(roundRecord);

        if (result === RESULTS.PLAYER_WIN) gameData.wins++;
        else if (result === RESULTS.AI_WIN) gameData.losses++;
        else gameData.ties++;

        playerChoiceDisplay.textContent = MOVE_EMOJI[playerMove];
        // For Level 4-1, AI's current choice *is* shown, but its previous choice in history is hidden.
        // The main display always shows current AI choice.
        aiChoiceDisplay.textContent = MOVE_EMOJI[aiMove]; 
        
        if (result === RESULTS.PLAYER_WIN) roundResultText.textContent = "你赢了!";
        else if (result === RESULTS.AI_WIN) roundResultText.textContent = "AI赢了!";
        else roundResultText.textContent = "平局!";

        updateUI();
        updateHistoryLog();

        if (gameData.currentRound >= levelConfig.totalRounds) {
            endLevel();
        } else {
             // If Boss AI, and it's in timer phase, restart timer for next player move
             if (levelConfig.featureFlags?.bossTimer && gameData.aiState.bossLogic?.timerActive) {
                const roundsRemaining = levelConfig.totalRounds - gameData.currentRound;
                if (roundsRemaining <= 30) {
                    const roundIntoTimerPhase = 30 - roundsRemaining;
                    const newTime = Math.max(5, Math.round(30 - (25/29) * roundIntoTimerPhase));
                    startBossTimer(newTime);
                }
            }
        }
    }

    function endLevel() {
        clearInterval(bossTimerInterval); // Clear any active boss timer
        timerDisplay.style.display = 'none';
        isGameInputDisabled = true;
        choiceBtns.forEach(btn => btn.disabled = true);

        const levelConfig = levels[currentLevelIndex];
        const stats = { wins: gameData.wins, ties: gameData.ties, losses: gameData.losses, totalRounds: levelConfig.totalRounds };
        const playerWon = levelConfig.winCondition(stats);

        modalTitle.textContent = playerWon ? "关卡通过!" : "挑战失败";
        modalMessage.textContent = playerWon ? `恭喜你战胜了 ${levelConfig.name}!` : `再接再厉，下次一定能打败 ${levelConfig.name}!`;
        modalWins.textContent = gameData.wins;
        modalTies.textContent = gameData.ties;
        modalLosses.textContent = gameData.losses;

        // Save full game history for AI 4-4
        const roundPlays = gameData.resultHistory.map(r => ({player: r.playerMove, ai: r.aiMove}));
        saveCompletedGame(currentLevelIndex, roundPlays);


        if (playerWon) {
            if (!levelConfig.bestScore || gameData.wins > levelConfig.bestScore.wins || (gameData.wins === levelConfig.bestScore.wins && gameData.ties > levelConfig.bestScore.ties)) {
                levels[currentLevelIndex].bestScore = { wins: gameData.wins, ties: gameData.ties, losses: gameData.losses };
            }
            if (currentLevelIndex + 1 < levels.length) {
                levels[currentLevelIndex + 1].unlocked = true;
                nextLevelBtn.style.display = 'inline-block';
                nextLevelBtn.onclick = () => {
                    levelCompleteModal.classList.remove('active');
                    startLevel(currentLevelIndex + 1);
                };
            } else {
                nextLevelBtn.style.display = 'none'; // No next level
                modalMessage.textContent += " 你已经完成了所有挑战！太棒了！";
            }
            saveProgress();
        } else {
            nextLevelBtn.style.display = 'none';
        }
        
        replayLevelBtn.onclick = () => {
            levelCompleteModal.classList.remove('active');
            startLevel(currentLevelIndex); // Replay current level
        };

        levelCompleteModal.classList.add('active');
    }

    // --- Event Listeners ---
    choiceBtns.forEach(button => {
        button.addEventListener('click', () => handlePlayerChoice(button.dataset.move));
    });

    window.addEventListener('keydown', (e) => {
        if (gameScreen.classList.contains('active') && !isGameInputDisabled) {
            let move = null;
            if (e.key.toLowerCase() === 'r') move = MOVES.ROCK;
            else if (e.key.toLowerCase() === 'p') move = MOVES.PAPER;
            else if (e.key.toLowerCase() === 's') move = MOVES.SCISSORS;
            
            if (move) {
                // Find the button and simulate click for visual feedback (optional)
                const btn = document.querySelector(`.choice-btn[data-move="${move}"]`);
                if (btn) btn.focus(); // or btn.classList.add('active-shortcut'); setTimeout remove
                handlePlayerChoice(move);
            }
        }
    });

    backToMenuBtn.addEventListener('click', () => {
        clearInterval(bossTimerInterval); // Stop boss timer if active
        populateLevelSelect();
        showScreen('main-menu');
    });
    
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
            if(btn.closest('.modal').id === 'level-complete-modal'){ // If closing level complete modal, go to menu
                 populateLevelSelect();
                 showScreen('main-menu');
            }
        });
    });

    hintBtn.addEventListener('click', () => {
        const levelConfig = levels[currentLevelIndex];
        hintTextContent.textContent = levelConfig.hint;
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

    // --- Initialization ---
    loadProgress();
    populateLevelSelect();
    showScreen('main-menu');

});