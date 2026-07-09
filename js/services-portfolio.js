/**
 * Services Portfolio Module
 * Handles modal video and image lightboxes, Web Audio API synthesis for audio/songs,
 * and handles UI states for active media playback.
 */
const ServicesPortfolio = {
    audioCtx: null,
    oscillator: null,
    gainNode: null,
    playingAudioId: null,
    playbackInterval: null,

    // Audio tracks definition for live synthesized audio feedback
    tracks: {
        'create-audio-1': { freq: 440, type: 'triangle', melody: [440, 554, 659, 880, 659, 554] },
        'create-song-2': { freq: 220, type: 'sine', melody: [220, 277, 329, 440, 329, 277] },
        'build-audio-3': { freq: 261.63, type: 'triangle', melody: [261.63, 329.63, 392.00, 523.25] },
        'build-song-4': { freq: 130.81, type: 'sawtooth', melody: [130.81, 164.81, 196.00, 261.63] },
        'overcome-audio-5': { freq: 196, type: 'sine', melody: [196, 246.94, 293.66, 392, 293.66] },
        'overcome-song-6': { freq: 146.83, type: 'triangle', melody: [146.83, 185.00, 220.00, 293.66] }
    },

    init() {
        this.cleanup();
        this.bindEvents();
        this.initFileExplorerTabs();
    },

    initFileExplorerTabs() {
        const tabs = document.querySelectorAll('.explorer-tab');
        const contents = document.querySelectorAll('.explorer-tab-content');

        const switchTab = (tabId) => {
            // Stop any playing audio
            this.stopAudio();

            // Reset visual panes to defaults
            this.resetAllVisualPanes();

            // Update tabs
            tabs.forEach(t => {
                const isActive = t.getAttribute('data-tab') === tabId;
                t.classList.toggle('active', isActive);
                t.setAttribute('aria-selected', isActive ? 'true' : 'false');
                t.setAttribute('tabindex', isActive ? '0' : '-1');
            });

            // Update content areas
            contents.forEach(content => {
                const isActive = content.id === `tab-content-${tabId}`;
                content.classList.toggle('active', isActive);
            });
        };

        // Click handlers for top tabs
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        // Keyboard navigation (Arrow keys, Space/Enter) for accessibility
        const handleKeyDown = (e, elements, index) => {
            let nextIndex = index;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                nextIndex = (index + 1) % elements.length;
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                nextIndex = (index - 1 + elements.length) % elements.length;
            } else if (e.key === 'Home') {
                nextIndex = 0;
            } else if (e.key === 'End') {
                nextIndex = elements.length - 1;
            } else {
                return; // Do nothing for other keys
            }

            e.preventDefault();
            const nextElement = elements[nextIndex];
            nextElement.focus();
            const tabId = nextElement.getAttribute('data-tab');
            switchTab(tabId);
        };

        tabs.forEach((tab, index) => {
            tab.addEventListener('keydown', (e) => handleKeyDown(e, tabs, index));
        });
    },

    bindEvents() {
        const cards = document.querySelectorAll('.portfolio-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.getAttribute('data-type');
                const src = card.getAttribute('data-src');
                const id = card.getAttribute('data-id');
                const title = card.querySelector('.portfolio-title') ? card.querySelector('.portfolio-title').textContent : 'Portfolio Asset';
                
                // Find active panel
                const activePanel = document.querySelector('.explorer-tab-content.active');
                if (!activePanel) return;

                const pane = activePanel.querySelector('.explorer-visual-pane');
                if (!pane) return;

                // If clicking another card while audio is playing, stop it first
                if (this.playingAudioId && this.playingAudioId !== id) {
                    this.stopAudio();
                }

                if (type === 'image') {
                    this.stopAudio();
                    pane.innerHTML = `<img src="${src}" alt="${title}" class="explorer-visual-img">`;
                } else if (type === 'video') {
                    this.stopAudio();
                    pane.innerHTML = `<video src="${src}" controls autoplay loop class="explorer-visual-img" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                } else if (type === 'audio' || type === 'song') {
                    if (this.playingAudioId === id) {
                        this.stopAudio();
                        this.resetVisualPane(activePanel);
                    } else {
                        const bgUrl = card.querySelector('.portfolio-card-bg').style.backgroundImage.slice(5, -2).replace(/"/g, "");
                        this.playAudio(id, card);
                        
                        pane.innerHTML = `
                            <div class="explorer-audio-preview" style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background-image: url('${bgUrl}'); background-size: cover; background-position: center; color: white;">
                                <div style="position: absolute; inset: 0; background: rgba(8, 27, 41, 0.75); z-index: 1;"></div>
                                <div style="position: relative; z-index: 2; text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center;">
                                    <div style="font-size: 3rem; margin-bottom: 1rem; animation: pulse 1.5s infinite;">🎵</div>
                                    <h4 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.5rem;">${title}</h4>
                                    <p style="color: var(--color-teal); font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">Synthesizing Audio Loop...</p>
                                    <div class="portfolio-wave playing" style="display: flex; gap: 4px; justify-content: center; margin-top: 1.5rem; height: 30px;">
                                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }

                // Smoothly scroll to visual pane so the user sees it
                pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        });
    },

    resetVisualPane(panel) {
        const pane = panel.querySelector('.explorer-visual-pane');
        if (pane) {
            const defaultSrc = pane.getAttribute('data-default-src');
            const defaultAlt = pane.getAttribute('data-default-alt');
            if (defaultSrc) {
                pane.innerHTML = `<img src="${defaultSrc}" alt="${defaultAlt}" class="explorer-visual-img">`;
            }
        }
    },

    resetAllVisualPanes() {
        const panels = document.querySelectorAll('.explorer-tab-content');
        panels.forEach(panel => this.resetVisualPane(panel));
    },

    toggleAudio(id, card) {
        // Obsolete/Unused since we handle clicking in bindEvents()
    },

    playAudio(id, card) {
        const track = this.tracks[id];
        if (!track) return;

        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        this.oscillator.type = track.type;
        this.oscillator.frequency.setValueAtTime(track.freq, this.audioCtx.currentTime);

        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        lfo.frequency.value = 2.0;
        lfoGain.gain.value = 0.05;

        lfo.connect(lfoGain);
        lfoGain.connect(this.gainNode.gain);
        lfo.start();

        this.gainNode.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        this.oscillator.start();

        this.playingAudioId = id;
        card.classList.add('playing');
        card.setAttribute('aria-label', `Pause ${card.querySelector('.portfolio-title').textContent}`);

        let noteIndex = 0;
        this.playbackInterval = setInterval(() => {
            if (this.oscillator && this.audioCtx) {
                noteIndex = (noteIndex + 1) % track.melody.length;
                const nextFreq = track.melody[noteIndex];
                this.oscillator.frequency.exponentialRampToValueAtTime(nextFreq, this.audioCtx.currentTime + 0.35);
            }
        }, 600);
    },

    stopAudio() {
        if (!this.playingAudioId) return;

        const activeCard = document.querySelector(`.portfolio-card[data-id="${this.playingAudioId}"]`);
        if (activeCard) {
            activeCard.classList.remove('playing');
            const titleText = activeCard.querySelector('.portfolio-title') ? activeCard.querySelector('.portfolio-title').textContent : 'Portfolio Asset';
            activeCard.setAttribute('aria-label', `Play ${titleText}`);
        }

        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }

        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) {}
            this.oscillator = null;
        }

        if (this.gainNode) {
            try {
                this.gainNode.disconnect();
            } catch (e) {}
            this.gainNode = null;
        }

        // Restore default image pane of the active panel
        const activePanel = document.querySelector('.explorer-tab-content.active');
        if (activePanel) {
            this.resetVisualPane(activePanel);
        }

        this.playingAudioId = null;
    },

    cleanup() {
        this.stopAudio();
    }
};
