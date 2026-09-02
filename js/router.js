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
                // Let links with target="_blank", static assets (/assets/), PDFs, or download attributes behave normally
                if (link.target === '_blank' || href.startsWith('/assets/') || href.endsWith('.pdf') || link.hasAttribute('download')) return;

                e.preventDefault();
                this.navigate(href);
            }
        });

        // Handle initial page load immediately without waiting for full window.onload asset downloads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.handleRouting());
        } else {
            this.handleRouting();
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
        let cleanPath = (pathOnly.length > 1 && pathOnly.endsWith('/')) ? pathOnly.slice(0, -1) : pathOnly;

        // Bypass static assets and PDF files in SPA router
        if (pathOnly.startsWith('/assets/') || pathOnly.endsWith('.pdf')) {
            return;
        }

        // Subdomain check for library.marchellosciortino.com
        const isLibrarySubdomain = window.location.hostname.includes('library.marchellosciortino.com') || window.location.hostname.startsWith('library.');
        if (isLibrarySubdomain || cleanPath === '/free-library' || cleanPath.startsWith('/free-library/')) {
            pathOnly = '/free-gifts';
            cleanPath = '/free-gifts';
            history.replaceState(null, '', '/free-gifts');
        }

        // Redirect /home or /index.html to /
        if (cleanPath === '/home' || cleanPath === '/index.html' || cleanPath === '') {
            pathOnly = '/';
            cleanPath = '/';
            // Preserve query string if any
            const search = currentPath.includes('?') ? '?' + currentPath.split('?')[1] : '';
            history.replaceState(null, '', '/' + search);
        }

        if (cleanPath === '/book') {
            const search = currentPath.includes('?') ? '?' + currentPath.split('?')[1] : '';
            history.replaceState(null, '', '/' + search);
            window.open('https://www.limitationstoliberation.com/', '_blank');
            return;
        }

        // Match route or clean route or redirect to home (/)
        const templateFn = this.routes[pathOnly] || this.routes[cleanPath] || (isLibrarySubdomain ? this.routes['/free-gifts'] : this.routes['/']);

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

            // Dynamic Canonical URL Tag management
            let canonicalLink = document.querySelector('link[rel="canonical"]');
            if (!canonicalLink) {
                canonicalLink = document.createElement('link');
                canonicalLink.setAttribute('rel', 'canonical');
                document.head.appendChild(canonicalLink);
            }

            // Check if current route matches an individual free gift page
            const currentGift = typeof FREE_GIFTS_DATA !== 'undefined' && pathOnly !== '/free-gifts' && pathOnly !== '/free-library'
                ? FREE_GIFTS_DATA.find(g => '/' + g.slug === pathOnly || (g.aliases && g.aliases.some(a => '/' + a === pathOnly))) 
                : null;

            // Update document title dynamically for SEO
            const titles = {
                '/': "Marchello Sciortino | Official Digital Hub",
                '/story': "My Story | Marchello Sciortino",
                '/services': "Services | Marchello Sciortino",
                '/services-create': "Services - Create | Marchello Sciortino",
                '/services-build': "Services - Build | Marchello Sciortino",
                '/services-overcome': "Services - Overcome | Marchello Sciortino",
                '/mission': "The Mission | Marchello Sciortino",
                '/speaking': "Speaking | Marchello Sciortino",
                '/chelloai': "ChelloAI | Marchello Sciortino",
                '/marchellos-blog': "Marchello's Blog | Marchello Sciortino",
                '/hub': "Marchello's Blog | Marchello Sciortino",
                '/contact': "Contact | Marchello Sciortino",
                '/free-gifts': "Free Gifts | Marchello Sciortino",
                '/win-anyway': "Win Anyway | Free Music Album by Marchello Sciortino",
                '/resources': "Resources | Marchello Sciortino",
                '/privacy': "Privacy Policy | Marchello Sciortino",
                '/terms': "Terms of Service | Marchello Sciortino",
                '/accessibility-statement': "Accessibility Statement | Marchello Sciortino",
                '/accessible-aim': "Accessible AIM | Marchello Sciortino"
            };

            if (currentGift) {
                document.title = currentGift.meta_title || `${currentGift.title} | Marchello Sciortino`;
                canonicalLink.setAttribute('href', `https://marchellosciortino.com/${currentGift.slug}`);
            } else {
                document.title = titles[pathOnly] || (isLibrarySubdomain ? "Free Gifts | Marchello Sciortino" : "Marchello Sciortino");
                if (isLibrarySubdomain || pathOnly === '/free-gifts') {
                    canonicalLink.setAttribute('href', 'https://marchellosciortino.com/free-gifts');
                } else {
                    canonicalLink.setAttribute('href', `https://marchellosciortino.com${pathOnly === '/' ? '' : pathOnly}`);
                }
            }

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
            let isMatch = (href === cleanRoute || href === '#' + cleanRoute);
            
            // Highlight Services menu item for services sub-paths
            if (href === '/services' && (cleanRoute === '/services-create' || cleanRoute === '/services-build' || cleanRoute === '/services-overcome')) {
                isMatch = true;
            }
            
            if (isMatch) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    resetFocus() {
        // Reset scroll position to top instantly
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

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
                Harnessing the hidden potential of AI, as an accessibility bridge to build creative outcomes and professional momentum, help people reframe daily challenges, and find the clarity in the chaos.
            </p>
            <div class="hero-ctas">
                <a href="/speaking" class="btn btn-orange">BOOK ME TO SPEAK &rarr;</a>
                <div class="signature-cta-container">
                    <a href="/accessible-aim" class="btn btn-outline-white">EXPLORE ACCESSIBLE AIM</a>
                    <a href="/accessible-aim" class="signature-program-badge" aria-label="Learn about My Signature Program">
                        <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                            <polygon points="114.00,60.00 105.12,68.97 109.89,80.66 98.25,85.56 98.18,98.18 85.56,98.25 80.66,109.89 68.97,105.12 60.00,114.00 51.03,105.12 39.34,109.89 34.44,98.25 21.82,98.18 21.75,85.56 10.11,80.66 14.88,68.97 6.00,60.00 14.88,51.03 10.11,39.34 21.75,34.44 21.82,21.82 34.44,21.75 39.34,10.11 51.03,14.88 60.00,6.00 68.97,14.88 80.66,10.11 85.56,21.75 98.18,21.82 98.25,34.44 109.89,39.34 105.12,51.03" fill="#FFFFFF" stroke="#0ad8ad" stroke-width="2.5"/>
                        </svg>
                        <div class="badge-text-overlay">
                            <span>MY</span>
                            <span>SIGNATURE</span>
                            <span>PROGRAM</span>
                        </div>
                    </a>
                    <svg class="signature-arrow-svg" viewBox="0 0 150 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path class="arrow-line" d="M130,15 Q75,45 15,35" stroke="#0ad8ad" stroke-width="2.5" stroke-linecap="round"/>
                        <path class="arrow-head" d="M25,25 L10,35 L23,47" stroke="#0ad8ad" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
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
                        <div class="marquee-item"><img src="assets/empower-1.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-2.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-3.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-4.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-5.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-6.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                    </div>
                    <div class="marquee-group" aria-hidden="true">
                        <div class="marquee-item"><img src="assets/empower-1.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-2.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-3.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-4.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-5.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
                        <div class="marquee-item"><img src="assets/empower-6.png" alt="The Empower Network TV" loading="lazy" decoding="async"></div>
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
            <button class="reviews-arrow reviews-arrow-left" aria-label="Previous Review">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button class="reviews-arrow reviews-arrow-right" aria-label="Next Review">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
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
 
    <!-- Book Promotion Section -->
    <section class="book-promo-sec">
        <div style="flex-grow: 1; display: flex; align-items: center; width: 100%; padding: 4.5rem 0;">
            <div class="container">
                <div class="grid-2">
                    <div class="book-promo-content">
                        <span class="section-tag text-teal">New Book Release</span>
                        <h2 class="book-promo-headline">LIMITATIONS TO LIBERATION</h2>
                        <p class="book-promo-subheadline">Discover the mental models and daily systems that turn constraints into creative freedom. Explore the book below, grab your copy today, and start writing your own story of liberation!</p>
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
                            <img src="assets/losing-mobility.jpg" alt="Losing Mobility and adapting" class="timeline-img" loading="lazy" decoding="async">
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
                            <img src="assets/warrior-story.png" alt="Refusing Defeat and digital creation" class="timeline-img" loading="lazy" decoding="async">
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
                            <span style="font-size: 1rem; color: var(--color-gray-light); line-height: 1.5; display: block;">
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
    <section class="section bg-white" style="padding-bottom: 2rem;">
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
                    <a href="/accessible-aim" class="text-teal">Join AIM Waitlist &rarr;</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Legacy Signature Section -->
    <section class="bg-navy-dark text-center" style="padding: 2rem 0; border-top: 1px solid rgba(0, 209, 193, 0.1);">
        <div class="container">
            <h2 class="legacy-title">Much love, party people!<br>That was awesome. The next one will only be better!</h2>
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
                            <p>Born in St. Louis... quiet, shy, and always watching from the sidelines. I had a beautiful, stable childhood thanks to my parents, David and Alicia (even if I panicked and choked during my very first t-ball game—yikes, sports were definitely not my calling). I preferred drawing and observing... finding quiet ways to explore the world before things started changing.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/childhood-early-years.jpg" alt="Born in St. Louis and childhood years" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Row 2: Image Left, Card Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/around-3rd-4th-grade.jpg" alt="Noticing progressive balance challenges in gym class" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Around 3rd & 4th Grade</div>
                        <div class="timeline-card">
                            <p>Gym class started feeling... different. My lungs burned, my heart raced, and my balance began to slip away. I couldn't walk a straight line or keep up with my peers. Was I just out of shape? Answer: No, something deeper was shifting. Other kids stared and asked why I walked so funny... and I had no answers to give them.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 3: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">The Diagnosis at 14</div>
                        <div class="timeline-card">
                            <p>After years of clinical tests and confusing doctors, the laboratory report came back: Friedrich's ataxia. A progressive neuromuscular condition that slowly chips away at coordination, fine motor skills, and energy. It was a heavy realization... a clear confirmation that my physical parameters were going to change, whether I liked it or not.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/diagnosis-at-14.jpg" alt="Medical diagnosis of Friedrich's ataxia at age 14" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Row 4: Image Left, Card Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/progression-independence-shift.jpg" alt="Transition to wheelchair and adapting daily routines" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Progression & Independence Shift</div>
                        <div class="timeline-card">
                            <p>Transitioning to a wheelchair meant constant adjustments through high school and college. Simple tasks like getting out of bed or cracking open a soda now required help. Did it drain my mental energy? Yes, the fatigue of feeling dependent on my parents was real... but I chose to focus my mind on the creative abilities I still possessed.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 5: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">Finding the Design Path & Faith</div>
                        <div class="timeline-card">
                            <p>I chose to align my life with God's divine plan... learning to see my daily constraints as a gift rather than a curse (some days it takes real effort to see a heavy wheelchair as a package of wrapping paper, but the perspective shift is real). Are constraints a sentence to stop? Answer: No, they are a prompt to build. I live with complete dedication, knowing I can and will share my story and perspective with others to prove that action and success can be achieved regardless of the hand you are dealt.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-faith.png" alt="Finding God's design path and walking by faith" class="timeline-img">
                        </div>
                    </div>
                </div>

                <!-- Row 6: Image Left, Card Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/marchello_story_marketing.jpg?v=20260805-2" alt="Marchello Sciortino holding ClickFunnels Certified Funnel Builder award plaque with partners" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Discovering Digital Marketing & AI</div>
                        <div class="timeline-card">
                            <p>Manual labor was out of the question... so I took my mind to the digital world. I earned my ClickFunnels certification and designed layout systems for partners. When typing became a slow, exhausting nightmare, I discovered AI tools. They acts as my typing speed... letting me build clean code and write stories without physical limits.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 7: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">Today - Writing the Legacy</div>
                        <div class="timeline-card">
                            <p>My physical parameters keep shifting... yet my purpose stays firm. I build websites, write stories, and share keynotes about adapting to constraints. God gave us the creativity to design pathways around our limits... and I am using my remaining abilities to create a lasting legacy for those I love.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/marchello_story_wheelchair.jpg?v=20260805-2" alt="Marchello Sciortino in a wheelchair speaking on stage in front of a presentation screen displaying 'Learning Different'" class="timeline-img">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
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

    <!-- Light Theme Tabbed Services Section -->
    <section class="services-explorer-section" aria-label="Services Portfolio">
        <div class="container">

            <div class="explorer-container">
                
                <!-- Workspace Workspace Pane -->
                <div class="explorer-workspace">
                    
                    <!-- Tab Bar -->
                    <div class="explorer-tab-bar" role="tablist" aria-label="Services Tabs">
                        <button class="explorer-tab active" data-tab="create" role="tab" aria-selected="true" aria-controls="tab-content-create" id="tab-create" tabindex="0">
                            <span>Create</span><span class="explorer-tab-tag">AI & Writing</span>
                        </button>
                        <button class="explorer-tab" data-tab="build" role="tab" aria-selected="false" aria-controls="tab-content-build" id="tab-build" tabindex="-1">
                            <span>Build</span><span class="explorer-tab-tag">Web & Funnels</span>
                        </button>
                        <button class="explorer-tab" data-tab="overcome" role="tab" aria-selected="false" aria-controls="tab-content-overcome" id="tab-overcome" tabindex="-1">
                            <span>Overcome</span><span class="explorer-tab-tag">Coaching</span>
                        </button>
                    </div>

                    <!-- Editor Content Pane -->
                    <div class="explorer-editor-pane">

                        <!-- Content Area -->
                        <div class="explorer-content-area">
                            
                            <!-- Tab Content 1: CREATE -->
                            <div class="explorer-tab-content active" id="tab-content-create" role="tabpanel" aria-labelledby="tab-create">
                                <!-- Row 1: Description & Portfolio (Three Columns) -->
                                <div class="explorer-grid-layout">
                                    <!-- Left Column: 3 Portfolio Squares -->
                                    <div class="explorer-grid-col explorer-grid-left">
                                        <div class="portfolio-card" data-type="video" data-src="assets/videos/the-adventure.mp4" aria-label="Play The Adventure Video" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/videos/the-adventure_cover-art.jpeg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Video</span>
                                                <h4 class="portfolio-title">The Adventure</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="video" data-src="assets/videos/king-zosimus.mp4" aria-label="Play King Zosimus Video" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/videos/king-zosimus_card-image.jpeg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Video</span>
                                                <h4 class="portfolio-title">King Zosimus</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="audio" data-src="assets/chello-ai-music.mp3" data-id="chello-ai-music" aria-label="Play Chello AI Music Audio" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/chello-ai-music_cover-art.jpeg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Audio</span>
                                                <h4 class="portfolio-title">Chello AI Music</h4>
                                                <div class="portfolio-wave">
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Center Column: Text & Button -->
                                    <div class="explorer-grid-col explorer-grid-center">
                                        <div class="explorer-panel-header">
                                            <span class="explorer-panel-subtitle">AI-Powered Creative Strategy</span>
                                            <h2 class="explorer-panel-title">CREATE</h2>
                                        </div>
                                        <p class="explorer-panel-desc">
                                            I use generative AI systems to build customized visual and written creative outputs. Whether you need audio loops, copy packages, or digital graphics, I construct systems that turn raw ideas into active assets.
                                        </p>
                                        <div class="explorer-cta">
                                            <a href="/contact?interest=Create" class="btn btn-teal">Contact me for creating</a>
                                        </div>
                                        <div class="explorer-brand-footer">
                                            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 2rem auto 1rem auto; width: 100%; max-width: 200px;">
                                                <div style="flex: 1; height: 1px; background: rgba(0,0,0,0.1);"></div>
                                                <img src="assets/logo-dark.png" alt="M logo" style="height: 33px; width: auto; opacity: 0.8;">
                                                <div style="flex: 1; height: 1px; background: rgba(0,0,0,0.1);"></div>
                                            </div>
                                            <div style="font-family: var(--font-heading); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-teal); line-height: 1.4;">
                                                Creativity. Technology. Determination.<br>
                                                Unlocking Possibilities. Delivering Results.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Right Column: 3 Portfolio Squares -->
                                    <div class="explorer-grid-col explorer-grid-right">
                                        <div class="portfolio-card" data-type="song" data-src="assets/endgame-shadows.mp3" data-id="endgame-shadows" aria-label="Play Endgame Shadows Song" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/endgame-shadows_cover-art.jpeg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Song</span>
                                                <h4 class="portfolio-title">Endgame Shadows</h4>
                                                <div class="portfolio-wave">
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="image" data-src="assets/muppet-or-man.png" aria-label="View Muppet or Man Image" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/muppet-or-man.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Image</span>
                                                <h4 class="portfolio-title">Muppet or Man</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="image" data-src="assets/paper-discovery.png" aria-label="View Paper Discovery Image" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/paper-discovery.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Image</span>
                                                <h4 class="portfolio-title">Paper Discovery</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 2: Features (Two Columns - 2 Left, 2 Right) -->
                                <div class="explorer-row explorer-features-row">
                                    <div class="explorer-features-col">
                                        <ul class="explorer-bullets-list">
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">💡</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Custom Images & Video</h4>
                                                    <p>Generating custom graphics, promotional videos, and interactive visual content with AI models.</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🎵</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Songs & Brand Jingles</h4>
                                                    <p>Crafting distinct background tunes, melodies, and custom jingles to enrich your message.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="explorer-features-col">
                                        <ul class="explorer-bullets-list">
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">✍️</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Assisted Writing & Copy</h4>
                                                    <p>Writing books, storytelling, and copy scripting using structured AI prompts and voice-dictated editing.</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🧠</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Creative AI Consulting</h4>
                                                    <p>Consulting on customized prompt setups and configurations to simplify your daily writing workflow.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Tab Content 2: BUILD -->
                            <div class="explorer-tab-content" id="tab-content-build" role="tabpanel" aria-labelledby="tab-build">
                                <!-- Row 1: Description & Portfolio (Three Columns) -->
                                <div class="explorer-grid-layout">
                                    <!-- Left Column: 3 Portfolio Squares -->
                                    <div class="explorer-grid-col explorer-grid-left">
                                        <div class="portfolio-card" data-type="image" data-src="assets/clickfunnels-integration-guide.jpg" aria-label="View ClickFunnels 2.0 External Form Integration Guide Image" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/clickfunnels-integration-guide.jpg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Image</span>
                                                <h4 class="portfolio-title">ClickFunnels Integration Guide</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="image" data-src="assets/accessible-aim-membership-site.png" aria-label="View Accessible AIM Membership Site Image" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/accessible-aim-membership-site.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Image</span>
                                                <h4 class="portfolio-title">Accessible AIM Membership Site</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="funnel" data-src="assets/book_sales_funnel_preview.png?v=20260807-3" data-link="https://www.limitationstoliberation.com/" aria-label="View Book Sales Funnel" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/book_sales_funnel_preview.png?v=20260807-3');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Funnel</span>
                                                <h4 class="portfolio-title">Book Sales Funnel</h4>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Center Column: Text & Button -->
                                    <div class="explorer-grid-col explorer-grid-center">
                                        <div class="explorer-panel-header">
                                            <span class="explorer-panel-subtitle">Websites & Digital Ecosystems</span>
                                            <h2 class="explorer-panel-title">BUILD</h2>
                                        </div>
                                        <p class="explorer-panel-desc">
                                            I construct modern web architectures, landing pages, and lead workflows. Using AI-assisted programming tools, I design responsive templates that connect with visitors and support clean automation pipelines.
                                        </p>
                                        <div class="explorer-cta">
                                            <a href="/contact?interest=Build" class="btn btn-teal">Contact me for building</a>
                                        </div>
                                        <div class="explorer-brand-footer">
                                            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 2rem auto 1rem auto; width: 100%; max-width: 200px;">
                                                <div style="flex: 1; height: 1px; background: rgba(0,0,0,0.1);"></div>
                                                <img src="assets/logo-dark.png" alt="M logo" style="height: 33px; width: auto; opacity: 0.8;">
                                                <div style="flex: 1; height: 1px; background: rgba(0,0,0,0.1);"></div>
                                            </div>
                                            <div style="font-family: var(--font-heading); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-teal); line-height: 1.4;">
                                                Creativity. Technology. Determination.<br>
                                                Unlocking Possibilities. Delivering Results.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Right Column: 3 Portfolio Squares -->
                                    <div class="explorer-grid-col explorer-grid-right">
                                         <div class="portfolio-card" data-type="website" data-src="assets/jesus-bello.png" data-link="https://jesus-bello.pages.dev/" aria-label="View Jesus Bello Website" role="button" tabindex="0">
                                             <div class="portfolio-card-bg" style="background-image: url('assets/jesus-bello.png');"></div>
                                             <div class="portfolio-card-overlay"></div>
                                             <div class="portfolio-card-icon">
                                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                             </div>
                                             <div class="portfolio-card-content">
                                                 <span class="portfolio-badge">Website</span>
                                                 <h4 class="portfolio-title">Jesus Bello Website</h4>
                                             </div>
                                         </div>
                                         <div class="portfolio-card" data-type="website" data-src="assets/ai-song-quiz.png" data-link="https://ai-song-quiz-app.pages.dev/" aria-label="View AI Song Quiz App Website" role="button" tabindex="0">
                                             <div class="portfolio-card-bg" style="background-image: url('assets/ai-song-quiz.png');"></div>
                                             <div class="portfolio-card-overlay"></div>
                                             <div class="portfolio-card-icon">
                                                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                             </div>
                                             <div class="portfolio-card-content">
                                                 <span class="portfolio-badge">Website</span>
                                                 <h4 class="portfolio-title">AI Song Quiz App</h4>
                                             </div>
                                         </div>
                                        <div class="portfolio-card" data-type="website" data-src="assets/stlmc-website.png" data-link="https://stlmc-website.pages.dev/" aria-label="View St. Louis Medical Center Website" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/stlmc-website.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Website</span>
                                                <h4 class="portfolio-title">St. Louis Medical Center</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 2: Features (Two Columns - 2 Left, 2 Right) -->
                                <div class="explorer-row explorer-features-row">
                                    <div class="explorer-features-col">
                                        <ul class="explorer-bullets-list">
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">💻</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Web Development</h4>
                                                    <p>Designing and deploying modern web portals, clean layouts, and functional portfolios.</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🚀</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Funnels & Landing Pages</h4>
                                                    <p>Building structured multi-page pathways and lead captures that turn clicks into active queries.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="explorer-features-col">
                                        <ul class="explorer-bullets-list">
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">⚙️</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Workflow Automation</h4>
                                                    <p>Connecting tools and automating administrative tasks using AI to save valuable hours.</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🔒</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Membership Platforms</h4>
                                                    <p>Setting up membership vaults, lesson portals, and automated digital course areas.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            </div>

                            <!-- Tab Content 3: OVERCOME -->
                            <div class="explorer-tab-content" id="tab-content-overcome" role="tabpanel" aria-labelledby="tab-overcome">
                                <!-- Row 1: Description & Portfolio (Three Columns) -->
                                <div class="explorer-grid-layout">
                                    <!-- Left Column: 3 Portfolio Squares -->
                                    <div class="explorer-grid-col explorer-grid-left">
                                        <div class="portfolio-card" data-type="video" data-src="assets/videos/i-hear-you.mp4" aria-label="Play I Hear You Video" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/videos/i-hear-you_thumbnail.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Video</span>
                                                <h4 class="portfolio-title">I Hear You</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="video" data-src="assets/videos/stop-saying-i-cant.mp4" aria-label="Play Stop Saying I Can't Video" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/videos/stop-saying-i-cant_thumbnail.webp');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Video</span>
                                                <h4 class="portfolio-title">Stop Saying I Can't</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="audio" data-src="assets/what-does-it-mean.mp3" data-id="what-does-it-mean" aria-label="Play What Does It Mean Audio" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/what-does-it-mean_cover-art.jpeg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Audio</span>
                                                <h4 class="portfolio-title">What Does It Mean</h4>
                                                <div class="portfolio-wave">
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Center Column: Text & Button -->
                                    <div class="explorer-grid-col explorer-grid-center">
                                        <div class="explorer-panel-header">
                                            <span class="explorer-panel-subtitle">Resilience & Mindset Coaching</span>
                                            <h2 class="explorer-panel-title">OVERCOME</h2>
                                        </div>
                                        <p class="explorer-panel-desc">
                                            I work directly with individuals to shift their perspective and reframe their limitations. Through mindset coaching and constraint-based problem solving, we establish customized habits to convert physical or mental barriers into growth pathways.
                                        </p>
                                        <div class="explorer-cta">
                                            <a href="/contact?interest=Overcome" class="btn btn-teal">Contact me for overcoming</a>
                                        </div>
                                        <div class="explorer-brand-footer">
                                            <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin: 2rem auto 1rem auto; width: 100%; max-width: 200px;">
                                                <div style="flex: 1; height: 1px; background: rgba(0,0,0,0.1);"></div>
                                                <img src="assets/logo-dark.png" alt="M logo" style="height: 33px; width: auto; opacity: 0.8;">
                                                <div style="flex: 1; height: 1px; background: rgba(0,0,0,0.1);"></div>
                                            </div>
                                            <div style="font-family: var(--font-heading); font-size: 0.72rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-teal); line-height: 1.4;">
                                                Creativity. Technology. Determination.<br>
                                                Unlocking Possibilities. Delivering Results.
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Right Column: 3 Portfolio Squares -->
                                    <div class="explorer-grid-col explorer-grid-right">
                                        <div class="portfolio-card" data-type="song" data-src="assets/the-battle-of-the-illusions.mp3" data-id="the-battle-of-the-illusions" aria-label="Play The Battle of the Illusions Song" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/the-battle-of-the-illusions_cover-art.jpeg');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Song</span>
                                                <h4 class="portfolio-title">The Battle of the Illusions</h4>
                                                <div class="portfolio-wave">
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                    <div class="portfolio-wave-bar"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="image" data-src="assets/determined-acceptance.png" aria-label="View Determined Acceptance Image" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/determined-acceptance.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Image</span>
                                                <h4 class="portfolio-title">Determined Acceptance</h4>
                                            </div>
                                        </div>
                                        <div class="portfolio-card" data-type="image" data-src="assets/shift-your-perspective.png" aria-label="View Shift Your Perspective Image" role="button" tabindex="0">
                                            <div class="portfolio-card-bg" style="background-image: url('assets/shift-your-perspective.png');"></div>
                                            <div class="portfolio-card-overlay"></div>
                                            <div class="portfolio-card-icon">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                            </div>
                                            <div class="portfolio-card-content">
                                                <span class="portfolio-badge">Image</span>
                                                <h4 class="portfolio-title">Shift Your Perspective</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Row 2: Features (Two Columns - 2 Left, 2 Right) -->
                                <div class="explorer-row explorer-features-row">
                                    <div class="explorer-features-col">
                                        <ul class="explorer-bullets-list">
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🌱</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Personal Growth</h4>
                                                    <p>Developing actionable goals and personal strategies to build consistent creative momentum.</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🧩</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Constraint-Based Strategy</h4>
                                                    <p>Reframing physical limitations or tight boundaries as structured design constraints for creation.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div class="explorer-features-col">
                                        <ul class="explorer-bullets-list">
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🗣️</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Speaking & Workshops</h4>
                                                    <p>Hosting presentations and active workshops showing the intersection of resilience and AI capability.</p>
                                                </div>
                                            </li>
                                            <li>
                                                <div class="explorer-bullet-icon" aria-hidden="true">🤝</div>
                                                <div class="explorer-bullet-content">
                                                    <h4>Adaptability Consulting</h4>
                                                    <p>Setting up customized voice commands, adaptive workspaces, and productivity hacks.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            <!-- Bottom spacing -->
            <div style="margin-top: 50px;"></div>

        </div>
    </section>
`);

Router.register('/services-create', () => Router.routes['/services']());
Router.register('/services-build', () => Router.routes['/services']());
Router.register('/services-overcome', () => Router.routes['/services']());

// 3. Mission Page Template
Router.register('/mission', () => `
    <style>
    /* Show and restyle the site's default header and footer for luxury dark-theme integration */
    body:has(.mission-immersive-page) .main-header {
        display: block !important;
        position: fixed !important;
        width: 100% !important;
        top: 0 !important;
        left: 0 !important;
        z-index: 1000 !important;
    }

    /* Restyle the header container directly since it holds the backgrounds/borders */
    body:has(.mission-immersive-page) .header-container {
        background: url('assets/bg_marble_dark.png') center/cover no-repeat !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(230, 175, 46, 0.25) !important; /* Elegant gold border */
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5) !important;
    }

    /* Hide teal nav flares */
    body:has(.mission-immersive-page) .nav-flare {
        display: none !important;
    }
    
    body:has(.mission-immersive-page) .main-header * {
        color: #ffffff !important;
    }
    
    body:has(.mission-immersive-page) .main-header .nav-link:hover,
    body:has(.mission-immersive-page) .main-header .nav-link.active {
        color: #e6af2e !important; /* Gold links on hover & active */
        text-shadow: 0 0 8px rgba(230, 175, 46, 0.5) !important;
    }

    body:has(.mission-immersive-page) .main-header .nav-link::after {
        background-color: #e6af2e !important;
        box-shadow: 0 0 8px #e6af2e !important;
    }
    
    body:has(.mission-immersive-page) .instagram-section-link {
        display: none !important;
    }
    
    body:has(.mission-immersive-page) .main-footer {
        background: url('assets/bg_marble_dark.png') center/cover no-repeat !important;
        border-top: 1px solid rgba(230, 175, 46, 0.2) !important;
        display: block !important;
        padding: 5rem 2.5rem 2rem 2.5rem !important;
    }
    
    body:has(.mission-immersive-page) .main-footer * {
        color: rgba(255, 255, 255, 0.7) !important;
    }
    
    body:has(.mission-immersive-page) .main-footer a:hover {
        color: #e6af2e !important; /* Gold on hover */
    }
    
    body:has(.mission-immersive-page) .main-footer .footer-logo-img {
        filter: brightness(1) !important;
    }
    
    /* Reset body padding/background when immersive page is active */
    body:has(.mission-immersive-page) {
        background-color: #0A0A0A !important;
        color: #E5E5E5 !important;
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }
    
    .mission-immersive-page {
        background-color: #0A0A0A;
        color: #E5E5E5;
        font-family: 'Inter', system-ui, sans-serif;
        min-height: 100vh;
        width: 100%;
        position: relative;
        overflow-x: hidden;
        padding-top: 80px; /* offset for fixed header */
    }
    
    /* Cursor styles */
    .immersive-cursor-dot {
        position: fixed;
        top: 0; left: 0;
        width: 8px; height: 8px;
        background-color: #ffffff;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate3d(-50%, -50%, 0);
        mix-blend-mode: difference;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    .immersive-cursor-ring {
        position: fixed;
        top: 0; left: 0;
        width: 30px; height: 30px;
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate3d(-50%, -50%, 0);
        mix-blend-mode: difference;
        opacity: 0;
        transition: opacity 0.3s ease, width 0.3s ease, height 0.3s ease, border-radius 0.3s ease;
    }
    
    /* Ambient Neon Flares */
    .ambient-flare {
        position: absolute;
        width: 45vw;
        height: 45vw;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
        filter: blur(150px);
        opacity: 0.05;
        mix-blend-mode: screen;
        animation: floatFlare 15s infinite alternate ease-in-out;
    }
    
    .flare-gold {
        background: radial-gradient(circle, #e6af2e 0%, transparent 70%);
        top: 5%;
        left: -15%;
    }
    
    .flare-teal {
        background: radial-gradient(circle, #00f2fe 0%, transparent 70%);
        bottom: 15%;
        right: -15%;
        animation-delay: -7.5s;
    }
    
    @keyframes floatFlare {
        0% {
            transform: translate3d(0, 0, 0) scale(1);
        }
        100% {
            transform: translate3d(6vw, 6vh, 0) scale(1.15);
        }
    }
    
    /* Hero Styles */
    #section_01_hero {
        height: 90vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 5rem 2.5rem;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        background: url('assets/bg_marble_dark.png') center/cover no-repeat;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }
    
    .hero-eyebrow {
        font-size: 0.85rem;
        letter-spacing: 0.25em;
        color: rgba(255, 255, 255, 0.5);
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 1.5rem;
        display: inline-block;
    }
    
    .hero-heading {
        font-family: var(--font-heading);
        font-size: clamp(2.3rem, 5.5vw, 4.3rem);
        font-weight: 900;
        color: #ffffff;
        line-height: 1.1;
        margin: 0.5rem 0 2rem 0;
    }
    
    .hero-heading span.char-span {
        display: inline-block;
        opacity: 0;
        transform: translate3d(0, 30px, 0);
        animation: charExplode 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes charExplode {
        to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
        }
    }
    
    .hero-subheading {
        font-size: clamp(1.05rem, 1.8vw, 1.3rem);
        color: rgba(255, 255, 255, 0.6);
        font-weight: 400;
        max-width: 700px;
        line-height: 1.6;
        margin-bottom: 3rem;
    }
    
    .hero-btn {
        align-self: flex-start;
        background: rgba(255, 255, 255, 0.03);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.15);
        padding: 14px 28px;
        font-size: 0.95rem;
        font-weight: 700;
        border-radius: 8px;
        cursor: pointer;
        text-decoration: none;
        transition: border-color 0.3s ease, color 0.3s ease, background 0.3s ease;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
    }
    
    .hero-btn::before {
        content: "";
        position: absolute;
        top: 50%; left: 50%;
        width: 100px; height: 100px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 50%;
        transform: translate3d(-50%, -50%, 0) scale(0);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .hero-btn:hover::before {
        transform: translate3d(-50%, -50%, 0) scale(3.5);
    }
    
    .hero-btn:hover {
        border-color: #ffffff;
        background: rgba(255, 255, 255, 0.06);
    }
    
    /* Interactive Perspective Console Section */
    #section_perspective_console {
        padding: 7rem 2.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        background: url('assets/bg_brushed_aluminum.png') center/cover no-repeat;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
    }
    
    .console-header {
        max-width: 1200px;
        margin: 0 auto 3rem auto;
        width: 100%;
        position: relative;
        z-index: 5;
    }
    
    .console-header h2 {
        font-family: var(--font-heading);
        font-size: 2.5rem;
        font-weight: 800;
        color: #ffffff;
    }
    
    .console-header p {
        color: rgba(255, 255, 255, 0.5);
        margin-top: 1rem;
        max-width: 600px;
        font-size: 1.05rem;
        line-height: 1.6;
    }
    
    .perspective-console-immersive {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        position: relative;
        z-index: 5;
    }
    
    .perspective-console-immersive .console-grid {
        display: grid;
        grid-template-cols: 1fr 2fr;
        gap: 2rem;
    }
    
    @media (max-width: 768px) {
        .perspective-console-immersive .console-grid {
            grid-template-cols: 1fr;
        }
    }
    
    .perspective-console-immersive .console-buttons-column {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .perspective-console-immersive .console-btn {
        background: rgba(15, 15, 15, 0.65);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.6);
        padding: 1.2rem;
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        font-size: 1.05rem;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .perspective-console-immersive .console-btn.active {
        background: #ffffff !important;
        color: #0A0A0A !important;
        border-color: #ffffff !important;
        box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15) !important;
    }
    
    .perspective-console-immersive .console-btn:hover:not(.active) {
        background: rgba(255, 255, 255, 0.05) !important;
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
    }
    
    .perspective-console-immersive .console-display-column {
        background: rgba(15, 15, 15, 0.65);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 3rem;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        min-height: 250px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    
    .perspective-console-immersive .console-display-title {
        font-family: var(--font-heading);
        font-size: 1.6rem;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 1rem;
    }
    
    .perspective-console-immersive .console-display-text {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.7;
    }
    
    /* Bento Features */
    #section_02_bento_features {
        min-height: 100vh;
        width: 100%;
        padding: 7rem 2.5rem;
        box-sizing: border-box;
        border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        display: flex;
        flex-direction: column;
        justify-content: center;
        background: url('assets/bg_gold_glitter.png') center/cover no-repeat;
        position: relative;
    }
    
    .bento-header {
        max-width: 1200px;
        margin: 0 auto 3rem auto;
        width: 100%;
        position: relative;
        z-index: 5;
    }
    
    .bento-header h2 {
        font-family: var(--font-heading);
        font-size: 2.5rem;
        font-weight: 800;
        color: #ffffff;
    }
    
    .bento-header p {
        color: rgba(255, 255, 255, 0.5);
        margin-top: 1rem;
        max-width: 600px;
        font-size: 1.05rem;
        line-height: 1.6;
    }
    
    .bento-grid {
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
        position: relative;
        z-index: 5;
    }
    
    .bento-featured-card {
        background: rgba(15, 15, 15, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 12px;
        padding: 3rem;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        border: 1px solid rgba(230, 175, 46, 0.25) !important; /* gold border tint */
        margin-bottom: 1.5rem;
        width: 100%;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    }
    
    .bento-featured-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 30px rgba(230, 175, 46, 0.08);
    }
    
    .bento-featured-card::before {
        content: "";
        position: absolute;
        top: -1px; left: -1px; right: -1px; bottom: -1px;
        z-index: 1;
        border-radius: 12px;
        background: radial-gradient(200px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(230, 175, 46, 0.15) 0%, transparent 100%);
        pointer-events: none;
    }
    
    .bento-featured-card-content {
        position: relative;
        z-index: 2;
    }
    
    .bento-featured-card h3 {
        font-family: var(--font-heading);
        font-size: 1.7rem;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .bento-featured-card p {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.7;
    }
    
    .bento-columns-3 {
        display: grid;
        grid-template-cols: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        width: 100%;
    }
    
    .bento-card {
        background: rgba(15, 15, 15, 0.6);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 12px;
        padding: 2.5rem;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        border: 1px solid rgba(255, 255, 255, 0.04) !important;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    }
    
    .bento-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .bento-card::before {
        content: "";
        position: absolute;
        top: -1px; left: -1px; right: -1px; bottom: -1px;
        z-index: 1;
        border-radius: 12px;
        background: radial-gradient(150px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(255, 255, 255, 0.12) 0%, transparent 100%);
        pointer-events: none;
    }
    
    .bento-card-content {
        position: relative;
        z-index: 2;
    }
    
    .bento-card h3 {
        font-family: var(--font-heading);
        font-size: 1.4rem;
        font-weight: 800;
        color: #ffffff;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .bento-card p {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.5);
        line-height: 1.6;
    }
    
    /* Narrative Bleed */
    #section_03_narrative_bleed {
        height: 80vh;
        width: 100%;
        background: url('assets/bg_marble_light.png') center/cover no-repeat;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0 2.5rem;
        text-align: center;
        position: relative;
        box-sizing: border-box;
    }
    
    .narrative-metric {
        font-family: monospace;
        font-size: clamp(3rem, 10vw, 7rem);
        font-weight: 900;
        color: #121212; /* Dark text for high contrast on light marble */
        letter-spacing: -0.02em;
        margin-bottom: 1.5rem;
        position: relative;
        z-index: 5;
    }
    
    .narrative-statement {
        font-family: var(--font-heading);
        font-size: clamp(1.4rem, 4vw, 2.2rem);
        font-weight: 700;
        max-width: 900px;
        line-height: 1.4;
        background: linear-gradient(to right, #121212 var(--wipe-pct, 0%), rgba(18, 18, 18, 0.15) var(--wipe-pct, 0%));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        transition: background 0.05s ease-out;
        position: relative;
        z-index: 5;
    }
    
    /* Reduced motion guidelines */
    @media (prefers-reduced-motion: reduce) {
        *, ::before, ::after {
            animation-delay: -1ms !important;
            animation-duration: 1ms !important;
            animation-iteration-count: 1 !important;
            background-attachment: initial !important;
            scroll-behavior: auto !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
        }
        .hero-heading span.char-span {
            opacity: 1 !important;
            transform: none !important;
        }
        .bento-card, .bento-featured-card {
            transform: none !important;
        }
        .narrative-statement {
            background: #121212 !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
        }
        .immersive-cursor-dot, .immersive-cursor-ring {
            display: none !important;
        }
    }
    </style>
    
    <div class="mission-immersive-page">
        <!-- Ambient Background Flares (Cinematic Glows) -->
        <div class="ambient-flare flare-gold"></div>
        <div class="ambient-flare flare-teal"></div>
        
        <!-- 1. Hero Section -->
        <header id="section_01_hero">
            <!-- Curved background gold lines using SVG curves -->
            <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25; z-index: 2;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="#e6af2e" stroke-width="0.3" />
            </svg>
            <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25; z-index: 2;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="#e6af2e" stroke-width="0.3" />
            </svg>

            <div style="position: relative; z-index: 5;">
                <span class="hero-eyebrow">THE NEXT PARADIGM</span>
                <h1 class="hero-heading">
                    Architecting Digital Momentum
                </h1>
                <p class="hero-subheading">
                    I teach creators how to turn limits into strategic leverage, live with a positive warrior mindset, and build highly-converting systems in the digital marketplace.
                </p>
                <a href="#section_perspective_console" class="hero-btn" data-magnetic="true">
                    Explore the Canvas
                </a>
            </div>
        </header>
        
        <!-- 2. Perspective Reframer Console Section -->
        <section id="section_perspective_console">
            <div class="console-header">
                <span class="hero-eyebrow" style="display: block; margin-bottom: 0.5rem;">LET'S TAKE ACTION</span>
                <h2>The Perspective Reframer</h2>
                <p>
                    Constraints aren't walls; they are design parameters. Select a constraint below to see how it can be reframed into your greatest competitive advantage!
                </p>
            </div>
            
            <div class="perspective-console-immersive">
                <div class="console-grid">
                    <div class="console-buttons-column">
                        <button class="console-btn active" data-constraint="physical" data-magnetic="true">
                            <span>🎯</span> Physical Limits
                        </button>
                        <button class="console-btn" data-constraint="time" data-magnetic="true">
                            <span>⏳</span> Limited Time
                        </button>
                        <button class="console-btn" data-constraint="tech" data-magnetic="true">
                            <span>💻</span> No Tech Background
                        </button>
                        <button class="console-btn" data-constraint="audience" data-magnetic="true">
                            <span>📣</span> Small Audience
                        </button>
                    </div>
                    
                    <div class="console-display-column">
                        <div id="console-loader" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 10, 0.95); justify-content: center; align-items: center; z-index: 10;">
                            <span style="color: #ffffff; font-family: var(--font-heading); font-weight: bold; animation: pulse-slow 1s infinite alternate; font-size: 1rem; letter-spacing: 0.15em;">REFRAMING...</span>
                        </div>
                        <h4 id="console-display-title" class="console-display-title">The Constraint Advantage</h4>
                        <p id="console-display-text" class="console-display-text">
                            Physical boundaries force me to preserve energy and leverage assistants. By using voice-driven automation, my AI digital twins, and structured workflows, I save my physical coordination while multiplying my digital leverage.
                        </p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- 3. Bento Pillars Section -->
        <section id="section_02_bento_features">
            <!-- Curved background gold lines using SVG curves -->
            <svg style="position: absolute; left: 0; top: 10%; height: 80%; width: 220px; pointer-events: none; opacity: 0.15; z-index: 2;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80" fill="none" stroke="#e6af2e" stroke-width="0.3" />
            </svg>
            <svg style="position: absolute; right: 0; top: 10%; height: 80%; width: 220px; pointer-events: none; opacity: 0.15; z-index: 2;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80" fill="none" stroke="#e6af2e" stroke-width="0.3" />
            </svg>

            <div class="bento-header">
                <span class="hero-eyebrow" style="display: block; margin-bottom: 0.5rem;">Core Disciplines</span>
                <h2>What I Teach</h2>
                <p>My core lessons and foundations to turn constraints into digital momentum and strategic freedom.</p>
            </div>
            
            <div class="bento-grid">
                <!-- Faith Featured Card (Gold Light Sweep) -->
                <div class="bento-featured-card">
                    <div class="bento-featured-card-content">
                        <h3><span>🙏</span> Faith-Driven Inspiration</h3>
                        <p>
                            All gratitude, respect, and honor go to God as the guide of my journey. Every digital system I build, every lesson I share, and everything I am able to do is dedicated to honoring Him. Inspiration is the name of the game—God is so good, providing me with a path of clarity and power to actively lift up and inspire others.
                        </p>
                    </div>
                </div>
                
                <div class="bento-columns-3">
                    <div class="bento-card">
                        <div class="bento-card-content">
                            <h3><span>🎯</span> The Constraint Advantage</h3>
                            <p>A limit is not a roadblock; it is a design parameter. Physical or environmental constraints force me to filter out noise, simplify layouts, and focus only on creating the highest-value digital solutions.</p>
                        </div>
                    </div>
                    <div class="bento-card">
                        <div class="bento-card-content">
                            <h3><span>⚡</span> Positive Mindset</h3>
                            <p>Warrior acceptance means accepting reality today, stopping excuses, and choosing to build with what is left in my hands. My joyful, determined attitude is the spark that keeps my projects consistent.</p>
                        </div>
                    </div>
                    <div class="bento-card">
                        <div class="bento-card-content">
                            <h3><span>🚀</span> Digital Marketplace</h3>
                            <p>I build clean online funnels, custom landing pages, and AI-driven automation systems. Mastering these digital skills allows me to monetize my creativity and scale my projects without boundaries.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- 4. Narrative Bleed Section -->
        <section id="section_03_narrative_bleed">
            <div class="narrative-metric">0.00ms</div>
            <p class="narrative-statement">
                Limits are design parameters, not barriers. We tether constraint directly to strategic leverage.
            </p>
        </section>
    </div>
`);
// 5. Speaking Page Template
Router.register('/speaking', () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const birthYear = 1996;
    const birthMonth = 5;
    const birthDay = 23;
    let initialAge = currentYear - birthYear;
    const hasHadBday = (now.getMonth() > birthMonth) || (now.getMonth() === birthMonth && now.getDate() >= birthDay);
    if (!hasHadBday) initialAge--;

    const isToday = (now.getMonth() === birthMonth && now.getDate() === birthDay);
    let targetBday;
    if (now.getMonth() > birthMonth || (now.getMonth() === birthMonth && now.getDate() > birthDay) || isToday) {
        targetBday = new Date(currentYear + 1, birthMonth, birthDay, 0, 0, 0, 0);
    } else {
        targetBday = new Date(currentYear, birthMonth, birthDay, 0, 0, 0, 0);
    }
    const diff = Math.max(0, targetBday.getTime() - now.getTime());
    const initDays = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
    const initHours = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    const initMins = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const initSecs = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
    const targetYear = targetBday.getFullYear();

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
            <span class="section-tag text-teal">Speaking</span>
            <h1 style="color: white;">Book Me to Speak</h1>
            <p class="section-desc" style="color: var(--color-gray-light); max-width: 750px; margin: 0 auto;">
                I deliver practical keynotes on how to reframe daily constraints, find clarity in the chaos, and use AI as an accessibility bridge to build creative outcomes and professional momentum. Through honest sharing and live voice-building, I show audiences how to adapt when their perspective shifts and turn limits into starting lines.
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
                    <div class="aim-video-wrapper" id="speaking-video-wrapper">
                        <video id="speaking-video" autoplay muted loop playsinline poster="assets/hero-bg.jpg">
                            <source src="assets/videos/speaking-reel.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div class="aim-sound-badge" id="speaking-sound-badge">
                            <img src="assets/click-to-turn-on-sound.png" alt="Click to turn on sound">
                        </div>
                        <div class="aim-center-play" id="speaking-center-play">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" fill="currentColor"/>
                            </svg>
                        </div>
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
                    <div class="portfolio-card" data-type="video" data-src="speaking-portfolio/Videos/Standing Ovation.mp4" aria-label="Play Standing Ovation Keynote Video" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('speaking-portfolio/Images/standing-ovation-cover.jpg');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Video</span>
                            <h4 class="portfolio-title">Standing Ovation</h4>
                        </div>
                    </div>
                    <!-- Item 2: Video -->
                    <div class="portfolio-card" data-type="video" data-src="speaking-portfolio/Videos/Chello AI.mp4" aria-label="Play Chello AI Presentation Video" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('assets/chello-ai-twin.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Video</span>
                            <h4 class="portfolio-title">Chello AI Presentation</h4>
                        </div>
                    </div>
                    <!-- Item 3: Song -->
                    <div class="portfolio-card" data-type="song" data-src="speaking-portfolio/Songs/Chosen Anyway.mp3" aria-label="Play Chosen Anyway Song" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('speaking-portfolio/Songs/chosen-anyway_cover-art.png');"></div>
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
                    <!-- Item 4: Song -->
                    <div class="portfolio-card" data-type="song" data-src="speaking-portfolio/Songs/Winning Despite The Odds.mp3" aria-label="Play Winning Despite The Odds Song" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('speaking-portfolio/Songs/winning-despite-the-odds_cover-art.png');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Song</span>
                            <h4 class="portfolio-title">Winning Despite The Odds</h4>
                            <div class="portfolio-wave">
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                            </div>
                        </div>
                    </div>
                    <!-- Item 5: Image -->
                    <div class="portfolio-card" data-type="image" data-src="speaking-portfolio/Images/grateful-for-your-guidance.jpg" aria-label="View Grateful Guidance Image" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('speaking-portfolio/Images/grateful-for-your-guidance.jpg');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Image</span>
                            <h4 class="portfolio-title">Grateful Guidance</h4>
                        </div>
                    </div>
                    <!-- Item 6: Image -->
                    <div class="portfolio-card" data-type="image" data-src="speaking-portfolio/Images/refraiming-resilience.jpeg" aria-label="View Reframing Resilience Image" role="button" tabindex="0">
                        <div class="portfolio-card-bg" style="background-image: url('speaking-portfolio/Images/refraiming-resilience.jpeg');"></div>
                        <div class="portfolio-card-overlay"></div>
                        <div class="portfolio-card-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        </div>
                        <div class="portfolio-card-content">
                            <span class="portfolio-badge">Image</span>
                            <h4 class="portfolio-title">Reframing Resilience</h4>
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
                            I am a web designer, AI developer, and speaker. When Friedreich's ataxia changed my physical balance, God redirected my path to show that His purpose is never limited. Today, I accept my constraints as a gift of perspective, honoring God with every project. I design highly-converting web layouts and develop custom AI systems to write code and bypass physical boundaries. AI creation is my cognitive prosthetic, but my heart is dedicated to serving God's calling. I speak to show how combining modern tools, digital design, and faith in His plan allows us to build what is possible.
                        </p>
                    </div>
                    <div>
                        <span class="section-tag text-teal" style="font-size: 0.8rem; margin-bottom: 5px;">Long Bio</span>
                        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--color-gray-light);">
                            My journey began in St. Louis, where a diagnosis of Friedreich's ataxia at age 14 gradually took away my physical balance and coordination. But instead of focusing on what was lost, I chose to accept what God left in my hands. I realized that my changing physical boundary was simply a redirection toward a greater digital calling, showing that His grace is sufficient in our weakness.<br><br>
                            I built my career around modern web design, crafting interfaces and ClickFunnels architectures that convert. To scale past physical limitations, I stepped into AI development. By building custom API pipelines and training AI assistants, I turn complex programming concepts into working software. This blend of web design and AI creation acts as my cognitive prosthetic, allowing me to build solutions that run faster.<br><br>
                            Yet, technology is never the hero of my story. Every design and line of code is proof of God's love and sovereignty. I believe our talents and the tools we build are blessings to be accepted and used for His glory. Today, I speak to inspire audiences to trust the purpose God has designed for them.
                        </p>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <!-- Speaker Age & Live Birthday Tracker Card -->
                    <div class="card speaker-age-card" style="border: 1px solid rgba(0, 209, 193, 0.35); background: linear-gradient(145deg, rgba(16, 26, 46, 0.95), rgba(10, 16, 30, 0.98)); color: white; padding: 1.5rem; border-radius: var(--radius-md); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3); margin: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
                            <span class="section-tag text-teal" style="margin: 0; font-size: 0.8rem; letter-spacing: 0.1em;">SPEAKER PROFILE</span>
                            <span class="bday-pill-badge" style="background: rgba(10, 216, 173, 0.12); color: var(--color-teal); border: 1px solid rgba(10, 216, 173, 0.3); font-size: 0.75rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                                <span class="bday-pulse-dot"></span> Live Age Tracker
                            </span>
                        </div>
                        
                        <div class="speaker-age-hero" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-sm); padding: 16px 20px;">
                            <div>
                                <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-gray-light); display: block; margin-bottom: 2px;">Current Age</span>
                                <div style="display: flex; align-items: baseline; gap: 8px;">
                                    <span id="speaker-current-age" class="speaker-age-number" style="font-size: 2.5rem; font-weight: 800; font-family: var(--font-heading); color: #FFFFFF; line-height: 1; text-shadow: 0 0 20px rgba(10, 216, 173, 0.5);">${initialAge}</span>
                                    <span style="font-size: 1.05rem; font-weight: 700; color: var(--color-teal); text-transform: uppercase; letter-spacing: 0.05em;">Years Old</span>
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <span style="font-size: 0.75rem; color: var(--color-gray-light); display: block;">Birthdate</span>
                                <strong style="font-size: 0.88rem; color: #FFFFFF; font-family: var(--font-heading);">June 23, 1996</strong>
                            </div>
                        </div>

                        <!-- Birthday Celebration Banner (Shown if today is June 23) -->
                        <div id="bday-celebration" class="bday-celebration-banner" style="${isToday ? 'display: block;' : 'display: none;'} background: linear-gradient(90deg, #ff6b35, #0ad8ad); color: white; padding: 12px 16px; border-radius: var(--radius-sm); text-align: center; font-weight: 700; font-size: 0.95rem; margin-top: 14px; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4); animation: bday-glow 2s infinite alternate;">
                            🎉 Happy Birthday Marchello! Turning <span id="bday-turning-age">${initialAge}</span> Today! 🎂🎈
                        </div>
                    </div>

                    <div class="card bg-navy" style="border: 1px solid rgba(0, 209, 193, 0.2); color: white; padding: 1.5rem; margin: 0;">
                        <span class="section-tag text-teal">Media Assets</span>
                        <h3 class="text-white">Download Media Kit</h3>
                        <p style="font-size: 0.9rem; margin-bottom: 12px; color: var(--color-gray-light);">Select files to download for event programs, promotional flyers, or articles.</p>
                        <ul style="list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.25rem;">
                            <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
                                <div>
                                    <strong style="display:block; color: white; font-size: 0.9rem;">Speaking Resume</strong>
                                    <span style="font-size:0.75rem; color:rgba(255, 255, 255, 0.7);">PDF (542 KB)</span>
                                </div>
                                <a href="assets/speaker_resume.pdf" download="Marchello_Sciortino_Speaking_Resume.pdf" class="btn btn-teal btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">Download</a>
                            </li>
                            <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
                                <div>
                                    <strong style="display:block; color: white; font-size: 0.9rem;">Speaking One-Sheet</strong>
                                    <span style="font-size:0.75rem; color:rgba(255, 255, 255, 0.7);">PNG (1.7 MB)</span>
                                </div>
                                <a href="assets/speaker_1_sheet.png" download="Speaker_1_Sheet.png" class="btn btn-teal btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">Download</a>
                            </li>
                            <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 6px;">
                                <div>
                                    <strong style="display:block; color: white; font-size: 0.9rem;">Headshot Gallery</strong>
                                    <span style="font-size:0.75rem; color:rgba(255, 255, 255, 0.7);">ZIP (9.6 MB)</span>
                                </div>
                                <a href="assets/Headshots.zip" download="Headshots.zip" class="btn btn-teal btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">Download</a>
                            </li>
                            <li style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <strong style="display:block; color: white; font-size: 0.9rem;">Marchello Logo Assets</strong>
                                    <span style="font-size:0.75rem; color:rgba(255, 255, 255, 0.7);">ZIP (39 KB)</span>
                                </div>
                                <a href="assets/Marchello_Sciortino_Logo_Assets.zip" download="Marchello_Sciortino_Logo_Assets.zip" class="btn btn-teal btn-sm" style="padding: 4px 10px; font-size: 0.8rem;">Download</a>
                            </li>
                        </ul>

                        <!-- Media kit preview gallery inside the card -->
                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 1rem;">
                            <h4 class="text-white" style="margin-bottom: 3px; font-family: var(--font-heading); font-size: 1rem;">Preview Speaker Materials</h4>
                            <p style="font-size: 0.8rem; color: var(--color-gray-light); margin-bottom: 8px;">Preview of assets included in the Download Media Kit package.</p>
                            <div class="media-gallery-grid" style="grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 0.25rem;">
                                <div class="gallery-item">
                                    <img src="assets/speaker_resume.png" alt="Speaking Resume" title="Speaking Resume" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/speaker_1_sheet.png" alt="Speaking One-Sheet" title="Speaking One-Sheet" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/headshot_1.jpg" alt="Headshot 1" title="Headshot 1" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/headshot_2.jpg" alt="Headshot 2" title="Headshot 2" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/headshot_3.jpg" alt="Headshot 3" title="Headshot 3" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/headshot_4.jpg" alt="Headshot 4" title="Headshot 4" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/marchello_logo_dark.png" alt="Marchello Sciortino Logo Dark" title="Marchello Sciortino Logo Dark" loading="lazy" decoding="async">
                                </div>
                                <div class="gallery-item">
                                    <img src="assets/marchello_logo_light.png" alt="Marchello Sciortino Logo Light" title="Marchello Sciortino Logo Light" loading="lazy" decoding="async">
                                </div>
                            </div>
                        </div>
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
`;
});

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
                    
                    <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-gray-steel); margin-bottom: 0; font-weight: 500;">
                        Use the interactive chat simulator to ask preset questions about my story, design process, and services.
                    </p>
                </div>
                
            </div>
        </div>
    </section>

    <!-- Section 2: Two-Column Chat Simulator & Guide -->
    <section id="chat-simulator-section" class="section bg-navy-light text-white" style="padding: 5rem 0; border-top: 1px solid rgba(0, 209, 193, 0.1); border-bottom: 1px solid rgba(0, 209, 193, 0.1);">
        <div class="container">
            <div class="grid-2" style="align-items: center; gap: var(--spacing-xl);">
                
                <!-- Left Column: Interactive Chat Simulator -->
                <div style="display: flex; flex-direction: column; justify-content: center; width: 100%;">
                    <div class="chat-window" id="companion-chat-window" style="width: 100%; display: flex; flex-direction: column; box-shadow: var(--shadow-lg);">
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
                        
                        <div class="chat-messages" id="chat-messages" style="flex: 1; min-height: 250px; max-height: 320px; overflow-y: auto; padding: 20px;">
                            <!-- Initial message -->
                            <div class="message-bubble incoming">
                                Hello! I am ChelloAI, my digital companion. Select any question below to explore my stories and tools.
                            </div>
                        </div>
                        
                        <div class="chat-suggestions" style="padding: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: rgba(4, 15, 24, 0.4);">
                            <p class="chat-suggestions-title" style="margin-bottom: 12px; font-weight: 600; color: var(--color-white);">Select a topic to ask:</p>
                            <div class="suggestions-grid" id="chat-suggestions-grid">
                                <!-- Pre-baked buttons dynamically load here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column: Explanatory Copy & How to Chat -->
                <div style="display: flex; flex-direction: column; justify-content: center;">
                    <span class="section-tag text-teal" style="display: inline-block; margin-bottom: 8px;">Interactive Text Guide</span>
                    <h3 class="text-white" style="font-size: 2rem; margin-bottom: var(--spacing-sm);">How to Interact with ChelloAI</h3>
                    
                    <p style="font-size: 1.05rem; line-height: 1.65; color: var(--color-gray-light); margin-bottom: var(--spacing-md);">
                        The chat simulator allows you to explore Marchello's digital hub using pre-baked prompt combinations. Select a suggestion button to generate immediate answers on topic areas without having to type.
                    </p>
                    
                    <div style="display: flex; flex-direction: column; gap: 20px; margin-top: 10px;">
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(10, 216, 173, 0.1); border: 1px solid var(--color-teal); display: flex; align-items: center; justify-content: center; color: var(--color-teal); font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; margin-top: 2px;">1</div>
                            <div>
                                <h4 style="color: var(--color-white); font-size: 1.1rem; margin-bottom: 4px;">Choose a Suggested Topic</h4>
                                <p style="font-size: 0.95rem; color: rgba(247, 250, 252, 0.72); margin: 0; line-height: 1.45;">Click any button in the suggestion panel to send a question directly to ChelloAI.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(10, 216, 173, 0.1); border: 1px solid var(--color-teal); display: flex; align-items: center; justify-content: center; color: var(--color-teal); font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; margin-top: 2px;">2</div>
                            <div>
                                <h4 style="color: var(--color-white); font-size: 1.1rem; margin-bottom: 4px;">Receive Instantly Amplified Answers</h4>
                                <p style="font-size: 0.95rem; color: rgba(247, 250, 252, 0.72); margin: 0; line-height: 1.45;">Read concepts regarding Marchello's story, background, custom prompt workflows, and design services.</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 15px; align-items: flex-start;">
                            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(10, 216, 173, 0.1); border: 1px solid var(--color-teal); display: flex; align-items: center; justify-content: center; color: var(--color-teal); font-weight: 700; font-family: var(--font-heading); flex-shrink: 0; margin-top: 2px;">3</div>
                            <div>
                                <h4 style="color: var(--color-white); font-size: 1.1rem; margin-bottom: 4px;">Explore Custom AI Integrations</h4>
                                <p style="font-size: 0.95rem; color: rgba(247, 250, 252, 0.72); margin: 0; line-height: 1.45;">See how structured rules enable a conversational agent to behave with brand fidelity and high-fidelity output.</p>
                            </div>
                        </div>
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
                            <span style="font-size: 1rem; color: var(--color-navy); line-height: 1.5; display: block;">
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
                    <img src="assets/contact_hero.png" alt="Marchello Sciortino" style="width: 100%; border-radius: var(--radius-lg); box-shadow: var(--shadow-md); border: 1px solid var(--color-gray-border); margin-bottom: 20px; object-fit: cover;" fetchpriority="high" decoding="async">
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

// 14. Free Gifts Data Registry & Template System
const FREE_GIFTS_DATA = [
    {
        id: "win-anyway",
        slug: "win-anyway",
        title: "Win Anyway",
        type: "Music Album",
        badge: "Available Now",
        meta_title: "Win Anyway | Free Music Album by Marchello Sciortino",
        meta_desc: "Winning Despite the Odds — The official 10-track album by Marchello Sciortino. Stream and download all 10 original anthems of faith, resilience, and triumph.",
        bullets: [
            "10 original inspirational tracks born from faith & resilience.",
            "Anthems of overcoming odds and turning limitations into agency.",
            "Stream every track online or download the full 10-track album."
        ],
        cover_image: "/assets/free-gifts/win_anyway_cover.jpg",
        file_url: "/win-anyway",
        album_zip_url: "#download-full-album",
        button_label: "Win Anyway Album",
        direct_page_only: true,
        tracks: [
            {
                number: 1,
                title: "Win Anyway",
                src: "/assets/free-gifts/win-anyway/01-win-anyway.mp3",
                cover: "/assets/free-gifts/win-anyway/01-win-anyway-cover.png",
                duration: "4:37"
            },
            {
                number: 2,
                title: "Let Them Doubt",
                src: "/assets/free-gifts/win-anyway/02-let-them-doubt.mp3",
                cover: "/assets/free-gifts/win-anyway/02-let-them-doubt-cover.png",
                duration: "3:25"
            },
            {
                number: 3,
                title: "Little Wins",
                src: "/assets/free-gifts/win-anyway/03-little-wins.mp3",
                cover: "/assets/free-gifts/win-anyway/03-little-wins-cover.png",
                duration: "1:59"
            },
            {
                number: 4,
                title: "Make Room",
                src: "/assets/free-gifts/win-anyway/04-make-room.mp3",
                cover: "/assets/free-gifts/win-anyway/04-make-room-cover.png",
                duration: "2:51"
            },
            {
                number: 5,
                title: "No Permission",
                src: "/assets/free-gifts/win-anyway/05-no-permission.mp3",
                cover: "/assets/free-gifts/win-anyway/05-no-permission-cover.png",
                duration: "2:31"
            },
            {
                number: 6,
                title: "Not Today",
                src: "/assets/free-gifts/win-anyway/06-not-today.mp3",
                cover: "/assets/free-gifts/win-anyway/06-not-today-cover.png",
                duration: "2:44"
            },
            {
                number: 7,
                title: "Play the Hand",
                src: "/assets/free-gifts/win-anyway/07-play-the-hand.mp3",
                cover: "/assets/free-gifts/win-anyway/07-play-the-hand-cover.png",
                duration: "2:05"
            },
            {
                number: 8,
                title: "Pressure Makes Diamonds",
                src: "/assets/free-gifts/win-anyway/08-pressure-makes-diamonds.mp3",
                cover: "/assets/free-gifts/win-anyway/08-pressure-makes-diamonds-cover.png",
                duration: "2:16"
            },
            {
                number: 9,
                title: "Still Rising",
                src: "/assets/free-gifts/win-anyway/09-still-rising.mp3",
                cover: "/assets/free-gifts/win-anyway/09-still-rising-cover.png",
                duration: "3:02"
            },
            {
                number: 10,
                title: "The Next Step",
                src: "/assets/free-gifts/win-anyway/10-the-next-step.mp3",
                cover: "/assets/free-gifts/win-anyway/10-the-next-step-cover.png",
                duration: "3:02"
            }
        ]
    },
    {
        id: "from-idea-to-free-product",
        slug: "from-idea-to-free-product",
        title: "From Idea to Free Product",
        type: "PDF Guide",
        badge: "Available Now",
        meta_title: "From Idea to Free Product | Free PDF Guide by Marchello Sciortino",
        meta_desc: "How I create PDFs, images, checklists, worksheets, e-books, and downloads through creative amplification.",
        bullets: [
            "Turning ideas into high-value digital assets.",
            "PDFs, checklists, worksheets & e-book creation.",
            "Creative amplification download framework."
        ],
        cover_image: "/assets/free-gifts/From_Idea_to_Free_Product_cover.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/From_Idea_to_Free_Product_Marchello_Sciortino.pdf",
        button_label: "Download PDF"
    },
    {
        id: "10-ways-to-win",
        slug: "10-ways-to-win",
        title: "10 Ways to Win Despite the Odds",
        type: "PDF Guide",
        badge: "Available Now",
        meta_title: "10 Ways to Win Despite the Odds | Free PDF Guide by Marchello Sciortino",
        meta_desc: "Rise with purpose through faith & resilience, 10 actionable principles to overcome obstacles, and leveraging creativity, support, and AI tools.",
        bullets: [
            "Rise with purpose through faith & resilience.",
            "10 actionable principles to overcome obstacles.",
            "Leveraging creativity, support, and AI tools."
        ],
        cover_image: "/assets/free-gifts/10_Ways_to_Win_Despite_the_Odds_cover.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/10_Ways_to_Win_Despite_the_Odds_Marchello_Sciortino.pdf",
        button_label: "Download PDF"
    },
    {
        id: "turn-a-still-ad-into-motion",
        slug: "turn-a-still-ad-into-motion",
        title: "Turn a Still Ad Into Motion",
        type: "AI Video Guide",
        badge: "Available Now",
        meta_title: "Turn a Still Ad Into Motion | Free AI Guide by Marchello Sciortino",
        meta_desc: "Simple ad-to-video workflow with Higgsfield AI, step-by-step Marketing Studio animation process, and transforming static image ads into dynamic motion.",
        bullets: [
            "Simple ad-to-video workflow with Higgsfield AI.",
            "Step-by-step Marketing Studio animation process.",
            "Transforming static image ads into dynamic motion."
        ],
        cover_image: "/assets/free-gifts/creative_amplification_higgsfield_guide_cover.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/creative_amplification_higgsfield_guide.pdf",
        button_label: "Download Guide"
    },
    {
        id: "creative-amplification",
        slug: "creative-amplification",
        title: "Creative Amplification Through AI",
        type: "PDF Guide",
        badge: "Available Now",
        meta_title: "Creative Amplification Through AI | Free Download by Marchello Sciortino",
        meta_desc: "Principles of Articulated Inspiration, turning constraints into strategic leverage, and practical prompt configurations for creators.",
        bullets: [
            "Principles of Articulated Inspiration.",
            "Turning constraints into strategic leverage.",
            "Practical prompt configurations for creators."
        ],
        cover_image: "/assets/free-gifts/creative_amplification_cover.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/Creative_amplification_through_AI.pdf",
        button_label: "Download PDF"
    },
    {
        id: "digital-flow-audit",
        slug: "digital-flow-audit",
        title: "Digital Flow Audit Checklist",
        type: "Interactive Checklist",
        badge: "Available Now",
        meta_title: "Digital Flow Audit Checklist | Free Download by Marchello Sciortino",
        meta_desc: "ADA accessibility compliance audit, speed & user experience friction check, and landing page conversion optimization.",
        bullets: [
            "ADA accessibility compliance audit.",
            "Speed & user experience friction check.",
            "Landing page conversion optimization."
        ],
        cover_image: "/assets/free-gifts/Digital_Flow_Audit_cover_image.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/Digital_Flow_Audit_Checklist_Enhanced.pdf",
        button_label: "Download Checklist"
    },
    {
        id: "ai-accessibility-commands",
        slug: "ai-accessibility-commands",
        title: "AI Accessibility Commands",
        type: "Prompt Cheat Sheet",
        badge: "Available Now",
        meta_title: "AI Accessibility Commands | Free Guide by Marchello Sciortino",
        meta_desc: "Sketch notebook prompt cheat sheet, voice transcription guide templates, and configuring AI as a cognitive prosthetic.",
        bullets: [
            "Sketch notebook prompt cheat sheet.",
            "Voice transcription guide templates.",
            "Configuring AI as a cognitive prosthetic."
        ],
        cover_image: "/assets/free-gifts/Prompt_Cheat_Sheat_cover_image.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/Prompt_Cheat_Sheet_Sketch_Notebook_Edition.pdf",
        button_label: "Download Guide"
    },
    {
        id: "win-reframe-matrix",
        slug: "win-reframe-matrix",
        title: "W.I.N. Reframe Matrix",
        type: "Ebook & Worksheet",
        badge: "Available Now",
        meta_title: "W.I.N. Reframe Matrix | Free Ebook by Marchello Sciortino",
        meta_desc: "Reflection grid for active constraints, breaking mental friction loops, and custom tactical action plan builder.",
        bullets: [
            "Reflection grid for active constraints.",
            "Breaking mental friction loops.",
            "Custom tactical action plan builder."
        ],
        cover_image: "/assets/free-gifts/WIN_Reframe_Matrix_cover_image.png",
        file_url: "https://www.marchellosciortino.com/assets/free-gifts/WIN_Reframe_Matrix_Ebook_by_Marchello_Sciortino.pdf",
        button_label: "Download Ebook"
    }
];

// Free Gifts & Free Library Main Grid Template
const freeGiftsTemplate = () => {
    const cardsHtml = FREE_GIFTS_DATA.map((gift, index) => {
        const isDirectPage = gift.direct_page_only || (gift.file_url && gift.file_url.startsWith('/') && !gift.file_url.endsWith('.pdf'));
        return `
        <!-- Item ${index + 1}: ${gift.title} -->
        <div class="teaser-card" id="${gift.slug}">
            <div class="card-cover-wrapper">
                <a href="/${gift.slug}" style="display: block; width: 100%; height: 100%;">
                    <img src="${gift.cover_image}" alt="${gift.title} Cover" class="card-cover-img">
                </a>
                <span class="card-status-badge active">&#10004; ${gift.badge}</span>
            </div>
            <div class="teaser-card-body">
                <h3 class="teaser-card-title">
                    <a href="/${gift.slug}" style="color: inherit; text-decoration: none;">${gift.title}</a>
                </h3>
                <ul class="teaser-bullets">
                    ${gift.bullets.map(b => `<li>${b}</li>`).join('')}
                </ul>
                ${isDirectPage ? `
                    <a href="/${gift.slug}" class="btn-download-trigger" data-title="${gift.title}">
                        ${gift.button_label} &rarr;
                    </a>
                ` : `
                    <a href="${gift.file_url}" target="_blank" rel="noopener noreferrer" class="btn-download-trigger js-spa-download-btn" data-title="${gift.title}" data-file="${gift.file_url}">
                        ${gift.button_label}
                    </a>
                `}
                <div class="teaser-card-footer-actions">
                    <button type="button" class="btn-card-share js-copy-share-btn" data-share-url="https://marchellosciortino.com/${gift.slug}" title="Copy direct link to share this resource">
                        🔗 Share Link
                    </button>
                    <a href="/${gift.slug}" class="btn-card-details">
                        Direct Page &rarr;
                    </a>
                </div>
            </div>
        </div>
    `;
    }).join('');

    return `
    <style>
        .teaser-lib-wrapper {
            background-color: #f8fafc;
            color: #475569;
            padding: 50px 0 90px;
        }

        .teaser-hero-section {
            text-align: center;
            margin-bottom: 40px;
        }

        .teaser-hero-tag {
            color: #0ad8ad;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 12px;
            display: inline-block;
        }

        .teaser-hero-title {
            color: #0f172a;
            font-family: var(--font-heading);
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0 0 16px;
            line-height: 1.25;
        }

        .teaser-hero-desc {
            max-width: 680px;
            margin: 0 auto;
            color: #475569;
            font-size: 1.05rem;
            line-height: 1.65;
        }

        .teaser-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 28px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .teaser-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
            transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s;
            position: relative;
        }

        .teaser-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 35px rgba(10, 216, 173, 0.15);
            border-color: #0ad8ad;
        }

        .card-cover-wrapper {
            position: relative;
            width: 100%;
            height: 220px;
            background: #f1f5f9;
            overflow: hidden;
            border-bottom: 1px solid #e2e8f0;
        }

        .card-cover-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .teaser-card:hover .card-cover-img {
            transform: scale(1.05);
        }

        .card-status-badge {
            position: absolute;
            top: 12px;
            right: 12px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            color: #0f172a;
            font-size: 0.72rem;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .card-status-badge.active {
            background: #dcfce7;
            color: #166534;
            border-color: #bbf7d0;
        }

        .teaser-card-body {
            padding: 24px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }

        .teaser-card-title {
            font-family: var(--font-heading);
            font-size: 1.25rem;
            color: #0f172a;
            margin: 0 0 10px;
        }

        .teaser-bullets {
            margin: 0 0 20px;
            padding-left: 18px;
            color: #475569;
            font-size: 0.9rem;
            line-height: 1.6;
            flex-grow: 1;
        }

        .teaser-bullets li {
            margin-bottom: 6px;
        }

        .btn-download-trigger {
            width: 100%;
            background: #081b29;
            color: #ffffff;
            font-family: var(--font-heading);
            font-weight: 700;
            font-size: 0.95rem;
            padding: 13px 20px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background 0.2s, transform 0.15s;
        }

        .btn-download-trigger:hover {
            background: #0ad8ad;
            color: #081b29;
        }

        .teaser-card-footer-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 14px;
            padding-top: 12px;
            border-top: 1px solid #f1f5f9;
            font-size: 0.82rem;
        }

        .btn-card-share {
            background: transparent;
            border: 1px solid #e2e8f0;
            color: #475569;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .btn-card-share:hover {
            background: #0ad8ad;
            border-color: #0ad8ad;
            color: #081b29;
        }

        .btn-card-share.copied {
            background: #10b981;
            border-color: #10b981;
            color: #ffffff;
        }

        .btn-card-details {
            color: #0ad8ad;
            font-weight: 600;
            text-decoration: none;
            transition: color 0.2s;
        }

        .btn-card-details:hover {
            color: #081b29;
            text-decoration: underline;
        }

        /* Modal Overlay */
        .spa-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(8px);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        .spa-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .spa-modal-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 36px;
            max-width: 460px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
            position: relative;
            transform: translateY(20px);
            transition: transform 0.3s ease;
            text-align: center;
        }

        .spa-modal-overlay.active .spa-modal-card {
            transform: translateY(0);
        }

        .spa-modal-close {
            position: absolute;
            top: 14px;
            right: 18px;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1.6rem;
            cursor: pointer;
        }

        .spa-modal-close:hover {
            color: #0f172a;
        }

        .spa-modal-card h3 {
            font-family: var(--font-heading);
            font-size: 1.4rem;
            color: #0f172a;
            margin: 0 0 10px;
        }

        .spa-modal-card p {
            color: #475569;
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 22px;
        }

        .spa-modal-input {
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            font-size: 1rem;
            color: #0f172a;
            background: #f8fafc;
            outline: none;
            margin-bottom: 14px;
        }

        .spa-modal-input:focus {
            border-color: #0ad8ad;
            box-shadow: 0 0 0 3px rgba(10, 216, 173, 0.15);
            background: #ffffff;
        }
    </style>

    <div class="page-intro" style="position: relative; overflow: hidden;">
        <!-- Curved background SVG line flourishes -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>

        <div class="container text-center" style="position: relative; z-index: 2;">
            <span class="section-tag text-teal">Tools & Resources</span>
            <h1 style="color: white;">Free Gifts &amp; Downloads</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Worksheets, prompt templates, PDF guides, and audio lessons to help you reframe obstacles and build your projects.
            </p>
        </div>
    </div>

    <section class="section bg-white" style="padding: 60px 0 90px; background-color: #f8fafc;">
        <div class="container">
            <div class="teaser-grid">
                ${cardsHtml}
            </div>
        </div>
    </section>

    <!-- Login / Unlock Modal -->
    <div class="spa-modal-overlay" id="spa-download-modal">
        <div class="spa-modal-card">
            <button class="spa-modal-close" id="spa-modal-close">&times;</button>
            <div id="spa-form-view">
                <h3 style="color: #0f172a; margin-bottom: 8px;">Unlock All Downloads</h3>
                <p id="spa-copy-text" style="color: #475569; font-size: 0.95rem; margin-bottom: 20px;">
                    Unlock all downloads by entering your email.
                </p>
                <form id="spa-modal-login-form">
                    <input type="email" class="spa-modal-input" id="spa-modal-email" placeholder="Enter your email address..." required style="width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 12px; font-size: 1rem; box-sizing: border-box;">
                    <button type="submit" class="btn-unlock-orange" style="background: #ff5722; color: #ffffff; width: 100%; padding: 14px 20px; font-size: 1rem; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; transition: background 0.2s, transform 0.15s;">
                        Unlock Free Access &rarr;
                    </button>
                    <a href="/" class="btn-decline-home" style="display: block; text-align: center; margin-top: 14px; color: #64748b; font-size: 0.78rem; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; transition: color 0.2s;">
                        I do not want to unlock. Take me back to the home page.
                    </a>
                </form>
            </div>
        </div>
    </div>
    `;
};

// Dedicated Single Free Gift Landing Page Template
const singleGiftTemplate = (gift) => {
    const shareUrl = `https://marchellosciortino.com/${gift.slug}`;

    return `
    <style>
        .single-gift-page-wrapper {
            background-color: #f8fafc;
            color: #475569;
            min-height: 100vh;
        }

        .single-gift-section {
            padding: 60px 0 90px;
        }

        .single-gift-container {
            max-width: 1160px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 460px 1fr;
            gap: 50px;
            align-items: start;
        }

        @media (max-width: 960px) {
            .single-gift-container {
                grid-template-columns: 1fr;
                gap: 36px;
            }
        }

        .single-gift-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08), 0 0 25px rgba(10, 216, 173, 0.12);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .single-gift-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 22px 50px rgba(0, 0, 0, 0.12), 0 0 35px rgba(10, 216, 173, 0.2);
            border-color: #0ad8ad;
        }

        .single-gift-cover-wrap {
            position: relative;
            width: 100%;
            background: #f1f5f9;
            overflow: hidden;
            border-bottom: 1px solid #e2e8f0;
        }

        .single-gift-cover-img {
            width: 100%;
            height: auto;
            aspect-ratio: 16 / 9;
            object-fit: cover;
            display: block;
        }

        .single-gift-badge {
            position: absolute;
            top: 14px;
            right: 14px;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 5px 12px;
            border-radius: 14px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .single-gift-content {
            display: flex;
            flex-direction: column;
        }

        .single-gift-tag {
            color: #0ad8ad;
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-bottom: 12px;
            display: inline-block;
        }

        .single-gift-heading {
            font-family: var(--font-heading);
            font-size: 2.5rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 16px;
            line-height: 1.2;
        }

        @media (max-width: 600px) {
            .single-gift-heading {
                font-size: 1.95rem;
            }
        }

        .single-gift-description {
            color: #475569;
            font-size: 1.1rem;
            line-height: 1.7;
            margin-bottom: 24px;
        }

        .single-gift-takeaways {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 0;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.03);
        }

        .single-gift-takeaways h4 {
            font-family: var(--font-heading);
            color: #0f172a;
            font-size: 1.05rem;
            font-weight: 700;
            margin: 0 0 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .single-gift-takeaways ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }

        .single-gift-takeaways li {
            position: relative;
            padding-left: 28px;
            margin-bottom: 12px;
            color: #334155;
            font-size: 0.98rem;
            line-height: 1.5;
        }

        .single-gift-takeaways li:last-child {
            margin-bottom: 0;
        }

        .single-gift-takeaways li::before {
            content: '\\2714';
            position: absolute;
            left: 0;
            top: 0;
            color: #0ad8ad;
            font-weight: 800;
            font-size: 1.15rem;
        }

        .single-gift-center-actions {
            max-width: 1160px;
            margin: 48px auto 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 18px;
            text-align: center;
        }

        .single-gift-center-actions .action-row {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .btn-download-primary {
            background: #ff5722;
            color: #ffffff !important;
            font-family: var(--font-heading);
            font-weight: 700;
            font-size: 1.15rem;
            padding: 18px 48px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            min-width: 280px;
            max-width: 440px;
            box-shadow: 0 10px 25px rgba(255, 87, 34, 0.35);
            transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .btn-download-primary:hover {
            background: #e64a19;
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(255, 87, 34, 0.45);
            color: #ffffff !important;
        }

        .btn-share-secondary {
            background: #ffffff;
            color: #0f172a;
            font-family: var(--font-heading);
            font-weight: 600;
            font-size: 0.95rem;
            padding: 15px 22px;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .btn-share-secondary:hover {
            border-color: #0ad8ad;
            background: #f0fdf4;
            color: #081b29;
        }

        .btn-share-secondary.copied {
            background: #10b981;
            border-color: #10b981;
            color: #ffffff;
        }

        .single-gift-back-link {
            color: #0ad8ad;
            font-family: var(--font-heading);
            font-weight: 600;
            text-decoration: none;
            font-size: 1.05rem;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: color 0.2s, transform 0.2s;
            padding: 8px 16px;
        }

        .single-gift-back-link:hover {
            color: #081b29;
            text-decoration: underline;
            transform: translateX(-4px);
        }

        .spa-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(8, 27, 41, 0.85);
            backdrop-filter: blur(8px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            padding: 20px;
            box-sizing: border-box;
        }

        .spa-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }

        .spa-modal-card {
            background: #ffffff;
            border-radius: 20px;
            padding: 36px;
            max-width: 460px;
            width: 100%;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            position: relative;
            transform: translateY(20px);
            transition: transform 0.3s ease;
            text-align: center;
            box-sizing: border-box;
        }

        .spa-modal-overlay.active .spa-modal-card {
            transform: translateY(0);
        }

        .spa-modal-close {
            position: absolute;
            top: 14px;
            right: 18px;
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1.6rem;
            cursor: pointer;
            line-height: 1;
            padding: 4px 8px;
        }

        .spa-modal-close:hover {
            color: #0f172a;
        }
        .btn-download-full-album {
            background: linear-gradient(135deg, #ff5722 0%, #e64a19 100%);
            color: #ffffff !important;
            font-family: var(--font-heading);
            font-weight: 800;
            font-size: 1.05rem;
            letter-spacing: 0.5px;
            padding: 16px 28px;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            width: 100%;
            box-sizing: border-box;
            box-shadow: 0 10px 25px rgba(255, 87, 34, 0.4);
            transition: all 0.25s ease;
        }

        .btn-download-full-album:hover {
            background: linear-gradient(135deg, #f4511e 0%, #d84315 100%);
            transform: translateY(-2px);
            box-shadow: 0 14px 30px rgba(255, 87, 34, 0.55);
            color: #ffffff !important;
        }

        .single-gift-one-column-row {
            max-width: 900px;
            margin: 48px auto 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .single-gift-back-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #0ad8ad;
            font-size: 1.05rem;
            font-weight: 600;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 9999px;
            background: rgba(10, 216, 173, 0.08);
            border: 1px solid rgba(10, 216, 173, 0.3);
            transition: all 0.25s ease;
        }

        .single-gift-back-link:hover {
            color: #ffffff !important;
            background: rgba(10, 216, 173, 0.2);
            border-color: #0ad8ad;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(10, 216, 173, 0.25);
        }

        .gift-track-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 18px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.25s ease;
            gap: 16px;
        }

        .gift-track-card:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(10, 216, 173, 0.4);
            transform: translateX(3px);
        }

        .gift-track-card.active-playing {
            background: rgba(10, 216, 173, 0.1) !important;
            border-color: #0ad8ad !important;
            box-shadow: 0 0 20px rgba(10, 216, 173, 0.2);
        }

        .track-card-left {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
            flex: 1;
        }

        .track-card-thumb {
            width: 52px;
            height: 52px;
            border-radius: 10px;
            object-fit: cover;
            flex-shrink: 0;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .btn-track-play {
            background: rgba(10, 216, 173, 0.15);
            border: 1px solid rgba(10, 216, 173, 0.5);
            color: #0ad8ad;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            flex-shrink: 0;
            transition: all 0.2s;
        }

        .btn-track-play:hover {
            background: #0ad8ad;
            color: #081b29;
            transform: scale(1.08);
        }

        .track-card-meta {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .track-card-num {
            font-size: 0.72rem;
            font-weight: 700;
            color: #0ad8ad;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .track-card-title {
            margin: 0;
            font-weight: 700;
            font-size: 1rem;
            color: #f8fafc;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }

        .track-card-dur {
            font-size: 0.8rem;
            color: #94a3b8;
            font-variant-numeric: tabular-nums;
        }

        .track-card-right {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }

        .btn-track-download {
            background: rgba(10, 216, 173, 0.12);
            color: #0ad8ad !important;
            border: 1px solid rgba(10, 216, 173, 0.4);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 0.82rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .btn-track-download:hover {
            background: #0ad8ad;
            color: #081b29 !important;
            border-color: #0ad8ad;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(10, 216, 173, 0.3);
        }

        @media (max-width: 600px) {
            .gift-track-card {
                flex-direction: column;
                align-items: flex-start;
                gap: 12px;
            }
            .track-card-right {
                width: 100%;
                justify-content: space-between;
            }
            .btn-track-download {
                flex: 1;
                justify-content: center;
            }
        }
    </style>

    <div class="single-gift-page-wrapper">
        <!-- Hero Component (.page-intro) -->
        <div class="page-intro" style="position: relative; overflow: hidden;">
            <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80 M -10,45 Q 20,85 100,95 M -10,60 Q 20,100 100,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
            </svg>
            <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80 M 110,45 Q 80,85 0,95 M 110,60 Q 80,100 0,110" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
            </svg>

            <div class="container text-center" style="position: relative; z-index: 2;">
                <span class="section-tag text-teal">Tools &amp; Resources</span>
                <h1 style="color: white; font-family: var(--font-heading); text-transform: uppercase;">${gift.title}</h1>
                <p class="section-desc" style="color: var(--color-gray-light); max-width: 680px; margin: 0 auto;">
                    Free ${gift.type} by Marchello Sciortino &bull; ${gift.badge}
                </p>
            </div>
        </div>

        <!-- Single Gift Showcase Section -->
        <section class="single-gift-section">
            <div class="container">
                <div class="single-gift-container">
                    <!-- Left: Artwork Card -->
                    <div>
                        <div class="single-gift-card">
                            <div class="single-gift-cover-wrap">
                                <img src="${gift.cover_image}" alt="${gift.title} Cover" class="single-gift-cover-img">
                                <span class="single-gift-badge">&#10004; ${gift.badge}</span>
                            </div>
                        </div>
                        <div style="margin-top: 16px; text-align: center;">
                            <button type="button" class="btn-share-secondary js-copy-share-btn" data-share-url="${shareUrl}" style="width: 100%; justify-content: center;">
                                &#128279; Copy Direct Share Link
                            </button>
                        </div>
                    </div>

                    <!-- Right: Content -->
                    <div class="single-gift-content">
                        <span class="single-gift-tag">${gift.type} &bull; Free ${gift.tracks ? 'Access &amp; Download' : 'Download'}</span>
                        <h2 class="single-gift-heading">${gift.title}</h2>
                        <p class="single-gift-description">
                            ${gift.meta_desc}
                        </p>

                        <div class="single-gift-takeaways">
                            <h4>What's Included:</h4>
                            <ul>
                                ${gift.bullets.map(b => `<li>${b}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- One-Column Row: Official 10-Track Album Card, followed by the Explore All link -->
                <div class="single-gift-one-column-row">
                    ${gift.tracks && gift.tracks.length > 0 ? `
                    <div class="gift-album-player-wrap" style="background: #081b29; border-radius: 20px; padding: 28px; color: #fff; border: 1px solid rgba(10, 216, 173, 0.3); box-shadow: 0 16px 40px rgba(0,0,0,0.35); width: 100%;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <div style="width: 42px; height: 42px; background: rgba(10, 216, 173, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #0ad8ad;">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                                </div>
                                <div>
                                    <h3 style="margin: 0; color: #ffffff; font-size: 1.25rem; font-family: var(--font-heading); font-weight: 800;">Official 10-Track Album</h3>
                                    <span id="album-now-playing-title" style="font-size: 0.88rem; color: #0ad8ad; font-weight: 600;">Preview tracks or download individually below</span>
                                </div>
                            </div>
                            <div id="album-header-wave" class="portfolio-wave" style="display: none;">
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                                <div class="portfolio-wave-bar"></div>
                            </div>
                        </div>

                        <!-- Audio Element -->
                        <audio id="gift-album-audio" preload="metadata"></audio>

                        <!-- Interactive Tracklist with Track Cards & Download Buttons -->
                        <div class="gift-tracklist" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
                            ${gift.tracks.map((track, tIdx) => `
                                <div class="gift-track-card" data-src="${track.src}" data-index="${tIdx}" data-title="${track.title}">
                                    <div class="track-card-left">
                                        <img src="${track.cover}" alt="${track.title} Cover" class="track-card-thumb">
                                        <button type="button" class="btn-track-play" aria-label="Play ${track.title}">
                                            <svg class="track-play-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>
                                            <svg class="track-pause-svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display: none;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                        </button>
                                        <div class="track-card-meta">
                                            <span class="track-card-num">Track ${track.number || (tIdx + 1)}</span>
                                            <h4 class="track-card-title">${track.title}</h4>
                                            <span class="track-card-dur">${track.duration}</span>
                                        </div>
                                    </div>
                                    <div class="track-card-right">
                                        <div class="track-item-wave portfolio-wave" style="display: none; height: 16px;">
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                            <div class="portfolio-wave-bar"></div>
                                        </div>
                                        <button type="button" class="btn-track-download js-download-track-btn" data-src="${track.src}" data-title="${track.title}" data-filename="${String(track.number || (tIdx + 1)).padStart(2, '0')} - ${track.title}.mp3" title="Direct Download ${track.title} MP3">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                            Download MP3
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Download Full Album Button at the bottom of the card -->
                        <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 22px;">
                            <button type="button" class="btn-download-full-album js-full-album-btn" data-title="${gift.title} - Complete Album">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                DOWNLOAD FULL ALBUM (ALL 10 TRACKS - ZIP)
                            </button>
                        </div>
                    </div>
                    ` : `
                    <div class="action-row" style="margin-bottom: 24px;">
                        <a href="${gift.file_url}" target="_blank" rel="noopener noreferrer" class="btn-download-primary js-spa-download-btn" data-title="${gift.title}" data-file="${gift.file_url}">
                            ${gift.button_label} &darr;
                        </a>
                    </div>
                    `}

                    <!-- Explore All Link coming directly after the card in the same centered one-column row -->
                    <div style="margin-top: 36px; text-align: center; width: 100%;">
                        <a href="/free-gifts" class="single-gift-back-link">
                            &larr; Explore all free resources on the Free Gifts page
                        </a>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Login / Unlock Modal -->
    <div class="spa-modal-overlay" id="spa-download-modal">
        <div class="spa-modal-card">
            <button class="spa-modal-close" id="spa-modal-close">&times;</button>
            <div id="spa-form-view">
                <h3 style="color: #0f172a; margin-bottom: 8px;">Unlock All Downloads</h3>
                <p id="spa-copy-text" style="color: #475569; font-size: 0.95rem; margin-bottom: 20px;">
                    Unlock all downloads by entering your email.
                </p>
                <form id="spa-modal-login-form">
                    <input type="email" class="spa-modal-input" id="spa-modal-email" placeholder="Enter your email address..." required style="width: 100%; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 12px; font-size: 1rem; box-sizing: border-box;">
                    <button type="submit" class="btn-unlock-orange" style="background: #ff5722; color: #ffffff; width: 100%; padding: 14px 20px; font-size: 1rem; font-weight: 700; border: none; border-radius: 10px; cursor: pointer; transition: background 0.2s, transform 0.15s;">
                        Unlock Free Access &rarr;
                    </button>
                    <a href="/" class="btn-decline-home" style="display: block; text-align: center; margin-top: 14px; color: #64748b; font-size: 0.78rem; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; transition: color 0.2s;">
                        I do not want to unlock. Take me back to the home page.
                    </a>
                </form>
            </div>
        </div>
    </div>
    `;
};

// Force direct download of any file to local disk (no audio player tab opening)
async function directDownloadFile(fileUrl, suggestedFilename, btn) {
    let originalHtml = '';
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⟳</span> Downloading...`;
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
    }

    try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = suggestedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

        if (btn) {
            btn.innerHTML = `✓ Downloaded`;
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
            }, 2500);
        }
    } catch (err) {
        console.warn('[Direct Download Blob Fallback]', err);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = fileUrl;
        a.download = suggestedFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
        }
    }
}

// Client-side ZIP packager for the 10-track album (downloads all 10 tracks into one zipped folder)
async function downloadFullAlbumZip(btn) {
    if (!btn) btn = document.querySelector('.btn-download-full-album, .js-full-album-btn');
    const originalText = btn ? btn.innerHTML : 'DOWNLOAD FULL ALBUM (ALL 10 TRACKS - ZIP)';

    const currentSlug = window.location.pathname.replace(/^\/|\/$/g, '');
    const gift = FREE_GIFTS_DATA.find(g => g.slug === currentSlug) || FREE_GIFTS_DATA[0];
    const tracks = (gift && gift.tracks) ? gift.tracks : [];

    if (!tracks || tracks.length === 0) return;

    if (!window.JSZip) {
        alert("Album packager is loading. Please try again in a few seconds.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.92';
    }

    try {
        const zip = new window.JSZip();
        const albumFolder = zip.folder("WIN ANYWAY");
        const total = tracks.length;

        for (let i = 0; i < total; i++) {
            const track = tracks[i];
            if (btn) {
                btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⟳</span> Downloading Track ${i + 1}/${total}: ${track.title}...`;
            }
            const res = await fetch(track.src);
            if (!res.ok) throw new Error(`Could not load track: ${track.title}`);
            const blob = await res.blob();
            const trackNum = String(track.number || (i + 1)).padStart(2, '0');
            albumFolder.file(`${trackNum} - ${track.title}.mp3`, blob);
        }

        // Add album artwork
        if (gift.cover_image) {
            if (btn) btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⟳</span> Adding Album Artwork...`;
            try {
                const coverRes = await fetch(gift.cover_image);
                if (coverRes.ok) {
                    const coverBlob = await coverRes.blob();
                    albumFolder.file("WIN ANYWAY - Cover Artwork.jpg", coverBlob);
                }
            } catch (e) {
                console.warn("[Album Zip] Cover fetch warning", e);
            }
        }

        if (btn) btn.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite;">⟳</span> Creating Zipped Folder...`;

        const zipBlob = await zip.generateAsync({
            type: "blob",
            compression: "STORE"
        }, (meta) => {
            if (btn) btn.innerHTML = `Zipping Album: ${Math.round(meta.percent)}%...`;
        });

        const downloadUrl = URL.createObjectURL(zipBlob);
        const downloadLink = document.createElement('a');
        downloadLink.style.display = 'none';
        downloadLink.href = downloadUrl;
        downloadLink.download = "Win_Anyway_Full_Album.zip";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 15000);

        if (btn) {
            btn.innerHTML = `✓ Zipped Album Downloaded!`;
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';
            }, 3000);
        }
    } catch (err) {
        console.error("[Album Zip Error]", err);
        alert("Failed to package album: " + err.message);
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1';
        }
    }
}

// Register main free gift routes
Router.register('/free-gifts', freeGiftsTemplate);
Router.register('/free-gifts/', freeGiftsTemplate);

// Register individual free gift canonical routes
FREE_GIFTS_DATA.forEach(gift => {
    Router.register('/' + gift.slug, () => singleGiftTemplate(gift));
    Router.register('/' + gift.slug + '/', () => singleGiftTemplate(gift));
});

// Global click event listener for 1-click clipboard sharing
document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.js-copy-share-btn');
    if (copyBtn) {
        e.preventDefault();
        e.stopPropagation();
        const shareUrl = copyBtn.getAttribute('data-share-url') || window.location.href;
        try {
            await navigator.clipboard.writeText(shareUrl);
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span>&#10004; Copied Link!</span>';
            copyBtn.classList.add('copied');
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2500);
        } catch (err) {
            console.error('[Share Link Clipboard Copy Error]', err);
            prompt('Copy this link:', shareUrl);
        }
    }
});

// Global click event listener for SPA download triggers
document.addEventListener('click', (e) => {
    // 1. Full Album Download Button
    const fullAlbumBtn = e.target.closest('.btn-download-full-album, .js-full-album-btn');
    if (fullAlbumBtn) {
        e.preventDefault();
        e.stopPropagation();
        const isUnlocked = localStorage.getItem('free-gifts-unlocked') === 'true';
        if (!isUnlocked) {
            const modal = document.getElementById('spa-download-modal');
            const copyText = document.getElementById('spa-copy-text');
            const formView = document.getElementById('spa-form-view');
            if (modal) {
                if (copyText) copyText.textContent = 'Unlock the full 10-track album by entering your email.';
                if (formView) formView.style.display = 'block';
                modal.setAttribute('data-target-file', 'action:download-full-album');
                modal.classList.add('active');
            }
            return;
        }
        downloadFullAlbumZip(fullAlbumBtn);
        return;
    }

    // 2. Individual Track Direct MP3 Download Button
    const trackDownloadBtn = e.target.closest('.js-download-track-btn, .btn-track-download');
    if (trackDownloadBtn) {
        e.preventDefault();
        e.stopPropagation();
        const fileUrl = trackDownloadBtn.getAttribute('data-src') || trackDownloadBtn.getAttribute('data-file');
        const filename = trackDownloadBtn.getAttribute('data-filename') || `${trackDownloadBtn.getAttribute('data-title') || 'Track'}.mp3`;

        const isUnlocked = localStorage.getItem('free-gifts-unlocked') === 'true';
        if (!isUnlocked) {
            const modal = document.getElementById('spa-download-modal');
            const copyText = document.getElementById('spa-copy-text');
            const formView = document.getElementById('spa-form-view');
            if (modal) {
                if (copyText) copyText.textContent = `Unlock direct download for "${filename}" by entering your email.`;
                if (formView) formView.style.display = 'block';
                modal.setAttribute('data-target-file', fileUrl);
                modal.setAttribute('data-target-filename', filename);
                modal.classList.add('active');
            }
            return;
        }

        directDownloadFile(fileUrl, filename, trackDownloadBtn);
        return;
    }

    // 3. Other Document & PDF Downloads
    const docDownloadBtn = e.target.closest('.js-spa-download-btn');
    if (docDownloadBtn) {
        let fileUrl = docDownloadBtn.getAttribute('data-file') || docDownloadBtn.getAttribute('href');
        if (!fileUrl) return;

        const modal = document.getElementById('spa-download-modal');
        const copyText = document.getElementById('spa-copy-text');
        const formView = document.getElementById('spa-form-view');

        const isUnlocked = localStorage.getItem('free-gifts-unlocked') === 'true';

        if (isUnlocked) {
            const filename = fileUrl.split('/').pop() || 'download';
            directDownloadFile(fileUrl, filename, docDownloadBtn);
            return;
        } else {
            e.preventDefault();
            if (modal) {
                if (copyText) copyText.textContent = 'Unlock all downloads by entering your email.';
                if (formView) formView.style.display = 'block';
                modal.setAttribute('data-target-file', fileUrl);
                modal.classList.add('active');
            }
        }
    }

    if (e.target && (e.target.id === 'spa-modal-close' || e.target.closest('#spa-modal-close'))) {
        const modal = document.getElementById('spa-download-modal');
        if (modal) modal.classList.remove('active');
    }
});

// Submit event listener for SPA modal form
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'spa-modal-login-form') {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const emailInput = document.getElementById('spa-modal-email');
        if (!emailInput) return;
        const email = emailInput.value;
        const originalText = submitBtn ? submitBtn.textContent : "Unlock Free Access →";

        const modal = document.getElementById('spa-download-modal');
        const targetUrl = modal ? modal.getAttribute('data-target-file') : null;

        // Trigger target action or direct download
        if (targetUrl === 'action:download-full-album') {
            downloadFullAlbumZip(document.querySelector('.btn-download-full-album, .js-full-album-btn'));
        } else if (targetUrl && (targetUrl.endsWith('.mp3') || modal.hasAttribute('data-target-filename'))) {
            const targetFilename = modal ? modal.getAttribute('data-target-filename') || 'Track.mp3' : 'Track.mp3';
            directDownloadFile(targetUrl, targetFilename, null);
        } else if (targetUrl && targetUrl !== '#' && !targetUrl.endsWith('#')) {
            const suggestedName = targetUrl.split('/').pop() || 'download';
            directDownloadFile(targetUrl, suggestedName, null);
        }

        // Close modal immediately so returning users see the page without any pop-up
        if (modal) {
            modal.classList.remove('active');
        }

        localStorage.setItem('free-gifts-unlocked', 'true');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Unlocking...";
        }

        try {
            const formData = new FormData();
            formData.append('email', email);

            const response = await fetch('/api/submit-free-gifts', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log("[ClickFunnels Free Gifts API Success]", result);
            }
        } catch (error) {
            console.error("[ClickFunnels Free Gifts API Error]", error);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }
});

// Interactive Album Track Player Event Listeners
function resetAlbumTrackStates() {
    document.querySelectorAll('.gift-track-card, .gift-track-item').forEach(el => {
        el.classList.remove('active-playing');
        const playSvg = el.querySelector('.track-play-svg');
        const pauseSvg = el.querySelector('.track-pause-svg');
        const wave = el.querySelector('.track-item-wave');
        if (playSvg) playSvg.style.display = 'block';
        if (pauseSvg) pauseSvg.style.display = 'none';
        if (wave) wave.style.display = 'none';
    });
    const headerWave = document.getElementById('album-header-wave');
    if (headerWave) headerWave.style.display = 'none';
}

document.addEventListener('click', (e) => {
    // Individual Track Card or Track Play Button Click
    const trackCard = e.target.closest('.gift-track-card, .gift-track-item');
    if (trackCard) {
        // If clicking download button, do not toggle playback
        if (e.target.closest('.btn-track-download, .js-spa-download-btn')) {
            return;
        }

        const audio = document.getElementById('gift-album-audio');
        if (!audio) return;

        const src = trackCard.getAttribute('data-src');
        const title = trackCard.getAttribute('data-title');
        const nowPlayingTitle = document.getElementById('album-now-playing-title');
        const headerWave = document.getElementById('album-header-wave');

        const isCurrentTrack = audio.getAttribute('data-active-src') === src;

        if (isCurrentTrack && !audio.paused) {
            // Pause current track
            audio.pause();
            trackCard.classList.remove('active-playing');
            const playSvg = trackCard.querySelector('.track-play-svg');
            const pauseSvg = trackCard.querySelector('.track-pause-svg');
            const wave = trackCard.querySelector('.track-item-wave');
            if (playSvg) playSvg.style.display = 'block';
            if (pauseSvg) pauseSvg.style.display = 'none';
            if (wave) wave.style.display = 'none';
            if (headerWave) headerWave.style.display = 'none';
            if (nowPlayingTitle) nowPlayingTitle.textContent = `Paused: ${title}`;
        } else {
            // Reset previous track styling
            resetAlbumTrackStates();

            // Set new track or resume
            if (!isCurrentTrack) {
                audio.src = src;
                audio.setAttribute('data-active-src', src);
                audio.setAttribute('data-current-index', trackCard.getAttribute('data-index'));
            }

            audio.play().then(() => {
                trackCard.classList.add('active-playing');
                const playSvg = trackCard.querySelector('.track-play-svg');
                const pauseSvg = trackCard.querySelector('.track-pause-svg');
                const wave = trackCard.querySelector('.track-item-wave');
                if (playSvg) playSvg.style.display = 'none';
                if (pauseSvg) pauseSvg.style.display = 'block';
                if (wave) wave.style.display = 'inline-flex';
                if (headerWave) headerWave.style.display = 'flex';
                if (nowPlayingTitle) nowPlayingTitle.textContent = `Now Playing: ${title}`;
            }).catch(err => {
                console.warn('[Album Audio Play Error]', err);
            });
        }
    }
});

// Auto-advance track on ended
document.addEventListener('page-loaded', () => {
    const audio = document.getElementById('gift-album-audio');
    if (audio) {
        audio.addEventListener('ended', () => {
            const currentIndex = parseInt(audio.getAttribute('data-current-index') || '0', 10);
            const tracks = document.querySelectorAll('.gift-track-card, .gift-track-item');
            const nextTrack = tracks[currentIndex + 1] || tracks[0];
            if (nextTrack) {
                nextTrack.click();
            } else {
                resetAlbumTrackStates();
            }
        });
    }
});

// Pause album audio when navigating away
window.addEventListener('popstate', () => {
    const audio = document.getElementById('gift-album-audio');
    if (audio) {
        audio.pause();
    }
});







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
                This website is fully optimized for keyboard navigation and screen-readers. We use standard HTML structures, skip-to-content links, and clear focus styling to make the site easy to navigate for everyone.
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
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Sources</span>
                            <img src="assets/resources/Sources_cover_image.png" alt="Sources cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>Coming Soon</h3>
                            <p>Documentation, references, and sources for Limitation to Liberation.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <button class="btn btn-outline-teal" disabled style="width: 100%; opacity: 0.6; cursor: not-allowed;">Coming Soon</button>
                        </div>
                    </div>
                    
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Read Now</span>
                            <img src="assets/resources/Book_Website_cover_image.png" alt="Book Website cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>Book Website</h3>
                            <p>Get your copy of "Limitations to Liberation" and begin turning constraints into creative agency.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://www.limitationstoliberation.com/" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                    
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Accessible AIM</span>
                            <img src="assets/resources/Accessible_AIM_cover_image.png" alt="AI Accessibility cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>AI Accessibility</h3>
                            <p>Learn how we are building an accessible world through AI-powered advocacy and solutions.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="/accessible-aim" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 2: Digital Marketing -->
            <div style="margin-bottom: 50px;">
                <h2 class="text-navy" style="margin-bottom: 5px;">Digital Marketing Tools</h2>
                <p style="color: var(--color-gray-medium); margin-bottom: 15px;">The professional platforms and systems I use to build pages, launch funnels, and organize digital momentum.</p>
                <div style="height: 2px; width: 60px; background: var(--color-teal); margin-top: 10px; margin-bottom: 25px;"></div>
                
                <div class="grid-3">
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Platform</span>
                            <img src="assets/resources/Clickfunnels.png" alt="ClickFunnels cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>ClickFunnels</h3>
                            <p>The ultimate platform for building high-converting landing pages, sales pipelines, and websites.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://www.clickfunnels.com/signup-flow-new-plans?aff=marchello-sciortino" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                    
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Training</span>
                            <img src="assets/resources/One_funnel_away.png" alt="One Funnel Away cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>One Funnel Away</h3>
                            <p>The training system that guides you step-by-step through launching your online funnel.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://www.onefunnelaway.com/?aff=marchello-sciortino" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                    
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Templates</span>
                            <img src="assets/resources/PLR_Funnels.jpg" alt="PLR Funnels cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>PLR Funnels</h3>
                            <p>Ready-to-use private label rights funnels to accelerate your digital launch speed.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://www.plrfunnels.com/plr?aff=marchello-sciortino" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Section 3: Recommended Books -->
            <div style="margin-bottom: 20px;">
                <h2 class="text-navy" style="margin-bottom: 5px;">Recommended Books</h2>
                <p style="color: var(--color-gray-medium); margin-bottom: 15px;">Essential literature that helped shape my business mindset and marketing strategies.</p>
                <div style="height: 2px; width: 60px; background: var(--color-teal); margin-top: 10px; margin-bottom: 25px;"></div>
                
                <div class="grid-3">
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Marketing</span>
                            <img src="assets/resources/Dotcom_Secrets.webp" alt="DotCom Secrets cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>DotCom Secrets</h3>
                            <p>The playbook for building a repeatable online sales system to grow any company.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://www.dotcomsecrets.com/?aff=d0960bf47d9b1ccc93da0b5cc9cf2d5a7bd719a1780f0a7f83d7b7bdce30c52b" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                    
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Influence</span>
                            <img src="assets/resources/Expert_Secrets.png" alt="Expert Secrets cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>Expert Secrets</h3>
                            <p>The guide to building a community of people who will pay you for your advice.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://www.expertsecrets.com/?aff=d0960bf47d9b1ccc93da0b5cc9cf2d5a7bd719a1780f0a7f83d7b7bdce30c52b" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                    
                    <div class="resource-card">
                        <div class="resource-image-wrapper">
                            <span class="resource-badge">Traffic</span>
                            <img src="assets/resources/Traffic_Secrets.png" alt="Traffic Secrets cover" class="resource-cover-image">
                        </div>
                        <div class="resource-card-content">
                            <h3>Traffic Secrets</h3>
                            <p>The strategies for finding your dream customers and directing them to your products.</p>
                        </div>
                        <div class="resource-card-button-wrapper">
                            <a href="https://trafficsecrets.com/thebook-5" target="_blank" rel="noopener noreferrer" class="btn btn-outline-teal" style="width: 100%; text-align: center;">Learn More</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
`);

// 17. Accessible AIM Page Template
Router.register('/accessible-aim', () => `
    <div class="page-intro" style="position: relative; overflow: hidden;">
        <!-- Curved background gold/teal lines using inline SVG -->
        <svg style="position: absolute; left: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M -10,0 Q 20,40 100,50 M -10,15 Q 20,55 100,65 M -10,30 Q 20,70 100,80" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        <svg style="position: absolute; right: 0; top: 0; height: 100%; width: 220px; pointer-events: none; opacity: 0.25;" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M 110,0 Q 80,40 0,50 M 110,15 Q 80,55 0,65 M 110,30 Q 80,70 0,80" fill="none" stroke="var(--color-teal)" stroke-width="0.3" />
        </svg>
        
        <div class="container text-center" style="position: relative; z-index: 2;">
            <span class="section-tag text-teal">Articulated Inspiration Method</span>
            <h1 style="color: white; text-transform: uppercase;">My Signature Program</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Treating generative artificial intelligence as a helper for human capability and a bridge for creation.
            </p>
        </div>
    </div>
    
    <!-- Centered One-Column Section: Accessible AIM -->
    <section class="aim-title-section" style="background-color: var(--color-white); padding: 50px 0 15px 0; text-align: center;">
        <div class="container">
            <h2 style="color: var(--color-navy); font-size: 2.8rem; font-family: 'Oswald', sans-serif; font-weight: 800; font-style: italic; text-transform: uppercase; letter-spacing: 0.01em; margin: 0; text-shadow: 2px 2px 0px rgba(10, 216, 173, 0.35), 4px 4px 8px rgba(8, 27, 41, 0.15);">Accessible AIM</h2>
            <div style="width: 80px; height: 4px; background-color: var(--color-teal); margin: 15px auto 0 auto; border-radius: 2px; box-shadow: 0 1px 5px rgba(10, 216, 173, 0.3);"></div>
        </div>
    </section>
    
    <section class="aim-showcase-section" style="padding-top: 15px;">
        <div class="container">
            <div class="aim-grid">
                <!-- Left Column: Video -->
                <div class="aim-video-col">
                    <div class="aim-video-wrapper" id="aim-video-wrapper">
                        <video id="aim-video" autoplay muted loop playsinline poster="assets/hero-bg.jpg">
                            <source src="assets/videos/accessible-aim-intro.mp4" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                        <div class="aim-sound-badge" id="aim-sound-badge">
                            <img src="assets/click-to-turn-on-sound.png" alt="Click to turn on sound">
                        </div>
                        <div class="aim-center-play" id="aim-center-play">
                            <svg viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column: Content and Opt-in Form -->
                <div class="aim-content-col">
                    <h2 style="color: var(--color-navy); font-size: clamp(1.15rem, 3.8vw, 2.1rem); margin-bottom: 5px; white-space: nowrap;">There's a brand new way to Win!</h2>
                    <p style="font-size: 1.05rem; line-height: 1.6; color: var(--color-gray-steel);">
                        Accessible AIM is designed for anyone facing a constraint—whether physical, mental, or circumstantial. We teach you to rise above obstacles by putting faith and perspective first, combining guidance with the helpful reality of artificial intelligence.
                    </p>
                    <p style="font-size: 1.05rem; line-height: 1.6; color: var(--color-gray-steel);">
                        By learning to use AI to amplify your creative expression online, you can build an inspiring digital presence free from the limitations that try to convince you success is out of reach.
                    </p>
                    
                    <!-- Social Proof Section -->
                    <div class="aim-social-proof">
                        <div class="aim-avatar-stack">
                            <img src="assets/reviews/reviewer_1.png" alt="Advocate avatar">
                            <img src="assets/reviews/reviewer_2.png" alt="Advocate avatar">
                            <img src="assets/reviews/reviewer_3.png" alt="Advocate avatar">
                            <img src="assets/reviews/reviewer_4.png" alt="Advocate avatar">
                        </div>
                        <span class="aim-joined-text">They joined today</span>
                    </div>
                    
                    <!-- Opt-in form -->
                    <form id="aim-dedicated-waitlist-form" class="aim-waitlist-form">
                        <input type="email" id="aim-dedicated-email" class="aim-email-input" placeholder="Enter your email address" required aria-label="Email address for waitlist">
                        <button type="submit" class="aim-submit-btn">Join the waitlist</button>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Motto Section -->
    <section class="aim-motto-section">
        <div class="container">
            <div class="aim-motto-divider-container">
                <div class="aim-motto-line"></div>
                <img src="assets/aim-logo.png" alt="Accessible AIM Logo" class="aim-motto-logo">
                <div class="aim-motto-line"></div>
            </div>
            <div class="aim-motto-text">
                <h3 class="aim-motto-title-navy">CREATIVITY. TECHNOLOGY. DETERMINATION.</h3>
                <h3 class="aim-motto-title-teal">UNLOCKING POSSIBILITIES. DELIVERING RESULTS.</h3>
            </div>
        </div>
    </section>
`);
