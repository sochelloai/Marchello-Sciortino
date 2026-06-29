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
            
            // Build shareable link URL
            const shareUrl = encodeURIComponent(window.location.origin + '/hub?article=' + art.id);
            const shareTitle = encodeURIComponent(art.title);
            
            body.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; border-bottom: 1px solid var(--color-gray-border); padding-bottom: 10px;">
                    <div style="font-size:0.9rem; color:var(--color-gray-steel);">Published: ${art.date}</div>
                    
                    <!-- Social Share Button Container -->
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 0.75rem; color: var(--color-gray-steel); font-family: var(--font-body); font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase;">Share:</span>
                        <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" target="_blank" rel="noopener noreferrer" class="share-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--color-gray-border); color: var(--color-navy); transition: var(--transition-fast); text-decoration: none;" title="Share on X (Twitter)">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener noreferrer" class="share-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--color-gray-border); color: var(--color-navy); transition: var(--transition-fast); text-decoration: none;" title="Share on LinkedIn">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener noreferrer" class="share-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--color-gray-border); color: var(--color-navy); transition: var(--transition-fast); text-decoration: none;" title="Share on Facebook">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                        </a>
                        <button id="copy-share-link" class="share-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--color-gray-border); color: var(--color-navy); background: transparent; cursor: pointer; transition: var(--transition-fast);" title="Copy Link">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        </button>
                    </div>
                </div>
                ${art.image ? `
                <div style="width:100%; max-height:380px; overflow:hidden; border-radius:var(--radius-md); margin-bottom:20px; border:1px solid var(--color-gray-border);">
                    <img src="${art.image}" alt="${art.title}" style="width:100%; max-height:380px; object-fit:cover;">
                </div>
                ` : ''}
                <div class="blog-body-html" style="line-height: 1.7; font-size: 1.05rem;">
                    ${art.body}
                </div>
            `;
            
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();

            // Set up Copy to Clipboard logic
            setTimeout(() => {
                const copyBtn = document.getElementById('copy-share-link');
                if (copyBtn) {
                    copyBtn.addEventListener('click', async () => {
                        try {
                            const fullUrl = window.location.origin + '/hub?article=' + art.id;
                            await navigator.clipboard.writeText(fullUrl);
                            
                            // Visual feedback (check icon)
                            const originalHtml = copyBtn.innerHTML;
                            copyBtn.innerHTML = `<span style="font-size:0.75rem; color:var(--color-teal); font-weight:bold;">&check;</span>`;
                            setTimeout(() => {
                                copyBtn.innerHTML = originalHtml;
                            }, 2000);
                        } catch (err) {
                            console.error("Failed to copy link:", err);
                        }
                    });
                }
            }, 50);
        }
    }
};
