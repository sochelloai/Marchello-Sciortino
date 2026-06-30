/**
 * Router Module - Handles client-side history routing for the SPA.
 */
const Router = {
    routes: {},
    currentPage: null,

    init() {
        // Handle browser navigation (back/forward)
        window.addEventListener('popstate', () => this.handleRouting());

        // Global link click interceptor for clean history routing
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;

            // Intercept internal routes (starting with / but not //)
            if (href.startsWith('/') && !href.startsWith('//')) {
                // Let links with target="_blank" behave normally
                if (link.target === '_blank') return;

                e.preventDefault();
                this.navigate(href);
            }
        });

        // Handle initial page load
        if (document.readyState === 'complete') {
            this.handleRouting();
        } else {
            window.addEventListener('load', () => this.handleRouting());
        }
    },

    register(route, templateFn) {
        this.routes[route] = templateFn;
    },

    navigate(route) {
        history.pushState(null, '', route);
        this.handleRouting(route);
    },

    handleRouting(route) {
        // If route is not provided, read pathname and search from location
        let currentPath = route || (window.location.pathname + window.location.search);
        
        // Split route path from query parameters
        let pathOnly = currentPath.split('?')[0];

        // Redirect /home or /index.html to /
        if (pathOnly === '/home' || pathOnly === '/index.html' || pathOnly === '') {
            pathOnly = '/';
            // Preserve query string if any
            const search = currentPath.includes('?') ? '?' + currentPath.split('?')[1] : '';
            history.replaceState(null, '', '/' + search);
        }

        if (pathOnly === '/book') {
            const search = currentPath.includes('?') ? '?' + currentPath.split('?')[1] : '';
            history.replaceState(null, '', '/' + search);
            window.open('https://www.limitationstoliberation.com/', '_blank');
            return;
        }

        // Match route or redirect to home (/)
        const templateFn = this.routes[pathOnly] || this.routes['/'];

        if (templateFn) {
            // Update current page
            this.currentPage = pathOnly === '/' ? 'home' : pathOnly.substring(1); // strip leading slash

            // Execute template builder
            const html = templateFn();

            // Ingest to app container
            const app = document.getElementById('app');
            if (app) {
                app.innerHTML = html;
            }

            // Update document title dynamically for SEO
            const titles = {
                '/': "Marchello Sciortino | Official Digital Hub",
                '/story': "My Story | Marchello Sciortino",
                '/services': "Services | Marchello Sciortino",
                '/mission': "The Mission | Marchello Sciortino",
                '/brain': "The Brain Map | Marchello Sciortino",
                '/speaking': "Speaking | Marchello Sciortino",
                '/chelloai': "ChelloAI | Marchello Sciortino",
                '/music': "AI Music Jingles | Marchello Sciortino",
                '/impact': "Impact & Reviews | Marchello Sciortino",
                '/marchellos-blog': "Marchello's Blog | Marchello Sciortino",
                '/hub': "Marchello's Blog | Marchello Sciortino",
                '/contact': "Contact | Marchello Sciortino",
                '/free-gifts': "Free Gifts | Marchello Sciortino",
                '/resources': "Resources | Marchello Sciortino",
                '/privacy': "Privacy Policy | Marchello Sciortino",
                '/terms': "Terms of Service | Marchello Sciortino",
                '/accessibility-statement': "Accessibility Statement | Marchello Sciortino"
            };
            document.title = titles[pathOnly] || "Marchello Sciortino";

            // Post-rendering actions
            this.updateNavLinks(pathOnly);
            this.resetFocus();

            // Dispatch page load event for submodules
            const event = new CustomEvent('page-loaded', { detail: { page: this.currentPage } });
            document.dispatchEvent(event);
        }
    },

    updateNavLinks(route) {
        const navLinks = document.querySelectorAll('.nav-link');
        const cleanRoute = route.split('?')[0];
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === cleanRoute || href === '#' + cleanRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    resetFocus() {
        // Reset scroll position to top
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Shift screen-reader focus to the main focus helper
        const mainFocus = document.getElementById('main-focus');
        if (mainFocus) {
            mainFocus.focus();
        }
    }
};

// ==========================================================================
// Page Templates Definitions (Using authentic voice guidelines)
// ==========================================================================

// 1. Home Page Template
Router.register('/', () => `
    <!-- Cinematic Hero -->
    <section class="hero-sec">
        <!-- Animated Grain Overlay -->
        <svg class="hero-grain" xmlns="http://www.w3.org/2000/svg">
            <filter id="grain-noise">
                <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-noise)" />
        </svg>
 
        <div class="container">
            <h1 class="hero-title">
                <span class="hero-title-line-1">LIMITATIONS DO NOT</span>
                <span class="hero-title-line-2">
                    <span class="text-teal-italic">DEFINE </span>
                    <span class="text-orange-brush">POSSIBILITY.
                        <span class="brush-underline"></span>
                    </span>
                </span>
            </h1>
            <p class="hero-tagline">
                I help people reframe daily constraints, adapt through changes, and use AI as an accessibility bridge to build creative outcomes and professional momentum.
            </p>
            <div class="hero-ctas">
                <a href="/services" class="btn btn-teal">MY SERVICES</a>
                <a href="https://www.accessibleaim.com" target="_blank" rel="noopener noreferrer" class="btn btn-outline-white">EXPLORE ACCESSIBLE AIM</a>
            </div>
        </div>
    </section>
 
    <!-- Featured In Scrolling Marquee -->
    <section class="featured-in bg-navy-dark">
        <div class="container">
            <h2 class="featured-title">As Featured In</h2>
            <div class="marquee-wrapper">
                <div class="marquee-track">
                    <div class="marquee-group">
                        <div class="marquee-item"><img src="assets/empower-1.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-2.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-3.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-4.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-5.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-6.png" alt="The Empower Network TV"></div>
                    </div>
                    <div class="marquee-group" aria-hidden="true">
                        <div class="marquee-item"><img src="assets/empower-1.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-2.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-3.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-4.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-5.png" alt="The Empower Network TV"></div>
                        <div class="marquee-item"><img src="assets/empower-6.png" alt="The Empower Network TV"></div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Impact & Reviews Section -->
    <section class="section bg-white" style="border-bottom: 1px solid var(--color-gray-border); padding: 4.5rem 0 3rem 0; overflow: hidden;">
        <div class="container">
            <div class="text-center" style="margin-bottom: var(--spacing-md);">
                <span class="section-tag">Audience & Client Reviews</span>
                <h2>Real Impact, Verified Outcomes</h2>
                <p class="section-desc" style="margin-bottom: 0;">
                    See what event planners, brand founders, and advocacy leaders say about working with Marchello.
                </p>
            </div>
        </div>
        
        <!-- Reviews Scrolling Marquee -->
        <div class="reviews-marquee-wrapper">
            <div class="reviews-marquee-track">
                <div class="reviews-marquee-group">
                    <!-- Card 1 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"A Shift in Paradigm"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "Marchello's keynote stripped away all the usual corny slogans we hear at sales rallies. His honest details about progression and practical AI execution changed how our management team views challenges."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_1.png" alt="Sarah Jenkins" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Sarah Jenkins</span>
                                <span class="reviewer-role">Event Director, Leadership Forum</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 2 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Zero Fluff, Real Proof"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "We hired Marchello to build our ClickFunnels logic. His technical design system was flawless, and knowing the limitations he works with just proved to us that he builds solid solutions."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_2.png" alt="David Chen" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">David Chen</span>
                                <span class="reviewer-role">Founder, Tech Accelerator</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 3 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Inspiring and Practical"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "As a parent of a disabled child, hearing Marchello speak gave me a realistic, non-pity roadmap. He shows that adapting is just a smarter way to execute."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_3.png" alt="Elena Rostova" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Elena Rostova</span>
                                <span class="reviewer-role">Advocate & Attendee, Advocacy Summit</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 4 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Unparalleled Strategic Focus"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "Marchello's insights on system automation enabled our marketing team to trim waste by 40%. He doesn't just talk about resilience; he builds practical systems that deliver it."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_4.png" alt="Amanda Cross" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Amanda Cross</span>
                                <span class="reviewer-role">VP of Operations, Retail Syndicate</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 5 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"A True Catalyst for Action"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "We brought Marchello in for our midyear kickoff. His presentation style is highly engaging, fully technical, and deeply grounding. Our audience was motivated and equipped."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_5.png" alt="Marcus Thorne" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Marcus Thorne</span>
                                <span class="reviewer-role">Executive Director, Global Sales Summit</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 6 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Flawless Integration Logic"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "The funnel architecture Marchello designed has run uninterrupted for six months, converting at double our previous benchmark. His systematic handling of constraints is masterclass."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_6.png" alt="Robert Vance" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Robert Vance</span>
                                <span class="reviewer-role">Chief Growth Officer, Apex Scaling</span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Duplicate group for infinite loop scroll -->
                <div class="reviews-marquee-group" aria-hidden="true">
                    <!-- Card 1 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"A Shift in Paradigm"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "Marchello's keynote stripped away all the usual corny slogans we hear at sales rallies. His honest details about progression and practical AI execution changed how our management team views challenges."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_1.png" alt="Sarah Jenkins" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Sarah Jenkins</span>
                                <span class="reviewer-role">Event Director, Leadership Forum</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 2 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Zero Fluff, Real Proof"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "We hired Marchello to build our ClickFunnels logic. His technical design system was flawless, and knowing the limitations he works with just proved to us that he builds solid solutions."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_2.png" alt="David Chen" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">David Chen</span>
                                <span class="reviewer-role">Founder, Tech Accelerator</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 3 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Inspiring and Practical"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "As a parent of a disabled child, hearing Marchello speak gave me a realistic, non-pity roadmap. He shows that adapting is just a smarter way to execute."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_3.png" alt="Elena Rostova" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Elena Rostova</span>
                                <span class="reviewer-role">Advocate & Attendee, Advocacy Summit</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 4 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Unparalleled Strategic Focus"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "Marchello's insights on system automation enabled our marketing team to trim waste by 40%. He doesn't just talk about resilience; he builds practical systems that deliver it."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_4.png" alt="Amanda Cross" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Amanda Cross</span>
                                <span class="reviewer-role">VP of Operations, Retail Syndicate</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 5 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"A True Catalyst for Action"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "We brought Marchello in for our midyear kickoff. His presentation style is highly engaging, fully technical, and deeply grounding. Our audience was motivated and equipped."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_5.png" alt="Marcus Thorne" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Marcus Thorne</span>
                                <span class="reviewer-role">Executive Director, Global Sales Summit</span>
                            </div>
                        </div>
                    </div>
                    <!-- Card 6 -->
                    <div class="reviews-marquee-card">
                        <div>
                            <span class="text-gold" style="font-size: 1.2rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                            <h4 style="margin-top: 8px; margin-bottom: 8px; font-size:1.15rem; font-family: var(--font-heading); color: var(--color-navy);">"Flawless Integration Logic"</h4>
                            <p style="font-style: italic; font-size: 0.92rem; line-height: 1.5; color: var(--color-navy); margin-bottom: 0;">
                                "The funnel architecture Marchello designed has run uninterrupted for six months, converting at double our previous benchmark. His systematic handling of constraints is masterclass."
                            </p>
                        </div>
                        <div class="reviewer-profile">
                            <img src="assets/reviews/reviewer_6.png" alt="Robert Vance" class="reviewer-avatar">
                            <div class="reviewer-info">
                                <span class="reviewer-name">Robert Vance</span>
                                <span class="reviewer-role">Chief Growth Officer, Apex Scaling</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
 
    <!-- The Reality Section -->
    <section class="section bg-white">
        <div class="container text-center">
            <span class="section-tag">The Daily Framework</span>
            <h2>Working Within Reality</h2>
            <p class="section-desc">
                Living with Friedrich’s ataxia (a progressive neuromuscular condition) means my physical boundaries change often. I focus on adapting my systems so I can keep building.
            </p>
            
            <div class="alternating-timeline">
                <!-- Row 1: Card on Left, Line in Center, Image on Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">Losing Mobility</div>
                        <div class="timeline-card">
                            <p>At 14, I was diagnosed with Friedreich's Ataxia, a progressive neuromuscular disease. Over time, I lost my balance, strength, coordination, and eventually my ability to walk, becoming a full-time manual wheelchair user, forever changing my life.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-1.png" alt="Losing Mobility and adapting" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Blank Spacer Row with Headline -->
                <div class="timeline-row timeline-spacer-row" style="height: auto; justify-content: center; position: relative; z-index: 2; margin-top: 50px; margin-bottom: 50px;">
                    <div style="background: var(--color-white); padding: 15px 30px; z-index: 3; position: relative;">
                        <h3 style="font-family: var(--font-heading); font-size: clamp(1.4rem, 3vw, 2.2rem); font-weight: 800; color: var(--color-navy); margin: 0; text-align: center; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.03em;">
                            Many shifts in <span class="text-orange-brush" style="font-size: inherit;">perspective<span class="brush-underline"></span></span> had to happen...
                        </h3>
                    </div>
                </div>
                
                <!-- Row 2: Image on Left, Line in Center, Card on Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-2.png" alt="Refusing Defeat and digital creation" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Warrior Story</div>
                        <div class="timeline-card">
                            <p>Everything changed when I shifted my perspective from what I had lost to what I could still create. That mindset revealed purpose, strengthened my faith, unlocked opportunities, and transformed how I live, lead, serve, every day.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
 
    <!-- Articulated Inspiration Section -->
    <section class="section bg-navy-light text-white" style="border-bottom: 1px solid rgba(0, 209, 193, 0.1); padding: 4.5rem 0;">
        <div class="container">
            <div class="text-center" style="margin-bottom: var(--spacing-lg);">
                <span class="section-tag text-teal" style="display: block; margin-bottom: var(--spacing-xs);">A New Way to See AI</span>
                <h2 class="text-white" style="margin-bottom: var(--spacing-md);">Articulated Inspiration</h2>
            </div>
            
            <div class="grid-2" style="align-items: center; gap: var(--spacing-lg);">
                
                <!-- Left Column: Text -->
                <div>
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-light); margin-bottom: var(--spacing-md);">
                        Articulated Inspiration is the moving joint between thought and expression. It is the process of bringing the ideas and creativity already present within us into active, functional reality.
                    </p>
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-light); margin-bottom: var(--spacing-lg);">
                        This philosophy serves as the foundation of the <strong>Accessible AIM</strong> (Articulated Inspiration Method). Through this framework, I treat artificial intelligence as a helper for human capability, acting as that moving joint so we can translate our concepts into active projects.
                    </p>
                    <div style="border-top: 1px solid rgba(0, 209, 193, 0.15); padding-top: var(--spacing-md); display: flex; align-items: flex-start; gap: 15px;">
                        <span style="font-size: 1.6rem; color: var(--color-teal); line-height: 1;">💡</span>
                        <div>
                            <strong style="color: var(--color-teal); display: block; margin-bottom: 6px; font-size: 1rem; letter-spacing: 0.05em;">THE METHOD IN ACTION:</strong>
                            <span style="font-size: 1rem; color: var(--color-gray-steel); line-height: 1.5; display: block;">
                                When physical coordination makes typing a struggle, I use custom prompt setups to act as the moving joint—turning a spoken draft into a clean, functional webpage.
                            </span>
                        </div>
                    </div>
                </div>


                <!-- Right Column: Visual Representation -->
                <div style="text-align: center;">
                    <img src="assets/articulated_inspiration.jpg" alt="Articulated Inspiration visualization" class="articulated-img">
                </div>

            </div>
        </div>
    </section>

 
    <!-- Key previews grid -->
    <section class="section bg-white">
        <div class="container">
            <h2 class="text-center" style="margin-bottom: var(--spacing-lg);">The Brand Ecosystem</h2>
            <div class="grid-3">
                <div class="card">
                    <span class="section-tag">Keynotes</span>
                    <h3 class="card-title">Keynote Speaking</h3>
                    <p>Delivering practical, no-fluff perspectives on resilience and adaptation for motivational, educational, and faith-driven events.</p>
                    <a href="/speaking" class="text-teal">Speaking Details &rarr;</a>
                </div>
                <div class="card">
                    <span class="section-tag">Literature</span>
                    <h3 class="card-title">Limitations to Liberation</h3>
                    <p>My new book about reframing constraints, finding your competitive advantage to thrive, and turning them into a message.</p>
                    <a href="https://www.limitationstoliberation.com/" target="_blank" rel="noopener noreferrer" class="text-teal">"Limitations to Liberation" book &rarr;</a>
                </div>
                <div class="card">
                    <span class="section-tag">Technology</span>
                    <h3 class="card-title">Accessible AIM</h3>
                    <p>A mission to help individuals with physical challenges discover how AI can act as a bridge for creation and communication.</p>
                    <a href="https://www.accessibleaim.com" target="_blank" rel="noopener noreferrer" class="text-teal">Join AIM Waitlist &rarr;</a>
                </div>
            </div>
        </div>
    </section>
 
    <!-- Book Promotion Section -->
    <section class="book-promo-sec">
        <div style="flex-grow: 1; display: flex; align-items: center; width: 100%; padding-top: 3rem;">
            <div class="container">
                <div class="grid-2">
                    <div class="book-promo-content">
                        <span class="section-tag text-teal">New Book Release</span>
                        <h2 class="book-promo-headline">LIMITATIONS TO LIBERATION</h2>
                        <p class="book-promo-subheadline">Learn the mental models and daily systems to build freedom from limitation and write your own story.</p>
                        <div style="margin-top: var(--spacing-sm);">
                            <a href="https://www.limitationstoliberation.com/" target="_blank" rel="noopener noreferrer" class="btn-cta-orange">Get The Book <span class="arrow">&rarr;</span></a>
                        </div>
                    </div>
                    <div class="book-promo-empty-col">
                        <!-- Right column is empty to showcase the background image -->
                    </div>
                </div>
            </div>
        </div>
        <div class="book-promo-footer-row text-center" style="width: 100%; padding-bottom: 3rem; position: relative; z-index: 2;">
            <div class="container">
                <h2 class="legacy-title">Much love, party people!<br>That was awesome. The next one will only be better!</h2>
            </div>
        </div>
    </section>
`);

// 2. Story Page Template
Router.register('/story', () => `
    <div class="page-intro" style="position: relative; overflow: hidden;">
        <!-- Curved background gold lines using inline SVG -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        
        <div class="container text-center" style="position: relative; z-index: 2;">
            <span class="section-tag text-teal">Timeline</span>
            <h1 style="color: white;">My Journey</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                An honest look at my timeline, the progressive challenges, and how I choose to keep building.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container text-center">
            <div class="alternating-timeline" style="margin-top: 0;">
                <!-- Row 1: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">1996 - Childhood & Early Years</div>
                        <div class="timeline-card">
                            <p>Born in St. Louis, Missouri. I had a fantastic childhood filled with comfort and stability provided by my loving parents, David and Alicia. Early on, I was a quiet, shy kid who stayed clear of sports after choking up at a t-ball game, preferring to play and observe.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-1.png" alt="Born in St. Louis and childhood years" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Row 2: Image Left, Card Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-2.png" alt="Noticing progressive balance challenges in gym class" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Around 3rd & 4th Grade</div>
                        <div class="timeline-card">
                            <p>I began noticing shortness of breath and a rapid heartbeat during gym class. Soon, my balance slipped. I couldn't keep up or walk in a straight line. Other kids started asking why I walked that way, and I had no answers.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 3: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">The Diagnosis at 14</div>
                        <div class="timeline-card">
                            <p>After years of tests, we received the laboratory diagnosis: Friedrich's ataxia. This progressive condition affects coordination, energy, and fine motor skills. It was clear confirmation that my physical abilities would change over time.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-3.png" alt="Medical diagnosis of Friedrich's ataxia at age 14" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Row 4: Image Left, Card Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-4.png" alt="Transition to wheelchair and adapting daily routines" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Progression & Independence Shift</div>
                        <div class="timeline-card">
                            <p>High school and college required constant adjustments as I transitioned to a wheelchair. Simple things like getting out of bed or opening a soda required my parents' help. The hardest part was the mental fatigue of feeling like an energy-draining mooch, but I chose to focus on what I could still control.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 5: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">Discovering Digital Marketing & AI</div>
                        <div class="timeline-card">
                            <p>Since physical work was out of the question, I focused on digital skills. I got ClickFunnels certified and built websites for business partners. When typing became a nightmare, I turned to AI. It acted as my typing speed, helping me write code and design pages.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-5.png" alt="Using AI and digital marketing as creative tools" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Row 6: Image Left, Card Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-6.png" alt="Keynote speaking on resilience and adaptive legacy" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Today - Writing the Legacy</div>
                        <div class="timeline-card">
                            <p>My physical challenges change, but my goal stays the same. I build websites, write, and speak to show that limits are parameters we can design around.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
`);

Router.register('/services', () => `
    <div class="services-header" style="position: relative; padding: 7.5rem 0 5rem 0; text-align: center; overflow: hidden; background: var(--color-navy); border-bottom: 2px solid var(--color-teal);">
        <!-- Curved background gold lines using inline SVG -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        
        <div class="container" style="position: relative; z-index: 2;">
            <span class="section-tag" style="color: var(--color-teal); font-size: 0.85rem; letter-spacing: 0.15em; font-weight: 600; margin-bottom: var(--spacing-sm);">SOLUTIONS THAT CREATE IMPACT</span>
            <h1 style="color: white; font-family: var(--font-heading); font-size: clamp(2.2rem, 5vw, 3.25rem); font-weight: 800; letter-spacing: 0.02em; margin-bottom: 15px; text-transform: uppercase;">
                WHAT <span style="color: var(--color-teal);">MARCHELLO</span> DOES
            </h1>
            <div style="width: 60px; height: 2px; background: var(--color-teal); margin: 0 auto var(--spacing-md) auto;"></div>
            <p style="color: var(--color-gray-light); font-size: 1.15rem; font-weight: 400; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                Three powerful ways we help you create, build, and overcome.
            </p>
        </div>
    </div>

    <!-- Accordion Section: CREATE, BUILD, OVERCOME -->
    <section class="services-accordion-section">
        <div class="container">
            <div class="services-accordion" role="tablist" aria-label="Our Services">
                
                <!-- Panel 1: CREATE -->
                <div class="accordion-panel active" data-panel="create" tabindex="0" role="tab" aria-expanded="true" aria-label="01 CREATE, currently expanded">
                    <div class="panel-trigger">
                        <span class="panel-num">01</span>
                        <h3 class="panel-vertical-title">CREATE</h3>
                    </div>
                    <div class="panel-content" id="panel-content-create" role="tabpanel">
                        <div class="panel-content-inner">
                            <div class="panel-text-side">
                                <span class="panel-subtitle">AI-Powered Creative Strategy</span>
                                <h2 class="panel-title">CREATE</h2>
                                <p class="panel-desc">
                                    I use generative AI systems to build customized visual and written creative outputs. Whether you need audio loops, copy packages, or digital graphics, I construct systems that turn raw ideas into active assets.
                                </p>
                                <ul class="panel-bullets">
                                    <li>
                                        <span class="bullet-emoji">💡</span>
                                        <div>
                                            <h4>Custom Images & Video</h4>
                                            <p>Generating custom graphics, promotional videos, and interactive visual content with AI models.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🎵</span>
                                        <div>
                                            <h4>Songs & Brand Jingles</h4>
                                            <p>Crafting distinct background tunes, melodies, and custom jingles to enrich your message.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">✍️</span>
                                        <div>
                                            <h4>Assisted Writing & Copy</h4>
                                            <p>Writing books, storytelling, and copy scripting using structured AI prompts and voice-dictated editing.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🧠</span>
                                        <div>
                                            <h4>Creative AI Consulting</h4>
                                            <p>Consulting on customized prompt setups and configurations to simplify your daily writing workflow.</p>
                                        </div>
                                    </li>
                                </ul>
                                <div class="panel-cta">
                                    <a href="/contact?interest=Create" class="btn btn-teal">CONTACT ME</a>
                                </div>
                            </div>
                            <div class="panel-visual-side">
                                <img src="assets/ai-content-creation.jpg" alt="AI Content Creation" class="panel-main-img">
                            </div>
                        </div>
                        
                        <!-- Panel Portfolio: CREATE -->
                        <div class="panel-portfolio">
                            <h4 class="portfolio-section-title">CREATE PORTFOLIO</h4>
                            <div class="portfolio-grid">
                                <div class="portfolio-card" data-type="video" data-src="assets/videos/W.mp4" aria-label="Play AI Promo Video" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/ai_content.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Video</span>
                                        <h4 class="portfolio-title">AI Promo Video</h4>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="audio" data-id="create-audio-1" aria-label="Play Brand Jingle Audio" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/articulated_inspiration.jpg');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Audio</span>
                                        <h4 class="portfolio-title">Commercial Jingle</h4>
                                        <div class="portfolio-wave">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="song" data-id="create-song-2" aria-label="Play Chosen Anyway" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/chosen-anyway.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Song</span>
                                        <h4 class="portfolio-title">Chosen Anyway</h4>
                                        <div class="portfolio-wave">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="image" data-src="assets/ai_content.png" aria-label="View Brand Graphics Mockup" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/ai_content.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Image</span>
                                        <h4 class="portfolio-title">Brand Graphics</h4>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="image" data-src="assets/book_cover_mockup.png" aria-label="View Book Cover Mockup" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/book_cover_mockup.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Image</span>
                                        <h4 class="portfolio-title">Book Cover Mockup</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel 2: BUILD -->
                <div class="accordion-panel" data-panel="build" tabindex="0" role="tab" aria-expanded="false" aria-label="02 BUILD, click to expand">
                    <div class="panel-trigger">
                        <span class="panel-num">02</span>
                        <h3 class="panel-vertical-title">BUILD</h3>
                    </div>
                    <div class="panel-content" id="panel-content-build" role="tabpanel">
                        <div class="panel-content-inner">
                            <div class="panel-text-side">
                                <span class="panel-subtitle">Websites & Digital Ecosystems</span>
                                <h2 class="panel-title">BUILD</h2>
                                <p class="panel-desc">
                                    I construct modern web architectures, landing pages, and lead workflows. Using AI-assisted programming tools, I design responsive templates that connect with visitors and support clean automation pipelines.
                                </p>
                                <ul class="panel-bullets">
                                    <li>
                                        <span class="bullet-emoji">💻</span>
                                        <div>
                                            <h4>Web Development</h4>
                                            <p>Designing and deploying modern web portals, clean layouts, and functional portfolios.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🚀</span>
                                        <div>
                                            <h4>Funnels & Landing Pages</h4>
                                            <p>Building structured multi-page pathways and lead captures that turn clicks into active queries.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">⚙️</span>
                                        <div>
                                            <h4>Workflow Automation</h4>
                                            <p>Connecting tools and automating administrative tasks using AI to save valuable hours.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🔒</span>
                                        <div>
                                            <h4>Membership Platforms</h4>
                                            <p>Setting up membership vaults, lesson portals, and automated digital course areas.</p>
                                        </div>
                                    </li>
                                </ul>
                                <div class="panel-cta">
                                    <a href="/contact?interest=Build" class="btn btn-teal">CONTACT ME</a>
                                </div>
                            </div>
                            <div class="panel-visual-side">
                                <img src="assets/funnel_building.png" alt="Websites & Funnels Building" class="panel-main-img">
                            </div>
                        </div>
                        
                        <!-- Panel Portfolio: BUILD -->
                        <div class="panel-portfolio">
                            <h4 class="portfolio-section-title">BUILD PORTFOLIO</h4>
                            <div class="portfolio-grid">
                                <div class="portfolio-card" data-type="image" data-src="assets/funnel_building.png" aria-label="View Client Portal Design Mockup" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/funnel_building.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Image</span>
                                        <h4 class="portfolio-title">Client Portal Design</h4>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="video" data-src="assets/videos/I.mp4" aria-label="Play Platform Logic Video" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/accessible_ai.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Video</span>
                                        <h4 class="portfolio-title">Platform Logic Demo</h4>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="audio" data-id="build-audio-3" aria-label="Play Automation Pulse Audio" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/articulated_inspiration.jpg');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Audio</span>
                                        <h4 class="portfolio-title">Automation Pulse</h4>
                                        <div class="portfolio-wave">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="song" data-id="build-song-4" aria-label="Play Cybernetic Rhythm Song" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/hero-bg.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Song</span>
                                        <h4 class="portfolio-title">Cybernetic Rhythm</h4>
                                        <div class="portfolio-wave">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="image" data-src="assets/accessible_ai.png" aria-label="View Workflow Diagram Preview" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/accessible_ai.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Image</span>
                                        <h4 class="portfolio-title">Workflow Schema</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Panel 3: OVERCOME -->
                <div class="accordion-panel" data-panel="overcome" tabindex="0" role="tab" aria-expanded="false" aria-label="03 OVERCOME, click to expand">
                    <div class="panel-trigger">
                        <span class="panel-num">03</span>
                        <h3 class="panel-vertical-title">OVERCOME</h3>
                    </div>
                    <div class="panel-content" id="panel-content-overcome" role="tabpanel">
                        <div class="panel-content-inner">
                            <div class="panel-text-side">
                                <span class="panel-subtitle">Resilience & Mindset Coaching</span>
                                <h2 class="panel-title">OVERCOME</h2>
                                <p class="panel-desc">
                                    I work directly with individuals to shift their perspective and reframe their limitations. Through mindset coaching and constraint-based problem solving, we establish customized habits to convert physical or mental barriers into growth pathways.
                                </p>
                                <ul class="panel-bullets">
                                    <li>
                                        <span class="bullet-emoji">🌱</span>
                                        <div>
                                            <h4>Personal Growth</h4>
                                            <p>Developing actionable goals and personal strategies to build consistent creative momentum.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🧩</span>
                                        <div>
                                            <h4>Constraint-Based Strategy</h4>
                                            <p>Reframing physical limitations or tight boundaries as structured design constraints for creation.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🗣️</span>
                                        <div>
                                            <h4>Speaking & Workshops</h4>
                                            <p>Hosting presentations and active workshops showing the intersection of resilience and AI capability.</p>
                                        </div>
                                    </li>
                                    <li>
                                        <span class="bullet-emoji">🤝</span>
                                        <div>
                                            <h4>Adaptability Consulting</h4>
                                            <p>Setting up customized voice commands, adaptive workspaces, and productivity hacks.</p>
                                        </div>
                                    </li>
                                </ul>
                                <div class="panel-cta">
                                    <a href="/contact?interest=Overcome" class="btn btn-teal">CONTACT ME</a>
                                </div>
                            </div>
                            <div class="panel-visual-side">
                                <img src="assets/ring_anyway_coaching.png" alt="Resilience Mindset & Coaching" class="panel-main-img">
                            </div>
                        </div>
                        
                        <!-- Panel Portfolio: OVERCOME -->
                        <div class="panel-portfolio">
                            <h4 class="portfolio-section-title">OVERCOME PORTFOLIO</h4>
                            <div class="portfolio-grid">
                                <div class="portfolio-card" data-type="video" data-src="assets/videos/N.mp4" aria-label="Play Keynote Snippet Video" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/timeline-6.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Video</span>
                                        <h4 class="portfolio-title">Keynote Speech Snippet</h4>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="audio" data-id="overcome-audio-5" aria-label="Play Resilience Mindset Audio" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/speaker_1_sheet.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Audio</span>
                                        <h4 class="portfolio-title">Mindset Quote</h4>
                                        <div class="portfolio-wave">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="song" data-id="overcome-song-6" aria-label="Play Adaptive Path Song" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/timeline-2.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Song</span>
                                        <h4 class="portfolio-title">Adaptive Path Song</h4>
                                        <div class="portfolio-wave">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="image" data-src="assets/speaker_1_sheet.png" aria-label="View Keynote Speaker One-Sheet PDF Mockup" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/speaker_1_sheet.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Image</span>
                                        <h4 class="portfolio-title">Keynote One-Sheet</h4>
                                    </div>
                                </div>
                                <div class="portfolio-card" data-type="image" data-src="assets/ring_anyway_coaching.png" aria-label="View Coaching Success Blueprint Design" role="button" tabindex="0">
                                    <div class="portfolio-card-bg" style="background-image: url('assets/ring_anyway_coaching.png');"></div>
                                    <div class="portfolio-card-overlay"></div>
                                    <div class="portfolio-card-icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                    </div>
                                    <div class="portfolio-card-content">
                                        <span class="portfolio-badge">Image</span>
                                        <h4 class="portfolio-title">Coaching Blueprint</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Bottom Logo/M-Divider -->
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 80px; margin-bottom: 25px;">
                <div style="flex: 1; max-width: 280px; height: 1.5px; background: var(--color-gray-border);"></div>
                <img src="assets/logo-dark.png" alt="M logo" style="height: 25px; width: auto; border-radius: 0; opacity: 0.85;">
                <div style="flex: 1; max-width: 280px; height: 1.5px; background: var(--color-gray-border);"></div>
            </div>

            <!-- Bottom Branding Text -->
            <div class="text-center">
                <h4 style="font-family: var(--font-heading); color: var(--color-navy); font-size: 1.05rem; font-weight: 800; letter-spacing: 0.18em; margin-bottom: 8px; text-transform: uppercase;">
                    CREATIVITY. TECHNOLOGY. DETERMINATION.
                </h4>
                <p style="color: var(--color-teal); font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; letter-spacing: 0.08em; margin-bottom: 0; text-transform: uppercase;">
                     UNLOCKING POSSIBILITIES. DELIVERING RESULTS.
                </p>
            </div>

        </div>
    </section>
`);

// 3. Mission Page Template
Router.register('/mission', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Purpose</span>
            <h1 style="color: white;">The Mission</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Why this hub exists, what I believe, and how we change our relationship with limitation.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2" style="margin-bottom: var(--spacing-lg);">
                <div>
                    <h2>Rejecting the Default Limit</h2>
                    <p>
                        We frame disability around capability. You do not need a perfect body to build a website, write copy, or help others. I focus on producing solid digital work with the physical coordination I have left.
                    </p>
                </div>
                <div class="graphic-panel bg-navy text-white" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: var(--spacing-lg); border-radius: var(--radius-md); position: relative; overflow: hidden; border: 1px solid rgba(10, 216, 173, 0.15); min-height: 280px;">
                    <div class="graphic-flare" style="position: absolute; width: 150px; height: 150px; background: var(--color-teal); filter: blur(70px); opacity: 0.15; top: 20%; left: 20%;"></div>
                    <div class="graphic-flare" style="position: absolute; width: 120px; height: 120px; background: var(--color-gold); filter: blur(60px); opacity: 0.12; bottom: 20%; right: 20%;"></div>
                    <span style="font-family: 'Permanent Marker', sans-serif; font-size: 2.2rem; color: var(--color-teal); transform: rotate(-5deg); margin-bottom: 10px; z-index: 2;">No Excuses.</span>
                    <p class="text-center" style="font-size: 0.95rem; color: var(--color-gray-steel); max-width: 280px; text-align: center; margin: 0; line-height: 1.5; z-index: 2;">
                        "Focus on what can be created within your constraints."
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Dynamic W.I.N. Framework Section -->
    <section class="win-scroll-trigger-section" style="position: relative; height: 300vh; background-color: var(--color-navy); border-top: 1px solid rgba(10, 216, 173, 0.1); border-bottom: 1px solid rgba(10, 216, 173, 0.1);">
        
        <!-- Sticky inner container: height 100vh -->
        <div class="win-sticky-container" style="position: sticky; top: 0; height: 100vh; height: 100dvh; display: flex; align-items: center; justify-content: center; overflow: hidden; width: 100%;">
            
            <div class="container win-two-col-container">
                
                <!-- Left Sticky Column -->
                <div class="win-left-sticky-col">
                    <span class="section-tag text-teal" style="display: block; margin-bottom: 10px;">Framework</span>
                    <h2 style="color: white; margin-bottom: var(--spacing-md); font-size: clamp(2rem, 3.5vw, 3rem); font-family: var(--font-heading); font-weight: 800; text-align: left;">The W.I.N. Framework</h2>
                    <p style="color: var(--color-gray-light); line-height: 1.6; font-size: 1.05rem; margin-bottom: 40px; text-align: left; max-width: 360px;">
                        A daily system to reframe limitations as parameters, focus on high-value digital execution, and automate consistent progress.
                    </p>
                    
                    <!-- Vertical Scroll Indicator Dot Matrix -->
                    <div class="win-scroll-indicator-inline" aria-hidden="true">
                        <div class="win-indicator-track">
                            <div class="win-indicator-progress"></div>
                        </div>
                        <button class="win-indicator-step active-step" data-step="0" aria-label="Warrior Story">
                            <span class="step-dot"></span>
                            <span class="step-label">W: Warrior Story</span>
                        </button>
                        <button class="win-indicator-step" data-step="1" aria-label="Inspiring Impact">
                            <span class="step-dot"></span>
                            <span class="step-label">I: Inspiring Impact</span>
                        </button>
                        <button class="win-indicator-step" data-step="2" aria-label="Nurturing Outcomes">
                            <span class="step-dot"></span>
                            <span class="step-label">N: Nurturing Outcomes</span>
                        </button>
                    </div>
                </div>

                <!-- Right Viewport Wrapper (Frame for vertical slider) -->
                <div class="win-right-viewport">
                    
                    <!-- Sliding cards track -->
                    <div class="win-right-scroll-col">
                        
                        <!-- Card 1: Warrior Story -->
                        <div class="win-card-wrapper" data-card="W" tabindex="0" aria-label="Warrior Story: Acknowledge your constraints. Detail: Acknowledge your limitations fully as design parameters rather than roadblocks.">
                            <div class="win-card-tilt">
                                <div class="win-card">
                                    <div class="win-card-content">
                                        <span class="win-badge">Phase W</span>
                                        <span class="win-letter">W</span>
                                        <h3 class="win-card-title">Warrior Story</h3>
                                        <p class="win-card-teaser">Acknowledge your constraints.</p>
                                        <div class="win-divider"></div>
                                        <p class="win-card-description">Acknowledge your limitations fully as design parameters rather than roadblocks. Accept your reality today, map out your boundary conditions, and design a strategic path around them. By shifting from pity to parameter-based execution, we redirect our focus toward what can actually be built.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card 2: Inspiring Impact -->
                        <div class="win-card-wrapper" data-card="I" tabindex="0" aria-label="Inspiring Impact: Focus on high-value execution. Detail: Identify the highest-value digital outcomes you can produce within your coordinates.">
                            <div class="win-card-tilt">
                                <div class="win-card">
                                    <div class="win-card-content">
                                        <span class="win-badge">Phase I</span>
                                        <span class="win-letter">I</span>
                                        <h3 class="win-card-title">Inspiring Impact</h3>
                                        <p class="win-card-teaser">Focus on high-value execution.</p>
                                        <div class="win-divider"></div>
                                        <p class="win-card-description">Identify the highest-value digital outcomes you can produce within your coordinates. Do not waste energy on busywork. Focus on producing high-impact assets—like custom web design, logic-driven systems, or copy—that prove what is possible when constraint meets deliberate creativity.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card 3: Nurturing Outcomes -->
                        <div class="win-card-wrapper" data-card="N" tabindex="0" aria-label="Nurturing Outcomes: Build steady daily progress. Detail: Establish consistent systems to protect your energy while maintaining progress.">
                            <div class="win-card-tilt">
                                <div class="win-card">
                                    <div class="win-card-content">
                                        <span class="win-badge">Phase N</span>
                                        <span class="win-letter">N</span>
                                        <h3 class="win-card-title">Nurturing Outcomes</h3>
                                        <p class="win-card-teaser">Build steady daily progress.</p>
                                        <div class="win-divider"></div>
                                        <p class="win-card-description">Establish consistent systems to protect your energy while maintaining progress. Integrate modern AI tools, voice-to-text transcription, and automated workflows to handle the repetitive, manual tasks. Nurture your projects through slow, daily increments—making sure every ounce of coordination you expend goes directly to high-value creation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    </section>

    <section class="section bg-white">
        <div class="container">
            <div class="grid-3">
                <div class="card">
                    <h3>Constraint-Based Thinking</h3>
                    <p>In web design, constraints like screen size make us build simpler pages. In life, boundaries help us filter out noise and focus on what we can write or design today.</p>
                </div>
                <div class="card">
                    <h3>AI as a Human Bridge</h3>
                    <p>I treat AI as a helper for human capability. For anyone with motor blocks, AI acts as a physical assistant that types and formats copy based on spoken instructions.</p>
                </div>
                <div class="card">
                    <h3>Serve First, Sell Last</h3>
                    <p>I value real connections and sharing helpful resources. This hub acts as a blueprint you can adapt for your own projects.</p>
                </div>
            </div>
        </div>
    </section>
`);

// 4. The Brain Page Template
Router.register('/brain', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Interactive Map</span>
            <h1 style="color: white;">The Brain Map</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                The most powerful resource I have left is how I think. Click the nodes below to explore the mental models, lessons, and milestones that drive my daily life.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="brain-map-wrapper">
                <div class="brain-map-container" id="brain-map-container">
                    <!-- JavaScript will dynamically inject the SVG neural map here -->
                </div>
            </div>
            
            <!-- Screen-Reader & Keyboard backup list -->
            <div class="brain-accessibility-list">
                <h4>Screen Reader & Keyboard Directory</h4>
                <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: var(--spacing-sm);">
                    Select any of the topics below to view Marchello's notes, rules, and reflections.
                </p>
                <div class="brain-list-grid" id="brain-list-grid">
                    <!-- JavaScript will dynamically render buttons here -->
                </div>
            </div>
        </div>
    </section>
`);

// 5. Speaking Page Template
Router.register('/speaking', () => `
    <div class="page-intro" style="position: relative; overflow: hidden;">
        <!-- Curved background gold lines using inline SVG -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        
        <div class="container text-center" style="position: relative; z-index: 2;">
            <span class="section-tag text-teal">Keynotes</span>
            <h1 style="color: white;">Speaking & Keynotes</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                An honest, practical talk about adapting to change for leadership and advocacy events.
            </p>
        </div>
    </div>
    
    <!-- Section 1: Keynote Video & Booking Inquiry -->
    <section class="section bg-white">
        <div class="container">
            <div class="grid-7-3">
                <!-- Left Column (70%): Keynote Video -->
                <div>
                    <h3 style="text-align: center; margin-bottom: 15px; color: var(--color-navy); font-family: var(--font-heading); font-weight: 700; font-size: 2.2rem;">A quick message from Marchello</h3>
                    <div class="video-container" style="position: relative; border-radius: var(--radius-md); overflow: hidden; box-shadow: var(--shadow-lg); border: 1px solid rgba(10, 216, 173, 0.2); background: var(--color-navy-dark); line-height: 0; aspect-ratio: 16 / 9;">
                        <video controls style="width: 100%; height: 100%; display: block; object-fit: cover; border-radius: var(--radius-md);" poster="assets/hero-bg.jpg">
                            <source src="assets/videos/W.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <p style="font-size: 0.98rem; line-height: 1.6; color: var(--color-gray-steel); margin-top: 20px; font-style: italic; background: rgba(10, 216, 173, 0.05); padding: 15px 20px; border-left: 4px solid var(--color-teal); border-radius: 0 var(--radius-md) var(--radius-md) 0;">
                        <strong>A note on my delivery:</strong> My approach to presentations is unique, which is by design. Due to my mobility and energy levels, I utilize assistance for longer speaking engagements. Although my delivery can sound weary at times, I am fully engaged. I have found this approach fosters greater attention and understanding from audiences, allowing us to connect more deeply.
                    </p>
                </div>
                
                <!-- Right Column (30%): Speaking Inquiry Form -->
                <div class="card" style="margin: 0;">
                    <h3>Book a Speaking Event</h3>
                    <p style="font-size: 0.9rem; margin-bottom: 15px;">Fill out this form to inquire about speaking availability.</p>
                    <form id="speaking-inquiry-form" class="speaking-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="speaking-name">Name: <span class="contact-asterisk">*</span></label>
                                <input type="text" id="speaking-name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="speaking-email">Email: <span class="contact-asterisk">*</span></label>
                                <input type="email" id="speaking-email" class="form-control" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="event-name">Event Name: <span class="contact-asterisk">*</span></label>
                            <input type="text" id="event-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="event-location">Location / Virtual: <span class="contact-asterisk">*</span></label>
                            <input type="text" id="event-location" placeholder="e.g. St. Louis, MO or Zoom" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="speaking-message">Message: <span class="contact-asterisk">*</span></label>
                            <textarea id="speaking-message" class="form-control" placeholder="Provide any details about the speaking request..." required></textarea>
                        </div>
                        <button type="submit" class="btn btn-teal" style="width: 100%;">Submit Speaking Inquiry</button>
                    </form>
                </div>
            </div>

            <!-- Speaking Page Portfolio -->
            <div class="services-portfolio-section">
                <div class="portfolio-title-wrapper text-center">
                    <span class="section-tag text-teal" style="font-size: 0.8rem; letter-spacing: 0.1em; display: inline-block; margin-bottom: 8px;">SPEAKING PORTFOLIO</span>
                    <h3 style="font-family: var(--font-heading); font-size: 1.6rem; color: var(--color-navy); font-weight: 800; margin: 0; text-transform: uppercase;">Featured Speaking Materials</h3>
                </div>
                <div class="portfolio-grid">
                    <!-- Item 1: Video -->
                    <div class="portfolio-card" data-type="video" data-src="assets/videos/N.mp4" aria-label="Play Keynote Snippet Video" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('assets/timeline-6.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Video</span>
                            <h4 class="portfolio-title">Keynote Speech Snippet</h4>
                        </div>
                    </div>
                    <!-- Item 2: Audio -->
                    <div class="portfolio-card" data-type="audio" data-id="overcome-audio-5" aria-label="Play Resilience Mindset Audio" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('assets/speaker_1_sheet.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Audio</span>
                            <h4 class="portfolio-title">Resilience Mic Test</h4>
                            <div class="portfolio-wave">
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                            </div>
                        </div>
                    </div>
                    <!-- Item 3: Song -->
                    <div class="portfolio-card" data-type="song" data-id="overcome-song-6" aria-label="Play Keynote Walk-on Song" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('assets/timeline-2.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Song</span>
                            <h4 class="portfolio-title">Keynote Walk-on Music</h4>
                            <div class="portfolio-wave">
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                            </div>
                        </div>
                    </div>
                    <!-- Item 4: Image -->
                    <div class="portfolio-card" data-type="image" data-src="assets/speaker_1_sheet.png" aria-label="View Keynote Speaker One-Sheet PDF Mockup" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('assets/speaker_1_sheet.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Image</span>
                            <h4 class="portfolio-title">Keynote One-Sheet</h4>
                        </div>
                    </div>
                    <!-- Item 5: Image -->
                    <div class="portfolio-card" data-type="image" data-src="assets/ring_anyway_coaching.png" aria-label="View Coaching Success Blueprint Design" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('assets/ring_anyway_coaching.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Image</span>
                            <h4 class="portfolio-title">Coaching Blueprint</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 2: Speaker Bios & Media Kit Assets -->
    <section class="section bg-navy-light text-white" style="border-top: 1px solid var(--color-gray-border); border-bottom: 1px solid var(--color-gray-border);">
        <div class="container">
            <div class="grid-2">
                <div>
                    <span class="section-tag text-teal">Speaker Materials</span>
                    <h2 class="text-white">Speaker Bios</h2>
                    <div style="margin-bottom: 20px;">
                        <span class="section-tag text-teal" style="font-size: 0.8rem; margin-bottom: 5px;">Short Bio (100 words)</span>
                        <p style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-left: 3px solid var(--color-teal); font-size: 0.95rem; color: var(--color-gray-light); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; margin-bottom: var(--spacing-sm);">
                            I am a digital designer, ClickFunnels builder, and speaker living with Friedrich's ataxia. I use AI to write and build code, bypassing my physical limits. I coach people on how to work within their constraints and build digital projects.
                        </p>
                    </div>
                    <div>
                        <span class="section-tag text-teal" style="font-size: 0.8rem; margin-bottom: 5px;">Long Bio</span>
                        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--color-gray-light);">
                            I grew up in St. Louis and was diagnosed with Friedrich's ataxia at age 14. As my coordination changed, I adjusted my plans and built a career in digital design. I configure AI to help me type, write code, and run my business. Today, I speak to groups about how to audit their constraints and build practical digital solutions.
                        </p>
                    </div>
                </div>
                
                <div class="card bg-navy" style="border: 1px solid rgba(0, 209, 193, 0.2); color: white;">
                    <span class="section-tag text-teal">Media Assets</span>
                    <h3 class="text-white">Download Media Kit</h3>
                    <p style="font-size: 0.95rem; margin-bottom: 20px; color: var(--color-gray-light);">Select files to download for event programs, promotional flyers, or articles.</p>
                    <ul style="list-style: none; display: flex; flex-direction: column; gap: 15px;">
                        <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
                            <div>
                                <strong style="display:block; color: white;">Speaking One-Sheet</strong>
                                <span style="font-size:0.8rem; color:rgba(255, 255, 255, 0.75);">PNG (1.7 MB)</span>
                            </div>
                            <a href="assets/speaker_1_sheet.png" download="Speaker_1_Sheet.png" class="btn btn-teal btn-sm">Download</a>
                        </li>
                        <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
                            <div>
                                <strong style="display:block; color: white;">Headshot Gallery</strong>
                                <span style="font-size:0.8rem; color:rgba(255, 255, 255, 0.75);">ZIP (9.6 MB)</span>
                            </div>
                            <a href="assets/Headshots.zip" download="Headshots.zip" class="btn btn-teal btn-sm">Download</a>
                        </li>
                        <li style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="display:block; color: white;">Marchello Sciortino Logo Assets</strong>
                                <span style="font-size:0.8rem; color:rgba(255, 255, 255, 0.75);">ZIP (39 KB)</span>
                            </div>
                            <a href="assets/Marchello_Sciortino_Logo_Assets.zip" download="Marchello_Sciortino_Logo_Assets.zip" class="btn btn-teal btn-sm">Download</a>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="media-gallery-row">
                <h4 class="text-white" style="margin-bottom: 5px; font-family: var(--font-heading); font-size: 1.25rem;">Preview Speaker Materials</h4>
                <p style="font-size: 0.9rem; color: var(--color-gray-light); margin-bottom: 20px;">Preview of assets included in the Download Media Kit package.</p>
                <div class="media-gallery-grid">
                    <div class="gallery-item">
                        <img src="assets/speaker_1_sheet.png" alt="Speaking One-Sheet">
                        <span class="gallery-item-label">Speaking One-Sheet</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/headshot_1.jpg" alt="Headshot 1">
                        <span class="gallery-item-label">Headshot 1</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/headshot_2.jpg" alt="Headshot 2">
                        <span class="gallery-item-label">Headshot 2</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/headshot_3.jpg" alt="Headshot 3">
                        <span class="gallery-item-label">Headshot 3</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/headshot_4.jpg" alt="Headshot 4">
                        <span class="gallery-item-label">Headshot 4</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/marchello_logo_dark.png" alt="Marchello Sciortino Logo Dark">
                        <span class="gallery-item-label">Marchello Sciortino Logo Dark</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/marchello_logo_light.png" alt="Marchello Sciortino Logo Light">
                        <span class="gallery-item-label">Marchello Sciortino Logo Light</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Signature Message Detail -->
    <section class="section bg-white" style="border-bottom: 1px solid var(--color-gray-border);">
        <div class="container">
            <div style="max-width: 900px; margin: 0 auto; margin-bottom: var(--spacing-lg);">
                <span class="section-tag">Signature Message</span>
                <h2 style="font-size: 2.2rem; margin-bottom: 20px;">Winning Despite The Odds</h2>
                <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-steel); margin-bottom: 20px;">
                    I speak about the reality of living with a progressive condition. Resilience is a daily choice to adjust your plans and keep moving forward.
                </p>
                <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-steel); margin-bottom: 30px;">
                    In this signature keynote, I share the W.I.N. framework to show how organizations, individuals, and teams can look at their changing parameters, reframe their focus, and build practical success.
                </p>
                <div style="background: var(--color-white); border-left: 4px solid var(--color-teal); padding: var(--spacing-md); border-radius: 0 var(--radius-md) var(--radius-md) 0; box-shadow: var(--shadow-sm); border-top: 1px solid rgba(10, 216, 173, 0.1); border-right: 1px solid rgba(10, 216, 173, 0.1); border-bottom: 1px solid rgba(10, 216, 173, 0.1);">
                    <strong style="font-size: 1.1rem; color: var(--color-navy); display: block; margin-bottom: 12px;">Key Audience Takeaways:</strong>
                    <ul style="margin: 0; padding-left: 20px; color: var(--color-gray-steel); display: grid; gap: 10px; font-size: 1.05rem;">
                        <li>Shift perspective from limitations to creative constraints.</li>
                        <li>Find practical alternatives when your physical or strategic resources change.</li>
                        <li>Use AI tools to handle repetitive tasks and speed up your writing.</li>
                    </ul>
                </div>
            </div>

            <!-- Speaking Topics Row (Moved under signature takeaways) -->
            <div style="margin-top: 3.5rem; border-top: 1px solid var(--color-gray-border); padding-top: 3rem;">
                <h3 class="text-center" style="margin-bottom: var(--spacing-lg); font-size: 2.25rem;">Speaking Topics</h3>
                <div class="grid-3">
                    <div class="card">
                        <h4 class="text-teal" style="font-size: 1.3rem; margin-bottom: 12px;">Perspective & The Hand You are Dealt</h4>
                        <p>A practical approach to working within physical limits and focusing on the abilities you still have.</p>
                    </div>
                    <div class="card">
                        <h4 class="text-teal" style="font-size: 1.3rem; margin-bottom: 12px;">AI for Daily Work</h4>
                        <p>How AI acts as a typing assistant. I share how to use prompts to write and design faster.</p>
                    </div>
                    <div class="card">
                        <h4 class="text-teal" style="font-size: 1.3rem; margin-bottom: 12px;">Faith, Family & Daily Adaptation</h4>
                        <p>Reflections on the faith and family support that keep me building under pressure.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
`);

// 8. ChelloAI Page Template
Router.register('/chelloai', () => `
    <div class="page-intro" style="position: relative; overflow: hidden;">
        <!-- Curved background gold lines using inline SVG -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        
        <div class="container text-center" style="position: relative; z-index: 2;">
            <span class="section-tag text-teal">When I Simply Can't</span>
            <h1 style="color: white;">Meet ChelloAI</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Technology amplifies my voice. Interact with ChelloAI, my custom conversational companion.
            </p>
        </div>
    </div>
    
    <!-- Section 1: Two-Column Intro Copy -->
    <section class="section bg-white" style="padding: 5rem 0 3rem 0;">
        <div class="container">
            <div class="grid-2" style="align-items: center; gap: var(--spacing-lg);">
                
                <!-- Left Column: Full-Width Image -->
                <div style="width: 100%;">
                    <img src="assets/chello-ai-twin.png" alt="ChelloAI Conversational Partner" style="width: 100%; height: auto; display: block; filter: drop-shadow(0 15px 30px rgba(7, 24, 39, 0.3)) drop-shadow(0 0 12px rgba(10, 216, 173, 0.15));">
                </div>
                
                <!-- Right Column: Text & CTAs -->
                <div>
                    <span class="section-tag text-teal" style="display: inline-block; margin-bottom: 8px;">My Digital Companion</span>
                    <h2 class="text-navy" style="font-size: 2.2rem; margin-bottom: var(--spacing-sm);">A Bridge for Connection</h2>
                    
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-medium); margin-bottom: var(--spacing-sm);">
                        Because typing can take me hours and my physical speech has changed due to Friedrich's ataxia, I developed <strong>ChelloAI</strong>. This partner is trained directly on my personal rules, writings, memories, and voice settings.
                    </p>
                    
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-medium); margin-bottom: var(--spacing-sm);">
                        It acts as a bridge for connection, representing me in conversations and answering questions about my story and design services to help visitors understand my perspective without delay.
                    </p>
                    
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-medium); margin-bottom: var(--spacing-sm);">
                        Creating ChelloAI has unlocked incredible benefits for my digital creations: it acts as a persistent digital twin that preserves my coordination energy, assists with communication flow, and enables me to build and share resources more efficiently.
                    </p>
                    
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-steel); margin-bottom: var(--spacing-lg); font-weight: 500;">
                        Speak directly with my Live Avatar companion below, or use the interactive chat simulator to ask preset questions.
                    </p>
                    
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: flex-start;">
                        <button id="start-avatar-btn" class="btn btn-teal" style="display: flex; align-items: center; gap: 8px; padding: 12px 24px; font-size: 1rem;">
                            <span style="font-size: 1.1rem;">🎙️</span> Talk to Live Avatar
                        </button>
                        <button id="scroll-to-simulator-btn" class="btn btn-outline-teal" style="padding: 12px 24px; font-size: 1rem;">
                            💬 Try Chat Simulator
                        </button>
                        <a href="https://www.accessibleaim.com" target="_blank" rel="noopener noreferrer" class="btn btn-outline-white" style="background: var(--color-navy); color: white; border: 1px solid var(--color-navy); padding: 12px 24px; font-size: 1rem; transition: var(--transition-fast);">Build Your Own Companion</a>
                    </div>
                </div>
                
            </div>
        </div>
    </section>

    <!-- Section 2: Live Avatar Companion (Centered in its own section, centered in a large row) -->
    <section id="live-avatar-section" class="section bg-navy-light" style="border-top: 1px solid rgba(0, 209, 193, 0.1); border-bottom: 1px solid rgba(0, 209, 193, 0.1); padding: 5rem 0;">
        <div class="container" style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
            
            <div class="text-center" style="margin-bottom: var(--spacing-md); max-width: 600px;">
                <span class="section-tag text-teal" style="display: block; margin-bottom: 8px;">Real-Time Voice Twin</span>
                <h3 class="text-white" style="font-size: 2rem; margin-bottom: var(--spacing-sm);">Talk to ChelloAI Twin</h3>
                <p style="color: var(--color-gray-light); font-size: 1.05rem; line-height: 1.5; margin: 0;">
                    Have a live, spoken conversation. Ask about Marchello's story, digital services, and prompt frameworks.
                </p>
            </div>

            <!-- Live Avatar Card (Centered in large row) -->
            <div id="companion-avatar-container" style="width: 100%; max-width: 800px; min-height: 500px; border-radius: var(--radius-md); overflow: hidden; background: var(--color-navy); border: 2px solid var(--color-teal); box-shadow: var(--shadow-lg); display: flex; flex-direction: column; position: relative;">
                
                <!-- Live Avatar Header -->
                <div class="avatar-header" style="background: var(--color-navy-dark); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 209, 193, 0.15); width: 100%; box-sizing: border-box;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div id="avatar-status-indicator" style="width: 10px; height: 10px; background: #a0aec0; border-radius: 50%;"></div>
                        <h4 style="margin: 0; color: white; font-size: 1.1rem; font-family: var(--font-heading);">ChelloAI Live Session</h4>
                    </div>
                    <button id="stop-avatar-btn" style="display: none; background: rgba(255, 74, 74, 0.15); border: 1px solid rgba(255, 74, 74, 0.3); color: #ff7474; padding: 6px 14px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; transition: var(--transition-fast); font-weight: 500;">End Session</button>
                </div>
                
                <!-- Iframe Target / Start Screen Area -->
                <div id="avatar-iframe-target" style="flex: 1; display: flex; align-items: center; justify-content: center; position: relative; background: #000; min-height: 440px; width: 100%;">
                    <!-- Static preview overlay with start button -->
                    <div id="avatar-placeholder-view" style="color: white; text-align: center; max-width: 500px; padding: 40px var(--spacing-md); display: flex; flex-direction: column; align-items: center; gap: 20px; width: 100%; box-sizing: border-box;">
                        <div class="avatar-preview-circle" style="position: relative; width: 120px; height: 120px; margin-bottom: 10px;">
                            <img src="assets/chello_ai_avatar.png" alt="ChelloAI Companion" style="width: 100%; height: 100%; border-radius: 50%; border: 3px solid var(--color-teal); object-fit: cover; box-shadow: 0 0 25px rgba(0, 209, 193, 0.3);">
                            <div style="position: absolute; bottom: 5px; right: 5px; width: 20px; height: 20px; background: #48bb78; border-radius: 50%; border: 3px solid var(--color-navy);"></div>
                        </div>
                        <h4 style="margin: 0; color: var(--color-white); font-size: 1.35rem; font-family: var(--font-heading); font-weight: 600;">ChelloAI Conversational Twin</h4>
                        <p style="font-size: 0.95rem; color: var(--color-gray-light); line-height: 1.5; margin: 0;">
                            ChelloAI is configured with Marchello's brand guidelines to answer questions in real time with audio lip-syncing.
                        </p>
                        <button id="start-avatar-card-btn" class="btn btn-teal" style="display: flex; align-items: center; gap: 10px; padding: 14px 28px; font-size: 1.05rem; font-weight: 600; width: 100%; justify-content: center; max-width: 320px;">
                            🎙️ Start Voice Conversation
                        </button>
                        <span style="font-size: 0.8rem; color: var(--color-gray-steel);">Note: Requires microphone permission. Standard data rates may apply.</span>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- Section 3: Interactive Chat Simulator (Centered in own section, centered in a large row) -->
    <section id="chat-simulator-section" class="section bg-white" style="padding: 5rem 0; border-bottom: 1px solid var(--color-gray-border);">
        <div class="container" style="display: flex; justify-content: center; align-items: center; flex-direction: column;">
            
            <div class="text-center" style="margin-bottom: var(--spacing-lg); max-width: 600px;">
                <span class="section-tag" style="display: block; margin-bottom: 8px;">Text Assistant</span>
                <h3 class="text-navy" style="font-size: 2.2rem; margin-bottom: var(--spacing-sm);">Interactive Chat Simulator</h3>
                <p style="color: var(--color-gray-medium); font-size: 1.05rem; line-height: 1.5; margin: 0;">
                    Prefer text? Click any of the topics below to instantly chat with ChelloAI.
                </p>
            </div>

            <!-- Static Chat Simulator (Always visible) -->
            <div class="chat-window" id="companion-chat-window" style="width: 100%; max-width: 800px; display: flex; flex-direction: column;">
                <div class="chat-header">
                    <div class="chat-avatar-wrapper">
                        <img src="assets/chello_ai_avatar.png" alt="ChelloAI Avatar" class="chat-avatar">
                        <div class="avatar-status-dot"></div>
                    </div>
                    <div class="chat-header-info">
                        <h4>ChelloAI</h4>
                        <p>Voice & Concept Amplifier</p>
                    </div>
                </div>
                
                <div class="chat-messages" id="chat-messages" style="flex: 1; min-height: 250px; max-height: 350px; overflow-y: auto; padding: 20px;">
                    <!-- Initial message -->
                    <div class="message-bubble incoming">
                        Hello! I am ChelloAI, my digital companion. Select any question below to explore my stories and tools.
                    </div>
                </div>
                
                <div class="chat-suggestions" style="padding: 20px; border-top: 1px solid var(--color-gray-border);">
                    <p class="chat-suggestions-title" style="margin-bottom: 12px; font-weight: 600;">Select a topic to ask:</p>
                    <div class="suggestions-grid" id="chat-suggestions-grid">
                        <!-- Pre-baked buttons dynamically load here -->
                    </div>
                </div>
            </div>

        </div>
    </section>

    <!-- Section 4: Articulated Inspiration (Alternating to White) -->
    <section class="section bg-white" style="padding: 5rem 0;">
        <div class="container">
            <div class="text-center" style="margin-bottom: var(--spacing-lg);">
                <span class="section-tag text-teal" style="display: block; margin-bottom: var(--spacing-xs);">A New Way to See AI</span>
                <h3 class="text-navy" style="font-size: 2.2rem; margin-bottom: var(--spacing-md);">Articulated Inspiration</h3>
            </div>
            
            <div class="grid-2" style="align-items: center; gap: var(--spacing-lg);">
                
                <!-- Left Column: Text -->
                <div>
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-medium); margin-bottom: var(--spacing-md);">
                        Articulated Inspiration is the moving joint between thought and expression. It transforms the creativity and wisdom present within us into active, functional reality.
                    </p>
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-medium); margin-bottom: var(--spacing-lg);">
                        This philosophy serves as the foundation of the <strong>Accessible AIM</strong> (Articulated Inspiration Method). Through this framework, AI becomes an amplifier of human capability—providing the joint that translates silent ideas into active expression.
                    </p>
                    <div style="border-top: 1px solid var(--color-gray-border); padding-top: var(--spacing-md); display: flex; align-items: flex-start; gap: 15px;">
                        <span style="font-size: 1.6rem; color: var(--color-teal); line-height: 1;">💡</span>
                        <div>
                            <strong style="color: var(--color-teal); display: block; margin-bottom: 6px; font-size: 1rem; letter-spacing: 0.05em;">THE METHOD IN ACTION:</strong>
                            <span style="font-size: 1rem; color: var(--color-gray-steel); line-height: 1.5; display: block;">
                                ChelloAI acts as this moving joint. When motor coordination restricts typing speed, this digital partner translates my thoughts and memories directly into natural conversations.
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Visual Representation -->
                <div style="text-align: center;">
                    <img src="assets/articulated_inspiration.jpg" alt="Articulated Inspiration visualization" class="articulated-img">
                </div>

            </div>
        </div>
    </section>
`);

// 9. AI Music and Jingles Page Template
Router.register('/music', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Soundscapes</span>
            <h1 style="color: white;">AI Music & Brand Jingles</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                A song can make your story easier to remember, easier to feel, and easier to share.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2" style="margin-bottom: var(--spacing-lg);">
                <div>
                    <h2>Melodies of Progression</h2>
                    <p>
                        Even though my hands cannot play the piano keys and my voice cannot maintain a singing energy block, I use AI generator models to compose, write lyrics, and build brand jingles.
                    </p>
                    <p style="margin-bottom: 20px;">
                        These tracks combine real stories (like early Lyme diagnosis or skydiving) with cinematic melodies to capture the emotion of the journey. Play the custom tracks on the right to hear the results.
                    </p>
                    
                    <div class="card">
                        <h3>Request a Brand Jingle Quote</h3>
                        <p style="font-size: 0.9rem; margin-bottom: 15px;">I help brands tell their story through custom melodies and acoustic patterns. Inquire for pricing.</p>
                        <form id="music-quote-form">
                            <div class="form-group">
                                <label for="music-name">Name</label>
                                <input type="text" id="music-name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="music-email">Email</label>
                                <input type="email" id="music-email" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="music-details">Describe the style/message of the song you want</label>
                                <textarea id="music-details" class="form-control" placeholder="e.g. A country acoustic ballad about perseverance for our local team" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-teal" style="width:100%;">Request Quote</button>
                        </form>
                    </div>
                </div>
                
                <div id="audio-players-container">
                    <!-- Javascript will dynamically inject the audio player list here -->
                </div>
            </div>
        </div>
    </section>
`);

// 11. Impact Page Template
Router.register('/impact', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Audience Feedback</span>
            <h1 style="color: white;">Impact & Reviews</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                The message is bigger than one stage. How audiences, brands, and readers respond to the mission.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="grid-3" style="margin-bottom: var(--spacing-lg);">
                <div class="card">
                    <span class="text-gold" style="font-size: 1.5rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <h4 style="margin-top: 10px;">"A Shift in Paradigm"</h4>
                    <p style="font-style: italic; font-size: 0.95rem;">
                        "Marchello's keynote stripped away all the usual corny slogans we hear at sales rallies. His honest details about progression and practical AI execution changed how our management team views challenges."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Event Planner, Leadership Forum</strong>
                </div>
                <div class="card">
                    <span class="text-gold" style="font-size: 1.5rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <h4 style="margin-top: 10px;">"Zero Fluff, Real Proof"</h4>
                    <p style="font-style: italic; font-size: 0.95rem;">
                        "We hired Marchello to build our ClickFunnels logic. His technical design system was flawless, and knowing the physical challenges he works with just proved to us that his capacity is second to none."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Founder, Tech Accelerator</strong>
                </div>
                <div class="card">
                    <span class="text-gold" style="font-size: 1.5rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <h4 style="margin-top: 10px;">"Inspiring and Practical"</h4>
                    <p style="font-style: italic; font-size: 0.95rem;">
                        "As a parent of a disabled child, hearing Marchello speak gave me a realistic, positive roadmap. He shows that adaptation is a practical pathway to build momentum."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Attendee, Advocacy Summit</strong>
                </div>
            </div>
            
            <div class="card bg-navy" style="padding: var(--spacing-lg); text-align: center; color: white;">
                <h3 style="color: white; margin-bottom: 10px;">Want to share your story?</h3>
                <p style="color: var(--color-gray-steel); margin-bottom: 20px;">If you have heard me speak or read my articles, let me know how the W.I.N. model helped you.</p>
                <a href="/contact" class="btn btn-teal">Write to Me</a>
            </div>
        </div>
    </section>
`);

// 12. Hub (Blog) Page Template
Router.register('/marchellos-blog', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Story Notes & AI</span>
            <h1 style="color: white;">My Blog</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Explore the mind behind the mission. Reflections on adaptation, prompt guides, personal notes, and framework worksheets.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <!-- Filter & Search Controls -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: var(--spacing-lg); flex-wrap: wrap;">
                <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="hub-tag-filters">
                    <!-- JS will load buttons here -->
                </div>
                <div style="flex: 1; max-width: 300px; min-width: 200px;">
                    <input type="text" id="hub-search" class="form-control" placeholder="Search articles...">
                </div>
            </div>
            
            <!-- Article Cards Container -->
            <div class="grid-3" id="hub-articles-grid">
                <!-- Javascript will load posts here -->
            </div>
        </div>
    </section>
`);

Router.register('/hub', () => Router.routes['/marchellos-blog']());

// 13. Contact Page Template
Router.register('/contact', () => {
    // Read query parameter from current URL
    const queryStr = window.location.search;
    let selectedInterest = 'Connect'; // default
    if (queryStr) {
        const params = new URLSearchParams(queryStr);
        const interestParam = params.get('interest');
        if (['Connect', 'Create', 'Build', 'Overcome'].includes(interestParam)) {
            selectedInterest = interestParam;
        }
    }

    return `
    <div class="page-intro" style="position: relative; overflow: hidden;">
        <!-- Curved background gold lines using inline SVG -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        
        <div class="container text-center" style="position: relative; z-index: 2;">
            <span class="section-tag text-teal">Connect</span>
            <h1 style="color: white;">Start a Conversation</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Have a question, want to collaborate, or want to share your own story? I am here.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2" style="align-items: center; gap: var(--spacing-lg);">
                <!-- Left Column: Picture of Marchello -->
                <div class="contact-image-column" style="text-align: center;">
                    <img src="assets/contact_hero.png" alt="Marchello Sciortino" style="width: 100%; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid var(--color-gray-border); margin-bottom: 20px; object-fit: cover;">
                    <h3 style="color: var(--color-navy); margin-bottom: 6px; font-family: var(--font-heading); font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em;">Marchello Sciortino</h3>
                    <p style="color: var(--color-teal); font-weight: 700; font-family: var(--font-heading); font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0;">Creativity. Technology. Determination.</p>
                </div>
                
                <!-- Right Column: Form -->
                <div class="contact-form-column">
                    <div class="contact-card-custom" style="padding: 40px 30px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); border: 1px solid var(--color-gray-border);">
                        <form id="contact-page-form">
                            <div class="contact-form-group">
                                <label for="contact-name" class="contact-label">NAME: <span class="contact-asterisk">*</span></label>
                                <input type="text" id="contact-name" class="contact-input" required placeholder="e.g. John Doe">
                            </div>
                            <div class="contact-form-group">
                                <label for="contact-email" class="contact-label">EMAIL: <span class="contact-asterisk">*</span></label>
                                <input type="email" id="contact-email" class="contact-input" required>
                            </div>
                            <div class="contact-form-group">
                                <label for="contact-subject" class="contact-label">SUBJECT: <span class="contact-asterisk">*</span></label>
                                <input type="text" id="contact-subject" class="contact-input" required>
                            </div>
                            <div class="contact-form-group">
                                <label class="contact-label">I WANT TO: <span class="contact-asterisk">*</span></label>
                                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; max-width: 320px; margin-top: 8px;">
                                    <label style="display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 0.95rem; color: var(--color-navy); cursor: pointer;">
                                        <input type="radio" name="contact-interest" value="Connect" ${selectedInterest === 'Connect' ? 'checked' : ''} required style="accent-color: var(--color-teal); width: 18px; height: 18px; cursor: pointer;">
                                        <span>Connect</span>
                                    </label>
                                    <label style="display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 0.95rem; color: var(--color-navy); cursor: pointer;">
                                        <input type="radio" name="contact-interest" value="Create" ${selectedInterest === 'Create' ? 'checked' : ''} style="accent-color: var(--color-teal); width: 18px; height: 18px; cursor: pointer;">
                                        <span>Create</span>
                                    </label>
                                    <label style="display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 0.95rem; color: var(--color-navy); cursor: pointer;">
                                        <input type="radio" name="contact-interest" value="Build" ${selectedInterest === 'Build' ? 'checked' : ''} style="accent-color: var(--color-teal); width: 18px; height: 18px; cursor: pointer;">
                                        <span>Build</span>
                                    </label>
                                    <label style="display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-body); font-size: 0.95rem; color: var(--color-navy); cursor: pointer;">
                                        <input type="radio" name="contact-interest" value="Overcome" ${selectedInterest === 'Overcome' ? 'checked' : ''} style="accent-color: var(--color-teal); width: 18px; height: 18px; cursor: pointer;">
                                        <span>Overcome</span>
                                    </label>
                                </div>
                            </div>
                            <div class="contact-form-group">
                                <label for="contact-description" class="contact-label">DESCRIPTION: <span class="contact-asterisk">*</span></label>
                                <textarea id="contact-description" class="contact-textarea" required></textarea>
                            </div>
                            <div class="contact-form-group">
                                <label for="contact-attachments" class="contact-label">ATTACHMENTS:</label>
                                <div class="contact-file-wrapper">
                                    <input type="file" id="contact-attachments" class="contact-file-input">
                                    <span class="contact-file-info">Max. file size: 50 MB.</span>
                                </div>
                            </div>
                            <div class="contact-form-group" style="margin-bottom: 0;">
                                <button type="submit" class="contact-btn-submit" style="width: 100%;">Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>
`;
});

// 14. Free Gifts Page Template
Router.register('/free-gifts', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Tools</span>
            <h1 style="color: white;">Free Gifts</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Worksheets, prompt templates, and PDF guides to help you reframe obstacles and build your projects.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="grid-3">
                <div class="card">
                    <span class="section-tag">PDF Worksheet</span>
                    <h3>W.I.N. Reframe Matrix</h3>
                    <p>A step-by-step reflection grid to list your active constraints and construct a custom action plan.</p>
                    <a href="/free-gifts" class="btn btn-outline-teal" onclick="alert('Downloading W.I.N. Reframe Matrix PDF'); return false;" style="margin-top: 15px;">Download PDF</a>
                </div>
                <div class="card">
                    <span class="section-tag">Prompt Cheat Sheet</span>
                    <h3>AI Accessibility Commands</h3>
                    <p>My core templates for configuring AI writing assistants to act as efficient transcription guides.</p>
                    <a href="/free-gifts" class="btn btn-outline-teal" onclick="alert('Downloading AI Accessibility Commands Prompt Guide'); return false;" style="margin-top: 15px;">Download Guide</a>
                </div>
                <div class="card">
                    <span class="section-tag">Checklist</span>
                    <h3>Digital Flow Audit</h3>
                    <p>A simple check sheet to audit your landing pages for ADA accessibility and speed friction blocks.</p>
                    <a href="/free-gifts" class="btn btn-outline-teal" onclick="alert('Downloading Digital Flow Audit Checklist'); return false;" style="margin-top: 15px;">Download Checklist</a>
                </div>
            </div>
        </div>
    </section>
`);



// 15. Privacy Page Template
Router.register('/privacy', () => `
    <div class="page-intro">
        <div class="container text-center">
            <h1 style="color: white;">Privacy Policy</h1>
            <p style="color: var(--color-gray-light);">Last updated: June 2026</p>
        </div>
    </div>
    <section class="section bg-white">
        <div class="container" style="max-width: 800px;">
            <h2>Information Collection</h2>
            <p>We respect your privacy. This site collects only the data you submit through our inquiry forms (name, email, organization, messages) and uses standard anonymous cookies to preserve accessibility choices locally on your browser.</p>
            
            <h2 style="margin-top: 25px;">Use of Data</h2>
            <p>Your details are used solely to reply to speaking inquiries, send waitlist notifications, or arrange book releases. We never sell or share your contact records with external marketers.</p>
            
            <h2 style="margin-top: 25px;">Consent</h2>
            <p>By entering data on our submission fields, you consent to our security policies. You can ask to have your data erased at any time by messaging us through our contact forms.</p>
        </div>
    </section>
`);

// 16. Terms Page Template
Router.register('/terms', () => `
    <div class="page-intro">
        <div class="container text-center">
            <h1 style="color: white;">Terms & Conditions</h1>
            <p style="color: var(--color-gray-light);">Last updated: June 2026</p>
        </div>
    </div>
    <section class="section bg-white">
        <div class="container" style="max-width: 800px;">
            <h2>Website Usage</h2>
            <p>Welcome to my official brand hub. By browsing this site, you agree to comply with standard usage policies. The materials, articles, SVG brain maps, and custom voice models featured on this domain are my intellectual assets.</p>
            
            <h2 style="margin-top: 25px;">No-Guarantees Disclaimer</h2>
            <p>The advice, strategies, and lessons presented in the Hub or Speaking keynotes reflect my personal journey and digital experience. They do not constitute official medical advice or secure financial growth promises.</p>
            
            <h2 style="margin-top: 25px;">Limitation of Liability</h2>
            <p>I am not liable for external links, user browser settings adjustments, or third-party implementations based on resources downloaded from this hub.</p>
        </div>
    </section>
`);

// 17. Accessibility Statement Template
Router.register('/accessibility-statement', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Compliance</span>
            <h1 style="color: white;">Accessibility Statement</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Accessibility is not an add-on to this mission. It is part of the mission.
            </p>
        </div>
    </div>
    <section class="section bg-white">
        <div class="container" style="max-width: 800px;">
            <h2>Commitment to Digital Inclusion</h2>
            <p>
                I am committed to making this digital hub accessible and navigable for as many people as possible. I actively develop this platform using WCAG 2.2 Level AA guidelines as my technical standard.
            </p>
            
            <h2 style="margin-top: 25px;">Built-in Accessibility Widget</h2>
            <p>
                We provide a custom accessibility widget (accessible by clicking the icon in the lower corner of the screen). It allows users to toggle, scale, and adjust a comprehensive set of interface features:
            </p>
            
            <div class="accessibility-features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 20px; margin-bottom: 25px;">
                <div class="card" style="margin: 0; padding: 20px; background: #081b29; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: #FFFFFF;">
                    <h3 style="color: #0ad8ad; font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <span>👁️</span> Essential Helpers
                    </h3>
                    <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.92rem; color: #E2E8F0;">
                        <li><strong>Larger Text Scale:</strong> A range slider to adjust text sizing globally from 100% up to 160%.</li>
                        <li><strong>High Contrast Mode:</strong> Enhances text legibility with yellow-on-black color profiles.</li>
                        <li><strong>Grayscale / Monochrome:</strong> Desaturates colors for reduced sensory stimulation.</li>
                        <li><strong>Underline Links:</strong> Automatically underscores all hyperlink elements.</li>
                        <li><strong>Highlight Links:</strong> Outlines and highlights all links with high-visibility overlays.</li>
                        <li><strong>Highlight Headings:</strong> Binds distinct teal borders around page headers.</li>
                        <li><strong>Dyslexic Reading Font:</strong> Swaps typefaces to dyslexia-friendly alternatives.</li>
                        <li><strong>Readable Font:</strong> Forces standard Arial/sans-serif typography.</li>
                        <li><strong>Increase Spacing:</strong> Expands letter-spacing to ease visual tracking.</li>
                        <li><strong>Line Height +:</strong> Increases vertical line height to 2.0x.</li>
                    </ul>
                </div>
                
                <div class="card" style="margin: 0; padding: 20px; background: #081b29; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: #FFFFFF;">
                    <h3 style="color: #0ad8ad; font-size: 1.1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                        <span>🚀</span> Creative Focus Tools
                    </h3>
                    <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; font-size: 0.92rem; color: #E2E8F0;">
                        <li><strong>ADHD Reading Ruler:</strong> A horizontal layout guide following the cursor for reading focus.</li>
                        <li><strong>Focus Spotlight:</strong> Dimmer mask highlighting only the direct space around the mouse pointer.</li>
                        <li><strong>High-Visibility Cursor:</strong> Replaces browser arrow with a large, high-visibility visual pointer.</li>
                        <li><strong>Text-to-Speech Reader:</strong> Reads out focused or hovered items while applying a green outline highlight.</li>
                        <li><strong>Pause Animations:</strong> Instantly halts transitions and scroll-based motion.</li>
                        <li><strong>Chime Sound Effects:</strong> Custom synthesizes Web Audio chime feedback on toggles.</li>
                    </ul>
                </div>
            </div>
            
            <h2 style="margin-top: 25px;">Keyboard & Screen-Reader Optimization</h2>
            <p>
                This Single Page Application includes semantic HTML tags, skip-to-content links, active focus management when transitioning routes, and keyboard-tab equivalent listings for all interactive visual modules (such as the SVG neural Brain Map).
            </p>
            
            <div class="card" style="margin-top: 30px;">
                <h3>Accessibility Feedback</h3>
                <p style="font-size: 0.95rem; margin-bottom: 15px;">If you experience any barriers while navigating this hub, please let me know so I can adjust the layout constraints.</p>
                <form id="access-feedback-form">
                    <div class="form-group">
                        <label for="access-email">Your Email</label>
                        <input type="email" id="access-email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="access-desc">Describe the barrier you encountered</label>
                        <textarea id="access-desc" class="form-control" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-teal">Submit Accessibility Feedback</button>
                </form>
            </div>
        </div>
    </section>
`);

// 18. Resources Page Template
Router.register('/resources', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Growth Hub</span>
            <h1 style="color: white;">Resources</h1>
            <p class="section-desc" style="color: var(--color-gray-light); max-width: 800px; margin: 0 auto;">
                These are the exact tools, books, and resources that have helped me grow—personally, professionally, and spiritually. Each one has played a part in my journey. Use what speaks to you—and take one step closer to the life you're building.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <!-- Section 1: Limitations to Liberation -->
            <div style="margin-bottom: 50px;">
                <h2 class="text-navy" style="margin-bottom: 5px;">Limitations to Liberation Initiatives</h2>
                <p style="color: var(--color-gray-medium); margin-bottom: 15px;">Key projects and sources focused on disability advocacy, accessibility, and personal agency.</p>
                <div style="height: 2px; width: 60px; background: var(--color-teal); margin-top: 10px; margin-bottom: 25px;"></div>
                
                <div class="grid-3">
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Sources</span>
                            <h3 style="margin-bottom: 10px;">Coming Soon</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">Documentation, references, and sources for Limitation to Liberation.</p>
                        </div>
                        <button class="btn btn-outline-teal" disabled style="width: 100%; opacity: 0.6; cursor: not-allowed;">Coming Soon</button>
                    </div>
                    
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Read Now</span>
                            <h3 style="margin-bottom: 10px;">Book Website</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">Get your copy of "Limitations to Liberation" and begin turning constraints into creative agency.</p>
                        </div>
                        <a href="https://www.limitationstoliberation.com/" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                    
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Accessible AIM</span>
                            <h3 style="margin-bottom: 10px;">AI Accessibility</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">Learn how we are building an accessible world through AI-powered advocacy and solutions.</p>
                        </div>
                        <a href="https://www.accessibleaim.com/" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                </div>
            </div>
            
            <!-- Section 2: Digital Marketing -->
            <div style="margin-bottom: 50px;">
                <h2 class="text-navy" style="margin-bottom: 5px;">Digital Marketing Tools</h2>
                <p style="color: var(--color-gray-medium); margin-bottom: 15px;">The professional platforms and systems I use to build pages, launch funnels, and organize digital momentum.</p>
                <div style="height: 2px; width: 60px; background: var(--color-teal); margin-top: 10px; margin-bottom: 25px;"></div>
                
                <div class="grid-3">
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Platform</span>
                            <h3 style="margin-bottom: 10px;">ClickFunnels</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">The ultimate platform for building high-converting landing pages, sales pipelines, and websites.</p>
                        </div>
                        <a href="https://www.clickfunnels.com/signup-flow-new-plans?aff=marchello-sciortino" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                    
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Training</span>
                            <h3 style="margin-bottom: 10px;">One Funnel Away</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">The training system that guides you step-by-step through launching your online funnel.</p>
                        </div>
                        <a href="https://www.onefunnelaway.com/?aff=marchello-sciortino" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                    
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Templates</span>
                            <h3 style="margin-bottom: 10px;">PLR Funnels</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">Ready-to-use private label rights funnels to accelerate your digital launch speed.</p>
                        </div>
                        <a href="https://www.plrfunnels.com/plr?aff=marchello-sciortino" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                </div>
            </div>
            
            <!-- Section 3: Recommended Books -->
            <div style="margin-bottom: 20px;">
                <h2 class="text-navy" style="margin-bottom: 5px;">Recommended Books</h2>
                <p style="color: var(--color-gray-medium); margin-bottom: 15px;">Essential literature that helped shape my business mindset and marketing strategies.</p>
                <div style="height: 2px; width: 60px; background: var(--color-teal); margin-top: 10px; margin-bottom: 25px;"></div>
                
                <div class="grid-3">
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Marketing</span>
                            <h3 style="margin-bottom: 10px;">DotCom Secrets</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">The playbook for building a repeatable online sales system to grow any company.</p>
                        </div>
                        <a href="https://www.dotcomsecrets.com/?aff=d0960bf47d9b1ccc93da0b5cc9cf2d5a7bd719a1780f0a7f83d7b7bdce30c52b" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                    
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Influence</span>
                            <h3 style="margin-bottom: 10px;">Expert Secrets</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">The guide to building a community of people who will pay you for your advice.</p>
                        </div>
                        <a href="https://www.expertsecrets.com/?aff=d0960bf47d9b1ccc93da0b5cc9cf2d5a7bd719a1780f0a7f83d7b7bdce30c52b" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                    
                    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
                        <div>
                            <span class="section-tag text-teal" style="margin-bottom: 10px; display: inline-block;">Traffic</span>
                            <h3 style="margin-bottom: 10px;">Traffic Secrets</h3>
                            <p style="font-size: 0.95rem; color: var(--color-gray-medium); margin-bottom: 20px;">The strategies for finding your dream customers and directing them to your products.</p>
                        </div>
                        <a href="https://trafficsecrets.com/thebook-5" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
`);
