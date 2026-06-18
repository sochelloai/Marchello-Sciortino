/**
 * Main Coordinator - Bootstraps all modules and manages global forms and modal UI.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize core system structures
    Accessibility.init();
    Router.init();
    
    // 2. Setup global DOM listeners
    setupMobileNav();
    setupGlobalModals();
    
    // 3. Listen to page rendering transitions to bootstrap specific page scripts
    document.addEventListener('page-loaded', (e) => {
        const page = e.detail.page;
        
        // Clean up parallax and timeline listeners when page transitions
        cleanupHeroParallax();
        cleanupTimelineScroll();
        
        if (page === 'home') {
            initHeroParallax();
        } else if (page === 'story') {
            initStoryTimelineScroll();
        } else if (page === 'brain') {
            Brain.init();
        } else if (page === 'chelloai') {
            Chat.init();
        } else if (page === 'music') {
            Music.init();
        } else if (page === 'hub' || page === 'marchellos-blog') {
            Hub.init();
        } else if (page === 'mission' || page === 'aim') {
            WinCardsEffect.init();
        }
        
        // Always bind forms rendered inside the page view
        bindFormHandlers();
    });
});

/**
 * Mobile Navigation Handler
 */
function setupMobileNav() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('main-nav');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
            menuToggle.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking links in mobile view
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            });
        });
    }
}

/**
 * Global Modals Event Handlers
 */
function setupGlobalModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    
    modals.forEach(modal => {
        const closeBtns = modal.querySelectorAll('.modal-close-btn, .modal-ok-btn');
        
        const closeModalFn = () => {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            // If stopping audio on modal close (fallback helper)
            if (modal.id === 'detail-modal' && typeof Music !== 'undefined') {
                // Return focus to active trigger
            }
        };

        // Close buttons clicks
        closeBtns.forEach(btn => btn.addEventListener('click', closeModalFn));
        
        // Click on dark backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModalFn();
        });
        
        // Escape key presses
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModalFn();
            }
        });
    });
}

/**
 * Form Interceptor & Success Modal Launcher
 */
function bindFormHandlers() {
    // 1. Speaking Inquiry Form
    const speakingForm = document.getElementById('speaking-inquiry-form');
    if (speakingForm) {
        speakingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                event: document.getElementById('event-name').value,
                org: document.getElementById('event-org').value,
                date: document.getElementById('event-date').value,
                location: document.getElementById('event-location').value,
                audience: document.getElementById('event-audience').value,
                timestamp: new Date().toISOString()
            };
            saveFormEntry('speaking', data);
            showSuccessModal("Speaking Inquiry Received", "Thank you for reaching out. We will review your event details and respond within 2 business days.");
            speakingForm.reset();
        });
    }

    // 2. Contact Page Form
    const contactForm = document.getElementById('contact-page-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('contact-attachments');
            const data = {
                email: document.getElementById('contact-email').value,
                subject: document.getElementById('contact-subject').value,
                description: document.getElementById('contact-description').value,
                attachmentName: fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "",
                timestamp: new Date().toISOString()
            };
            saveFormEntry('contact', data);
            showSuccessModal("Message Sent", "Thank you, Marchello has received your message. We prioritize genuine connections and will get back to you shortly.");
            contactForm.reset();
        });
    }

    // 3. AIM Waitlist Form
    const aimForm = document.getElementById('aim-waitlist-form');
    if (aimForm) {
        aimForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('aim-name').value,
                email: document.getElementById('aim-email').value,
                role: document.getElementById('aim-role').value,
                timestamp: new Date().toISOString()
            };
            saveFormEntry('aim-waitlist', data);
            showSuccessModal("Waitlist Joined", "Welcome to Accessible AIM! You have been successfully added to the early access queue. We will email you prompt starter files soon.");
            aimForm.reset();
        });
    }

    // 4. Book Pre-registration Form
    const bookForm = document.getElementById('book-notify-form');
    if (bookForm) {
        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = bookForm.querySelector('input[type="email"]').value;
            saveFormEntry('book-notify', { email, timestamp: new Date().toISOString() });
            showSuccessModal("Release Notification Setup", `Success! You will be notified at ${email} as soon as 'Limitations to Liberation' launches.`);
            bookForm.reset();
        });
    }

    // 5. AI Music Quote Form
    const musicForm = document.getElementById('music-quote-form');
    if (musicForm) {
        musicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('music-name').value,
                email: document.getElementById('music-email').value,
                details: document.getElementById('music-details').value,
                timestamp: new Date().toISOString()
            };
            saveFormEntry('music-quote', data);
            showSuccessModal("Jingle Quote Requested", "Thank you. Marchello will review your brand details and follow up with structural melody ideas and package options.");
            musicForm.reset();
        });
    }

    // 6. Accessibility Feedback Form
    const accessForm = document.getElementById('access-feedback-form');
    if (accessForm) {
        accessForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                email: document.getElementById('access-email').value,
                description: document.getElementById('access-desc').value,
                timestamp: new Date().toISOString()
            };
            saveFormEntry('access-feedback', data);
            showSuccessModal("Feedback Logged", "Thank you for helping us optimize. We review all barriers logged to construct layouts that serve more people.");
            accessForm.reset();
        });
    }
}

/**
 * Persists submissions locally to simulate databases
 */
function saveFormEntry(formId, data) {
    console.log(`[Form Submission Logged] Form: ${formId}`, data);
    
    // Save to localStorage array
    const key = `ms-form-${formId}`;
    const existing = JSON.parse(localStorage.getItem(key)) || [];
    existing.push(data);
    localStorage.setItem(key, JSON.stringify(existing));
}

/**
 * Triggers success modal popup
 */
function showSuccessModal(title, message) {
    const modal = document.getElementById('success-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    
    if (modal && titleEl && msgEl) {
        titleEl.textContent = title;
        msgEl.textContent = message;
        
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Shift focus inside modal
        const okBtn = modal.querySelector('.modal-ok-btn');
        if (okBtn) okBtn.focus();
    }
}

// Global references for hero parallax scroll listeners to allow clean removal
let heroScrollListener = null;
let heroResizeListener = null;

/**
 * Initializes a parallax scroll effect on the hero background image.
 * Active only when the screen width crops the 16:9 aspect ratio image.
 */
function initHeroParallax() {
    cleanupHeroParallax();

    const hero = document.querySelector('.hero-sec');
    if (!hero) return;

    const handleScroll = () => {
        const rect = hero.getBoundingClientRect();
        // Skip computations if hero is out of viewport
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        // Check if the container aspect ratio crops the 16:9 image horizontally (ratio < 16/9)
        const aspectRatio = window.innerWidth / window.innerHeight;
        const isCropped = aspectRatio < (16 / 9);

        if (isCropped) {
            const scrollY = window.scrollY;
            const yOffset = scrollY * 0.45; // Smooth 0.45 scroll speed coefficient
            const isMobile = window.innerWidth <= 768;
            const xPos = isMobile ? '65%' : 'center';
            hero.style.backgroundPosition = `${xPos} calc(50% + ${yOffset}px)`;
        } else {
            hero.style.backgroundPosition = '';
        }
    };

    heroScrollListener = handleScroll;
    heroResizeListener = handleScroll;

    window.addEventListener('scroll', heroScrollListener, { passive: true });
    window.addEventListener('resize', heroResizeListener);
    
    // Run initial frame
    handleScroll();
}

/**
 * Cleans up active parallax event listeners to prevent leaks during page navigation.
 */
function cleanupHeroParallax() {
    if (heroScrollListener) {
        window.removeEventListener('scroll', heroScrollListener);
        heroScrollListener = null;
    }
    if (heroResizeListener) {
        window.removeEventListener('resize', heroResizeListener);
        heroResizeListener = null;
    }
}

/**
 * WinCardsEffect - Implements the dynamic 3D tilt, glare tracking, and 3D card flip
 * effects for the W.I.N. framework on the Mission page.
 */
const WinCardsEffect = {
    init() {
        const cards = document.querySelectorAll('.win-card-wrapper');
        cards.forEach(card => {
            const tiltContainer = card.querySelector('.win-card-tilt');
            const flipCard = card.querySelector('.win-flip-card');
            
            if (!tiltContainer || !flipCard) return;

            // Hover (3D Tilt & Glare Coordinate calculations)
            card.addEventListener('mouseenter', () => {
                const video = card.querySelector('.win-card-video');
                if (video) {
                    video.play().catch(err => console.log('Video play interrupted:', err));
                }
            });
            
            card.addEventListener('mousemove', (e) => this.handleMouseMove(e, card, tiltContainer));
            
            card.addEventListener('mouseleave', () => {
                const video = card.querySelector('.win-card-video');
                if (video) {
                    video.pause();
                }
                this.handleMouseLeave(tiltContainer);
            });
            
            // Interaction (Click to Flip)
            card.addEventListener('click', () => this.toggleFlip(flipCard));
            
            // Accessibility (Keypress Space or Enter to Flip)
            card.addEventListener('keydown', (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault(); // Stop page scrolling on Spacebar
                    this.toggleFlip(flipCard);
                }
            });
        });
    },
    
    handleMouseMove(e, wrapper, tiltContainer) {
        // Accessibility check: disable tilt when animations are paused
        if (document.documentElement.classList.contains('accessibility-paused-animations')) {
            return;
        }

        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate percentages for radial glare overlay
        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;
        
        wrapper.style.setProperty('--glare-x', `${pctX}%`);
        wrapper.style.setProperty('--glare-y', `${pctY}%`);
        
        // Calculate tilt rotation (-6 to 6 degrees max to be subtle but noticeable)
        const tiltX = -((y / rect.height) - 0.5) * 12;
        const tiltY = ((x / rect.width) - 0.5) * 12;
        
        tiltContainer.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    },
    
    handleMouseLeave(tiltContainer) {
        // Reset tilt transformation back to initial state
        tiltContainer.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    },
    
    toggleFlip(flipCard) {
        flipCard.classList.toggle('is-flipped');
        
        // Update accessibility attributes
        const isFlipped = flipCard.classList.contains('is-flipped');
        const wrapper = flipCard.closest('.win-card-wrapper');
        if (wrapper) {
            const letter = wrapper.getAttribute('data-card');
            const term = letter === 'W' ? 'Warrior Story' : (letter === 'I' ? 'Inspiring Impact' : 'Nurturing Outcomes');
            wrapper.setAttribute('aria-label', `${term}, click to reveal details. Currently showing ${isFlipped ? 'details (flipped)' : 'front face'}.`);
            
            // Dynamically update tooltip content for paused animation state
            const tooltip = wrapper.querySelector('.win-card-tooltip');
            if (tooltip) {
                tooltip.textContent = isFlipped ? 'Click to Return (Animations Paused)' : 'Click to Flip (Animations Paused)';
            }
        }
    }
};

let timelineScrollListener = null;

/**
 * initStoryTimelineScroll - Sets up scroll-linked vertical progress animations
 * and spring active highlights on timeline nodes.
 */
function initStoryTimelineScroll() {
    const timeline = document.querySelector('.alternating-timeline');
    if (!timeline) return;

    // Inject the progress bar overlay if not already present
    let progressBar = timeline.querySelector('.alternating-timeline-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'alternating-timeline-progress-bar';
        timeline.appendChild(progressBar);
    }

    const bullets = timeline.querySelectorAll('.timeline-bullet');

    const handleScroll = () => {
        // Accessibility check: Pause animations toggles snap full progress and skips effects
        const animationsPaused = document.documentElement.classList.contains('accessibility-paused-animations');
        
        if (animationsPaused) {
            bullets.forEach(b => b.classList.add('active-bullet'));
            return;
        }

        const rect = timeline.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Trigger point is at 55% height of the screen (slightly below center for organic flow)
        const triggerPoint = viewportHeight * 0.55;
        
        // Calculate progress percentage
        const scrolled = triggerPoint - rect.top;
        let percentage = (scrolled / rect.height) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        
        progressBar.style.height = `${percentage}%`;

        // Check each bullet and activate when progress line crosses it
        bullets.forEach(bullet => {
            const bulletRect = bullet.getBoundingClientRect();
            // Trigger when center of bullet crosses triggerPoint
            const bulletCenter = bulletRect.top + bulletRect.height / 2;
            if (bulletCenter < triggerPoint) {
                bullet.classList.add('active-bullet');
            } else {
                bullet.classList.remove('active-bullet');
            }
        });
    };

    timelineScrollListener = handleScroll;
    window.addEventListener('scroll', timelineScrollListener, { passive: true });
    
    // Initial run
    handleScroll();
}

/**
 * cleanupTimelineScroll - Safely unbinds the scroll listeners.
 */
function cleanupTimelineScroll() {
    if (timelineScrollListener) {
        window.removeEventListener('scroll', timelineScrollListener);
        timelineScrollListener = null;
    }
}



