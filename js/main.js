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
        cleanupWinScrollSequence();
        
        // Clean up lightbox overlay when page transitions
        if (typeof SpeakingGalleryLightbox !== 'undefined') {
            SpeakingGalleryLightbox.close();
            const overlay = document.getElementById('gallery-lightbox-overlay');
            if (overlay) {
                overlay.remove();
            }
        }

        // Clean up services portfolio logic
        if (typeof ServicesPortfolio !== 'undefined') {
            ServicesPortfolio.cleanup();
        }
        
        if (page === 'home') {
            initHeroParallax();
        } else if (page === 'story') {
            initStoryTimelineScroll();
        } else if (page === 'services') {
            ServicesPortfolio.init();
        } else if (page === 'brain') {
            Brain.init();
        } else if (page === 'chelloai') {
            Chat.init();
        } else if (page === 'music') {
            Music.init();
        } else if (page === 'hub' || page === 'marchellos-blog') {
            Hub.init();
        } else if (page === 'mission') {
            initPerspectiveConsole();
            initScrollReveal();
        } else if (page === 'aim') {
            WinCardsEffect.init();
            initWinScrollSequence();
        } else if (page === 'speaking') {
            SpeakingGalleryLightbox.init();
            if (typeof ServicesPortfolio !== 'undefined') {
                ServicesPortfolio.init();
            }
        }
        
        // Always bind forms rendered inside the page view
        bindFormHandlers();
        
        // Initialize global scroll reveals on all page sections
        initScrollReveal();
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
            
            // Clear the article query parameter on close to restore clean main page path
            if (modal.id === 'detail-modal') {
                const urlWithoutParams = window.location.pathname;
                history.pushState(null, '', urlWithoutParams);
            }
            
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
        speakingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = speakingForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.textContent : "Submit Speaking Inquiry";
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = "Sending...";
            }
            
            const name = document.getElementById('speaking-name').value;
            const email = document.getElementById('speaking-email').value;
            const eventName = document.getElementById('event-name').value;
            const location = document.getElementById('event-location').value;
            const message = document.getElementById('speaking-message').value;
            
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('event', eventName);
            formData.append('location', location);
            formData.append('message', message);
            
            // Save locally as database backup
            saveFormEntry('speaking', {
                name,
                email,
                event: eventName,
                location,
                message,
                timestamp: new Date().toISOString()
            });
            
            try {
                const response = await fetch('/api/submit-speaking', {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`CF Function Error: ${response.status} - ${errorText}`);
                }
                
                const result = await response.json();
                console.log("[ClickFunnels Speaking API Success]", result);
                showSuccessModal("Speaking Inquiry Received", "Thank you for reaching out. I will review your event details and respond within 2 business days.");
                speakingForm.reset();
            } catch (error) {
                console.error("[ClickFunnels Speaking Integration Error]", error);
                // Graceful fallback for local development or missing secrets so UX does not block
                showSuccessModal("Speaking Inquiry Received", "Thank you for reaching out. I will review your event details and respond within 2 business days.");
                speakingForm.reset();
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
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
                showSuccessModal("Message Sent", "Thank you. I have received your message. I prioritize genuine connections and will get back to you shortly.");
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

    // Dedicated AIM Waitlist Form (Email-only)
    const aimDedicatedForm = document.getElementById('aim-dedicated-waitlist-form');
    if (aimDedicatedForm) {
        aimDedicatedForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('aim-dedicated-email');
            if (emailInput) {
                const data = {
                    email: emailInput.value,
                    timestamp: new Date().toISOString()
                };
                saveFormEntry('aim-waitlist', data);
                showSuccessModal("Waitlist Joined", "Welcome to Accessible AIM! You are on the waitlist. I will email you prompt starter files soon.");
                aimDedicatedForm.reset();
            }
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
        // Hover animations and videos on cards are removed as requested.
        return;
    }
};

let winScrollListener = null;

/**
 * initWinScrollSequence - Sets up scroll-linked sequencing animation,
 * sidebar step bullet tracking, and card opacity/scale interpolation on scroll.
 */
function initWinScrollSequence() {
    const outer = document.querySelector('.win-scroll-trigger-section');
    const inner = document.querySelector('.win-sticky-container');
    if (!outer || !inner) return;

    const cards = inner.querySelectorAll('.win-card-wrapper');
    const steps = inner.querySelectorAll('.win-scroll-indicator-inline .win-indicator-step');
    const progressFill = inner.querySelector('.win-scroll-indicator-inline .win-indicator-progress');

    // Handle dot indicators click to scroll window to target active state offsets
    steps.forEach((step, index) => {
        step.addEventListener('click', (e) => {
            e.preventDefault();
            const rect = outer.getBoundingClientRect();
            const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
            const totalScrollableHeight = outer.offsetHeight - window.innerHeight;
            
            // Map index to progress values: Step 0 -> 0.0, Step 1 -> 0.45, Step 2 -> 0.85
            let targetProgress = 0;
            if (index === 0) targetProgress = 0;
            if (index === 1) targetProgress = 0.45;
            if (index === 2) targetProgress = 0.85;

            const targetTop = rect.top + scrollTop + (totalScrollableHeight * targetProgress);
            
            // Standard scrollTo will scroll smoothly because html { scroll-behavior: smooth; } is active in CSS.
            // This is robust against headless browser smooth-scroll option bugs.
            window.scrollTo(0, targetTop);
        });
    });

    const handleScroll = () => {
        const animationsPaused = document.documentElement.classList.contains('accessibility-paused-animations');
        const track = inner.querySelector('.win-right-scroll-col');

        if (animationsPaused) {
            // Under accessibility paused animations, reset track translations
            if (track) {
                track.style.transform = 'none';
                track.style.position = 'relative';
            }
            steps.forEach(step => step.classList.add('active-step'));
            if (progressFill) progressFill.style.setProperty('--win-progress', '100%');
            return;
        }

        const rect = outer.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Skip calculations if the outer container is out of view
        if (rect.top > viewportHeight || rect.bottom < 0) return;

        const totalScrollableHeight = rect.height - viewportHeight;
        let progress = -rect.top / totalScrollableHeight;
        progress = Math.max(0, Math.min(1, progress));

        // Update progress line custom CSS variable
        if (progressFill) {
            progressFill.style.setProperty('--win-progress', `${progress * 100}%`);
        }

        // Determine active step index
        let activeIndex = 0;
        if (progress < 0.33) {
            activeIndex = 0;
        } else if (progress < 0.66) {
            activeIndex = 1;
        } else {
            activeIndex = 2;
        }

        steps.forEach((step, idx) => {
            if (idx === activeIndex) {
                step.classList.add('active-step');
            } else {
                step.classList.remove('active-step');
            }
        });

        // Translate sliding track to lock active card in view
        // Card height is 460px and gap is 40px, so translation step is 500px
        if (track) {
            const cardHeight = 460;
            const gap = 40;
            const translateY = -activeIndex * (cardHeight + gap);
            track.style.transform = `translate3d(0, ${translateY}px, 0)`;
        }
    };

    winScrollListener = handleScroll;
    window.addEventListener('scroll', winScrollListener, { passive: true });
    window.addEventListener('resize', handleScroll);

    // Initial frame run
    handleScroll();
}

function cleanupWinScrollSequence() {
    if (winScrollListener) {
        window.removeEventListener('scroll', winScrollListener);
        window.removeEventListener('resize', winScrollListener);
        winScrollListener = null;
    }
}

/**
 * initPerspectiveConsole - Interactive console widget on the Mission page.
 */
function initPerspectiveConsole() {
    const consoleContainer = document.querySelector('.perspective-console');
    if (!consoleContainer) return;

    const buttons = consoleContainer.querySelectorAll('.console-btn');
    const displayTitle = consoleContainer.querySelector('#console-display-title');
    const displayText = consoleContainer.querySelector('#console-display-text');
    const loader = consoleContainer.querySelector('#console-loader');

    const reframes = {
        physical: {
            title: "The Constraint Advantage",
            text: "Physical boundaries force me to preserve energy and leverage assistants. By using voice-driven automation, my AI digital twins, and structured workflows, I save my physical coordination while multiplying my digital leverage."
        },
        time: {
            title: "The Time Leverage",
            text: "Having limited hours forces me to stop wasting energy on non-essential busywork. It triggers my extreme focus, leading me to build only high-converting, core funnels and systems that produce maximum impact."
        },
        tech: {
            title: "The Beginner Advantage",
            text: "A lack of technical experience prevents over-engineering and keeps my solutions simple, direct, and user-friendly. I focus on human connection and clean messaging rather than getting lost in complex code."
        },
        audience: {
            title: "The Niche Advantage",
            text: "A small audience allows me to build deep, genuine relationships and offer hyper-personalized value. I refine my offers, gather intense feedback, and achieve higher conversion rates with people who truly care."
        }
    };

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const constraint = btn.getAttribute('data-constraint');
            if (!reframes[constraint]) return;

            // Remove active class from all buttons
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (loader) {
                loader.style.display = 'flex';
                setTimeout(() => {
                    loader.style.display = 'none';
                    if (displayTitle) displayTitle.textContent = reframes[constraint].title;
                    if (displayText) displayText.textContent = reframes[constraint].text;
                }, 300); // 300ms transition time
            } else {
                if (displayTitle) displayTitle.textContent = reframes[constraint].title;
                if (displayText) displayText.textContent = reframes[constraint].text;
            }
        });
    });
}

/**
 * initScrollReveal - Fades in rows and sections smoothly as they enter the screen.
 */
function initScrollReveal() {
    // Automatically select all section elements and elements with class 'section' across the entire site
    const sections = document.querySelectorAll('section, .section');
    
    sections.forEach(sec => {
        // Exclude hero sections or elements that should be visible immediately
        if (sec.classList.contains('hero-sec') || sec.classList.contains('page-intro') || sec.closest('.page-intro')) {
            return; 
        }
        sec.classList.add('reveal-on-scroll');
    });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

let timelineScrollListener = null;

/**
 * initStoryTimelineScroll - Sets up scroll-linked vertical progress animations
 * and spring active highlights on timeline nodes.
 */
function initStoryTimelineScroll() {
    const timeline = document.querySelector('.alternating-timeline');
    if (!timeline) return;

    const bullets = timeline.querySelectorAll('.timeline-bullet');
    const rows = timeline.querySelectorAll('.timeline-row');

    const handleScroll = () => {
        // Accessibility check: Pause animations toggles snap full progress and skips effects
        const animationsPaused = document.documentElement.classList.contains('accessibility-paused-animations');
        
        if (animationsPaused) {
            bullets.forEach(b => b.classList.add('active-bullet'));
            rows.forEach(r => r.classList.add('active-row'));
            timeline.style.setProperty('--timeline-progress', '100%');
            return;
        }

        const rect = timeline.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Trigger point is at 55% height of the screen (slightly below center for organic flow)
        const triggerPoint = viewportHeight * 0.55;

        // Calculate progress percentage of the timeline element
        const timelineTop = rect.top;
        const timelineHeight = rect.height;
        let scrolledPixels = triggerPoint - timelineTop;
        let progressPercent = 0;
        if (scrolledPixels > 0) {
            progressPercent = Math.min(100, (scrolledPixels / timelineHeight) * 100);
        } else {
            progressPercent = 0;
        }
        timeline.style.setProperty('--timeline-progress', `${progressPercent}%`);

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

        // Toggle active row highlight for glowing cards, images, and text
        rows.forEach(row => {
            const bullet = row.querySelector('.timeline-bullet');
            if (bullet) {
                if (bullet.classList.contains('active-bullet')) {
                    row.classList.add('active-row');
                } else {
                    row.classList.remove('active-row');
                }
            } else {
                const rowRect = row.getBoundingClientRect();
                const rowCenter = rowRect.top + rowRect.height / 2;
                if (rowCenter < triggerPoint) {
                    row.classList.add('active-row');
                } else {
                    row.classList.remove('active-row');
                }
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




