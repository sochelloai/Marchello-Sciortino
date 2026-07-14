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

                // Stop any currently playing audio before triggering new lightbox/audio
                this.stopAudio();

                const bgCardBg = card.querySelector('.portfolio-card-bg');
                const bgUrl = bgCardBg && bgCardBg.style.backgroundImage ? bgCardBg.style.backgroundImage.slice(5, -2).replace(/"/g, "") : '';

                if (type === 'image') {
                    if (pane) {
                        pane.innerHTML = `<img src="${src}" alt="${title}" class="explorer-visual-img" data-type="image" data-media-src="${src}" data-id="${id}">`;
                    }
                    this.openLightbox('image', src, title);
                } else if (type === 'video') {
                    if (pane) {
                        pane.innerHTML = `<img src="${bgUrl}" alt="${title}" class="explorer-visual-img" data-type="video" data-media-src="${src}" data-id="${id}">`;
                    }
                    this.openLightbox('video', src, title);
                } else if (type === 'website') {
                    if (pane) {
                        pane.innerHTML = `<img src="${src}" alt="${title}" class="explorer-visual-img" data-type="website" data-media-src="${src}" data-link="${card.getAttribute('data-link') || ''}" data-id="${id}">`;
                    }
                    this.openLightbox('website', src, title, null, null, card);
                } else if (type === 'audio' || type === 'song') {
                    if (pane) {
                        pane.innerHTML = `<img src="${bgUrl}" alt="${title}" class="explorer-visual-img" data-type="${type}" data-media-src="${src || ''}" data-id="${id}">`;
                    }
                    this.openLightbox(type, bgUrl, title, src, id, card);
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
                const img = pane.querySelector('.explorer-visual-img');
                if (img) {
                    const type = img.getAttribute('data-type') || 'image';
                    const mediaSrc = img.getAttribute('data-media-src') || img.getAttribute('src');
                    const mediaId = img.getAttribute('data-id');
                    const alt = img.getAttribute('alt') || 'Portfolio Asset';
                    
                    if (type === 'image') {
                        this.openLightbox('image', mediaSrc, alt);
                    } else if (type === 'video') {
                        this.openLightbox('video', mediaSrc, alt);
                    } else if (type === 'website') {
                        const matchingCard = document.querySelector(`.portfolio-card[data-src="${mediaSrc}"]`) || document.querySelector(`.portfolio-card[data-id="${mediaId}"]`);
                        this.openLightbox('website', mediaSrc, alt, null, null, matchingCard);
                    } else if (type === 'audio' || type === 'song') {
                        const matchingCard = document.querySelector(`.portfolio-card[data-id="${mediaId}"], .portfolio-card[data-src="${mediaSrc}"]`);
                        this.openLightbox(type, img.getAttribute('src'), alt, mediaSrc, mediaId, matchingCard);
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
        const src = card ? card.getAttribute('data-src') : null;
        if (src) {
            this.stopAudio();

            this.activeAudio = new Audio(src);
            this.activeAudio.loop = true;
            this.activeAudio.play().catch(err => {
                console.warn("Audio autoplay blocked or failed:", err);
            });

            this.playingAudioId = id;
            if (card) {
                card.classList.add('playing');
                const titleText = card.querySelector('.portfolio-title') ? card.querySelector('.portfolio-title').textContent : 'Portfolio Asset';
                card.setAttribute('aria-label', `Pause ${titleText}`);
            }

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
        if (card) {
            card.classList.add('playing');
            card.setAttribute('aria-label', `Pause ${card.querySelector('.portfolio-title').textContent}`);
        }

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

    openLightbox(type, src, title, audioSrc = null, audioId = null, card = null) {
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
        } else if (type === 'audio' || type === 'song') {
            content.innerHTML = `
                <div class="portfolio-lightbox-audio-container" style="text-align: center; max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <img src="${src}" alt="${title}" class="portfolio-lightbox-image" style="max-height: 50vh; border-radius: var(--radius-md); box-shadow: var(--shadow-lg);">
                    <div class="portfolio-wave playing" style="display: flex; gap: 6px; justify-content: center; height: 30px; margin-top: 1.5rem;">
                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                        <div class="portfolio-wave-bar" style="background-color: var(--color-teal); width: 4px; height: 100%;"></div>
                    </div>
                    <p style="color: var(--color-teal); font-family: var(--font-heading); margin-top: 1rem; font-size: 1.1rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;">Playing Audio</p>
                </div>
            `;
            // Play audio track
            this.playAudio(audioId, card);
        } else if (type === 'website') {
            const link = card ? card.getAttribute('data-link') : '';
            content.innerHTML = `
                <div class="portfolio-lightbox-website-container" style="text-align: center; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1rem;">
                    <iframe src="${link || src}" class="portfolio-lightbox-iframe" style="width: 85vw; height: 70vh; max-width: 1200px; min-height: 450px; border: none; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); background: #ffffff;"></iframe>
                    ${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer" class="btn btn-teal" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; font-weight: 600; font-size: 0.9rem; padding: 8px 16px;">Open in New Tab <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>` : ''}
                </div>
            `;
        } else {
            return;
        }

        caption.textContent = title;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        // Stop audio when lightbox closes
        this.stopAudio();

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
