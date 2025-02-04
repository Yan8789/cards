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



// 修改更新寶石的函數
function updateGems() {
    document.getElementById('gemCount').textContent = gems;
    Storage.saveGameData(); // 儲存更新後的數據
}

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
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(pageId).style.display = 'block';

    if (pageId === 'collection') {
        renderCollection();
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

.gems {
    color: #ffd700;
    font-size: 1.2em;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
    transition: background-color 0.3s;
}

.gems:hover {
    background-color: rgba(255, 215, 0, 0.1);
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

// 遊戲初始化
showPage('collection');

//Storage.clearGameData();
//location.reload();
