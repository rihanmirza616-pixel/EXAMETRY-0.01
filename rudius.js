/* ========================================
   EXAMETRY 0.01 — Rudius 3.z Page
   AI Mentor Chat with Groq Integration
   ======================================== */

const RudiusPage = {
    currentConvId: null,
    messages: [],

    async render() {
        UI.setBreadcrumb(['Rudius 3.z', 'AI Mentor']);
        const content = document.getElementById('app-content');
        const conversations = await ExaDB.getAll('chatConversations');

        content.innerHTML = `
      <div class="page-enter">
        <div class="page-header">
          <h1 class="page-title">Rudius 3.z — AI Mentor</h1>
          <p class="page-subtitle">Expert guidance for CUET, NEET, JEE & more</p>
        </div>

        <div class="chat-layout">
          <div class="chat-sidebar">
            <div class="chat-sidebar-header">
              <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="RudiusPage.newConversation()">+ New Chat</button>
            </div>
            <div class="chat-list" id="chat-list">
              ${conversations.map(c => `
                <div class="chat-list-item ${c.id === this.currentConvId ? 'active' : ''}" onclick="RudiusPage.loadConversation('${c.id}')">
                  <span style="overflow: hidden; text-overflow: ellipsis;">${c.title || 'New Chat'}</span>
                  <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); RudiusPage.deleteConversation('${c.id}')" style="flex-shrink:0; padding: 2px;">🗑</button>
                </div>
              `).join('')}
              ${conversations.length === 0 ? '<p style="padding: var(--space-3); color: var(--text-tertiary); font-size: 0.8rem; text-align: center;">No conversations yet</p>' : ''}
            </div>
          </div>

          <div class="chat-main">
            <div class="chat-header">
              <div class="flex-row">
                <div class="avatar sm" style="background: var(--gradient-accent);">🤖</div>
                <div>
                  <div style="font-weight: 600; font-size: 0.9rem;">Rudius 3.z</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Powered by Groq</div>
                </div>
              </div>
              <div class="flex-row">
                <button class="btn btn-ghost btn-sm" id="mic-btn" onclick="RudiusPage.toggleAudio()" title="Voice input">
                  🎤
                </button>
                <button class="btn btn-ghost btn-sm" onclick="RudiusPage.exportChat()" title="Export chat">📥</button>
              </div>
            </div>

            <div class="chat-quick-actions" id="chat-quick-actions">
              <button class="btn btn-secondary btn-sm" onclick="RudiusPage.sendQuickAction('Create a revision plan for my weak topics')">📋 Revision Plan</button>
              <button class="btn btn-secondary btn-sm" onclick="RudiusPage.sendQuickAction('Explain the most important concepts I should focus on')">💡 Key Concepts</button>
              <button class="btn btn-secondary btn-sm" onclick="RudiusPage.sendQuickAction('Give me a mock test strategy')">🎯 Test Strategy</button>
              <button class="btn btn-secondary btn-sm" onclick="RudiusPage.sendQuickAction('Analyze my weak areas and suggest improvements')">📊 Analyze Weaknesses</button>
            </div>

            <div class="chat-messages" id="chat-messages">
              <div style="text-align: center; padding: var(--space-8); color: var(--text-tertiary);">
                <div style="font-size: 2.5rem; margin-bottom: var(--space-3);">🤖</div>
                <h3 style="margin-bottom: var(--space-2);">Start a Conversation</h3>
                <p style="font-size: 0.85rem;">Ask me about study plans, concepts, exam tips, or anything related to your preparation.</p>
              </div>
            </div>

            <div class="chat-input-area">
              <textarea class="chat-input" id="chat-input" placeholder="Ask Rudius anything..." rows="1"
                onkeypress="if(event.key==='Enter' && !event.shiftKey){event.preventDefault(); RudiusPage.sendMessage();}"
                oninput="this.style.height='auto'; this.style.height=Math.min(this.scrollHeight,120)+'px';"
              ></textarea>
              <button class="btn btn-primary" onclick="RudiusPage.sendMessage()" id="send-btn">
                Send ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

        // Load first conversation or create one
        if (conversations.length > 0 && !this.currentConvId) {
            this.loadConversation(conversations[0].id);
        } else if (this.currentConvId) {
            this.loadConversation(this.currentConvId);
        }
    },

    async newConversation() {
        const id = ExaDB.generateId();
        await ExaDB.put('chatConversations', {
            id,
            title: 'New Chat',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        this.currentConvId = id;
        this.messages = [];
        this.render();
    },

    async loadConversation(convId) {
        this.currentConvId = convId;
        const allMessages = await ExaDB.getAll('chatMessages');
        this.messages = allMessages
            .filter(m => m.conversationId === convId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Update active state in sidebar
        document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
        const items = document.querySelectorAll('.chat-list-item');
        items.forEach(item => {
            if (item.onclick?.toString().includes(convId)) item.classList.add('active');
        });

        this.renderMessages();
    },

    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
        <div style="text-align: center; padding: var(--space-8); color: var(--text-tertiary);">
          <div style="font-size: 2.5rem; margin-bottom: var(--space-3);">🤖</div>
          <h3 style="margin-bottom: var(--space-2);">Start a Conversation</h3>
          <p style="font-size: 0.85rem;">Ask me about study plans, concepts, exam tips, or anything related to your preparation.</p>
        </div>
      `;
            return;
        }

        container.innerHTML = this.messages.map(m => `
      <div class="chat-message ${m.role}">
        <div class="avatar sm" style="${m.role === 'assistant' ? 'background: var(--gradient-accent);' : ''}">
          ${m.role === 'assistant' ? '🤖' : '👤'}
        </div>
        <div>
          <div class="chat-bubble">${this.formatMessage(m.content)}</div>
          <div class="chat-time">${UI.timeAgo(m.timestamp)}</div>
        </div>
      </div>
    `).join('');

        container.scrollTop = container.scrollHeight;
    },

    formatMessage(text) {
        // Basic markdown-like formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: var(--bg-tertiary); padding: 1px 6px; border-radius: 4px; font-size: 0.85em;">$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/^- (.+)/gm, '• $1')
            .replace(/^\d+\.\s/gm, match => `<strong>${match}</strong>`);
    },

    async sendMessage(text) {
        const input = document.getElementById('chat-input');
        const message = text || input.value.trim();
        if (!message) return;
        if (input) input.value = '';

        // Create conversation if none
        if (!this.currentConvId) {
            await this.newConversation();
        }

        // Add user message
        const userMsg = {
            id: ExaDB.generateId(),
            conversationId: this.currentConvId,
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };
        await ExaDB.put('chatMessages', userMsg);
        this.messages.push(userMsg);

        // Update conversation title if first message
        if (this.messages.filter(m => m.role === 'user').length === 1) {
            await ExaDB.put('chatConversations', {
                id: this.currentConvId,
                title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }

        this.renderMessages();

        // Show typing indicator
        const container = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message assistant';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
      <div class="avatar sm" style="background: var(--gradient-accent);">🤖</div>
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    `;
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;

        try {
            // Build context
            const profile = await Settings.getProfile();
            const entries = await ExaDB.getAll('studyEntries');
            const recentEntries = entries.slice(-5);

            let contextMsg = '';
            if (profile) {
                contextMsg = `\n[Student context: name=${profile.name}, exam=${profile.targetExam || 'Not set'}, target=${profile.targetCollege || 'Not set'}, daily goal=${profile.dailyGoal || 6}h]`;
                if (profile.books && profile.books.length > 0) {
                    contextMsg += `\n[Books/Textbooks being used: ${profile.books.join(', ')}. Base your explanations, references, and chapter suggestions on these books.]`;
                }
            }
            if (recentEntries.length > 0) {
                const weak = ExaAnalytics.getWeakChapters(entries).slice(0, 3);
                const streak = ExaAnalytics.getStudyStreak(entries);
                contextMsg += `\n[Recent stats: streak=${streak} days, weak chapters: ${weak.map(w => w.name + '(' + w.average + '%)').join(', ')}]`;
            }

            // Build messages array for API
            const apiMessages = [
                { role: 'system', content: ExaAPI.MENTOR_SYSTEM_PROMPT + contextMsg },
                ...this.messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
            ];

            const response = await ExaAPI.callGroq(apiMessages);

            // Remove typing indicator
            document.getElementById('typing-indicator')?.remove();

            // Typing animation: reveal response character by character
            const assistMsg = {
                id: ExaDB.generateId(),
                conversationId: this.currentConvId,
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            // Create the bubble element for animation
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message assistant';
            msgDiv.innerHTML = `
              <div class="avatar sm" style="background: var(--gradient-accent);">🤖</div>
              <div>
                <div class="chat-bubble" id="typing-bubble" style="min-height:1.6em;"></div>
                <div class="chat-time">${UI.timeAgo(assistMsg.timestamp)}</div>
              </div>`;
            container.appendChild(msgDiv);
            container.scrollTop = container.scrollHeight;

            const bubble = document.getElementById('typing-bubble');
            const formatted = this.formatMessage(response);
            const totalChars = response.length;
            const chunkSize = Math.max(1, Math.ceil(totalChars / 60)); // finish in ~60 steps ≈ 1s
            let charIdx = 0;

            await new Promise(resolve => {
                const interval = setInterval(() => {
                    charIdx = Math.min(charIdx + chunkSize, totalChars);
                    // Render partial formatted text + blinking cursor
                    bubble.innerHTML = this.formatMessage(response.substring(0, charIdx)) +
                        (charIdx < totalChars ? '<span class="animate-pulse" style="color:var(--primary-400);">▎</span>' : '');
                    container.scrollTop = container.scrollHeight;
                    if (charIdx >= totalChars) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 16); // ~60fps
            });

            // Final render with full formatting
            bubble.innerHTML = formatted;
            bubble.removeAttribute('id');

            // Save to DB
            await ExaDB.put('chatMessages', assistMsg);
            this.messages.push(assistMsg);

        } catch (error) {
            document.getElementById('typing-indicator')?.remove();
            const errType = ExaAPI.handleError(error);

            if (errType === 'missing_key') {
                // Show helpful message in chat
                const helpMsg = {
                    id: ExaDB.generateId(),
                    conversationId: this.currentConvId,
                    role: 'assistant',
                    content: '⚠️ **API Key Required**\n\nTo chat with me, you need to add your Groq API key.\n\nGo to **Settings > Integrations** and enter your Groq API key to get started.',
                    timestamp: new Date().toISOString()
                };
                this.messages.push(helpMsg);
                this.renderMessages();
            }
        }
    },

    async sendQuickAction(text) {
        this.sendMessage(text);
    },

    toggleAudio() {
        if (!ExaAudio.isRecognitionSupported()) {
            UI.showToast('Speech recognition is not supported in this browser. Please use Chrome or Edge.', 'warning');
            return;
        }

        if (ExaAudio.isListening) {
            ExaAudio.stopRecognition();
        } else {
            ExaAudio.startRecognition(
                (transcript) => {
                    document.getElementById('chat-input').value = transcript;
                    UI.showToast('Voice captured! Press Send or edit the text.', 'info');
                },
                (error) => UI.showToast(error, 'warning')
            );
            UI.showToast('Listening... Speak now 🎤', 'info');
        }
    },

    async deleteConversation(convId) {
        UI.showConfirm('Delete this conversation?', async () => {
            await ExaDB.delete('chatConversations', convId);
            // Delete related messages
            const allMessages = await ExaDB.getAll('chatMessages');
            for (const msg of allMessages) {
                if (msg.conversationId === convId) await ExaDB.delete('chatMessages', msg.id);
            }
            if (this.currentConvId === convId) {
                this.currentConvId = null;
                this.messages = [];
            }
            this.render();
            UI.showToast('Conversation deleted.', 'info');
        });
    },

    async exportChat() {
        if (this.messages.length === 0) {
            UI.showToast('No messages to export.', 'warning');
            return;
        }
        const text = this.messages.map(m => `[${m.role.toUpperCase()}] ${UI.formatDate(m.timestamp)}\n${m.content}`).join('\n\n---\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rudius-chat-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        UI.showToast('Chat exported! 📥', 'success');
    }
};
