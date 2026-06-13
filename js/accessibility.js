/**
 * Accessibility Module - Controls the redesigned floating ADA settings panel.
 * Includes text scaling, monochrome, high contrast, dyslexic font, underline links,
 * ADHD reading ruler, focus spotlight, high-visibility cursor, and synthesized chime sound effects.
 */
const Accessibility = {
    // Current states
    soundEffects: true,
    voiceReaderActive: false,
    readingRulerActive: false,
    focusSpotlightActive: false,
    
    // Class mapping for body toggles
    toggles: {
        'high-contrast': 'accessibility-contrast-high',
        'grayscale': 'accessibility-monochrome',
        'underline-links': 'accessibility-underline-links',
        'highlight-links': 'accessibility-highlight-links',
        'highlight-headings': 'accessibility-highlight-headings',
        'dyslexic-font': 'accessibility-dyslexic-font',
        'readable-font': 'accessibility-readable-font',
        'pause-animations': 'accessibility-paused-animations',
        'large-cursor': 'accessibility-large-cursor',
        'spacing-increase': 'accessibility-spacing-increase',
        'lineheight-increase': 'accessibility-lineheight-increase'
    },
    
    // Event listener handlers for dynamic elements
    rulerMoveHandler: null,
    spotlightMoveHandler: null,
    
    // Audio synthesis context and oscillators
    playChime(isTurnOn) {
        if (!this.soundEffects) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            
            if (isTurnOn) {
                // Bright, premium ascending C-Major arpeggio (C5 -> E5 -> G5 -> C6)
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.type = 'triangle'; // Mellow tone
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    
                    gainNode.gain.setValueAtTime(0, now + idx * 0.08);
                    gainNode.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
                    
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.25);
                });
            } else {
                // Downward soothing tone (G5 -> E5 -> C5)
                const freqs = [783.99, 659.25, 523.25];
                freqs.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gainNode = ctx.createGain();
                    osc.connect(gainNode);
                    gainNode.connect(ctx.destination);
                    
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    
                    gainNode.gain.setValueAtTime(0, now + idx * 0.08);
                    gainNode.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
                    
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.25);
                });
            }
        } catch (e) {
            console.warn("Audio Context error playing chime:", e);
        }
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
        
        // Slider elements
        this.slider = document.getElementById('font-scale-slider');
        this.sliderVal = document.getElementById('font-scale-value');
        this.sliderCard = document.getElementById('larger-text-card');
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

        // Text size scale slider event
        this.slider.addEventListener('input', (e) => {
            this.handleSlider(parseFloat(e.target.value));
        });

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
            this.closeBtn.focus();
        }
    },

    closePanel() {
        this.toggleBtn.setAttribute('aria-expanded', 'false');
        this.panel.classList.remove('active');
        this.panel.setAttribute('aria-hidden', 'true');
    },

    handleSlider(scaleValue) {
        // Adjust root document font scale
        document.documentElement.style.setProperty('--font-scale', scaleValue);
        
        // Sync text value
        const percent = Math.round(scaleValue * 100);
        if (this.sliderVal) {
            this.sliderVal.textContent = `${percent}%`;
        }
        
        // Toggle card active border state
        if (this.sliderCard) {
            if (scaleValue > 1.0) {
                this.sliderCard.classList.add('active-slider');
            } else {
                this.sliderCard.classList.remove('active-slider');
            }
        }
        
        this.savePreference('fontScale', scaleValue);
    },

    handleAction(action, btn) {
        if (this.toggles[action]) {
            // Standard html class toggle to avoid fixed positioning stacking bugs
            const className = this.toggles[action];
            const isToggled = document.documentElement.classList.toggle(className);
            
            // Sync button state
            this.syncButtonState(action, isToggled);
            
            // Handle exclusive font face toggle options
            if (action === 'dyslexic-font' && isToggled) {
                if (document.documentElement.classList.contains(this.toggles['readable-font'])) {
                    document.documentElement.classList.remove(this.toggles['readable-font']);
                    this.syncButtonState('readable-font', false);
                    this.savePreference('readable-font', false);
                }
            } else if (action === 'readable-font' && isToggled) {
                if (document.documentElement.classList.contains(this.toggles['dyslexic-font'])) {
                    document.documentElement.classList.remove(this.toggles['dyslexic-font']);
                    this.syncButtonState('dyslexic-font', false);
                    this.savePreference('dyslexic-font', false);
                }
            }
            
            // Audio confirmation
            this.playChime(isToggled);
            
            // Persist preference
            this.savePreference(action, isToggled);
        } else {
            // Custom helper operations
            switch(action) {
                case 'reading-ruler':
                    this.readingRulerActive = !this.readingRulerActive;
                    this.syncButtonState(action, this.readingRulerActive);
                    if (this.readingRulerActive) {
                        this.initRuler();
                    } else {
                        this.destroyRuler();
                    }
                    this.playChime(this.readingRulerActive);
                    this.savePreference('reading-ruler', this.readingRulerActive);
                    break;
                    
                case 'focus-spotlight':
                    this.focusSpotlightActive = !this.focusSpotlightActive;
                    this.syncButtonState(action, this.focusSpotlightActive);
                    if (this.focusSpotlightActive) {
                        this.initSpotlight();
                    } else {
                        this.destroySpotlight();
                    }
                    this.playChime(this.focusSpotlightActive);
                    this.savePreference('focus-spotlight', this.focusSpotlightActive);
                    break;
                    
                case 'voice-reader':
                    this.voiceReaderActive = !this.voiceReaderActive;
                    this.syncButtonState(action, this.voiceReaderActive);
                    if (this.voiceReaderActive) {
                        this.speakText("Screen Reader Enabled");
                    } else {
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        this.clearSpeakingHighlight();
                    }
                    this.playChime(this.voiceReaderActive);
                    this.savePreference('voice-reader', this.voiceReaderActive);
                    break;
                    
                case 'sound-effects':
                    // If turning off, play the downward chime first, then disable variable
                    if (this.soundEffects) {
                        this.playChime(false);
                        this.soundEffects = false;
                    } else {
                        this.soundEffects = true;
                        this.playChime(true);
                    }
                    this.syncButtonState(action, this.soundEffects);
                    this.savePreference('sound-effects', this.soundEffects);
                    break;
            }
        }
    },

    // ADHD Reading Ruler controller
    initRuler() {
        let ruler = document.getElementById('accessibility-reading-ruler');
        if (!ruler) {
            ruler = document.createElement('div');
            ruler.id = 'accessibility-reading-ruler';
            document.body.appendChild(ruler);
        }
        ruler.style.display = 'block';
        
        this.rulerMoveHandler = (e) => {
            ruler.style.top = e.clientY + 'px';
        };
        window.addEventListener('mousemove', this.rulerMoveHandler);
    },
    
    destroyRuler() {
        const ruler = document.getElementById('accessibility-reading-ruler');
        if (ruler) {
            ruler.style.display = 'none';
        }
        if (this.rulerMoveHandler) {
            window.removeEventListener('mousemove', this.rulerMoveHandler);
            this.rulerMoveHandler = null;
        }
    },
    
    // Focus Spotlight controller
    initSpotlight() {
        let spotlight = document.getElementById('accessibility-focus-spotlight');
        if (!spotlight) {
            spotlight = document.createElement('div');
            spotlight.id = 'accessibility-focus-spotlight';
            document.body.appendChild(spotlight);
        }
        spotlight.style.display = 'block';
        
        this.spotlightMoveHandler = (e) => {
            document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
            document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
        };
        window.addEventListener('mousemove', this.spotlightMoveHandler);
        
        // Initial location coordinate set to center
        document.documentElement.style.setProperty('--mouse-x', '50%');
        document.documentElement.style.setProperty('--mouse-y', '50%');
    },
    
    destroySpotlight() {
        const spotlight = document.getElementById('accessibility-focus-spotlight');
        if (spotlight) {
            spotlight.style.display = 'none';
        }
        if (this.spotlightMoveHandler) {
            window.removeEventListener('mousemove', this.spotlightMoveHandler);
            this.spotlightMoveHandler = null;
        }
    },

    // Speech synthesis reader engine
    lastSpokenElement: null,
    activeUtterance: null,
    
    speakText(text, target = null) {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        
        this.clearSpeakingHighlight();
        
        if (!this.voiceReaderActive) return;
        
        if (target) {
            target.classList.add('accessibility-speaking-highlight');
        }
        
        setTimeout(() => {
            const phoneticText = text.replace(/Sciortino/gi, 'Shor-tee-no');
            const utterance = new SpeechSynthesisUtterance(phoneticText);
            utterance.lang = 'en-US';
            
            const voices = window.speechSynthesis.getVoices();
            // Fallback English voice matching
            const voice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
                       || voices.find(v => v.lang.startsWith('en'))
                       || voices[0];
            if (voice) {
                utterance.voice = voice;
            }
            
            utterance.rate = 1.05;
            this.activeUtterance = utterance;
            
            utterance.onend = () => {
                if (target && target.classList.contains('accessibility-speaking-highlight')) {
                    target.classList.remove('accessibility-speaking-highlight');
                }
            };
            utterance.onerror = () => {
                if (target && target.classList.contains('accessibility-speaking-highlight')) {
                    target.classList.remove('accessibility-speaking-highlight');
                }
            };
            
            window.speechSynthesis.speak(utterance);
        }, 80);
    },
    
    clearSpeakingHighlight() {
        const highlighted = document.querySelectorAll('.accessibility-speaking-highlight');
        highlighted.forEach(el => el.classList.remove('accessibility-speaking-highlight'));
    },
    
    handleScreenReader(e, eventType) {
        if (!this.voiceReaderActive) return;
        
        let target = e.target.closest('a, button, h1, h2, h3, h4, h5, h6, p, li, span, label, [role="button"], .brain-node, .message-bubble, blockquote, q, td, th, option, small, em, i, strong, b, cite, mark, figcaption, legend, summary');
        
        // Fallback: If no standard target is matched, but the hovered element is a leaf node containing text, read it
        if (!target && e.target && e.target.nodeType === Node.ELEMENT_NODE) {
            if (e.target.children.length === 0 && e.target.textContent.trim().length > 0) {
                target = e.target;
            }
        }
        
        if (!target) return;
        
        // Prioritize parent links, buttons, headings, list items, blockquotes, or message bubbles if this target is an inline child
        const blockParent = target.closest('a, button, h1, h2, h3, h4, h5, h6, p, li, [role="button"], .message-bubble, blockquote, figcaption, legend, summary');
        if (blockParent && blockParent !== target) {
            target = blockParent;
        }
        
        if (eventType === 'hover' && this.lastSpokenElement === target) return;
        this.lastSpokenElement = target;
        
        let textToRead = target.getAttribute('aria-label') || target.textContent;
        textToRead = textToRead.trim().replace(/\s+/g, ' ');
        
        if (textToRead) {
            this.speakText(textToRead, target);
        }
    },

    savePreference(key, value) {
        localStorage.setItem(`ms-access-${key}`, value);
    },

    loadSavedPreferences() {
        // 1. Load sound effects state (defaults to true)
        const savedSounds = localStorage.getItem('ms-access-sound-effects');
        this.soundEffects = savedSounds === null ? true : (savedSounds === 'true');
        this.syncButtonState('sound-effects', this.soundEffects);
        
        // 2. Load standard body toggles
        for (const [action, className] of Object.entries(this.toggles)) {
            const saved = localStorage.getItem(`ms-access-${action}`);
            if (saved === 'true') {
                document.documentElement.classList.add(className);
                this.syncButtonState(action, true);
            } else {
                this.syncButtonState(action, false);
            }
        }
        
        // 3. Load ADHD reading ruler
        const savedRuler = localStorage.getItem('ms-access-reading-ruler');
        if (savedRuler === 'true') {
            this.readingRulerActive = true;
            this.syncButtonState('reading-ruler', true);
            this.initRuler();
        }
        
        // 4. Load Focus Spotlight
        const savedSpotlight = localStorage.getItem('ms-access-focus-spotlight');
        if (savedSpotlight === 'true') {
            this.focusSpotlightActive = true;
            this.syncButtonState('focus-spotlight', true);
            this.initSpotlight();
        }
        
        // 5. Load Voice Reader (TTS)
        const savedVoice = localStorage.getItem('ms-access-voice-reader');
        if (savedVoice === 'true') {
            this.voiceReaderActive = true;
            this.syncButtonState('voice-reader', true);
        }
        
        // 6. Load font scale slider
        const savedFontScale = localStorage.getItem('ms-access-fontScale');
        if (savedFontScale) {
            const scale = parseFloat(savedFontScale);
            if (this.slider) this.slider.value = scale;
            this.handleSlider(scale);
        } else {
            this.handleSlider(1.0);
        }
    },
    
    syncButtonState(action, isActive) {
        const btn = this.panel.querySelector(`[data-action="${action}"]`);
        if (btn) {
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            const pill = btn.querySelector('.toggle-pill');
            if (pill) {
                pill.textContent = isActive ? 'ON' : 'OFF';
            }
        }
    },

    resetAll() {
        // Clear body classes
        for (const className of Object.values(this.toggles)) {
            document.documentElement.classList.remove(className);
        }
        
        // Cancel reading voice
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.clearSpeakingHighlight();
        
        // Reset state properties
        this.soundEffects = true;
        this.voiceReaderActive = false;
        this.readingRulerActive = false;
        this.focusSpotlightActive = false;
        
        // Destroy overlays
        this.destroyRuler();
        this.destroySpotlight();
        
        // Reset all button visuals
        this.syncButtonState('sound-effects', true);
        for (const action of Object.keys(this.toggles)) {
            this.syncButtonState(action, false);
        }
        this.syncButtonState('reading-ruler', false);
        this.syncButtonState('focus-spotlight', false);
        this.syncButtonState('voice-reader', false);
        
        // Reset font scale slider
        if (this.slider) this.slider.value = 1.0;
        this.handleSlider(1.0);
        
        // Play confirming chime sound
        this.playChime(true);
        
        // Clear all localStorage preferences
        for (const action of Object.keys(this.toggles)) {
            localStorage.removeItem(`ms-access-${action}`);
        }
        localStorage.removeItem('ms-access-sound-effects');
        localStorage.removeItem('ms-access-reading-ruler');
        localStorage.removeItem('ms-access-focus-spotlight');
        localStorage.removeItem('ms-access-voice-reader');
        localStorage.removeItem('ms-access-fontScale');
    }
};
