/**
 * Hub Module - Controls blog database, tag filtering, and dynamic article rendering.
 */
const Hub = {
    articles: [],
    tags: ["All", "Story Notes", "AI and Accessibility", "Lessons From Limitation", "Tools I Use", "Daily Inspiration"],
    activeTag: "All",

    async init() {
        this.tagFilters = document.getElementById('hub-tag-filters');
        this.articlesGrid = document.getElementById('hub-articles-grid');
        this.searchBar = document.getElementById('hub-search');
        
        if (this.tagFilters && this.articlesGrid) {
            // Render spinner loading state
            this.articlesGrid.innerHTML = `
                <div style="grid-column: span 3; text-align: center; padding: 50px; color: var(--color-teal); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; width: 100%;">
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                    <div style="width: 35px; height: 35px; border: 3px solid rgba(10, 216, 173, 0.15); border-top-color: var(--color-teal); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="font-size: 0.95rem; margin: 0; font-family: var(--font-body);">Loading daily articles...</p>
                </div>
            `;

            try {
                const response = await fetch('data/articles.json');
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                const data = await response.json();
                // Ensure data is array and reverse so newest (appended at bottom of JSON) are shown first
                this.articles = Array.isArray(data) ? data.reverse() : [];
            } catch (err) {
                console.error("Failed to load articles dynamically. Falling back to static values:", err);
                this.articles = [
                    {
                        id: 'acceptance',
                        title: "Acceptance and Constraints",
                        tag: "Lessons From Limitation",
                        desc: "A practical look at how identifying your coordinates allows you to build solutions.",
                        date: "June 4, 2026",
                        image: "assets/articulated_inspiration.jpg",
                        body: "<p>One of the biggest lessons I learned growing up with Friedrich's ataxia is that acceptance is the foundation of strength.</p>\n<p>When my coordination began changing, I spent time fighting the reality of it. Designing workarounds begins with seeing our coordinates clearly.</p>\n<blockquote>\"Identifying constraints is the first step of construction. It is finding the clearest path on your coordinates.\"</blockquote>\n<p>In digital design, constraints are normal. We deal with code limits and screen boundaries. We design responsive layouts to fit the exact parameters available. When you treat physical or personal limitations as simple parameters, you focus your energy on what you can build today.</p>"
                    },
                    {
                        id: 'skydiving',
                        title: "The Skydiving Tape Method",
                        tag: "Story Notes",
                        desc: "How a roll of tape and a jump from 14,000 feet taught me the reality of daily adaptation.",
                        date: "May 22, 2026",
                        image: "assets/timeline-4.png",
                        body: "<p>August 27, 2021. I was scheduled to jump out of a airplane. After monsoon rains delayed us three times, the skies cleared and we got the green light to fly.</p>\n<p>Just before boarding, my tandem expert realized a problem: 'We need you to lift and hold your legs up for landing so they don't break. Since you can't control them, we have a problem.'</p>\n<p>He stayed calm and focused on a workaround. He ran to the supply cabinet and returned with a roll of white duck-tape. He taped my legs together so I could lift them as a single unit using my upper body strength. It worked perfectly.</p>\n<blockquote>\"When life gives you coordination blocks, find the nearest roll of duck-tape.\"</blockquote>\n<p>That jump taught me that adaptation is gritty, immediate, and practical. When you want to build a solution, you work with the available parameters to design a bridge.</p>"
                    }
                ];
            }

            this.renderFilters();
            this.renderArticles();
            this.bindEvents();
        }
    },

    bindEvents() {
        if (this.searchBar) {
            this.searchBar.addEventListener('input', () => {
                this.renderArticles();
            });
        }
    },

    renderFilters() {
        this.tagFilters.innerHTML = '';
        this.tags.forEach(tag => {
            const btn = document.createElement('button');
            btn.className = `btn ${this.activeTag === tag ? 'btn-teal' : 'btn-outline-teal'}`;
            btn.style.padding = '6px 14px';
            btn.style.fontSize = '0.85rem';
            btn.textContent = tag;
            btn.setAttribute('aria-pressed', this.activeTag === tag);
            
            btn.addEventListener('click', () => {
                this.activeTag = tag;
                this.renderFilters();
                this.renderArticles();
            });
            this.tagFilters.appendChild(btn);
        });
    },

    renderArticles() {
        this.articlesGrid.innerHTML = '';
        
        const query = this.searchBar ? this.searchBar.value.toLowerCase().trim() : '';
        
        // Filter logic
        const filtered = this.articles.filter(art => {
            const matchesTag = this.activeTag === "All" || art.tag === this.activeTag;
            const matchesSearch = query === '' || 
                                  art.title.toLowerCase().includes(query) || 
                                  art.desc.toLowerCase().includes(query) ||
                                  art.tag.toLowerCase().includes(query);
            return matchesTag && matchesSearch;
        });

        if (filtered.length === 0) {
            this.articlesGrid.innerHTML = `
                <div style="grid-column: span 3; text-align: center; padding: var(--spacing-lg); color: var(--color-gray-steel);">
                    <p>No articles found matching your criteria.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(art => {
            const card = document.createElement('article');
            card.className = 'card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.overflow = 'hidden';
            card.style.padding = '0'; // reset standard card padding to make image bleed
            
            card.innerHTML = `
                ${art.image ? `
                <div class="blog-card-image" style="width: 100%; height: 180px; overflow: hidden; border-bottom: 1px solid var(--color-gray-border);">
                    <img src="${art.image}" alt="${art.title}" style="width: 100%; height: 100%; object-fit: cover; transition: var(--transition-fast);">
                </div>
                ` : ''}
                <div style="padding: var(--spacing-md); display: flex; flex-direction: column; flex: 1;">
                    <span class="section-tag" style="font-size:0.8rem; margin-bottom: 8px; display: inline-block;">${art.tag}</span>
                    <h3 class="card-title" style="margin-top:0; font-size:1.3rem; margin-bottom: 10px; line-height: 1.3;">${art.title}</h3>
                    <p style="font-size:0.9rem; color:var(--color-gray-steel); margin-bottom:15px; line-height: 1.5;">${art.desc}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-gray-border); padding-top:12px; margin-top:auto; width: 100%;">
                        <span style="font-size:0.8rem; color:var(--color-gray-steel);">${art.date}</span>
                        <button class="btn btn-outline-teal" style="padding: 6px 12px; font-size:0.8rem;" aria-label="Read ${art.title}">Read Article</button>
                    </div>
                </div>
            `;
            
            // Clicking card opens full article in detail modal
            const readBtn = card.querySelector('button');
            const openModalFn = () => this.showArticleDetail(art);
            
            readBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openModalFn();
            });
            card.addEventListener('click', () => openModalFn());
            
            this.articlesGrid.appendChild(card);
        });
    },

    showArticleDetail(art) {
        const modal = document.getElementById('detail-modal');
        const tag = document.getElementById('detail-node-tag');
        const title = document.getElementById('detail-node-title');
        const body = document.getElementById('detail-node-body');
        
        if (modal && title && body) {
            tag.textContent = art.tag;
            title.textContent = art.title;
            body.innerHTML = `
                <div style="font-size:0.9rem; color:var(--color-gray-steel); margin-bottom:15px;">Published: ${art.date}</div>
                ${art.image ? `
                <div style="width:100%; max-height:380px; overflow:hidden; border-radius:var(--radius-md); margin-bottom:20px; border:1px solid var(--color-gray-border);">
                    <img src="${art.image}" alt="${art.title}" style="width:100%; max-height:380px; object-fit:cover;">
                </div>
                ` : ''}
                <div class="detail-divider" style="margin-bottom: 20px;"></div>
                <div class="blog-body-html" style="line-height: 1.7; font-size: 1.05rem;">
                    ${art.body}
                </div>
            `;
            
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();
        }
    }
};
