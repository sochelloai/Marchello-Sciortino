/**
 * Music Module - Renders custom HTML5-like audio cards using browser Web Audio API synthesis.
 * This guarantees real, working audio without requiring binary physical .mp3 assets.
 */
const Music = {
    tracks: [
        {
            id: 'warrior',
            title: "The Warrior's Path",
            genre: "Acoustic Rock Anthem",
            desc: "A rhythmic guitar-driven track detailing early Lyme rashes, physical shifts, and the choice to keep building.",
            durationSec: 222,
            durationStr: "3:42",
            frequency: 220 // base chord pitch A3
        },
        {
            id: 'monsoon',
            title: "Monsoon Hangar",
            genre: "Cinematic Country Synth",
            desc: "A reflective electronic track capturing the storm clouds clearing at the airfield before the tandem skydive jump.",
            durationSec: 178,
            durationStr: "2:58",
            frequency: 261.63 // base chord pitch C4
        },
        {
            id: 'ambient',
            title: "Chello AI Melody",
            genre: "Warm Ambient Lo-Fi",
            desc: "A soft, relaxing background track used during keynotes and readings, emphasizing perspective and space.",
            durationSec: 255,
            durationStr: "4:15",
            frequency: 196 // base chord pitch G3
        }
    ],

    playingTrackId: null,
    audioCtx: null,
    oscillator: null,
    gainNode: null,
    playbackInterval: null,
    virtualCurrentTime: 0,

    init() {
        const container = document.getElementById('audio-players-container');
        if (container) {
            this.renderPlayers(container);
        }
    },

    renderPlayers(container) {
        container.innerHTML = '';
        
        this.tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'music-player-card';
            card.id = `player-${track.id}`;
            
            // Build visual waveform bars
            let barsHtml = '';
            for(let i=0; i<45; i++) {
                barsHtml += '<div class="waveform-bar"></div>';
            }

            card.innerHTML = `
                <div class="music-track-info">
                    <div>
                        <h4 class="music-track-title">${track.title}</h4>
                        <span class="music-track-genre">${track.genre}</span>
                        <p style="font-size: 0.85rem; color: var(--color-gray-steel); margin-top: 8px;">${track.desc}</p>
                    </div>
                    <span class="music-track-duration">${track.durationStr}</span>
                </div>
                
                <div class="waveform-container">
                    ${barsHtml}
                </div>
                
                <div class="player-controls-row">
                    <button class="play-toggle-btn" aria-label="Play ${track.title}" data-track-id="${track.id}">
                        <!-- Play SVG icon -->
                        <svg class="play-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </button>
                    <div class="player-slider-container">
                        <span class="time-display current-time">00:00</span>
                        <input type="range" class="player-progress-bar" min="0" max="${track.durationSec}" value="0" aria-label="Scrub track progress">
                        <span class="time-display">${track.durationStr}</span>
                    </div>
                </div>
            `;

            // Bind player control listeners
            const playBtn = card.querySelector('.play-toggle-btn');
            const progress = card.querySelector('.player-progress-bar');
            
            playBtn.addEventListener('click', () => this.toggleTrack(track.id));
            progress.addEventListener('input', (e) => this.seekTrack(track.id, e.target.value));

            container.appendChild(card);
        });
    },

    toggleTrack(trackId) {
        if (this.playingTrackId === trackId) {
            // Stop current track
            this.stopAudio();
        } else {
            // Stop whatever is playing
            if (this.playingTrackId) this.stopAudio();
            // Start new track
            this.playAudio(trackId);
        }
    },

    playAudio(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        const card = document.getElementById(`player-${trackId}`);
        const playBtn = card.querySelector('.play-toggle-btn');
        const progress = card.querySelector('.player-progress-bar');
        const timeDisplay = card.querySelector('.current-time');
        
        // 1. Initialize Browser AudioContext if needed
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Resume AudioContext if suspended (browser security blocks autoplay)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        // 2. Synthesize ambient melody cords
        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();
        
        // Premium lo-fi sound: triangle wave filter, smooth gain envelopes
        this.oscillator.type = 'triangle';
        this.oscillator.frequency.setValueAtTime(track.frequency, this.audioCtx.currentTime);
        
        // Create an LFO (Low Frequency Oscillator) to make a pleasant volume tremolo vibe
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        lfo.frequency.value = 1.8; // speed of modulation
        lfoGain.gain.value = 0.15; // depth of volume dip
        
        lfo.connect(lfoGain);
        lfoGain.connect(this.gainNode.gain);
        lfo.start();
        
        // Base volume set low
        this.gainNode.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
        
        // Connection nodes
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
        
        // Start sound waves
        this.oscillator.start();
        
        // 3. UI State Changes
        this.playingTrackId = trackId;
        card.classList.add('playing');
        playBtn.setAttribute('aria-label', `Pause ${track.title}`);
        playBtn.innerHTML = `
            <!-- Pause SVG icon -->
            <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
        `;

        // 4. Update track timeline tracking
        this.playbackInterval = setInterval(() => {
            if (this.virtualCurrentTime < track.durationSec) {
                this.virtualCurrentTime++;
                progress.value = this.virtualCurrentTime;
                timeDisplay.textContent = this.formatTime(this.virtualCurrentTime);
                
                // Add a dynamic pitch slide occasionally to simulate synthesized acoustic sweeps
                if (this.virtualCurrentTime % 8 === 0) {
                    this.oscillator.frequency.exponentialRampToValueAtTime(track.frequency * 1.25, this.audioCtx.currentTime + 0.5);
                } else if (this.virtualCurrentTime % 8 === 2) {
                    this.oscillator.frequency.exponentialRampToValueAtTime(track.frequency, this.audioCtx.currentTime + 0.5);
                }
            } else {
                this.stopAudio();
            }
        }, 1000);
    },

    stopAudio() {
        if (!this.playingTrackId) return;

        const card = document.getElementById(`player-${this.playingTrackId}`);
        const playBtn = card.querySelector('.play-toggle-btn');
        const track = this.tracks.find(t => t.id === this.playingTrackId);
        
        // 1. Terminate audio context oscillators
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch(e) {}
            this.oscillator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
        
        // 2. Clear progress handlers
        clearInterval(this.playbackInterval);
        
        // 3. Revert UI Elements
        card.classList.remove('playing');
        playBtn.setAttribute('aria-label', `Play ${track.title}`);
        playBtn.innerHTML = `
            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        `;
        
        this.playingTrackId = null;
    },

    seekTrack(trackId, val) {
        this.virtualCurrentTime = parseInt(val);
        const card = document.getElementById(`player-${trackId}`);
        const timeDisplay = card.querySelector('.current-time');
        if (timeDisplay) {
            timeDisplay.textContent = this.formatTime(this.virtualCurrentTime);
        }
        
        // If actively playing, perform a pitch bend relative to slider coordinates
        if (this.playingTrackId === trackId && this.oscillator) {
            const shiftFrequency = this.tracks.find(t => t.id === trackId).frequency * (1 + (val / 500));
            this.oscillator.frequency.setValueAtTime(shiftFrequency, this.audioCtx.currentTime);
        }
    },

    formatTime(sec) {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
};
