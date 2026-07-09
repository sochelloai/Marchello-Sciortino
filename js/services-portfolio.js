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
    activeAudio: null,

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
        this.ensureLightboxInDOM();
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
                const id = card.getAttribute('data-id') || src;
                const title = card.querySelector('.portfolio-title') ? card.querySelector('.portfolio-title').textContent : 'Portfolio Asset';
                
                // Find active panel and visual pane (only present on Services page)
                const activePanel = document.querySelector('.explorer-tab-content.active');
                const pane = activePanel ? activePanel.querySelector('.explorer-visual-pane') : null;

                // If clicking another card while audio is playing, stop it first
                if (this.playingAudioId && this.playingAudioId !== id) {
                    this.stopAudio();
                }

                if (type === 'image') {
                    this.stopAudio();
                    if (pane) {
                        pane.innerHTML = `<img src="${src}" alt="${title}" class="explorer-visual-img">`;
                    }
                    this.openLightbox('image', src, title);
                } else if (type === 'video') {
                    this.stopAudio();
                    if (pane) {
                        pane.innerHTML = `<video src="${src}" controls autoplay loop class="explorer-visual-img" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
                    }
                    this.openLightbox('video', src, title);
                } else if (type === 'audio' || type === 'song') {
                    if (this.playingAudioId === id) {
                        this.stopAudio();
                        if (activePanel) {
                            this.resetVisualPane(activePanel);
                        }
                    } else {
                        const bgCardBg = card.querySelector('.portfolio-card-bg');
                        const bgUrl = bgCardBg && bgCardBg.style.backgroundImage ? bgCardBg.style.backgroundImage.slice(5, -2).replace(/"/g, "") : '';
                        this.playAudio(id, card);
                        
                        if (pane) {
                            pane.innerHTML = `
                                <div class="explorer-audio-preview" style="position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background-image: url('${bgUrl}'); background-size: cover; background-position: center; color: white;">
                                    <div style="position: absolute; inset: 0; background: rgba(8, 27, 41, 0.75); z-index: 1;"></div>
                                    <div style="position: relative; z-index: 2; text-align: center; padding: 2rem; display: flex; flex-direction: column; align-items: center;">
                                        <div style="font-size: 3rem; margin-bottom: 1rem; animation: pulse 1.5s infinite;">🎵</div>
                                        <h4 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.5rem;">${title}</h4>
                                        <p style="color: var(--color-teal); font-size: 0.9rem; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">Playing Audio...</p>
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
                }

                // Smoothly scroll to visual pane so the user sees it
                if (pane) {
                    pane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            });
        });

        // Also allow clicking the preview pane image/media to open the lightbox
        const visualPanes = document.querySelectorAll('.explorer-visual-pane');
        visualPanes.forEach(pane => {
            pane.style.cursor = 'pointer';
            pane.addEventListener('click', (e) => {
                // If a video control is clicked, let the event propagate normally
                if (e.target.tagName.toLowerCase() === 'video' && e.target.hasAttribute('controls')) {
                    return;
                }
                
                const img = pane.querySelector('.explorer-visual-img');
                if (img) {
                    const src = img.getAttribute('src');
                    const alt = img.getAttribute('alt') || 'Portfolio Asset';
                    const tagName = img.tagName.toLowerCase();
                    
                    if (tagName === 'img') {
                        this.openLightbox('image', src, alt);
                    } else if (tagName === 'video') {
                        this.openLightbox('video', src, alt);
                    }
                }
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
        const src = card.getAttribute('data-src');
        if (src) {
            this.stopAudio();

            this.activeAudio = new Audio(src);
            this.activeAudio.loop = true;
            this.activeAudio.play().catch(err => {
                console.warn("Audio autoplay blocked or failed:", err);
            });

            this.playingAudioId = id;
            card.classList.add('playing');
            const titleText = card.querySelector('.portfolio-title') ? card.querySelector('.portfolio-title').textContent : 'Portfolio Asset';
            card.setAttribute('aria-label', `Pause ${titleText}`);

            this.activeAudio.addEventListener('ended', () => {
                this.stopAudio();
            });
            return;
        }

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

        if (this.activeAudio) {
            try {
                this.activeAudio.pause();
                this.activeAudio.currentTime = 0;
            } catch (e) {}
            this.activeAudio = null;
        }

        const activeCard = document.querySelector(`.portfolio-card[data-id="${this.playingAudioId}"], .portfolio-card[data-src="${this.playingAudioId}"]`);
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

        const activePanel = document.querySelector('.explorer-tab-content.active');
        if (activePanel) {
            this.resetVisualPane(activePanel);
        }

        this.playingAudioId = null;
    },

    ensureLightboxInDOM() {
        if (!document.getElementById('portfolio-lightbox-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'portfolio-lightbox-overlay';
            overlay.className = 'portfolio-lightbox-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-label', 'Portfolio Item Viewer');

            overlay.innerHTML = `
                <div class="portfolio-lightbox-wrapper">
                    <button id="portfolio-lightbox-close" class="portfolio-lightbox-close" aria-label="Close viewer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div id="portfolio-lightbox-content"></div>
                    <div id="portfolio-lightbox-caption" class="portfolio-lightbox-caption"></div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.addEventListener('click', (e) => {
                const isVideoControl = e.target.tagName.toLowerCase() === 'video' && e.target.hasAttribute('controls');
                if (!isVideoControl) {
                    this.closeLightbox();
                }
            });

            const closeBtn = overlay.querySelector('#portfolio-lightbox-close');
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeLightbox();
            });
        }

        // Always bind keydown listener
        if (!this.boundEscHandler) {
            this.boundEscHandler = this.handleEscKey.bind(this);
        }
        document.addEventListener('keydown', this.boundEscHandler);
    },

    openLightbox(type, src, title) {
        const overlay = document.getElementById('portfolio-lightbox-overlay');
        if (!overlay) return;

        const content = overlay.querySelector('#portfolio-lightbox-content');
        const caption = overlay.querySelector('#portfolio-lightbox-caption');

        if (type === 'image') {
            content.innerHTML = `<img src="${src}" alt="${title}" class="portfolio-lightbox-image">`;
        } else if (type === 'video') {
            // Check for YouTube / Vimeo URLs
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/i;
            
            const ytMatch = src.match(ytRegex);
            const vimeoMatch = src.match(vimeoRegex);
            
            if (ytMatch) {
                const videoId = ytMatch[1];
                content.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" class="portfolio-lightbox-video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 80vw; height: 60vh; min-height: 320px; border: none; border-radius: var(--radius-md);"></iframe>`;
            } else if (vimeoMatch) {
                const videoId = vimeoMatch[3];
                content.innerHTML = `<iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1" class="portfolio-lightbox-video" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width: 80vw; height: 60vh; min-height: 320px; border: none; border-radius: var(--radius-md);"></iframe>`;
            } else {
                content.innerHTML = `<video src="${src}" controls autoplay loop class="portfolio-lightbox-video"></video>`;
            }
        } else {
            return;
        }

        caption.textContent = title;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        const overlay = document.getElementById('portfolio-lightbox-overlay');
        if (!overlay) return;

        overlay.classList.remove('active');
        document.body.style.overflow = '';

        const content = overlay.querySelector('#portfolio-lightbox-content');
        if (content) {
            content.innerHTML = '';
        }
    },

    handleEscKey(e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('portfolio-lightbox-overlay');
            if (overlay && overlay.classList.contains('active')) {
                this.closeLightbox();
            }
        }
    },

    cleanup() {
        this.stopAudio();
        this.closeLightbox();
        if (this.boundEscHandler) {
            document.removeEventListener('keydown', this.boundEscHandler);
        }
    }
};
