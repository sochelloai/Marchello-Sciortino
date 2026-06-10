/**
 * Chat Module - Implements the simulated chat dialog for ChelloAI.
 */
const Chat = {
    conversations: {
        'typing': {
            question: "How does AI help you write or type?",
            answer: "Typing is a physical nightmare for me. By using structured AI prompts and configurations, I can generate complete articles, code structures, and marketing copies in minutes. It turns my ideas into execution, acting as my typing speed."
        },
        'speaking': {
            question: "How do you speak at keynotes using technology?",
            answer: "Friedrich's ataxia affects speech stability. To deliver professional keynotes, I draft scripts and use voice amplifiers, and dynamic text-to-speech systems (ChelloAI). This lets me present a raw, high-energy message on stage without vocal exhaustion."
        },
        'warrior': {
            question: "What does being a 'warrior' mean to you?",
            answer: "It means refusing to defend your limitations or submit to being 'less than' others. It's accepting daily challenges as design parameters to create around, rather than blockades to sit behind in defeat."
        },
        'aim': {
            question: "What is the goal of Accessible AIM?",
            answer: "Accessible AIM exists to open-source my prompt workflows. We are building a space where individuals with physical constraints learn to configure AI tools, letting them write, code, design, and work online with zero friction."
        },
        'services': {
            question: "What digital services do you build?",
            answer: "I am a ClickFunnels certified funnel builder and designer. I write layout code, optimize lead flow pipelines, and construct premium brand hubs. High-fidelity design meets smooth conversions, with no corporate fluff."
        }
    },

    init() {
        this.messagesContainer = document.getElementById('chat-messages');
        this.suggestionsGrid = document.getElementById('chat-suggestions-grid');
        
        if (this.messagesContainer && this.suggestionsGrid) {
            this.renderSuggestions();
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
