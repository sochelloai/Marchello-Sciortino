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
        this.initAccordion();
    },

    initAccordion() {
        const panels = document.querySelectorAll('.accordion-panel');
        panels.forEach(panel => {
            const handleExpand = () => {
                if (panel.classList.contains('active')) return;
                panels.forEach(p => {
                    p.classList.remove('active');
                    p.setAttribute('aria-expanded', 'false');
                    const num = p.querySelector('.panel-num') ? p.querySelector('.panel-num').textContent : '';
                    const title = p.querySelector('.panel-vertical-title') ? p.querySelector('.panel-vertical-title').textContent : '';
                    p.setAttribute('aria-label', `${num} ${title}, click to expand`);
                });
                panel.classList.add('active');
                panel.setAttribute('aria-expanded', 'true');
                const num = panel.querySelector('.panel-num') ? panel.querySelector('.panel-num').textContent : '';
                const title = panel.querySelector('.panel-vertical-title') ? panel.querySelector('.panel-vertical-title').textContent : '';
                panel.setAttribute('aria-label', `${num} ${title}, currently expanded`);
            };

            panel.addEventListener('click', (e) => {
                if (panel.classList.contains('active') && !e.target.closest('.panel-trigger')) {
                    return;
                }
                if (window.innerWidth <= 768 && panel.classList.contains('active') && e.target.closest('.panel-trigger')) {
                    panel.classList.remove('active');
                    panel.setAttribute('aria-expanded', 'false');
                    const num = panel.querySelector('.panel-num') ? panel.querySelector('.panel-num').textContent : '';
                    const title = panel.querySelector('.panel-vertical-title') ? panel.querySelector('.panel-vertical-title').textContent : '';
                    panel.setAttribute('aria-label', `${num} ${title}, click to expand`);
                    return;
                }
                handleExpand();
            });

            panel.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleExpand();
                }
            });
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

                if (type === 'image' || type === 'video') {
                    this.openLightbox(type, src, title);
                } else if (type === 'audio' || type === 'song') {
                    this.toggleAudio(id, card);
                }
            });
        });

        // Initialize Lightbox Elements
        let overlay = document.getElementById('portfolio-lightbox-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'portfolio-lightbox-overlay';
            overlay.className = 'portfolio-lightbox-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-hidden', 'true');
            overlay.innerHTML = `
                <div class="portfolio-lightbox-wrapper">
                    <button class="portfolio-lightbox-close" aria-label="Close lightbox">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div id="portfolio-lightbox-content"></div>
                    <div class="portfolio-lightbox-caption"></div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Close lightbox click handlers
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.closest('.portfolio-lightbox-close')) {
                    this.closeLightbox();
                }
            });

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && overlay.classList.contains('active')) {
                    this.closeLightbox();
                }
            });
        }
    },

    openLightbox(type, src, title) {
        const overlay = document.getElementById('portfolio-lightbox-overlay');
        const content = document.getElementById('portfolio-lightbox-content');
        const caption = overlay.querySelector('.portfolio-lightbox-caption');

        if (!overlay || !content || !caption) return;

        content.innerHTML = '';
        caption.textContent = title;

        if (type === 'image') {
            const img = document.createElement('img');
            img.src = src;
            img.alt = title;
            img.className = 'portfolio-lightbox-image';
            content.appendChild(img);
        } else if (type === 'video') {
            const video = document.createElement('video');
            video.src = src;
            video.controls = true;
            video.autoplay = true;
            video.className = 'portfolio-lightbox-video';
            content.appendChild(video);
        }

        overlay.classList.add('active');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    },

    closeLightbox() {
        const overlay = document.getElementById('portfolio-lightbox-overlay');
        const content = document.getElementById('portfolio-lightbox-content');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.setAttribute('aria-hidden', 'true');
            if (content) {
                const video = content.querySelector('video');
                if (video) {
                    video.pause();
                    video.src = '';
                }
                content.innerHTML = '';
            }
        }
        document.body.style.overflow = '';
    },

    toggleAudio(id, card) {
        if (this.playingAudioId === id) {
            this.stopAudio();
        } else {
            if (this.playingAudioId) {
                this.stopAudio();
            }
            this.playAudio(id, card);
        }
    },

    playAudio(id, card) {
        const track = this.tracks[id];
        if (!track) return;

        // 1. Initialize Browser AudioContext if needed
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume context if suspended
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // 2. Setup Synth nodes
        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        this.oscillator.type = track.type;
        this.oscillator.frequency.setValueAtTime(track.freq, this.audioCtx.currentTime);

        // Low volume tremolo modulation
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

        // Melody loop progression
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
            this.gainNode.disconnect();
            this.gainNode = null;
        }

        this.playingAudioId = null;
    },

    cleanup() {
        this.stopAudio();
        this.closeLightbox();
        const overlay = document.getElementById('portfolio-lightbox-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
};
