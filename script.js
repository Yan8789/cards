// 本地存儲相關的函數
const Storage = {
    // 儲存遊戲數據
    saveGameData: function() {
        try {
            // 將 Map 轉換為可序列化的對象
            const collectionObject = {};
            collection.forEach((value, key) => {
                collectionObject[key] = {
                    card: value.card,
                    count: value.count
                };
            });

            // 儲存數據
            localStorage.setItem('cardGameGems', gems.toString());
            localStorage.setItem('cardGameCollection', JSON.stringify(collectionObject));
            localStorage.setItem('cardGameLastSaved', new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('保存遊戲數據失敗:', error);
            return false;
        }
    },

    // 載入遊戲數據
    loadGameData: function() {
        try {
            // 讀取寶石
            const savedGems = localStorage.getItem('cardGameGems');
            if (savedGems) {
                gems = parseInt(savedGems, 10);
            }

            // 讀取收藏
            const savedCollection = localStorage.getItem('cardGameCollection');
            if (savedCollection) {
                const collectionObject = JSON.parse(savedCollection);
                collection = new Map();
                
                // 將數據轉換回 Map
                Object.entries(collectionObject).forEach(([key, value]) => {
                    collection.set(key, {
                        card: value.card,
                        count: value.count
                    });
                });
            }

            // 更新顯示
            updateGems();
            if (document.querySelector('.card-grid')) {
                renderCollection();
            }
            
            return true;
        } catch (error) {
            console.error('載入遊戲數據失敗:', error);
            return false;
        }
    },

    // 清除遊戲數據
    clearGameData: function() {
        try {
            localStorage.removeItem('cardGameGems');
            localStorage.removeItem('cardGameCollection');
            localStorage.removeItem('cardGameLastSaved');
            return true;
        } catch (error) {
            console.error('清除遊戲數據失敗:', error);
            return false;
        }
    }
};

// 添加點擊計數器
let secretButtonClickCount = 0;
let lastSecretButtonClickTime = 0;

// 創建並添加隱藏按鈕
function createSecretButton() {
    // 移除可能已存在的按鈕
    const existingButton = document.querySelector('.secret-button');
    if (existingButton) {
        existingButton.remove();
    }

    const button = document.createElement('div');
    button.className = 'secret-button';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 12px;
        height: 12px;
        background-color: #000;
        opacity: 0.2;
        border-radius: 50%;
        cursor: pointer;
        z-index: 1000;
        -webkit-tap-highlight-color: transparent;
    `;

    // 添加點擊事件
    button.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        
        // 如果超過3秒沒點擊，重置計數
        if (currentTime - lastSecretButtonClickTime > 3000) {
            secretButtonClickCount = 0;
        }
        
        secretButtonClickCount++;
        lastSecretButtonClickTime = currentTime;
        
        // 達到35次點擊
        if (secretButtonClickCount === 35) {
            console.log('觸發隱藏功能');
            activateHiddenFeature();
            secretButtonClickCount = 0; // 重置計數
        }
        
        // 防止事件冒泡
        e.stopPropagation();
    });

    // 添加觸摸事件處理
    button.addEventListener('touchstart', (e) => {
        e.preventDefault(); // 防止觸摸時的閃爍
    });

    document.body.appendChild(button);
}

// 隱藏功能觸發
function activateHiddenFeature() {
    // 添加所有卡片到收藏
    for (let i = 1; i <= 1084; i++) {
        const rarity = Math.random() < 0.05 ? 'UR' : Math.random() < 0.25 ? 'SR' : 'R';
        const cardKey = `${i}-${rarity}`;
        if (!collection.has(cardKey)) {
            collection.set(cardKey, {
                card: {
                    id: i,
                    image: `${IMAGE_CONFIG.BASE_PATH}${i}.jpeg`,
                    rarity: rarity
                },
                count: 1
            });
        }
    }
    
    // 更新顯示
    if (document.querySelector('.card-grid')) {
        renderCollection();
        displayCollectionStats();
    }
    
    // 保存數據
    Storage.saveGameData();
    
    // 震動反饋
    if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
    }
}



// 修改更新寶石的函數
function updateGems() {
    document.getElementById('gemCount').textContent = gems;
    Storage.saveGameData(); // 儲存更新後的數據
}


function showCompletionGif() {
    console.log("開始顯示完成選擇");
    
    try {
        const existingOverlay = document.querySelector('.completion-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        document.body.style.overflow = 'hidden';
        
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';
        overlay.style.cssText = `
            position: fixed;
            z-index: 999999;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            touch-action: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        `;

        const container = document.createElement('div');
        container.className = 'completion-gif';
        container.style.cssText = `
            padding: 20px;
            background-color: rgba(42, 42, 42, 0.9);
            border-radius: 20px;
            text-align: center;
            width: 90%;
            max-width: 800px;
            touch-action: none;
        `;

        const message = document.createElement('div');
        message.textContent = '恭喜！你已收集完所有卡片！選擇一個禮物盒打開：';
        message.style.cssText = `
            color: #ffd700;
            font-size: 18px;
            margin: 15px 0;
            font-weight: bold;
            padding: 0 10px;
        `;
        container.appendChild(message);

        const gifContainer = document.createElement('div');
        gifContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
            max-width: 600px;
            margin: 20px auto;
        `;

        // 創建4個禮物盒
        for (let i = 1; i <= 4; i++) {
            const giftBox = document.createElement('div');
            giftBox.style.cssText = `
                background: url('public/picture/gift.png') no-repeat center;
                background-size: contain;
                width: 100%;
                height: 200px;
                cursor: pointer;
                transition: transform 0.3s ease;
            `;
            
            giftBox.addEventListener('mouseover', () => {
                giftBox.style.transform = 'scale(1.1)';
            });
            
            giftBox.addEventListener('mouseout', () => {
                giftBox.style.transform = 'scale(1)';
            });

            giftBox.onclick = () => showSelectedGift(i, overlay);
            
            gifContainer.appendChild(giftBox);
        }

        container.appendChild(gifContainer);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

    } catch (error) {
        console.error("顯示完成選擇時發生錯誤:", error);
    }
}

function showSelectedGift(giftNumber, originalOverlay) {
    originalOverlay.innerHTML = '';
    
    const container = document.createElement('div');
    container.className = 'completion-gif';
    container.style.cssText = `
        padding: 20px;
        background-color: rgba(42, 42, 42, 0.9);
        border-radius: 20px;
        text-align: center;
        width: 90%;
        max-width: 400px;
        touch-action: none;
    `;

    const loadingText = document.createElement('div');
    loadingText.textContent = '打開禮物中...';
    loadingText.style.color = '#ffd700';
    container.appendChild(loadingText);

    const img = new Image();
    img.onload = () => {
        loadingText.remove();
        
        img.style.cssText = `
            width: 100%;
            max-width: 300px;
            height: auto;
            border-radius: 10px;
            margin-bottom: 20px;
            pointer-events: none;
            display: block;
            margin: 0 auto;
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = '關閉';
        closeButton.style.cssText = `
            background: #4169e1;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            min-width: 120px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
            margin-top: 15px;
        `;

        closeButton.onclick = () => {
            document.body.style.overflow = '';
            originalOverlay.remove();
        };

        container.appendChild(img);
        container.appendChild(closeButton);
    };

    img.onerror = (error) => {
        console.error("禮物圖片載入失敗:", error);
        loadingText.textContent = '圖片載入失敗';
        loadingText.style.color = '#ff4444';
    };

    img.src = `public/picture/${giftNumber}.gif?t=${new Date().getTime()}`;
    originalOverlay.appendChild(container);
}

// 2. 修改檢查完成的邏輯，確保在手機上也能正常運作
function checkCollectionComplete() {
    const uniqueCards = new Set();
    let totalCount = 0;

    collection.forEach((value, key) => {
        const cardId = parseInt(key.split('-')[0]);
        uniqueCards.add(cardId);
        totalCount++;
    });

    // 添加詳細日誌
    console.log("收集檢查 (手機端)：");
    console.log("- 獨特卡片數：", uniqueCards.size);
    console.log("- 總卡片數：", totalCount);
    console.log("- 目標卡片數：", 1084);
    
    // 保存檢查結果到 localStorage
    const checkResult = {
        uniqueCards: uniqueCards.size,
        totalCards: totalCount,
        timestamp: new Date().toISOString(),
        isMobile: /Mobi|Android/i.test(navigator.userAgent)
    };
    
    localStorage.setItem('lastCollectionCheck', JSON.stringify(checkResult));
    
    return uniqueCards.size >= 1084;
}

// 3. 在頁面載入時添加手機端檢測
document.addEventListener('DOMContentLoaded', () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
        console.log("檢測到手機端訪問");
        
        // 添加手機端特定的 meta 標籤
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
            document.head.appendChild(meta);
        }
        
        // 防止手機端縮放造成的問題
        document.addEventListener('touchmove', (e) => {
            if (document.querySelector('.completion-overlay')) {
                e.preventDefault();
            }
        }, { passive: false });
    }
});

function revealCards() {
    document.getElementById('packReveal').style.display = 'none';
    const revealedCards = document.getElementById('revealedCards');
    revealedCards.style.display = 'grid';
    revealedCards.innerHTML = '';

    currentPack.forEach(card => {
        const cardKey = `${card.id}-${card.rarity}`;
        const currentData = collection.get(cardKey) || { card, count: 0 };
        collection.set(cardKey, {
            card: card,
            count: currentData.count + 1
        });

        const div = document.createElement('div');
        div.className = `card ${card.rarity.toLowerCase()}-border`;
        const currentCount = collection.get(cardKey).count;

        const img = document.createElement('img');
        img.src = `${card.image}`; 
        img.onerror = () => handleImageLoadError(img, card.id);

        div.innerHTML = `
            <div class="card-inner">
                ${img.outerHTML}
                ${currentCount === 1 ? '<div class="new-card-badge">新卡片!</div>' : ''}
            </div>
        `;
        revealedCards.appendChild(div);
    });

    setTimeout(() => {
        document.getElementById('drawButton').style.display = 'block';

        // 創建遮罩層
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);

        // 創建彈出視窗
        const continueScreen = document.createElement('div');
        continueScreen.className = 'game-end';
        continueScreen.innerHTML = `
            <h2>抽卡完成！</h2>
            ${gems >= 1000 ? '<button onclick="continueDraw()">繼續抽卡</button>' : '<div class="warning">寶石不足！</div>'}
            <button onclick="closeGameEnd()">關閉</button>
        `;

        document.getElementById('packs').appendChild(continueScreen);

        // 限制互動，只允許點擊按鈕
        document.body.style.pointerEvents = 'none';
        continueScreen.style.pointerEvents = 'auto';
    }, 1000);
}

// 在頁面載入時初始化數據
document.addEventListener('DOMContentLoaded', () => {
    Storage.loadGameData();
});

// 定期自動保存（每分鐘）
setInterval(() => {
    Storage.saveGameData();
}, 60000);

// 在頁面關閉時保存數據
window.addEventListener('beforeunload', () => {
    Storage.saveGameData();
});

// 第一部分：基礎設置和圖片處理
let gems = 10000;
let collection = new Map(); // 使用 Map 來儲存卡片和數量
let currentPack = null;



const IMAGE_CONFIG = {
    BASE_PATH: './public/picture/card/',
    PACK_PATH: './public/picture/pack.jpg',
    DEFAULT_PATH: './public/picture/default.jpg'
};

function formatImagePath(cardId) {
    return `${IMAGE_CONFIG.BASE_PATH}${cardId}`;
}

// 改進的圖片驗證函數
async function validateImagePath(path) {
    return new Promise(resolve => {
        const img = new Image();
        const timeoutId = setTimeout(() => {
            img.src = '';  // 取消圖片載入
            resolve(false);
        }, 5000);  // 5秒超時
        
        img.onload = () => {
            clearTimeout(timeoutId);
            resolve(true);
        };
        img.onerror = () => {
            clearTimeout(timeoutId);
            resolve(false);
        };
        img.src = path;
    });
}


// 簡化的圖片錯誤處理函數
function handleImageLoadError(imgElement, cardId) {
    // 直接使用 JPEG 格式
    const imagePath = `${IMAGE_CONFIG.BASE_PATH}${cardId}.jpeg`;
    
    // 添加錯誤處理
    imgElement.onerror = function() {
        console.warn(`無法載入卡片 ${cardId} 的圖片，使用預設圖片`);
        this.src = IMAGE_CONFIG.DEFAULT_PATH;
        this.setAttribute('alt', `Card ${cardId}`);
    };
    
    // 設置圖片來源
    imgElement.src = imagePath;
}

    
async function preloadCardImages() {
    const preloadPromises = cards.map(async card => {
        for (const format of IMAGE_CONFIG.FORMATS) {
            const path = `${IMAGE_CONFIG.BASE_PATH}${card.id}.${format}`;
            try {
                if (await validateImagePath(path)) {
                    return true;
                }
            } catch (error) {
                console.warn(`預載入失敗: ${path}`);
            }
        }
        return false;
    });
    
    return Promise.all(preloadPromises);
}

const cards = Array.from({length: 1084}, (_, i) => {
    const id = i + 1;
    // 保留邊框顏色的隨機分配，但不影響抽卡機率
    const rand = Math.random();
    const rarity = rand < 0.05 ? 'UR' : rand < 0.25 ? 'SR' : 'R';
    
    return {
        id: id,
        image: `${IMAGE_CONFIG.BASE_PATH}${id}.jpeg`,
        rarity: rarity  // 只用於顯示邊框顏色
    };
});

// 頁面顯示控制
// 修改頁面顯示函數
function showPage(pageId) {
    // 隱藏所有頁面
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    
    // 顯示目標頁面
    const targetPage = document.getElementById(pageId);
    targetPage.style.display = 'block';

    // 如果是收藏冊頁面，執行相關操作
    if (pageId === 'collection') {
        renderCollection();
        displayCollectionStats();
        
        // 檢查收集完成並顯示動畫
        setTimeout(() => {
            if (checkCollectionComplete()) {
                console.log("檢測到收集完成"); // 用於偵錯
                showCompletionGif();
            }
        }, 300); // 給予更多時間確保頁面完全加載
    } else if (pageId === 'packs') {
        resetPackState();
    } else if (pageId === 'games') {
        renderGames();
    }
}

// 改進的渲染卡片函數
function renderCard(card, container) {
    const div = document.createElement('div');
    div.className = `card ${card.rarity.toLowerCase()}-border`;
    
    const cardInner = document.createElement('div');
    cardInner.className = 'card-inner';
    
    const img = document.createElement('img');
    img.alt = `Card ${card.id}`;
    
    // 直接設置圖片處理
    handleImageLoadError(img, card.id);
    
    cardInner.appendChild(img);
    div.appendChild(cardInner);
    
    return div;
}
// 遊戲頁面渲染
function renderGames() {
    document.getElementById('games').innerHTML = `
        <div class="game-grid">
            <div class="game-card" onclick="startMemoryGame()">
                <h3>配對遊戲</h3>
                <p>獎勵: 1000 寶石</p>
            </div>
            <div class="game-card" onclick="startPuzzleGame()">
                <h3>圈圈叉叉</h3>
                <p>獎勵: 300 寶石</p>
            </div>
        </div>
    `;
}

// 第二部分：遊戲相關函數
// 配對遊戲
function startMemoryGame() {
    const gameBoard = document.createElement('div');
    gameBoard.className = 'memory-game';
    gameBoard.innerHTML = `
        <div class="game-header">
            <button onclick="showPage('games')" class="exit-btn">退出遊戲</button>
        </div>
        <div class="game-content"></div>
    `;
    
    document.getElementById('games').innerHTML = '';
    document.getElementById('games').appendChild(gameBoard);
    
    const gameContent = gameBoard.querySelector('.game-content');
    const cards = ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐱', '🐶', '🐭', '🐹', '🐰', '🦊'];
    let flipped = [];
    let matched = [];
 
    cards.sort(() => Math.random() - 0.5).forEach(emoji => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `<div class="back">?</div><div class="front">${emoji}</div>`;
        card.addEventListener('click', () => flipCard(card, emoji));
        gameContent.appendChild(card);
    });
 
    function flipCard(card, emoji) {
        if (flipped.length < 2 && !flipped.includes(card) && !matched.includes(emoji)) {
            card.classList.add('flipped');
            flipped.push(card);
            
            if (flipped.length === 2) {
                setTimeout(() => {
                    const [card1, card2] = flipped;
                    const emoji1 = card1.querySelector('.front').textContent;
                    const emoji2 = card2.querySelector('.front').textContent;
                    
                    if (emoji1 === emoji2) {
                        matched.push(emoji1);
                        if (matched.length === cards.length / 2) {
                            setTimeout(memoryGameEnd, 500);
                        }
                    } else {
                        card1.classList.remove('flipped');
                        card2.classList.remove('flipped');
                    }
                    flipped = [];
                }, 1000);
            }
        }
    }
}

// 圈圈叉叉遊戲
function startPuzzleGame() {
    const gameBoard = document.createElement('div');
    gameBoard.className = 'tictactoe-game';
    gameBoard.innerHTML = `
        <div class="game-header">
            <button onclick="showPage('games')" class="exit-btn">退出遊戲</button>
        </div>
        <div class="board">
            ${Array(9).fill('').map((_, i) => `<div class="cell" data-index="${i}"></div>`).join('')}
        </div>
    `;
    
    document.getElementById('games').innerHTML = '';
    document.getElementById('games').appendChild(gameBoard);
    
    let currentPlayer = 'X';
    let board = Array(9).fill('');
    let gameActive = true;
    
    const cells = gameBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = cell.dataset.index;
            if (board[index] === '' && gameActive && currentPlayer === 'X') {
                makeMove(index);
            }
        });
    });
    
    function makeMove(index) {
        board[index] = currentPlayer;
        cells[index].textContent = currentPlayer;
        cells[index].classList.add(currentPlayer.toLowerCase());
        
        if (checkWin()) {
            gameActive = false;
            tictactoeGameEnd(currentPlayer === 'X' ? 'win' : 'lose');
            return;
        }
        
        if (board.every(cell => cell !== '')) {
            gameActive = false;
            tictactoeGameEnd('draw');
            return;
        }
        
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        
        if (currentPlayer === 'O') {
            setTimeout(computerMove, 500);
        }
    }
    
    function computerMove() {
        if (!gameActive) return;
        
        const emptyCells = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
        if (emptyCells.length > 0) {
            const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            makeMove(randomIndex);
        }
    }
    
    function checkWin() {
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        
        return winPatterns.some(pattern => {
            const [a, b, c] = pattern;
            return board[a] && board[a] === board[b] && board[b] === board[c];
        });
    }
}

// 第三部分：遊戲結束和抽卡相關函數
// 結束畫面關閉
function closeGameEnd() {
    const gameEnd = document.querySelector('.game-end');
    if (gameEnd) {
        gameEnd.remove();
        const overlay = document.querySelector('.overlay');
        if (overlay) overlay.remove();

        // 解除限制
        document.body.style.pointerEvents = 'auto';
    }
}

// 卡包狀態重置
function resetPackState() {
    const drawButton = document.getElementById('drawButton');
    const packGrid = document.getElementById('packGrid');
    const packReveal = document.getElementById('packReveal');
    const revealedCards = document.getElementById('revealedCards');
    
    drawButton.style.display = 'block';
    packGrid.style.display = 'none';
    packReveal.style.display = 'none';
    revealedCards.style.display = 'none';
    
    packGrid.innerHTML = '';
    revealedCards.innerHTML = '';
}

// 遊戲結束處理
function memoryGameEnd() {
    const endScreen = document.createElement('div');
    endScreen.className = 'game-end';
    endScreen.innerHTML = `
        <h2>遊戲完成！獲得1000寶石</h2>
        <button onclick="startMemoryGame()">重新開始</button>
        <button onclick="closeGameEnd()">關閉</button>
    `;
    document.getElementById('games').appendChild(endScreen);
    earnGems(1000);
}

function tictactoeGameEnd(result) {
    const endScreen = document.createElement('div');
    endScreen.className = 'game-end';
    
    if (result === 'win') {
        endScreen.innerHTML = `
            <h2>你獲勝！獲得300寶石</h2>
            <button onclick="startPuzzleGame()">重新開始</button>
            <button onclick="closeGameEnd()">關閉</button>
        `;
        earnGems(300);
    } else if (result === 'lose') {
        endScreen.innerHTML = `
            <h2>電腦獲勝！</h2>
            <button onclick="startPuzzleGame()">重新開始</button>
            <button onclick="closeGameEnd()">關閉</button>
        `;
    } else {
        endScreen.innerHTML = `
            <h2>平手！</h2>
            <button onclick="startPuzzleGame()">重新開始</button>
            <button onclick="closeGameEnd()">關閉</button>
        `;
    }
    
    document.getElementById('games').appendChild(endScreen);
}

// 抽卡相關函數
function continueDraw() {
    closeGameEnd();
    document.getElementById('revealedCards').style.display = 'none';
    startDraw();
}

function startDraw() {
    if (gems < 1000) {
        const notEnoughGems = document.createElement('div');
        notEnoughGems.className = 'game-end';
        notEnoughGems.innerHTML = `
            <h2>寶石不足！</h2>
            <button onclick="closeGameEnd()">關閉</button>
        `;
        document.getElementById('packs').appendChild(notEnoughGems);
        return;
    }
    
    gems -= 1000;
    updateGems();
    
    currentPack = generatePack();
    document.getElementById('drawButton').style.display = 'none';
    renderPackGrid();
}

function generatePack() {
    const packSize = 5;
    const pack = [];
    const availableIndices = Array.from({length: cards.length}, (_, i) => i);
    
    // 隨機抽取不重複的卡片
    for (let i = 0; i < packSize; i++) {
        // 從剩餘卡片中隨機選擇
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        const cardIndex = availableIndices[randomIndex];
        
        // 加入選中的卡片，並從可選列表中移除
        pack.push(cards[cardIndex]);
        availableIndices.splice(randomIndex, 1);
        
        // 為新抽到的卡片重新隨機分配邊框顏色
        const rand = Math.random();
        pack[i].rarity = rand < 0.05 ? 'UR' : rand < 0.25 ? 'SR' : 'R';
    }
    
    return pack;
}

function displayCollectionProgress() {
    const total = cards.length;
    const collected = collection.size;
    const percentage = ((collected / total) * 100).toFixed(1);
    
    const grid = document.querySelector('.card-grid');
    if (grid) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'collection-progress';
        progressDiv.innerHTML = `收集進度：${collected}/${total} (${percentage}%)`;
        grid.prepend(progressDiv);
    }
}

// 第四部分：卡片相關函數
// 卡包網格渲染
function renderPackGrid() {
    const grid = document.getElementById('packGrid');
    grid.innerHTML = '';
    grid.style.display = 'grid';
    
    for (let i = 0; i < 15; i++) {
        const pack = document.createElement('div');
        pack.className = 'pack-card';
        pack.innerHTML = `<img src="${IMAGE_CONFIG.PACK_PATH}" alt="pack">`;
        pack.onclick = () => selectPack(i);
        grid.appendChild(pack);
    }
}

// 卡包選擇和展示
function selectPack(index) {
    document.getElementById('packGrid').style.display = 'none';
    const packReveal = document.getElementById('packReveal');
    packReveal.style.display = 'flex';
    setupRevealHandler(packReveal);
}

function setupRevealHandler(element) {
    let tapCount = 0;
    const cardContainer = element.querySelector('.card-container');
    cardContainer.style.transform = 'translate(-50%, -30%) scale(0.8)';

    cardContainer.addEventListener('click', () => {
        tapCount++;
        if (tapCount === 1) {
            cardContainer.style.transform = 'translate(-50%, -30%) scale(0.8) rotateY(-15deg)';
        }
        if (tapCount === 2) {
            cardContainer.style.transform = 'translate(-50%, -30%) scale(0.8) rotateY(-180deg)';
            setTimeout(revealCards, 800);
        }
    });
}

// 卡片展示
function revealCards() {
    document.getElementById('packReveal').style.display = 'none';
    const revealedCards = document.getElementById('revealedCards');
    revealedCards.style.display = 'grid';
    revealedCards.innerHTML = '';
    
    currentPack.forEach(card => {
        const cardKey = `${card.id}-${card.rarity}`;
        const currentData = collection.get(cardKey) || { card, count: 0 };
        collection.set(cardKey, {
            card: card,
            count: currentData.count + 1
        });
        
        const div = document.createElement('div');
        div.className = `card ${card.rarity.toLowerCase()}-border`;
        const currentCount = collection.get(cardKey).count;
        
        const img = document.createElement('img');
        img.src = `${card.image}`; 
        img.onerror = () => handleImageLoadError(img, card.id);

        
        div.innerHTML = `
            <div class="card-inner">
                ${img.outerHTML}
                ${currentCount === 1 ? '<div class="new-card-badge">新卡片!</div>' : ''}
            </div>
        `;
        revealedCards.appendChild(div);
    });
    
    setTimeout(() => {
        document.getElementById('drawButton').style.display = 'block';
        const continueScreen = document.createElement('div');
        continueScreen.className = 'game-end';
        continueScreen.innerHTML = `
            <h2>抽卡完成！</h2>
            ${gems >= 1000 ? '<button onclick="continueDraw()">繼續抽卡</button>' : '<div class="warning">寶石不足！</div>'}
            <button onclick="closeGameEnd()">關閉</button>
        `;
        document.getElementById('packs').appendChild(continueScreen);
    }, 1000);
}

// 收藏集渲染
function renderCollection() {
    const grid = document.querySelector('.card-grid');
    grid.innerHTML = '';
    
    collection.forEach((value) => {
        const { card, count } = value;
        const div = document.createElement('div');
        div.className = `card ${card.rarity.toLowerCase()}-border`;
        
        const img = document.createElement('img');
        img.src = `${card.image}`; // 保留預設嘗試.jpg
        img.onerror = () => handleImageLoadError(img, card.id);
        
        div.innerHTML = `
            <div class="card-inner">
                ${img.outerHTML}
                <div class="card-count">×${count}</div>
            </div>
        `;
        div.addEventListener('click', () => showEnlargedCard(card, count));
        grid.appendChild(div);
    });
}



// 卡片放大顯示
function showEnlargedCard(card, count) {
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    
    const img = document.createElement('img');
    img.src = `${card.image}`; // 保留預設嘗試.jpg
    img.onerror = () => handleImageLoadError(img, card.id);
    
    overlay.innerHTML = `
        <div class="enlarged-card ${card.rarity.toLowerCase()}-border">
            ${img.outerHTML}
            <div class="enlarged-card-count">持有數量：${count}</div>
        </div>
    `;
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

let clickCount = 0;
let lastClickTime = 0;

// 修改更新寶石的函數
function updateGems() {
    document.getElementById('gemCount').textContent = gems;
    Storage.saveGameData(); // 儲存更新後的數據
}

// 添加點擊處理函數
document.addEventListener('DOMContentLoaded', () => {
    const gemsElement = document.querySelector('.gems');
    
    gemsElement.addEventListener('click', () => {
        const currentTime = new Date().getTime();
        
        // 檢查點擊時間間隔
        if (currentTime - lastClickTime > 2000) {
            clickCount = 1;
        } else {
            clickCount++;
        }
        
        lastClickTime = currentTime;
        
        // 達到15次連續點擊
        if (clickCount === 15) {
            gems += 50000;
            updateGems();
            clickCount = 0;
        }
    });
});

// 寶石相關函數
function earnGems(amount) {
    gems += amount;
    updateGems();
}

function updateGems() {
    document.getElementById('gemCount').textContent = gems;
}

function calculateCollectionStats() {
    let totalCards = 0;
    let uniqueCards = collection.size;
    
    collection.forEach(value => {
        totalCards += value.count;
    });
    
    return {
        totalCards,
        uniqueCards,
        progress: ((uniqueCards / 1084) * 100).toFixed(1)
    };
}

function displayCollectionStats() {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'collection-stats';
    
    const stats = calculateCollectionStats();
    
    statsDiv.innerHTML = `
        <div class="stats-row">
            <div class="stat-item">
                <span class="stat-label">總抽卡數</span>
                <span class="stat-value">${stats.totalCards}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">不重複卡片</span>
                <span class="stat-value">${stats.uniqueCards}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">收集進度</span>
                <span class="stat-value">${stats.progress}%</span>
            </div>
        </div>
    `;
    
   
    // 在卡片網格之前插入統計信息
    const grid = document.querySelector('.card-grid');
    if (grid.firstChild) {
        grid.insertBefore(statsDiv, grid.firstChild);
    } else {
        grid.appendChild(statsDiv);
    }
}

// 修改 showPage 函數，在顯示遊戲頁面時添加按鈕
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    originalShowPage(pageId);
    
    if (pageId === 'games') {
        // 確保按鈕被添加到頁面
        setTimeout(createSecretButton, 100);
    } else {
        // 在其他頁面移除按鈕
        const secretButton = document.querySelector('.secret-button');
        if (secretButton) {
            secretButton.remove();
        }
    }
};

// 在頁面載入時初始化
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('games').style.display === 'block') {
        createSecretButton();
    }
});




// 遊戲初始化
showPage('collection');

//Storage.clearGameData();
//location.reload();

