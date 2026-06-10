/**
 * Accessibility Module - Controls the floating ADA settings panel.
 * Includes text scaling, contrast theme overrides, and a custom English screen reader.
 */
const Accessibility = {
    // Current scale values
    fontScale: 1.0,
    spacingScale: false,
    lineHeightScale: 1.6,
    activeVoice: null, // 'male', 'female', or null
    lastSpokenElement: null,
    
    // List of body class toggles
    toggles: {
        'contrast-high': 'accessibility-contrast-high',
        'contrast-light': 'accessibility-contrast-light',
        'font-dyslexic': 'accessibility-dyslexic-font',
        'font-readable': 'accessibility-readable-font',
        'pause-animations': 'accessibility-paused-animations',
        'highlight-links': 'accessibility-highlight-links',
        'highlight-headings': 'accessibility-highlight-headings',
        'large-cursor': 'accessibility-large-cursor'
    },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadSavedPreferences();
        
        // Warm up speech synthesis voices list
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
        }
    },

    cacheDOM() {
        this.widget = document.getElementById('accessibility-widget');
        this.toggleBtn = document.getElementById('accessibility-toggle-btn');
        this.panel = document.getElementById('accessibility-panel');
        this.closeBtn = document.getElementById('close-panel-btn');
        this.resetBtn = document.getElementById('reset-accessibility');
        this.actionButtons = this.panel.querySelectorAll('.widget-btn');
    },

    bindEvents() {
        // Toggle panel open/close
        this.toggleBtn.addEventListener('click', () => this.togglePanel());
        this.closeBtn.addEventListener('click', () => this.closePanel());
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.panel.classList.contains('active') && 
                !this.widget.contains(e.target)) {
                this.closePanel();
            }
        });
        
        // Handle Escape key to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.panel.classList.contains('active')) {
                this.closePanel();
                this.toggleBtn.focus();
            }
        });

        // Binds action buttons
        this.actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                this.handleAction(action, btn);
            });
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => this.resetAll());

        // Screen reader hover & focus event delegation listeners
        document.addEventListener('mouseover', (e) => this.handleScreenReader(e, 'hover'));
        document.addEventListener('focusin', (e) => this.handleScreenReader(e, 'focus'));
    },

    togglePanel() {
        const isExpanded = this.toggleBtn.getAttribute('aria-expanded') === 'true';
        this.toggleBtn.setAttribute('aria-expanded', !isExpanded);
        this.panel.classList.toggle('active');
        this.panel.setAttribute('aria-hidden', isExpanded);
        
        if (!isExpanded) {
            // Focus close button on open
            this.closeBtn.focus();
        }
    },

    closePanel() {
        this.toggleBtn.setAttribute('aria-expanded', 'false');
        this.panel.classList.remove('active');
        this.panel.setAttribute('aria-hidden', 'true');
    },

    handleAction(action, btn) {
        if (this.toggles[action]) {
            // It is a standard class toggle
            const className = this.toggles[action];
            const isToggled = document.body.classList.toggle(className);
            
            // Sync button visual state
            btn.setAttribute('aria-pressed', isToggled);
            
            // Handle exclusive toggles (like fonts and contrasts)
            if (action === 'font-dyslexic' && isToggled) {
                this.deactivateAction('font-readable');
            } else if (action === 'font-readable' && isToggled) {
                this.deactivateAction('font-dyslexic');
            }
            
            this.savePreference(action, isToggled);
        } else {
            // Custom panel commands
            switch(action) {
                case 'contrast-default':
                    this.clearContrasts();
                    btn.setAttribute('aria-pressed', 'true');
                    break;
                case 'contrast-high':
                    this.clearContrasts();
                    document.body.classList.add(this.toggles['contrast-high']);
                    btn.setAttribute('aria-pressed', 'true');
                    this.savePreference('contrast', 'high');
                    break;
                case 'contrast-light':
                    this.clearContrasts();
                    document.body.classList.add(this.toggles['contrast-light']);
                    btn.setAttribute('aria-pressed', 'true');
                    this.savePreference('contrast', 'light');
                    break;
                case 'voice-male':
                    this.toggleVoice('male', btn);
                    break;
                case 'voice-female':
                    this.toggleVoice('female', btn);
                    break;
                case 'text-increase':
                    this.adjustFontScale(0.15);
                    break;
                case 'text-decrease':
                    this.adjustFontScale(-0.15);
                    break;
                case 'spacing-increase':
                    this.toggleTextSpacing(btn);
                    break;
                case 'lineheight-increase':
                    this.toggleLineHeight(btn);
                    break;
            }
        }
    },

    deactivateAction(action) {
        const className = this.toggles[action];
        document.body.classList.remove(className);
        const btn = this.panel.querySelector(`[data-action="${action}"]`);
        if (btn) btn.setAttribute('aria-pressed', 'false');
        this.savePreference(action, false);
    },

    clearContrasts() {
        document.body.classList.remove(this.toggles['contrast-high']);
        document.body.classList.remove(this.toggles['contrast-light']);
        
        const defaultBtn = this.panel.querySelector('[data-action="contrast-default"]');
        const highBtn = this.panel.querySelector('[data-action="contrast-high"]');
        const lightBtn = this.panel.querySelector('[data-action="contrast-light"]');
        
        if (defaultBtn) defaultBtn.setAttribute('aria-pressed', 'true');
        if (highBtn) highBtn.setAttribute('aria-pressed', 'false');
        if (lightBtn) lightBtn.setAttribute('aria-pressed', 'false');
        
        this.savePreference('contrast', 'default');
    },

    toggleVoice(gender, btn) {
        const maleBtn = this.panel.querySelector('[data-action="voice-male"]');
        const femaleBtn = this.panel.querySelector('[data-action="voice-female"]');
        
        if (this.activeVoice === gender) {
            // Turning it off
            this.activeVoice = null;
            btn.setAttribute('aria-pressed', 'false');
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            this.savePreference('voice', 'none');
        } else {
            // Turning it on (and off the other gender)
            this.activeVoice = gender;
            
            if (gender === 'male') {
                if (maleBtn) maleBtn.setAttribute('aria-pressed', 'true');
                if (femaleBtn) femaleBtn.setAttribute('aria-pressed', 'false');
            } else {
                if (maleBtn) maleBtn.setAttribute('aria-pressed', 'false');
                if (femaleBtn) femaleBtn.setAttribute('aria-pressed', 'true');
            }
            
            this.savePreference('voice', gender);
            
            // Speak confirmation
            const confirmMsg = gender === 'male' ? "Male Screen Reader Enabled" : "Female Screen Reader Enabled";
            this.speakText(confirmMsg);
        }
    },

    speakText(text) {
        if (!('speechSynthesis' in window)) return;
        
        window.speechSynthesis.cancel();
        
        if (!this.activeVoice) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        
        const isFemale = this.activeVoice === 'female';
        const searchTerms = isFemale 
            ? ['zira', 'hazel', 'samantha', 'susan', 'karen', 'female', 'google us english', 'heather', 'serena', 'samantha']
            : ['david', 'george', 'mark', 'male', 'ravi', 'microsoft david', 'google uk english male'];
        
        // Look for English vocal gender matches
        let matchVoice = voices.find(v => {
            const name = v.name.toLowerCase();
            const lang = v.lang.toLowerCase();
            return lang.startsWith('en') && searchTerms.some(term => name.includes(term));
        });
        
        // Fallback to any language match
        if (!matchVoice) {
            matchVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                return searchTerms.some(term => name.includes(term));
            });
        }
        
        if (matchVoice) {
            utterance.voice = matchVoice;
        } else {
            // Pitch modifications if specific genders aren't built in
            utterance.pitch = isFemale ? 1.35 : 0.82;
        }
        
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
    },

    handleScreenReader(e, eventType) {
        if (!this.activeVoice) return;
        
        // Findclosest read-worthy interactive elements or semantic structures
        const target = e.target.closest('a, button, h1, h2, h3, h4, p, [role="button"], .brain-node');
        if (!target) return;
        
        // Ignore menu widgets text to avoid feedback loops inside dashboard
        if (this.panel.contains(target)) return;
        
        if (eventType === 'hover' && this.lastSpokenElement === target) return;
        this.lastSpokenElement = target;
        
        let prefix = '';
        if (target.tagName === 'A') {
            prefix = 'Link: ';
        } else if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
            prefix = 'Button: ';
        } else if (target.tagName.match(/^H[1-6]$/)) {
            prefix = 'Heading: ';
        }
        
        let textToRead = target.getAttribute('aria-label') || target.textContent;
        textToRead = textToRead.trim().replace(/\s+/g, ' ');
        
        if (textToRead) {
            this.speakText(prefix + textToRead);
        }
    },

    adjustFontScale(amount) {
        this.fontScale = Math.min(Math.max(0.85, this.fontScale + amount), 1.6);
        document.documentElement.style.setProperty('--font-scale', this.fontScale);
        this.savePreference('fontScale', this.fontScale);
    },

    toggleTextSpacing(btn) {
        this.spacingScale = !this.spacingScale;
        const spacing = this.spacingScale ? '0.08em' : 'normal';
        document.documentElement.style.setProperty('--letter-spacing', spacing);
        btn.setAttribute('aria-pressed', this.spacingScale);
        this.savePreference('spacingScale', this.spacingScale);
    },

    toggleLineHeight(btn) {
        this.lineHeightScale = this.lineHeightScale === 1.6 ? 2.0 : 1.6;
        document.documentElement.style.setProperty('--line-height-scale', this.lineHeightScale);
        btn.setAttribute('aria-pressed', this.lineHeightScale === 2.0);
        this.savePreference('lineHeightScale', this.lineHeightScale);
    },

    savePreference(key, value) {
        localStorage.setItem(`ms-access-${key}`, value);
    },

    loadSavedPreferences() {
        // Load class toggles
        for (const [action, className] of Object.entries(this.toggles)) {
            if (action.startsWith('contrast-')) continue;
            
            const saved = localStorage.getItem(`ms-access-${action}`);
            if (saved === 'true') {
                document.body.classList.add(className);
                const btn = this.panel.querySelector(`[data-action="${action}"]`);
                if (btn) btn.setAttribute('aria-pressed', 'true');
            }
        }
        
        // Load contrast state
        const savedContrast = localStorage.getItem('ms-access-contrast');
        if (savedContrast) {
            const btn = this.panel.querySelector(`[data-action="contrast-${savedContrast}"]`);
            if (btn) this.handleAction(`contrast-${savedContrast}`, btn);
        }

        // Load voice state
        const savedVoice = localStorage.getItem('ms-access-voice');
        if (savedVoice && savedVoice !== 'none') {
            const btn = this.panel.querySelector(`[data-action="voice-${savedVoice}"]`);
            if (btn) this.toggleVoice(savedVoice, btn);
        }

        // Load scale properties
        const savedFontScale = localStorage.getItem('ms-access-fontScale');
        if (savedFontScale) {
            this.fontScale = parseFloat(savedFontScale);
            document.documentElement.style.setProperty('--font-scale', this.fontScale);
        }

        const savedSpacing = localStorage.getItem('ms-access-spacingScale');
        if (savedSpacing === 'true') {
            const btn = this.panel.querySelector('[data-action="spacing-increase"]');
            if (btn) this.toggleTextSpacing(btn);
        }

        const savedLineHeight = localStorage.getItem('ms-access-lineHeightScale');
        if (savedLineHeight) {
            this.lineHeightScale = parseFloat(savedLineHeight);
            document.documentElement.style.setProperty('--line-height-scale', this.lineHeightScale);
            const btn = this.panel.querySelector('[data-action="lineheight-increase"]');
            if (btn) btn.setAttribute('aria-pressed', this.lineHeightScale === 2.0);
        }
    },

    resetAll() {
        // Clear body classes
        for (const className of Object.values(this.toggles)) {
            document.body.classList.remove(className);
        }
        
        // Cancel active screen reader voices
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        
        // Reset properties
        this.fontScale = 1.0;
        this.spacingScale = false;
        this.lineHeightScale = 1.6;
        this.activeVoice = null;
        this.lastSpokenElement = null;
        
        document.documentElement.style.setProperty('--font-scale', 1.0);
        document.documentElement.style.setProperty('--letter-spacing', 'normal');
        document.documentElement.style.setProperty('--line-height-scale', 1.6);
        
        // Reset button tags
        this.actionButtons.forEach(btn => {
            const action = btn.getAttribute('data-action');
            if (action === 'contrast-default') {
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.setAttribute('aria-pressed', 'false');
            }
        });
        
        // Reset localStorage keys
        for (const action of Object.keys(this.toggles)) {
            localStorage.removeItem(`ms-access-${action}`);
        }
        localStorage.removeItem('ms-access-contrast');
        localStorage.removeItem('ms-access-voice');
        localStorage.removeItem('ms-access-fontScale');
        localStorage.removeItem('ms-access-spacingScale');
        localStorage.removeItem('ms-access-lineHeightScale');
    }
};
