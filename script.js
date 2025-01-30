// 第一部分：基礎設置和圖片處理
let gems = 3000;
let collection = new Map(); // 使用 Map 來儲存卡片和數量
let currentPack = null;



const IMAGE_CONFIG = {
    BASE_PATH: './public/picture/card/',
    PACK_PATH: './public/picture/pack.jpg',
    DEFAULT_PATH: './public/picture/default.jpg',
    FORMATS: [ 'jpeg','jpg', 'png', 'webp', 'gif'], // 新增jpeg格式
    MAX_RETRIES: 3,
    CACHE_IMAGES: true
};

function formatImagePath(cardId) {
    return `${IMAGE_CONFIG.BASE_PATH}${cardId}`;
}

// 改進的圖片驗證函數
async function validateImagePath(path) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = path;
    });
}

// 改進的圖片錯誤處理函數
async function handleImageLoadError(imgElement, cardId) {
    const basePath = formatImagePath(cardId);
    
    // 嘗試所有支援的圖片格式
    for (const format of IMAGE_CONFIG.FORMATS) {
        const path = `${basePath}.${format}`;
        if (await validateImagePath(path)) {
            imgElement.src = path;
            return true;
        }
    }
    
    // 所有格式都失敗時使用預設圖片
    console.warn(`無法載入卡片 ${cardId} 的圖片，使用預設圖片`);
    imgElement.src = IMAGE_CONFIG.DEFAULT_PATH;
    imgElement.setAttribute('alt', `Card ${cardId}`);
    return false;
}

    
function preloadCardImages() {
    const grid = document.querySelector('.card-grid');
    grid.innerHTML = `<h3 class="collection-count">總卡片數: ${cards.length} (已收集 ${collection.size} 種)</h3>`;
    return Promise.all(cards.map(async card => {
        // 預設先嘗試.jpg格式
        const imagePath = `${card.image}`;
        try {
            if (await validateImagePath(imagePath)) {
                const img = new Image();
                img.src = imagePath;
            } else {
                // 若失敗則觸發錯誤處理流程
                const tempImg = new Image();
                await handleImageLoadError(tempImg, card.id);
            }
        } catch (error) {
            console.warn(`預載入圖片失敗: ${card.id}`);
        }
    }));
}

// 卡片資料初始化
const cards = Array.from({length: 385}, (_, i) => ({
    id: i + 1,
    image: `${IMAGE_CONFIG.BASE_PATH}${i+1}.jpeg`,
    rarity: Math.random() < 0.05 ? 'UR' : Math.random() < 0.2 ? 'SR' : 'R'
}));

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

function renderCard(card, container, options = {}) {
    const div = document.createElement('div');
    div.className = `card ${card.rarity.toLowerCase()}-border`;
    
    const img = document.createElement('img');
    img.alt = `Card ${card.id}`;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'card-loading';
    loadingDiv.textContent = '載入中...';
    
    div.innerHTML = `<div class="card-inner"></div>`;
    const cardInner = div.querySelector('.card-inner');
    cardInner.appendChild(loadingDiv);
    cardInner.appendChild(img);
    
    // 非同步載入圖片
    const loadImage = async () => {
        try {
            // 先嘗試.jpg擴展名
            const imagePath = `${card.image}`;
            if (await validateImagePath(imagePath)) {
                img.src = imagePath;
            } else {
                await handleImageLoadError(img, card.id);
            }
        } catch (error) {
            await handleImageLoadError(img, card.id);
        } finally {
            loadingDiv.remove();
        }
    };
    
    loadImage();
    container.appendChild(div);
    return div;
}
// 遊戲頁面渲染
function renderGames() {
    document.getElementById('games').innerHTML = `
        <div class="game-grid">
            <div class="game-card" onclick="startMemoryGame()">
                <h3>配對遊戲</h3>
                <p>獎勵: 300 寶石</p>
            </div>
            <div class="game-card" onclick="startPuzzleGame()">
                <h3>圈圈叉叉</h3>
                <p>獎勵: 100 寶石</p>
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
        const packsPage = document.getElementById('packs');
        const gamesPage = document.getElementById('games');
        
        if (packsPage.style.display === 'block') {
            resetPackState();
        } else if (gamesPage.style.display === 'block') {
            renderGames();
        }
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
        <h2>遊戲完成！獲得300寶石</h2>
        <button onclick="startMemoryGame()">重新開始</button>
        <button onclick="closeGameEnd()">關閉</button>
    `;
    document.getElementById('games').appendChild(endScreen);
    earnGems(300);
}

function tictactoeGameEnd(result) {
    const endScreen = document.createElement('div');
    endScreen.className = 'game-end';
    
    if (result === 'win') {
        endScreen.innerHTML = `
            <h2>你獲勝！獲得100寶石</h2>
            <button onclick="startPuzzleGame()">重新開始</button>
            <button onclick="closeGameEnd()">關閉</button>
        `;
        earnGems(100);
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
    return Array.from({length: packSize}, () => {
        const rand = Math.random();
        let rarity = rand < 0.05 ? 'UR' : rand < 0.25 ? 'SR' : 'R';
        const possibleCards = cards.filter(card => card.rarity === rarity);
        return possibleCards[Math.floor(Math.random() * possibleCards.length)];
    });
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