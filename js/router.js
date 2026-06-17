/**
 * Router Module - Handles client-side hash routing for the SPA.
 */
const Router = {
    routes: {},
    currentPage: null,

    init() {
        // Register window hash change listener
        window.addEventListener('hashchange', () => this.handleRouting());
        
        // Handle initial page load
        window.addEventListener('load', () => {
            if (!window.location.hash) {
                window.location.hash = '#/home';
            } else {
                this.handleRouting();
            }
        });
    },

    register(route, templateFn) {
        this.routes[route] = templateFn;
    },

    handleRouting() {
        const hash = window.location.hash;
        
        // If hash is empty or just #, set to #/home
        if (!hash || hash === '#') {
            window.location.hash = '#/home';
            return;
        }
        
        // If it's a page anchor or skip-link (doesn't start with #/), let browser handle it
        if (!hash.startsWith('#/')) {
            return;
        }
        
        const route = this.parseRoute(hash);
        
        if (route === '/book') {
            window.location.hash = '#/home';
            window.open('https://www.limitationstoliberation.com/', '_blank');
            return;
        }
        
        // Match route or redirect to home
        const templateFn = this.routes[route] || this.routes['/home'];
        
        if (templateFn) {
            // Update current page
            this.currentPage = route.substring(1); // strip leading slash
            
            // Execute template builder
            const html = templateFn();
            
            // Ingest to app container
            const app = document.getElementById('app');
            app.innerHTML = html;
            
            // Update document title dynamically for SEO
            const titles = {
                '/home': "Marchello Sciortino | Official Digital Hub",
                '/story': "My Story | Marchello Sciortino",
                '/services': "Services | Marchello Sciortino",
                '/mission': "The Mission | Marchello Sciortino",
                '/brain': "The Brain Map | Marchello Sciortino",
                '/speaking': "Speaking | Marchello Sciortino",
                '/aim': "Accessible AIM | Marchello Sciortino",
                '/chelloai': "ChelloAI | Marchello Sciortino",
                '/music': "AI Music Jingles | Marchello Sciortino",
                '/impact': "Impact & Reviews | Marchello Sciortino",
                '/marchellos-blog': "Marchello's Blog | Marchello Sciortino",
                '/hub': "Marchello's Blog | Marchello Sciortino",
                '/contact': "Contact | Marchello Sciortino",
                '/resources': "Free Resources | Marchello Sciortino",
                '/privacy': "Privacy Policy | Marchello Sciortino",
                '/terms': "Terms of Service | Marchello Sciortino",
                '/accessibility-statement': "Accessibility Statement | Marchello Sciortino"
            };
            document.title = titles[route] || "Marchello Sciortino";
            
            // Post-rendering actions
            this.updateNavLinks(hash);
            this.resetFocus();
            
            // Dispatch page load event for submodules
            const event = new CustomEvent('page-loaded', { detail: { page: this.currentPage } });
            document.dispatchEvent(event);
        }
    },

    parseRoute(hash) {
        // Simple router logic: hash like '#/story' -> '/story'
        let route = hash.replace('#', '');
        if (route === '') route = '/home';
        return route;
    },

    updateNavLinks(hash) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === hash) {
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
Router.register('/home', () => `
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
                <a href="#/story" class="btn btn-teal">WATCH MY STORY</a>
                <a href="#/aim" class="btn btn-outline-white">EXPLORE ACCESSIBLE AIM</a>
            </div>
        </div>
    </section>

    <!-- Featured In Scrolling Marquee -->
    <section class="featured-in bg-navy-dark">
        <div class="container">
            <h2 class="featured-title">As Featured In</h2>
            <div class="marquee-wrapper">
                <div class="marquee-track">
                    <div class="marquee-item"><img src="assets/brand-tech-weekly.svg" alt="Tech Weekly"></div>
                    <div class="marquee-item"><img src="assets/brand-ai-journal.svg" alt="AI Journal"></div>
                    <div class="marquee-item"><img src="assets/brand-access-magazine.svg" alt="Access Magazine"></div>
                    <div class="marquee-item"><img src="assets/brand-speaker-today.svg" alt="Speaker Today"></div>
                    <div class="marquee-item"><img src="assets/brand-digital-builder.svg" alt="Digital Builder"></div>
                    <div class="marquee-item"><img src="assets/brand-resilience-quarterly.svg" alt="Resilience Quarterly"></div>
                    
                    <div class="marquee-item"><img src="assets/brand-tech-weekly.svg" alt="Tech Weekly"></div>
                    <div class="marquee-item"><img src="assets/brand-ai-journal.svg" alt="AI Journal"></div>
                    <div class="marquee-item"><img src="assets/brand-access-magazine.svg" alt="Access Magazine"></div>
                    <div class="marquee-item"><img src="assets/brand-speaker-today.svg" alt="Speaker Today"></div>
                    <div class="marquee-item"><img src="assets/brand-digital-builder.svg" alt="Digital Builder"></div>
                    <div class="marquee-item"><img src="assets/brand-resilience-quarterly.svg" alt="Resilience Quarterly"></div>
                </div>
            </div>
        </div>
    </section>

    <!-- Impact & Reviews Section -->
    <section class="section bg-white" style="border-bottom: 1px solid var(--color-gray-border); padding: 4.5rem 0;">
        <div class="container">
            <div class="text-center" style="margin-bottom: var(--spacing-lg);">
                <span class="section-tag">Audience & Client Reviews</span>
                <h2>Real Impact, Verified Outcomes</h2>
                <p class="section-desc" style="margin-bottom: 0;">
                    See what event planners, brand founders, and advocacy leaders say about working with Marchello.
                </p>
            </div>
            <div class="grid-3">
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
                        "We hired Marchello to build our ClickFunnels logic. His technical design system was flawless, and knowing the coordination coordinates he works with just proved to us that his capacity is second to none."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Founder, Tech Accelerator</strong>
                </div>
                <div class="card">
                    <span class="text-gold" style="font-size: 1.5rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <h4 style="margin-top: 10px;">"Inspiring and Practical"</h4>
                    <p style="font-style: italic; font-size: 0.95rem;">
                        "As a parent of a disabled child, hearing Marchello speak gave me a realistic, non-pity roadmap. He shows that adaptation isn't giving up; it is just a smarter execution strategy."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Attendee, Advocacy Summit</strong>
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
                Living with Friedrich’s ataxia (a progressive neuromuscular condition) means my physical boundaries change often. My response is simple: adapt, construct, and show up.
            </p>
            
            <div class="alternating-timeline">
                <!-- Row 1: Card on Left, Line/Bullet in Center, Image on Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">Losing Mobility</div>
                        <div class="timeline-card">
                            <p>When coordinates in gym class became difficult and balance disappeared, I plateaued at a confusing level before accepting my progression. It meant learning to live without walking, relying on assistance, and planning daily energy blocks carefully.</p>
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-teal"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-1.png" alt="Losing Mobility and adapting" class="timeline-img">
                        </div>
                    </div>
                </div>
                
                <!-- Row 2: Image on Left, Line/Bullet in Center, Card on Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-image-placeholder">
                            <img src="assets/timeline-2.png" alt="Refusing Defeat and digital creation" class="timeline-img">
                        </div>
                    </div>
                    <div class="timeline-col timeline-center">
                        <div class="timeline-bar-line"></div>
                        <div class="timeline-bullet bullet-gold"></div>
                    </div>
                    <div class="timeline-col timeline-content-right">
                        <div class="timeline-year">Refusing Defeat</div>
                        <div class="timeline-card">
                            <p>Being a warrior in my vocabulary isn't about being a superhero. It's deciding that physical limitations don't define creative output. I shifted my career to digital marketing, designing websites, funnels, and systems online.</p>
                        </div>
                    </div>
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
                    <p>Delivering practical, no-fluff perspectives on resilience and adaptation for corporate, educational, and faith-driven events.</p>
                    <a href="#/speaking" class="text-teal">Book Speaking Details &rarr;</a>
                </div>
                <div class="card">
                    <span class="section-tag">Literature</span>
                    <h3 class="card-title">Limitations to Liberation</h3>
                    <p>My upcoming book about the practical tools, mental models, and spiritual principles that build freedom from limitation.</p>
                    <a href="https://www.limitationstoliberation.com/" target="_blank" rel="noopener noreferrer" class="text-teal">"Limitations to Liberation" book &rarr;</a>
                </div>
                <div class="card">
                    <span class="section-tag">Technology</span>
                    <h3 class="card-title">Accessible AIM</h3>
                    <p>A mission to help individuals with physical challenges discover how AI can act as a bridge for creation and communication.</p>
                    <a href="#/aim" class="text-teal">Join AIM Waitlist &rarr;</a>
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
                        <p class="book-promo-subheadline">Discover the mental models, resilience systems, and practical tools to build freedom and turn daily limits into creative agency.</p>
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
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Timeline</span>
            <h1 style="color: white;">My Journey</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                No hero-worship. No pity. Just an honest timeline of progressive challenges and the choices made to keep building.
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
                            <p>I began noticing shortness of breath and a rapid heartbeat after normal activity in gym class. Soon, balance blocks appeared. I couldn't run as fast, walk in a straight line, or balance across parking blocks. Other kids started asking, "Why do you walk like that?" and I had no answers.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 3: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">The Diagnosis at 14</div>
                        <div class="timeline-card">
                            <p>After years of medical uncertainty, muscle tests, and spinal checks, we received a laboratory diagnosis: Friedrich's ataxia. It's a progressive, neuromuscular condition that disrupts neural pathways, affecting fine motor skills, gait, energy, and hearing. It was a clear confirmation that my physical state would slowly decline over time.</p>
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
                            <p>High school and college years required constant adjustments. I eventually transitioned to a wheelchair. Simple things—sitting up, opening a soda, getting in or out of bed—required parent assistance. The hardest challenge was the mental fatigue: resisting feeling like a "nuisance" or "disabled mooch" and choosing to focus on what coordinates I still controlled.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Row 5: Card Left, Image Right -->
                <div class="timeline-row">
                    <div class="timeline-col timeline-content-left">
                        <div class="timeline-year">Discovering Digital Marketing & AI</div>
                        <div class="timeline-card">
                            <p>With physical labor impossible, I focused on digital skillsets. I trained, became ClickFunnels certified, and began building websites and marketing campaigns for business partners. As typing became a nightmare, AI became my typing speed. It bridged the physical gap, acting as an amplifier for my ideas, voice, and designs.</p>
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
                            <p>The challenges changed, but the mission did not. I continue to build systems, write books, create AI-powered songs, and deliver keynotes to show that limits are parameters to create around, not blockades to accept.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
`);

// 2b. Services Page Template
Router.register('/services', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">WHAT I DO</span>
            <h1 style="color: white;">Services</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Where AI, Creativity, and Human Potential Meet
            </p>
        </div>
    </div>
    
    <!-- Hero / Main Section -->
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2">
                <div>
                    <span class="section-tag">Overview</span>
                    <h2>Where AI, Creativity, and Human Potential Meet</h2>
                    <p class="text-teal" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 20px; line-height: 1.4;">
                        Marchello helps individuals, businesses, and organizations leverage artificial intelligence, digital strategy, and resilience-based thinking to create meaningful results.
                    </p>
                    <p style="color: var(--color-gray-steel); margin-bottom: 20px; font-weight: 500; font-style: italic;">
                        Technology changes quickly. Human potential does not.
                    </p>
                    <p style="color: var(--color-gray-steel); margin-bottom: 30px;">
                        Marchello combines AI innovation, digital creation, and lived experience to help people build businesses, amplify ideas, and overcome obstacles. His work sits at the intersection of creativity, technology, and possibility.
                    </p>
                    <div class="hero-ctas">
                        <a href="#/contact" class="btn btn-teal">WORK WITH MARCHELLO</a>
                        <a href="#services-list" class="btn btn-outline-teal">EXPLORE SERVICES</a>
                    </div>
                </div>
                <div>
                    <div class="card bg-navy text-white" style="border: 1px solid var(--color-gray-border); padding: var(--spacing-lg); max-width: 480px; margin: 0 auto; box-shadow: var(--shadow-lg);">
                        <div class="success-icon-wrapper" style="background: rgba(0, 209, 193, 0.1); margin-bottom: 20px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2" style="width: 40px; height: 40px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                        </div>
                        <h3 class="text-white text-center" style="font-size: 1.5rem; margin-bottom: 15px;">Three Ways Marchello Helps People Win</h3>
                        <p style="color: var(--color-gray-light); font-size: 0.95rem; line-height: 1.6; text-align: center;">
                            Rather than offering dozens of disconnected services, Marchello focuses on three core areas that bring together his experience as a creator, builder, speaker, AI explorer, and advocate.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Introduction Section -->
    <section class="section bg-white" id="services-list" style="border-top: 1px solid var(--color-gray-border);">
        <div class="container text-center" style="max-width: 800px;">
            <span class="section-tag">How I Serve</span>
            <h2>Three Ways Marchello Helps People Win Despite The Odds</h2>
            <p class="section-desc">
                Rather than offering dozens of disconnected services, Marchello focuses on three core areas that bring together his experience as a creator, builder, speaker, AI explorer, and advocate.
            </p>
            <p style="color: var(--color-gray-steel); margin-top: -15px; margin-bottom: 40px;">
                These categories represent the primary ways clients, organizations, and individuals work with him.
            </p>
        </div>
    </section>

    <!-- Services Detail Section -->
    
    <!-- Service 01 -->
    <section class="section bg-navy-light text-white" style="border-top: 1px solid var(--color-gray-border); border-bottom: 1px solid var(--color-gray-border);">
        <div class="container">
            <div class="grid-2">
                <div>
                    <span class="section-tag text-teal">Service 01</span>
                    <h2 class="text-white">Digital Experiences & Funnel Engineering</h2>
                    <p class="text-gold" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 20px;">
                        Build systems that attract, engage, and convert.
                    </p>
                    <p style="color: var(--color-gray-light); margin-bottom: 30px; line-height: 1.6;">
                        Marchello designs digital experiences that help businesses communicate clearly and guide visitors toward action. Whether it is a sales funnel, landing page, website, membership area, or custom application, every project is built around creating a seamless user experience and meaningful outcomes.
                    </p>
                    
                    <div style="background: rgba(7, 24, 39, 0.4); border-radius: var(--radius-md); border: 1px solid rgba(0, 209, 193, 0.2); padding: var(--spacing-md); margin-bottom: 20px;">
                        <h4 class="text-white" style="margin-bottom: 15px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Ideal For:</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Entrepreneurs</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Small Businesses</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Coaches</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Speakers</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Course Creators</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Organizations</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="card bg-navy" style="border: 1px solid rgba(0, 209, 193, 0.2); padding: var(--spacing-lg);">
                        <h3 class="text-white" style="margin-bottom: 20px; font-size: 1.35rem; border-bottom: 1px solid rgba(0, 209, 193, 0.2); padding-bottom: 10px; font-family: var(--font-heading);">What's Included</h3>
                        <ul style="list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; color: var(--color-gray-light); padding-left: 0;">
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Funnel building
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Website design
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Sales page engineering
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Landing pages
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Membership platforms
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Course portals
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Lead generation systems
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Customer journey optimization
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                App development
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI-powered experiences
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                ClickFunnels implementation
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Conversion strategy
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Service 02 -->
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2">
                <div style="order: 2;">
                    <span class="section-tag">Service 02</span>
                    <h2>AI-Powered Content Creation</h2>
                    <p class="text-teal" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 20px;">
                        Transform ideas into content, media, and stories.
                    </p>
                    <p style="color: var(--color-gray-steel); margin-bottom: 30px; line-height: 1.6;">
                        Marchello actively explores emerging AI tools and creative technologies to help people create content faster and more effectively. From visual assets and videos to books, music, copywriting, and storytelling, AI becomes a creative amplifier rather than a replacement for human imagination.
                    </p>
                    
                    <div style="background: var(--color-white); border-radius: var(--radius-md); border: 1px solid var(--color-gray-border); padding: var(--spacing-md); margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-navy);">Ideal For:</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Personal Brands</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Content Creators</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Businesses</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Authors</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Speakers</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Marketing Teams</span>
                        </div>
                    </div>
                </div>
                
                <div style="order: 1;">
                    <div class="card bg-navy-light text-white" style="border: 1px solid rgba(0, 209, 193, 0.2); padding: var(--spacing-lg);">
                        <h3 class="text-white" style="margin-bottom: 20px; font-size: 1.35rem; border-bottom: 1px solid rgba(0, 209, 193, 0.2); padding-bottom: 10px; font-family: var(--font-heading);">What's Included</h3>
                        <ul style="list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; color: var(--color-gray-light); padding-left: 0;">
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI-assisted copywriting
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI image generation
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI video generation
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI music & song creation
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI book development
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                AI storytelling
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Brand messaging
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Content systems
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Marketing assets
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Creative campaigns
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Educational content
                            </li>
                            <li style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                Digital media production
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Service 03 -->
    <section class="section bg-navy-light text-white" style="border-top: 1px solid var(--color-gray-border); border-bottom: 1px solid var(--color-gray-border);">
        <div class="container">
            <div class="grid-2">
                <div>
                    <span class="section-tag text-teal">Service 03</span>
                    <h2 class="text-white">Winning Despite The Odds Coaching & AI Advocacy</h2>
                    <p class="text-gold" style="font-size: 1.25rem; font-weight: 600; margin-bottom: 20px;">
                        Learn to transform limitations into advantages.
                    </p>
                    <p style="color: var(--color-gray-light); margin-bottom: 30px; line-height: 1.6;">
                        Built from Marchello's personal journey and years of navigating adversity, this coaching experience focuses on helping people reframe challenges, build resilience, and discover opportunities hidden inside constraints.
                        <br><br>
                        At the same time, Marchello teaches practical ways artificial intelligence can empower people to accomplish more, communicate more effectively, and expand what is possible in their personal and professional lives.
                    </p>
                    
                    <div style="background: rgba(7, 24, 39, 0.4); border-radius: var(--radius-md); border: 1px solid rgba(0, 209, 193, 0.2); padding: var(--spacing-md); margin-bottom: 20px;">
                        <h4 class="text-white" style="margin-bottom: 15px; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">Ideal For:</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Individuals Facing Adversity</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Educators & Schools</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Organizations</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Leadership Teams</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Entrepreneurs</span>
                            <span class="btn btn-outline-teal" style="padding: 6px 12px; font-size: 0.75rem; pointer-events: none; text-transform: none;">Anyone Seeking Growth</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="card bg-navy" style="border: 1px solid rgba(0, 209, 193, 0.2); padding: var(--spacing-lg);">
                        <h3 class="text-white" style="margin-bottom: 20px; font-size: 1.35rem; border-bottom: 1px solid rgba(0, 209, 193, 0.2); padding-bottom: 10px; font-family: var(--font-heading);">Topics Include</h3>
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div style="display: flex; gap: 12px;">
                                <div style="margin-top: 3px;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div>
                                    <h4 class="text-white" style="font-size: 1.05rem; margin-bottom: 3px; font-family: var(--font-heading);">Constraint-Based Thinking</h4>
                                    <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: 0; line-height: 1.4;">Learning how obstacles can become sources of innovation.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <div style="margin-top: 3px;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div>
                                    <h4 class="text-white" style="font-size: 1.05rem; margin-bottom: 3px; font-family: var(--font-heading);">Resilience & Mindset</h4>
                                    <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: 0; line-height: 1.4;">Developing healthier responses to difficult circumstances.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <div style="margin-top: 3px;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div>
                                    <h4 class="text-white" style="font-size: 1.05rem; margin-bottom: 3px; font-family: var(--font-heading);">Winning Despite The Odds Framework</h4>
                                    <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: 0; line-height: 1.4;">The philosophy that guides Marchello's speaking, coaching, and educational work.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <div style="margin-top: 3px;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div>
                                    <h4 class="text-white" style="font-size: 1.05rem; margin-bottom: 3px; font-family: var(--font-heading);">AI Empowerment</h4>
                                    <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: 0; line-height: 1.4;">Understanding how technology can amplify human capability.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <div style="margin-top: 3px;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div>
                                    <h4 class="text-white" style="font-size: 1.05rem; margin-bottom: 3px; font-family: var(--font-heading);">Personal Growth</h4>
                                    <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: 0; line-height: 1.4;">Building confidence, purpose, and momentum.</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px;">
                                <div style="margin-top: 3px;">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-teal)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </div>
                                <div>
                                    <h4 class="text-white" style="font-size: 1.05rem; margin-bottom: 3px; font-family: var(--font-heading);">Human Potential</h4>
                                    <p style="color: var(--color-gray-light); font-size: 0.9rem; margin-bottom: 0; line-height: 1.4;">Discovering strengths hidden beneath limitations.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Innovation Section -->
    <section class="section bg-white">
        <div class="container text-center" style="max-width: 800px;">
            <span class="section-tag">Vision & Exploration</span>
            <h2>Always Exploring What's Next</h2>
            <p class="section-desc">
                Marchello is not simply a service provider. He is an active explorer of emerging technologies, AI systems, creative tools, and digital experiences. His passion lies in discovering practical applications that help people create more, communicate better, save time, and unlock opportunities that previously seemed out of reach. Every project, lesson, and conversation is guided by one belief:
            </p>
            <div style="background: var(--color-white); border-left: 5px solid var(--color-teal); border-radius: 4px; padding: var(--spacing-md) var(--spacing-lg); margin-top: 30px; display: inline-block; text-align: left; max-width: 650px; box-shadow: var(--shadow-md); border: 1px solid var(--color-gray-border);">
                <p style="font-style: italic; font-size: 1.25rem; font-weight: 600; color: var(--color-navy); margin-bottom: 0; font-family: var(--font-heading);">
                    "Your limitations may shape your path, but they do not define your potential."
                </p>
            </div>
        </div>
    </section>

    <!-- Closing Section -->
    <section class="section bg-navy text-white" style="border-top: 1px solid rgba(0, 209, 193, 0.2);">
        <div class="container text-center" style="max-width: 800px;">
            <span class="section-tag text-teal">Start Today</span>
            <h2 class="text-white">Let's Build Something Meaningful</h2>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Whether you're building a business, creating content, exploring AI, or learning how to navigate life's challenges with greater confidence, Marchello brings together technology, creativity, and lived experience to help you move forward.
            </p>
            <div class="hero-ctas" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 30px;">
                <a href="#/contact" class="btn btn-teal">WORK WITH MARCHELLO</a>
                <a href="#/contact" class="btn btn-outline-white">BOOK A CONVERSATION</a>
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
                        A lot of the language around disability is either rooted in pity ("your life is so hard") or hero-worship ("you are such a hero"). Both frame the person solely by their limitation, putting them in a box.
                    </p>
                    <p>
                        My mission is to demonstrate that <strong>purpose and contribution do not require physical perfection</strong>. You do not need a perfect body to create a world-class website, direct a business strategy, or offer value to others.
                    </p>
                </div>
                <div class="graphic-panel bg-navy text-white" style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: var(--spacing-lg); border-radius: var(--radius-md); position: relative; overflow: hidden; border: 1px solid rgba(10, 216, 173, 0.15); min-height: 280px;">
                    <div class="graphic-flare" style="position: absolute; width: 150px; height: 150px; background: var(--color-teal); filter: blur(70px); opacity: 0.15; top: 20%; left: 20%;"></div>
                    <div class="graphic-flare" style="position: absolute; width: 120px; height: 120px; background: var(--color-gold); filter: blur(60px); opacity: 0.12; bottom: 20%; right: 20%;"></div>
                    <span style="font-family: 'Permanent Marker', sans-serif; font-size: 2.2rem; color: var(--color-teal); transform: rotate(-5deg); margin-bottom: 10px; z-index: 2;">No Excuses.</span>
                    <p class="text-center" style="font-size: 0.95rem; color: var(--color-gray-steel); max-width: 280px; text-align: center; margin: 0; line-height: 1.5; z-index: 2;">
                        "The limit is not the parameter of the body, but the boundary of the imagination."
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Dynamic W.I.N. Framework Section -->
    <section class="section bg-navy win-section" style="border-top: 1px solid rgba(10, 216, 173, 0.1); border-bottom: 1px solid rgba(10, 216, 173, 0.1); position: relative; overflow: hidden; padding-bottom: 0;">
        <div class="container">
            <span class="section-tag text-teal text-center" style="display: block; margin: 0 auto 10px auto;">Framework</span>
            <h2 class="text-center" style="color: white; margin-bottom: var(--spacing-lg);">The W.I.N. Framework</h2>
        </div>
        
        <div class="win-grid">
            <!-- Card 1: W -->
            <div class="win-card-wrapper" data-card="W" tabindex="0" role="button" aria-label="Warrior Story, click to reveal details">
                <div class="win-card-tooltip">Click to Flip (Animations Paused)</div>
                <div class="win-card-tilt">
                    <div class="win-flip-card">
                        <!-- Front -->
                        <div class="win-flip-card-front">
                            <div class="glare-card-glare"></div>
                            <div class="glare-card-rainbow"></div>
                            <div class="win-content-front">
                                <span class="win-letter">W</span>
                                <h3 class="win-card-title">Warrior Story</h3>
                                <p class="win-card-teaser">Refuse to defend limitations.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Flip</span>
                            </div>
                        </div>
                        <!-- Back -->
                        <div class="win-flip-card-back">
                            <span class="win-badge">Details</span>
                            <div class="win-content-back">
                                <span class="win-letter-back">W</span>
                                <h4 class="win-back-heading">Warrior Story</h4>
                                <div class="win-divider"></div>
                                <p class="win-back-text">Refusing to defend limitation, choosing not to accept the ordinary.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: I -->
            <div class="win-card-wrapper" data-card="I" tabindex="0" role="button" aria-label="Inspiring Impact, click to reveal details">
                <div class="win-card-tooltip">Click to Flip (Animations Paused)</div>
                <div class="win-card-tilt">
                    <div class="win-flip-card">
                        <!-- Front -->
                        <div class="win-flip-card-front">
                            <div class="glare-card-glare"></div>
                            <div class="glare-card-rainbow"></div>
                            <div class="win-content-front">
                                <span class="win-letter">I</span>
                                <h3 class="win-card-title">Inspiring Impact</h3>
                                <p class="win-card-teaser">Prove capacity to others.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Flip</span>
                            </div>
                        </div>
                        <!-- Back -->
                        <div class="win-flip-card-back">
                            <span class="win-badge">Details</span>
                            <div class="win-content-back">
                                <span class="win-letter-back">I</span>
                                <h4 class="win-back-heading">Inspiring Impact</h4>
                                <div class="win-divider"></div>
                                <p class="win-back-text">Building visible outcomes that prove capacity to others struggling.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 3: N -->
            <div class="win-card-wrapper" data-card="N" tabindex="0" role="button" aria-label="Nurturing Outcomes, click to reveal details">
                <div class="win-card-tooltip">Click to Flip (Animations Paused)</div>
                <div class="win-card-tilt">
                    <div class="win-flip-card">
                        <!-- Front -->
                        <div class="win-flip-card-front">
                            <div class="glare-card-glare"></div>
                            <div class="glare-card-rainbow"></div>
                            <div class="win-content-front">
                                <span class="win-letter">N</span>
                                <h3 class="win-card-title">Nurturing Outcomes</h3>
                                <p class="win-card-teaser">Adapt to your parameters.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Flip</span>
                            </div>
                        </div>
                        <!-- Back -->
                        <div class="win-flip-card-back">
                            <span class="win-badge">Details</span>
                            <div class="win-content-back">
                                <span class="win-letter-back">N</span>
                                <h4 class="win-back-heading">Nurturing Outcomes</h4>
                                <div class="win-divider"></div>
                                <p class="win-back-text">Guiding people to adapt step-by-step to their own parameters.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Return</span>
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
                    <p>In web design, constraints (screen sizes, load limits) force better solutions. The same is true in life. Limitations force us to filter out the noise and focus on what can still be created.</p>
                </div>
                <div class="card">
                    <h3>AI as a Human Bridge</h3>
                    <p>Artificial Intelligence isn't about replacing humanity; it is about expanding capability. For those of us with motor blocks, AI operates as the ultimate accessibility tool, turning thoughts into execution.</p>
                </div>
                <div class="card">
                    <h3>Serve First, Sell Last</h3>
                    <p>Relationships come first. Contribution is second. Selling is last. This hub is built to serve as a library of what is possible, helping others see a blueprint they can apply to their own lives.</p>
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
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Keynotes</span>
            <h1 style="color: white;">Speaking & Keynotes</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                A straight-forward, no-fluff, highly motivating message for leadership groups, disability advocacy conferences, and faith-driven events.
            </p>
        </div>
    </div>
    
    <!-- Section 1: Signature Message & Booking Inquiry -->
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2">
                <div>
                    <span class="section-tag">Signature Message</span>
                    <h2>Winning Despite The Odds</h2>
                    <p>
                        Most motivational talks outline a temporary setback that was magically solved. My message is different: I live with a progressive condition that gets harder every day. Resilience isn't a one-time event; it is a daily adjustment.
                    </p>
                    <p style="margin-bottom: 20px;">
                        In this signature keynote, I share the W.I.N. framework to show how organizations, individuals, and teams can look at their changing parameters, reframe their focus, and build practical success.
                    </p>
                    <div style="background: var(--color-white); border-left: 4px solid var(--color-teal); padding: var(--spacing-sm); margin-bottom: 20px;">
                        <strong>Key Audience Takeaways:</strong>
                        <ul style="margin-top: 10px; padding-left: 20px; color: var(--color-gray-steel);">
                            <li>Shift perspective from limitations to creative constraints.</li>
                            <li>Develop a can-do execution model when traditional resources shift.</li>
                            <li>Leverage emerging AI technologies to multiply team output.</li>
                        </ul>
                    </div>
                </div>
                <div class="card">
                    <h3>Book Speaking Booking Inquiry</h3>
                    <p style="font-size: 0.9rem; margin-bottom: 15px;">Fill out this form to inquire about booking Marchello for an upcoming virtual or in-person event.</p>
                    <form id="speaking-inquiry-form" class="speaking-form">
                        <div class="form-group">
                            <label for="event-name">Event Name</label>
                            <input type="text" id="event-name" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="event-org">Organization</label>
                            <input type="text" id="event-org" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="event-date">Proposed Date</label>
                            <input type="date" id="event-date" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="event-location">Location / Virtual</label>
                            <input type="text" id="event-location" placeholder="e.g. St. Louis, MO or Zoom" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label for="event-audience">Expected Audience size / Type</label>
                            <input type="text" id="event-audience" placeholder="e.g. 200 Corporate Managers" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-teal" style="width: 100%;">Submit Speaking Inquiry</button>
                    </form>
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
                            Marchello Sciortino is a ClickFunnels certified builder, digital creator, and keynote speaker living with Friedrich's ataxia, a progressive neuromuscular condition. Rejecting traditional limits, Marchello uses emerging AI tools to amplify his voice and creative agency. Driven by his W.I.N. framework, he coaches individuals and brands on how to turn physical and strategic limitations into practical, high-performance outcomes.
                        </p>
                    </div>
                    <div>
                        <span class="section-tag text-teal" style="font-size: 0.8rem; margin-bottom: 5px;">Long Bio</span>
                        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--color-gray-light);">
                            Marchello Sciortino is a St. Louis native, digital creator, and keynote speaker. Diagnosed at age 14 with Friedrich’s ataxia, a progressive neuromuscular condition that impacts mobility, energy, and speech, Marchello learned early to reframe boundaries. Rather than accepting defeat, he built a career in online marketing, creating brand websites, funnels, and applications. Today, he leverages AI as an accessibility bridge and shares his W.I.N. (Warrior story, Inspiring impact, Nurturing outcomes) framework with audiences worldwide, helping them turn daily limits into creative assets.
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
                                <strong style="display:block; color: white;">Speaker One-Sheet</strong>
                                <span style="font-size:0.8rem; color:rgba(255, 255, 255, 0.75);">PDF (1.2 MB)</span>
                            </div>
                            <a href="#/speaking" class="btn btn-teal btn-sm" onclick="alert('Downloading placeholder: Speaker One-Sheet.pdf'); return false;">Download</a>
                        </li>
                        <li style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 10px;">
                            <div>
                                <strong style="display:block; color: white;">Headshot Gallery</strong>
                                <span style="font-size:0.8rem; color:rgba(255, 255, 255, 0.75);">ZIP (12 MB)</span>
                            </div>
                            <a href="#/speaking" class="btn btn-teal btn-sm" onclick="alert('Downloading placeholder: Headshots.zip'); return false;">Download</a>
                        </li>
                        <li style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="display:block; color: white;">W.I.N. Framework Logo Assets</strong>
                                <span style="font-size:0.8rem; color:rgba(255, 255, 255, 0.75);">PNG/SVG (3 MB)</span>
                            </div>
                            <a href="#/speaking" class="btn btn-teal btn-sm" onclick="alert('Downloading placeholder: Brand_Assets.zip'); return false;">Download</a>
                        </li>
                    </ul>
            </div>
            
            <div class="media-gallery-row">
                <h4 class="text-white" style="margin-bottom: 5px; font-family: var(--font-heading); font-size: 1.25rem;">Preview Speaker Materials</h4>
                <p style="font-size: 0.9rem; color: var(--color-gray-light); margin-bottom: 20px;">Preview of assets included in the Download Media Kit package.</p>
                <div class="media-gallery-grid">
                    <div class="gallery-item">
                        <img src="assets/placeholders/speaker_munching.svg" alt="Speaker Action">
                        <span class="gallery-item-label">Speaker Action</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/placeholders/headshot_1.svg" alt="Headshot 1">
                        <span class="gallery-item-label">Headshot 1</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/placeholders/headshot_2.svg" alt="Headshot 2">
                        <span class="gallery-item-label">Headshot 2</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/placeholders/headshot_3.svg" alt="Headshot 3">
                        <span class="gallery-item-label">Headshot 3</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/placeholders/headshot_4.svg" alt="Headshot 4">
                        <span class="gallery-item-label">Headshot 4</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/placeholders/win_logo_1.svg" alt="WIN Logo Dark">
                        <span class="gallery-item-label">WIN Logo Dark</span>
                    </div>
                    <div class="gallery-item">
                        <img src="assets/placeholders/win_logo_2.svg" alt="WIN Logo Light">
                        <span class="gallery-item-label">WIN Logo Light</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Section 3: Speaking Topics -->
    <section class="section bg-white" style="border-bottom: 1px solid var(--color-gray-border);">
        <div class="container">
            <h3 class="text-center" style="margin-bottom: var(--spacing-lg); font-size: 2.25rem;">Speaking Topics</h3>
            <div class="grid-3">
                <div class="card">
                    <h4 class="text-teal" style="font-size: 1.3rem; margin-bottom: 12px;">Perspective & The Hand You are Dealt</h4>
                    <p>How to accept real limitations without accepting defeat. A tactical guide to shifting perspective to discover what abilities remain.</p>
                </div>
                <div class="card">
                    <h4 class="text-teal" style="font-size: 1.3rem; margin-bottom: 12px;">AI as a Creative Catalyst</h4>
                    <p>How technology can act as an equalizer. Practical insights into how businesses and individuals can amplify their productivity using modern AI tools.</p>
                </div>
                <div class="card">
                    <h4 class="text-teal" style="font-size: 1.3rem; margin-bottom: 12px;">Faith, Family & Daily Adaptation</h4>
                    <p>Reflections on the support structures, faith foundations, and community ties that keep a warrior story moving forward under pressure.</p>
                </div>
            </div>
        </div>
    </section>
`);

// 7. Accessible AIM Page Template
Router.register('/aim', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Community Initiative</span>
            <h1 style="color: white;">Accessible AIM</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Helping people with physical limitations discover how AI can act as a voice amplifier, text simulator, and creative partner.
            </p>
        </div>
    </div>
    
    <section class="section bg-white" style="padding-bottom: 0;">
        <div class="container text-center" style="max-width: 800px; margin: 0 auto;">
            <span class="section-tag">Teaser & Vision</span>
            <h2>Amplifying Ability through AI</h2>
            <p style="font-size: 1.15rem; line-height: 1.7; margin-bottom: var(--spacing-md); color: var(--color-gray-steel);">
                When physical coordinates become hard to reach, simple tasks like typing, communicating, and coding can become significant barriers. 
                <strong>Accessible AIM</strong> is a program and platform designed to teach constraint-based AI use. We train individuals with disabilities, neuromuscular conditions, and physical constraints on how to configure AI tools to act as their physical extensions.
            </p>
            <p style="font-size: 1.1rem; line-height: 1.7; margin-bottom: var(--spacing-lg); color: var(--color-gray-steel);">
                By learning how to prompt, structure data, and automate layouts, members can build online careers, handle personal admin tasks, and write their own stories with less friction.
            </p>
        </div>
    </section>

    <!-- Dynamic Pillars Section (W.I.N. styled card deck) -->
    <section class="section bg-navy win-section" style="border-top: 1px solid rgba(10, 216, 173, 0.1); border-bottom: 1px solid rgba(10, 216, 173, 0.1); position: relative; overflow: hidden; padding-bottom: 4rem;">
        <div class="container">
            <span class="section-tag text-teal text-center" style="display: block; margin: 0 auto 10px auto;">Pillars</span>
            <h2 class="text-center" style="color: white; margin-bottom: var(--spacing-lg);">Core Focus Areas</h2>
        </div>
        
        <div class="win-grid">
            <!-- Card 1: 1 / A -->
            <div class="win-card-wrapper" data-card="1" tabindex="0" role="button" aria-label="AI Configuration, click to reveal details">
                <div class="win-card-tooltip">Click to Flip (Animations Paused)</div>
                <div class="win-card-tilt">
                    <div class="win-flip-card">
                        <!-- Front -->
                        <div class="win-flip-card-front">
                            <div class="glare-card-glare"></div>
                            <div class="glare-card-rainbow"></div>
                            <div class="win-content-front">
                                <span class="win-letter">1</span>
                                <h3 class="win-card-title">AI Configuration</h3>
                                <p class="win-card-teaser">Optimize your workspace.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Flip</span>
                            </div>
                        </div>
                        <!-- Back -->
                        <div class="win-flip-card-back">
                            <span class="win-badge">Details</span>
                            <div class="win-content-back">
                                <span class="win-letter-back">1</span>
                                <h4 class="win-back-heading">AI Configuration</h4>
                                <div class="win-divider"></div>
                                <p class="win-back-text">Setting up voice-to-text assistants, keyboard shortcuts, and visual layouts to reduce fine motor strain.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 2: 2 / I -->
            <div class="win-card-wrapper" data-card="2" tabindex="0" role="button" aria-label="Creative Execution, click to reveal details">
                <div class="win-card-tooltip">Click to Flip (Animations Paused)</div>
                <div class="win-card-tilt">
                    <div class="win-flip-card">
                        <!-- Front -->
                        <div class="win-flip-card-front">
                            <div class="glare-card-glare"></div>
                            <div class="glare-card-rainbow"></div>
                            <div class="win-content-front">
                                <span class="win-letter">2</span>
                                <h3 class="win-card-title">Creative Execution</h3>
                                <p class="win-card-teaser">Build without barriers.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Flip</span>
                            </div>
                        </div>
                        <!-- Back -->
                        <div class="win-flip-card-back">
                            <span class="win-badge">Details</span>
                            <div class="win-content-back">
                                <span class="win-letter-back">2</span>
                                <h4 class="win-back-heading">Creative Execution</h4>
                                <div class="win-divider"></div>
                                <p class="win-back-text">Using AI to write, code, design graphics, and build websites using prompts and constraint-based directives.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Card 3: 3 / M -->
            <div class="win-card-wrapper" data-card="3" tabindex="0" role="button" aria-label="Community Workspace, click to reveal details">
                <div class="win-card-tooltip">Click to Flip (Animations Paused)</div>
                <div class="win-card-tilt">
                    <div class="win-flip-card">
                        <!-- Front -->
                        <div class="win-flip-card-front">
                            <div class="glare-card-glare"></div>
                            <div class="glare-card-rainbow"></div>
                            <div class="win-content-front">
                                <span class="win-letter">3</span>
                                <h3 class="win-card-title">Community Workspace</h3>
                                <p class="win-card-teaser">Grow with others.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Flip</span>
                            </div>
                        </div>
                        <!-- Back -->
                        <div class="win-flip-card-back">
                            <span class="win-badge">Details</span>
                            <div class="win-content-back">
                                <span class="win-letter-back">3</span>
                                <h4 class="win-back-heading">Community Workspace</h4>
                                <div class="win-divider"></div>
                                <p class="win-back-text">A friendly, no-pity environment where members share custom workflows, support, and professional projects.</p>
                            </div>
                            <div class="flip-prompt">
                                <svg class="flip-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                                </svg>
                                <span>Click to Return</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Waitlist CTA Section -->
    <section class="section bg-white">
        <div class="container text-center">
            <div style="max-width: 800px; margin: 0 auto; border: 1px solid var(--color-gray-border); border-radius: var(--radius-lg); padding: var(--spacing-lg); box-shadow: var(--shadow-md);">
                <h3 style="margin-bottom: 10px;">Join the Early Access Waitlist</h3>
                <p style="color: var(--color-gray-steel); margin-bottom: 25px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    We are currently building the first training tracks. Click the button below to join the waitlist, receive initial guides, and get early entry notifications.
                </p>
                <a href="https://www.accessibleaim.com/optin" target="_blank" rel="noopener noreferrer" class="btn btn-teal" style="padding: 1rem 2.5rem; font-size: 1.1rem; box-shadow: var(--shadow-teal);">
                    Join Waitlist Now &rarr;
                </a>
            </div>
        </div>
    </section>
`);

// 8. ChelloAI Page Template
Router.register('/chelloai', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Digital Companion</span>
            <h1 style="color: white;">ChelloAI Partner</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Technology did not replace my voice. It amplified it. Interact with ChelloAI, my custom conversational companion.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container">
            <div class="grid-2">
                <div>
                    <h2>A Bridge for Connection</h2>
                    <p>
                        Because typing can take me hours and my physical speech has changed, I developed ChelloAI. This partner is trained directly on my personal rules, writings, memories, and voice settings.
                    </p>
                    <p>
                        It does not speak for me, but it represents me in conversations, answering standard questions, providing resources, and helping visitors understand my perspective without delay.
                    </p>
                    <p style="margin-bottom: 20px;">
                        Select a preset topic on the simulator to see how ChelloAI acts as a typing hand and narrative companion.
                    </p>
                    <div style="display: flex; gap: 10px;">
                        <a href="#/aim" class="btn btn-teal">Build Your Own Companion</a>
                    </div>
                </div>
                
                <!-- Chat Window Simulator Container -->
                <div class="chat-window">
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
                    
                    <div class="chat-messages" id="chat-messages">
                        <!-- Initial message -->
                        <div class="message-bubble incoming">
                            Hello! I am ChelloAI, Marchello's digital companion. Select any question below to explore his stories and tools.
                        </div>
                    </div>
                    
                    <div class="chat-suggestions">
                        <p class="chat-suggestions-title">Select a topic to ask:</p>
                        <div class="suggestions-grid" id="chat-suggestions-grid">
                            <!-- Pre-baked buttons dynamically load here -->
                        </div>
                    </div>
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
                        "We hired Marchello to build our ClickFunnels logic. His technical design system was flawless, and knowing the coordination coordinates he works with just proved to us that his capacity is second to none."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Founder, Tech Accelerator</strong>
                </div>
                <div class="card">
                    <span class="text-gold" style="font-size: 1.5rem;">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                    <h4 style="margin-top: 10px;">"Inspiring and Practical"</h4>
                    <p style="font-style: italic; font-size: 0.95rem;">
                        "As a parent of a disabled child, hearing Marchello speak gave me a realistic, non-pity roadmap. He shows that adaptation isn't giving up; it is just a smarter execution strategy."
                    </p>
                    <strong style="display:block; font-size: 0.85rem; margin-top: 10px;">— Attendee, Advocacy Summit</strong>
                </div>
            </div>
            
            <div class="card bg-navy" style="padding: var(--spacing-lg); text-align: center; color: white;">
                <h3 style="color: white; margin-bottom: 10px;">Want to share your story?</h3>
                <p style="color: var(--color-gray-steel); margin-bottom: 20px;">If you have heard Marchello speak or read his articles, let us know how the W.I.N. model helped you.</p>
                <a href="#/contact" class="btn btn-teal">Write to Marchello</a>
            </div>
        </div>
    </section>
`);

// 12. Hub (Blog) Page Template
Router.register('/marchellos-blog', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Story Notes & AI</span>
            <h1 style="color: white;">Marchello's Blog</h1>
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
Router.register('/contact', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Connect</span>
            <h1 style="color: white;">Start a Conversation</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Have a question, want to collaborate, or want to share your own story? I am here.
            </p>
        </div>
    </div>
    
    <section class="section bg-white">
        <div class="container" style="max-width: 600px;">
            <div class="contact-card-custom">
                <form id="contact-page-form">
                    <div class="contact-form-group">
                        <label for="contact-email" class="contact-label">EMAIL <span class="contact-asterisk">*</span></label>
                        <input type="email" id="contact-email" class="contact-input" required>
                    </div>
                    <div class="contact-form-group">
                        <label for="contact-subject" class="contact-label">SUBJECT: <span class="contact-asterisk">*</span></label>
                        <input type="text" id="contact-subject" class="contact-input" required>
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
                    <div class="contact-form-group">
                        <button type="submit" class="contact-btn-submit">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    </section>
`);

// 14. Resources Page Template
Router.register('/resources', () => `
    <div class="page-intro">
        <div class="container text-center">
            <span class="section-tag text-teal">Tools</span>
            <h1 style="color: white;">Free Resources</h1>
            <p class="section-desc" style="color: var(--color-gray-light);">
                Worksheets, prompt templates, and PDF guides to help you reframe obstacles and scale output.
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
                    <a href="#/resources" class="btn btn-outline-teal" onclick="alert('Downloading W.I.N. Reframe Matrix PDF'); return false;" style="margin-top: 15px;">Download PDF</a>
                </div>
                <div class="card">
                    <span class="section-tag">Prompt Cheat Sheet</span>
                    <h3>AI Accessibility Commands</h3>
                    <p>My core templates for configuring AI writing assistants to act as efficient transcription guides.</p>
                    <a href="#/resources" class="btn btn-outline-teal" onclick="alert('Downloading AI Accessibility Commands Prompt Guide'); return false;" style="margin-top: 15px;">Download Guide</a>
                </div>
                <div class="card">
                    <span class="section-tag">Checklist</span>
                    <h3>Digital Flow Audit</h3>
                    <p>A simple check sheet to audit your landing pages for ADA accessibility and speed friction blocks.</p>
                    <a href="#/resources" class="btn btn-outline-teal" onclick="alert('Downloading Digital Flow Audit Checklist'); return false;" style="margin-top: 15px;">Download Checklist</a>
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
            <p>Welcome to Marchello Sciortino's official brand hub. By browsing this site, you agree to comply with standard usage policies. The materials, articles, SVG brain maps, and custom voice models featured on this domain are the intellectual assets of the brand.</p>
            
            <h2 style="margin-top: 25px;">No-Guarantees Disclaimer</h2>
            <p>The advice, strategies, and lessons presented in the Hub or Speaking keynotes reflect Marchello's personal journey and digital experience. They do not constitute official medical advice or secure financial growth promises.</p>
            
            <h2 style="margin-top: 25px;">Limitation of Liability</h2>
            <p>We are not liable for external links, user browser settings adjustments, or third-party implementations based on resources downloaded from this hub.</p>
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
                Marchello Sciortino is committed to making this digital hub accessible and navigable for as many people as possible. We actively develop this platform using WCAG 2.2 Level AA guidelines as our technical standard.
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
                <p style="font-size: 0.95rem; margin-bottom: 15px;">If you experience any barriers while navigating this hub, please let us know so we can adjust the layout constraints.</p>
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
