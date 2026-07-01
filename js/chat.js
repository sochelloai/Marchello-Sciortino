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
        this.startAvatarBtn = document.getElementById('start-avatar-btn'); // Intro block trigger
        this.scrollToSimulatorBtn = document.getElementById('scroll-to-simulator-btn'); // Intro block scroll trigger
        this.startAvatarCardBtn = document.getElementById('start-avatar-card-btn'); // Card start button
        this.stopAvatarBtn = document.getElementById('stop-avatar-btn');
        this.avatarContainer = document.getElementById('companion-avatar-container');
        this.iframeTarget = document.getElementById('avatar-iframe-target');
        this.statusIndicator = document.getElementById('avatar-status-indicator');
        this.placeholderView = document.getElementById('avatar-placeholder-view');

        if (this.startAvatarBtn) {
            this.startAvatarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSec = document.getElementById('live-avatar-section');
                if (targetSec) {
                    targetSec.scrollIntoView({ behavior: 'smooth' });
                }
                this.startAvatarSession();
            });
        }

        if (this.scrollToSimulatorBtn) {
            this.scrollToSimulatorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const simulatorSec = document.getElementById('chat-simulator-section');
                if (simulatorSec) {
                    simulatorSec.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        if (this.startAvatarCardBtn) {
            this.startAvatarCardBtn.addEventListener('click', () => this.startAvatarSession());
        }

        if (this.stopAvatarBtn) {
            this.stopAvatarBtn.addEventListener('click', () => this.stopAvatarSession());
        }

        // AUTO START LIVE SESSION IF POSSIBLE - disabled (Live Avatar removed)
        // this.startAvatarSession();
    },

    async startAvatarSession() {
        if (!this.avatarContainer || !this.iframeTarget) return;

        // Disable start buttons to prevent double clicks during load
        if (this.startAvatarBtn) {
            this.startAvatarBtn.disabled = true;
            this.startAvatarBtn.innerHTML = `<span style="font-size: 1.1rem; margin-right: 5px;">⏳</span> Connecting...`;
        }
        if (this.startAvatarCardBtn) {
            this.startAvatarCardBtn.disabled = true;
            this.startAvatarCardBtn.innerHTML = `⏳ Connecting...`;
        }

        // Hide static placeholder view if it exists
        if (this.placeholderView) {
            this.placeholderView.style.display = 'none';
        }

        // Show stop button in header
        if (this.stopAvatarBtn) {
            this.stopAvatarBtn.style.display = 'block';
        }

        // Set status indicator to active (teal glow)
        if (this.statusIndicator) {
            this.statusIndicator.style.backgroundColor = '#0ad8ad';
            this.statusIndicator.style.boxShadow = '0 0 10px #0ad8ad';
            this.statusIndicator.style.animation = 'pulse 2s infinite';
        }
        
        // Render spinner loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'avatar-loading';
        loadingDiv.style.cssText = 'color: white; text-align: center; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; z-index: 10; height: 100%; width: 100%; min-height: 440px;';
        loadingDiv.innerHTML = `
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
            <div style="width: 40px; height: 40px; border: 3px solid rgba(10, 216, 173, 0.15); border-top-color: var(--color-teal); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="font-size: 1rem; color: var(--color-gray-light); margin: 0;">Connecting to ChelloAI voice companion...</p>
        `;
        this.iframeTarget.appendChild(loadingDiv);

        try {
            const response = await fetch('/api/create-avatar-embed', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                let errorMsg = `Server API returned error ${response.status}`;
                try {
                    const errData = await response.json();
                    if (errData && errData.message) {
                        errorMsg = errData.message;
                        if (errData.debugEnv && errData.debugEnv.LIVEAVATAR_API_KEY) {
                            const keyInfo = errData.debugEnv.LIVEAVATAR_API_KEY;
                            errorMsg += ` (Key: ${keyInfo.configured ? 'Configured, len=' + keyInfo.length + ', prefix=' + keyInfo.prefix + '...' : 'Not Configured'})`;
                        }
                    }
                } catch (e) {
                    // Fallback if not JSON
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();

            // Clear loading spinner
            const loader = document.getElementById('avatar-loading');
            if (loader) loader.remove();

            if (data.success && data.url) {
                // Render secure iframe with microphone permissions
                this.iframeTarget.insertAdjacentHTML('beforeend', `
                    <iframe src="${data.url}" allow="microphone" title="LiveAvatar Embed" style="width: 100%; height: 100%; min-height: 440px; border: none;"></iframe>
                `);
            } else if (data.isMock) {
                // Key not configured yet - load developer sandbox assistant guide
                this.iframeTarget.insertAdjacentHTML('beforeend', `
                    <div id="avatar-sandbox-alert" style="color: white; text-align: center; max-width: 450px; padding: 25px; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 10; margin: 0 auto;">
                        <span style="font-size: 2.2rem; filter: drop-shadow(0 0 10px rgba(10, 216, 173, 0.4));">🤖</span>
                        <h4 style="margin: 0; color: var(--color-teal); font-size: 1.25rem; font-family: var(--font-heading); font-weight: 600;">LiveAvatar Key Required</h4>
                        <p style="font-size: 0.95rem; color: var(--color-gray-light); line-height: 1.5; margin: 0;">
                            LiveAvatar API Key is not configured yet. Configure the key in Cloudflare Pages (for production) or in your local settings to initialize the avatar session.
                        </p>
                        <p style="font-size: 0.85rem; color: var(--color-gray-steel); line-height: 1.45; margin: 0; text-align: left; background: rgba(255,255,255,0.05); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); width: 100%;">
                            <strong>Local Setup Instructions:</strong><br>
                            1. Open <code>.dev.vars</code> in the project root.<br>
                            2. Add your key: <code>LIVEAVATAR_API_KEY="your_api_key_here"</code>.<br>
                            3. Restart the wrangler dev server.
                        </p>
                    </div>
                `);
            } else {
                throw new Error(data.message || "Failed to initialize LiveAvatar session.");
            }

        } catch (err) {
            // Clear loading spinner if still there
            const loader = document.getElementById('avatar-loading');
            if (loader) loader.remove();

            this.iframeTarget.insertAdjacentHTML('beforeend', `
                <div id="avatar-error" style="color: white; text-align: center; padding: 25px; font-family: var(--font-body); display: flex; flex-direction: column; align-items: center; gap: 15px; z-index: 10;">
                    <span style="font-size: 2.2rem; color: #ff5e5e;">❌</span>
                    <h4 style="margin: 0; color: #ff5e5e; font-size: 1.2rem; font-family: var(--font-heading); font-weight: 600;">Connection Refused</h4>
                    <p style="font-size: 0.95rem; color: var(--color-gray-light); max-width: 350px; line-height: 1.4; margin: 0;">${err.message}</p>
                    <button id="retry-avatar-btn" class="btn btn-outline-teal btn-sm" style="margin-top: 5px; padding: 8px 16px;">Retry Connection</button>
                </div>
            `);
            const retryBtn = document.getElementById('retry-avatar-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    const errDiv = document.getElementById('avatar-error');
                    if (errDiv) errDiv.remove();
                    this.startAvatarSession();
                });
            }
        } finally {
            if (this.startAvatarBtn) {
                this.startAvatarBtn.disabled = false;
                this.startAvatarBtn.innerHTML = `<span style="font-size: 1.1rem; margin-right: 5px;">🎙️</span> Talk to Live Avatar`;
            }
            if (this.startAvatarCardBtn) {
                this.startAvatarCardBtn.disabled = false;
                this.startAvatarCardBtn.innerHTML = `🎙️ Start Voice Conversation`;
            }
        }
    },

    stopAvatarSession() {
        if (!this.iframeTarget) return;

        // Clear dynamic elements (iframe, sandbox alert, error view, loading spinner)
        const iframe = this.iframeTarget.querySelector('iframe');
        if (iframe) iframe.remove();
        
        const loader = document.getElementById('avatar-loading');
        if (loader) loader.remove();
        
        const sandboxAlert = document.getElementById('avatar-sandbox-alert');
        if (sandboxAlert) sandboxAlert.remove();
        
        const errorView = document.getElementById('avatar-error');
        if (errorView) errorView.remove();

        // Restore static placeholder view if it exists
        if (this.placeholderView) {
            this.placeholderView.style.display = 'flex';
        }
        
        // Hide stop button
        if (this.stopAvatarBtn) {
            this.stopAvatarBtn.style.display = 'none';
        }
        
        // Reset status indicator to inactive (gray)
        if (this.statusIndicator) {
            this.statusIndicator.style.backgroundColor = '#a0aec0';
            this.statusIndicator.style.boxShadow = 'none';
            this.statusIndicator.style.animation = 'none';
        }
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
