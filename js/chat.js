/**
 * Chat Module - Implements the simulated chat dialog for ChelloAI.
 */
const Chat = {
    conversations: {
        'typing': {
            question: "How does AI help you write or type?",
            answer: "Typing is a physical struggle for me. By using structured AI prompts and templates, I draft articles and build code structures in minutes. It turns my ideas into results, acting as my typing speed."
        },
        'speaking': {
            question: "How do you speak at keynotes using technology?",
            answer: "Friedrich's ataxia affects speech stability. To deliver keynote presentations, I write detailed scripts and use voice amplification tools. This lets me share an authentic, direct message on stage."
        },
        'warrior': {
            question: "What does being a 'warrior' mean to you?",
            answer: "It means identifying your constraints and treating them as design parameters. You design your work around your parameters to continue creating and building every day."
        },
        'aim': {
            question: "What is the goal of Accessible AIM?",
            answer: "Accessible AIM is an initiative where I share my prompt setups. I want to build a space where people with physical limitations learn to configure AI tools to write, code, and design using their voice."
        },
        'services': {
            question: "What digital services do you build?",
            answer: "I build websites and funnels that make things easy and professional. I handle the code and set up clean designs that look great and work smoothly."
        }
    },

    init() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.suggestionsGrid = document.getElementById('chat-suggestions-grid');
        
        if (this.messagesContainer && this.suggestionsGrid) {
            this.renderSuggestions();
        }

        // Bind LiveAvatar UI Elements
        this.startAvatarBtn = document.getElementById('start-avatar-btn');
        this.stopAvatarBtn = document.getElementById('stop-avatar-btn');
        this.chatWindow = document.getElementById('companion-chat-window');
        this.avatarContainer = document.getElementById('companion-avatar-container');
        this.iframeTarget = document.getElementById('avatar-iframe-target');

        if (this.startAvatarBtn && this.stopAvatarBtn) {
            this.startAvatarBtn.addEventListener('click', () => this.startAvatarSession());
            this.stopAvatarBtn.addEventListener('click', () => this.stopAvatarSession());
        }
    },

    async startAvatarSession() {
        if (!this.chatWindow || !this.avatarContainer || !this.iframeTarget) return;

        // Disable button to prevent double clicks during load
        this.startAvatarBtn.disabled = true;
        this.startAvatarBtn.innerHTML = `<span style="font-size: 1.1rem; margin-right: 5px;">⏳</span> Connecting...`;

        // Switch to the video avatar container
        this.chatWindow.style.display = 'none';
        this.avatarContainer.style.display = 'flex';
        
        // Render spinner loading state
        this.iframeTarget.innerHTML = `
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div id="avatar-loading" style="color: white; text-align: center; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 10;">
                <div style="width: 40px; height: 40px; border: 3px solid rgba(10, 216, 173, 0.15); border-top-color: var(--color-teal); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="font-size: 1rem; color: var(--color-gray-light); margin: 0;">Connecting to ChelloAI voice companion...</p>
            </div>
        `;

        try {
            const response = await fetch('/api/create-avatar-embed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Server API returned error ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.url) {
                // Render secure iframe with microphone permissions
                this.iframeTarget.innerHTML = `
                    <iframe src="${data.url}" allow="microphone" title="LiveAvatar Embed" style="width: 100%; height: 100%; min-height: 380px; border: none;"></iframe>
                `;
            } else if (data.isMock) {
                // Key not configured yet - load developer sandbox assistant guide
                this.iframeTarget.innerHTML = `
                    <div style="color: white; text-align: center; max-width: 450px; padding: 25px; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 10; margin: 0 auto;">
                        <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(10, 216, 173, 0.4));">🤖</span>
                        <h4 style="margin: 0; color: var(--color-teal); font-size: 1.25rem; font-family: var(--font-heading); font-weight: 600;">Sandbox Mode Dev Alert</h4>
                        <p style="font-size: 0.95rem; color: var(--color-gray-light); line-height: 1.5; margin: 0;">
                            LiveAvatar API Key is not configured yet. Set up the key in your local settings to enable context streams.
                        </p>
                        <p style="font-size: 0.85rem; color: var(--color-gray-steel); line-height: 1.45; margin: 0; text-align: left; background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); width: 100%;">
                            <strong>Setup Instructions:</strong><br>
                            1. Open <code>.dev.vars</code> in the project root.<br>
                            2. Add your key: <code>LIVEAVATAR_API_KEY="your_api_key_here"</code>.<br>
                            3. Restart the wrangler dev server.
                        </p>
                        <button id="load-sandbox-demo-btn" class="btn btn-teal" style="width: 100%; padding: 10px; font-size: 0.9rem;">Test Free Sandbox Demo Iframe</button>
                    </div>
                `;

                // Allow loading the default sandbox demo iframe directly (requires no auth on iframe link)
                const sandboxDemoBtn = document.getElementById('load-sandbox-demo-btn');
                if (sandboxDemoBtn) {
                    sandboxDemoBtn.addEventListener('click', () => {
                        this.iframeTarget.innerHTML = `
                            <iframe src="https://embed.liveavatar.com/v1/65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0" allow="microphone" title="LiveAvatar Sandbox Demo" style="width: 100%; height: 100%; min-height: 380px; border: none;"></iframe>
                        `;
                    });
                }
            } else {
                throw new Error(data.message || "Failed to initialize LiveAvatar session.");
            }

        } catch (err) {
            this.iframeTarget.innerHTML = `
                <div style="color: white; text-align: center; padding: 25px; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 10;">
                    <span style="font-size: 2.2rem; color: #ff5e5e;">❌</span>
                    <h4 style="margin: 0; color: #ff5e5e; font-size: 1.2rem; font-family: var(--font-heading); font-weight: 600;">Connection Refused</h4>
                    <p style="font-size: 0.95rem; color: var(--color-gray-light); max-width: 350px; line-height: 1.4; margin: 0;">${err.message}</p>
                    <button id="retry-avatar-btn" class="btn btn-outline-teal btn-sm" style="margin-top: 5px; padding: 8px 16px;">Retry Connection</button>
                </div>
            `;
            const retryBtn = document.getElementById('retry-avatar-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => this.startAvatarSession());
            }
        } finally {
            this.startAvatarBtn.disabled = false;
            this.startAvatarBtn.innerHTML = `<span style="font-size: 1.1rem; margin-right: 5px;">🎙️</span> Talk to Live Avatar`;
        }
    },

    stopAvatarSession() {
        if (!this.chatWindow || !this.avatarContainer || !this.iframeTarget) return;

        // Clean out target DOM to sever WebRTC connections and stop microphone use
        this.iframeTarget.innerHTML = '';
        
        // Restore standard simulator display
        this.avatarContainer.style.display = 'none';
        this.chatWindow.style.display = 'flex';
    },

    renderSuggestions() {
        this.suggestionsGrid.innerHTML = '';
        
        for (const [key, conv] of Object.entries(this.conversations)) {
            const btn = document.createElement('button');
            btn.className = 'suggestion-btn';
            btn.textContent = conv.question;
            btn.setAttribute('aria-label', `Ask: ${conv.question}`);
            
            btn.addEventListener('click', () => this.handleSuggestionClick(key, btn));
            this.suggestionsGrid.appendChild(btn);
        }
    },

    handleSuggestionClick(key, clickedBtn) {
        // Disable suggestions while typing
        const buttons = this.suggestionsGrid.querySelectorAll('.suggestion-btn');
        buttons.forEach(btn => btn.disabled = true);
        
        const conv = this.conversations[key];
        
        // 1. Render User Message
        this.appendMessage(conv.question, 'outgoing');
        this.scrollToBottom();
        
        // 2. Show Typing Indicator
        this.showTypingIndicator();
        this.scrollToBottom();
        
        // 3. Simulate AI typing response
        setTimeout(() => {
            this.hideTypingIndicator();
            this.appendTypewriterMessage(conv.answer, () => {
                // Re-enable buttons after typing complete
                buttons.forEach(btn => btn.disabled = false);
            });
        }, 1500);
    },

    appendMessage(text, side) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${side === 'outgoing' ? 'outgoing' : 'incoming'}`;
        bubble.textContent = text;
        this.messagesContainer.appendChild(bubble);
    },

    appendTypewriterMessage(text, callback) {
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble incoming typewriter-cursor';
        this.messagesContainer.appendChild(bubble);
        
        const words = text.split(' ');
        let wordIndex = 0;
        
        const typeInterval = setInterval(() => {
            if (wordIndex < words.length) {
                bubble.textContent = words.slice(0, wordIndex + 1).join(' ');
                wordIndex++;
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
                bubble.classList.remove('typewriter-cursor');
                if (callback) callback();
            }
        }, 80); // speed of typing words
    },

    showTypingIndicator() {
        this.indicator = document.createElement('div');
        this.indicator.className = 'typing-indicator';
        this.indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        this.messagesContainer.appendChild(this.indicator);
    },

    hideTypingIndicator() {
        if (this.indicator) {
            this.indicator.remove();
        }
    },

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
};
