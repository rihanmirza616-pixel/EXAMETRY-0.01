/* ========================================
   EXAMETRY 0.01 — Tic Tac Toe Arena
   Neon-themed, 3 Difficulties, Minimax
   ======================================== */

const TicTacToePage = {
    board: Array(9).fill(null),
    human: 'X', ai: 'O',
    difficulty: 'Normal',
    gameOver: false,
    scores: { wins: 0, losses: 0, draws: 0 },
    moveHistory: [],

    async render() {
        UI.setBreadcrumb(['Extras', 'Tic Tac Toe']);
        // Load scores
        const saved = await Settings.get('ttt_scores');
        if (saved) this.scores = saved;
        this.resetGame();

        document.getElementById('app-content').innerHTML = `
      <div class="page-enter ttt-page">
        <div class="page-header" style="text-align:center;">
          <h1 class="page-title" style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">⚡ Tic Tac Toe Arena</h1>
          <p class="page-subtitle">Challenge the AI in neon-lit combat</p>
        </div>
        <div class="ttt-controls">
          <button class="btn ${this.difficulty === 'Easy' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TicTacToePage.setDifficulty('Easy')">Easy</button>
          <button class="btn ${this.difficulty === 'Normal' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TicTacToePage.setDifficulty('Normal')">Normal</button>
          <button class="btn ${this.difficulty === 'Hard' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="TicTacToePage.setDifficulty('Hard')">Hard</button>
        </div>
        <div class="ttt-board" id="ttt-board">
          ${this.board.map((cell, i) => `<div class="ttt-cell ${cell ? 'taken' : ''} ${cell === 'X' ? 'x' : ''}${cell === 'O' ? 'o' : ''}" onclick="TicTacToePage.makeMove(${i})" data-index="${i}">${cell || ''}</div>`).join('')}
        </div>
        <div id="ttt-status" style="font-size:1.1rem;font-weight:600;min-height:36px;"></div>
        <div class="ttt-scoreboard">
          <div class="ttt-score-item"><div class="ttt-score-value" style="color:var(--success-500);">${this.scores.wins}</div><div class="ttt-score-label">Wins</div></div>
          <div class="ttt-score-item"><div class="ttt-score-value" style="color:var(--text-tertiary);">${this.scores.draws}</div><div class="ttt-score-label">Draws</div></div>
          <div class="ttt-score-item"><div class="ttt-score-value" style="color:var(--danger-500);">${this.scores.losses}</div><div class="ttt-score-label">Losses</div></div>
        </div>
        <div style="display:flex;gap:var(--space-3);">
          <button class="btn btn-primary" onclick="TicTacToePage.resetAndRender()">🔄 New Game</button>
          <button class="btn btn-secondary" onclick="TicTacToePage.undoMove()">↩️ Undo</button>
        </div>
        <div class="card no-hover ttt-history" id="ttt-history" style="margin-top:var(--space-4);"><h4 style="padding:var(--space-2);font-size:0.85rem;">Move History</h4></div>
      </div>`;
        this.updateHistory();
    },

    resetGame() { this.board = Array(9).fill(null); this.gameOver = false; this.moveHistory = []; },
    resetAndRender() { this.resetGame(); this.render(); },

    setDifficulty(d) { this.difficulty = d; this.resetAndRender(); },

    makeMove(idx) {
        if (this.board[idx] || this.gameOver) return;
        this.board[idx] = this.human;
        this.moveHistory.push({ player: 'You', index: idx });
        this.updateBoard();

        if (this.checkWin(this.human)) { this.endGame('win'); return; }
        if (this.board.every(c => c)) { this.endGame('draw'); return; }

        // AI move
        setTimeout(() => {
            const move = this.getAIMove();
            if (move !== -1) {
                this.board[move] = this.ai;
                this.moveHistory.push({ player: 'AI', index: move });
                this.updateBoard();
                if (this.checkWin(this.ai)) { this.endGame('lose'); return; }
                if (this.board.every(c => c)) { this.endGame('draw'); }
            }
        }, 300);
    },

    getAIMove() {
        const empty = this.board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
        if (!empty.length) return -1;

        if (this.difficulty === 'Easy') {
            return empty[Math.floor(Math.random() * empty.length)];
        }
        if (this.difficulty === 'Normal') {
            // Check win/block first, else random
            for (const i of empty) { this.board[i] = this.ai; if (this.checkWin(this.ai)) { this.board[i] = null; return i; } this.board[i] = null; }
            for (const i of empty) { this.board[i] = this.human; if (this.checkWin(this.human)) { this.board[i] = null; return i; } this.board[i] = null; }
            if (this.board[4] === null) return 4;
            return empty[Math.floor(Math.random() * empty.length)];
        }
        // Hard: Minimax with alpha-beta
        return this.minimax(this.board.slice(), this.ai, -Infinity, Infinity).index;
    },

    minimax(board, player, alpha, beta) {
        const empty = board.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
        if (this.checkWinBoard(board, this.human)) return { score: -10 };
        if (this.checkWinBoard(board, this.ai)) return { score: 10 };
        if (!empty.length) return { score: 0 };

        let best = player === this.ai ? { score: -Infinity } : { score: Infinity };
        for (const i of empty) {
            board[i] = player;
            const result = this.minimax(board, player === this.ai ? this.human : this.ai, alpha, beta);
            board[i] = null;
            result.index = i;
            if (player === this.ai) {
                if (result.score > best.score) best = result;
                alpha = Math.max(alpha, result.score);
            } else {
                if (result.score < best.score) best = result;
                beta = Math.min(beta, result.score);
            }
            if (beta <= alpha) break;
        }
        return best;
    },

    WINS: [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]],

    checkWin(player) { return this.checkWinBoard(this.board, player); },
    checkWinBoard(board, player) { return this.WINS.some(w => w.every(i => board[i] === player)); },

    getWinLine(player) { return this.WINS.find(w => w.every(i => this.board[i] === player)); },

    updateBoard() {
        const cells = document.querySelectorAll('.ttt-cell');
        cells.forEach((cell, i) => {
            cell.textContent = this.board[i] || '';
            cell.className = `ttt-cell ${this.board[i] ? 'taken' : ''} ${this.board[i] === 'X' ? 'x' : ''}${this.board[i] === 'O' ? 'o' : ''}`;
        });
        this.updateHistory();
    },

    updateHistory() {
        const el = document.getElementById('ttt-history');
        if (!el) return;
        el.innerHTML = '<h4 style="padding:var(--space-2);font-size:0.85rem;">Move History</h4>' +
            this.moveHistory.map((m, i) => `<div class="ttt-move"><span>#${i + 1} ${m.player}</span><span>Cell ${m.index + 1}</span></div>`).join('');
    },

    async endGame(result) {
        this.gameOver = true;
        const status = document.getElementById('ttt-status');
        if (result === 'win') {
            status.innerHTML = '<span style="color:var(--success-500);">🎉 You Win!</span>';
            this.scores.wins++;
            this.showConfetti();
        } else if (result === 'lose') {
            status.innerHTML = '<span style="color:var(--danger-500);">😔 AI Wins!</span>';
            this.scores.losses++;
        } else {
            status.innerHTML = '<span style="color:var(--text-tertiary);">🤝 Draw!</span>';
            this.scores.draws++;
        }

        // Highlight winning line
        const winner = result === 'win' ? this.human : result === 'lose' ? this.ai : null;
        if (winner) {
            const line = this.getWinLine(winner);
            if (line) line.forEach(i => document.querySelectorAll('.ttt-cell')[i].classList.add('winning'));
        }

        await Settings.set('ttt_scores', this.scores);
        this.render(); // Re-render to update scoreboard
    },

    undoMove() {
        if (this.moveHistory.length < 2 || this.gameOver) return;
        // Undo both AI and human moves
        const aiMove = this.moveHistory.pop();
        const humanMove = this.moveHistory.pop();
        this.board[aiMove.index] = null;
        this.board[humanMove.index] = null;
        this.updateBoard();
    },

    showConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);
        const colors = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899'];
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (2 + Math.random() * 2) + 's';
            container.appendChild(piece);
        }
        setTimeout(() => container.remove(), 4000);
    }
};
