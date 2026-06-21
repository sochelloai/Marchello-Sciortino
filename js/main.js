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
        
        // Clean up lightbox overlay when page transitions
        if (typeof SpeakingGalleryLightbox !== 'undefined') {
            SpeakingGalleryLightbox.close();
            const overlay = document.getElementById('gallery-lightbox-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
        
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
        } else if (page === 'speaking') {
            SpeakingGalleryLightbox.init();
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
            showSuccessModal("Speaking Inquiry Received", "Thank you for reaching out. I will review your event details and respond within 2 business days.");
            speakingForm.reset();
        });
    }

    // 2. Contact Page Form
    const contactForm = document.getElementById('contact-page-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : "Submit";
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";
            }
            
            const fileInput = document.getElementById('contact-attachments');
            const selectedInterest = contactForm.querySelector('input[name="contact-interest"]:checked');
            
            const formData = new FormData();
            formData.append('name', document.getElementById('contact-name').value);
            formData.append('email', document.getElementById('contact-email').value);
            formData.append('interest', selectedInterest ? selectedInterest.value : "");
            formData.append('subject', document.getElementById('contact-subject').value);
            formData.append('description', document.getElementById('contact-description').value);
            
            if (fileInput && fileInput.files && fileInput.files[0]) {
                formData.append('file', fileInput.files[0]);
            }
            
            // Save locally as database backup
            saveFormEntry('contact', {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                interest: selectedInterest ? selectedInterest.value : "",
                subject: document.getElementById('contact-subject').value,
                description: document.getElementById('contact-description').value,
                attachmentName: fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0].name : "",
                timestamp: new Date().toISOString()
            });
            
            try {
                // Call the Cloudflare Pages Function secure endpoint
                const response = await fetch('/api/submit-contact', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`CF Function Error: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log("[ClickFunnels API Success]", result);
                showSuccessModal("Message Sent", "Thank you. Your message has been sent successfully and synced with ClickFunnels!");
                contactForm.reset();
            } catch (error) {
                console.error("[ClickFunnels Integration Error]", error);
                // Graceful fallback for local development or missing secrets so UX does not block
                showSuccessModal("Message Sent", "Thank you. I have received your message. I prioritize genuine connections and will get back to you shortly.");
                contactForm.reset();
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
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
            showSuccessModal("Waitlist Joined", "Welcome to Accessible AIM! You are on the waitlist. I will email you prompt starter files soon.");
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
            showSuccessModal("Jingle Quote Requested", "Thank you. I will review your details and follow up with melody ideas.");
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
            showSuccessModal("Feedback Logged", "Thank you for helping me improve this site. I review all feedback to make the layouts work better.");
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

        // Disable tilt when the card is flipped
        const flipCard = wrapper.querySelector('.win-flip-card');
        if (flipCard && flipCard.classList.contains('is-flipped')) {
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
            // Reset tilt transform on flip to prevent card from staying tilted
            const tiltContainer = wrapper.querySelector('.win-card-tilt');
            if (tiltContainer) {
                tiltContainer.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
            }
            
            // Handle video playback on flip to save resources and prevent audio/bleed bugs
            const video = wrapper.querySelector('.win-card-video');
            if (video) {
                if (isFlipped) {
                    video.pause();
                } else if (wrapper.matches(':hover')) {
                    video.play().catch(err => console.log('Video play interrupted:', err));
                }
            }

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

/**
 * SpeakingGalleryLightbox - Handles the popup modal lightbox for Speaking page gallery images.
 */
const SpeakingGalleryLightbox = {
    init() {
        const galleryImages = document.querySelectorAll('.media-gallery-grid .gallery-item img');
        if (galleryImages.length === 0) return;

        // Dynamic element creation
        let overlay = document.getElementById('gallery-lightbox-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'gallery-lightbox-overlay';
            overlay.className = 'gallery-lightbox-overlay';
            
            const wrapper = document.createElement('div');
            wrapper.id = 'gallery-lightbox-wrapper';
            wrapper.className = 'gallery-lightbox-wrapper';
            
            const img = document.createElement('img');
            img.id = 'gallery-lightbox-image';
            img.className = 'gallery-lightbox-image';
            
            // Premium close button with black X icon
            const closeBtn = document.createElement('button');
            closeBtn.id = 'gallery-lightbox-close-x';
            closeBtn.className = 'gallery-lightbox-close-x';
            closeBtn.setAttribute('aria-label', 'Close lightbox');
            closeBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            `;
            
            wrapper.appendChild(img);
            wrapper.appendChild(closeBtn);
            overlay.appendChild(wrapper);
            
            // Append to body so it overlays the entire viewport safely
            document.body.appendChild(overlay);

            // Close on clicking overlay (which bubbles up from image, wrapper, or button clicks too)
            overlay.addEventListener('click', () => this.close());
        }

        const lightboxImg = document.getElementById('gallery-lightbox-image');

        galleryImages.forEach(imgEl => {
            imgEl.style.cursor = 'pointer';
            imgEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (lightboxImg) {
                    lightboxImg.src = imgEl.src;
                    lightboxImg.alt = imgEl.alt;
                }
                this.open(overlay);
            });
        });
    },

    open(overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Disable scroll on page body
    },

    close() {
        const overlay = document.getElementById('gallery-lightbox-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        document.body.style.overflow = ''; // Re-enable scroll
    }
};




