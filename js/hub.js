/**
 * Hub Module - Controls blog database, tag filtering, and dynamic article rendering.
 */
const Hub = {
    articles: [
        {
            id: 'acceptance',
            title: "Acceptance and Constraints",
            tag: "Lessons From Limitation",
            desc: "A practical look at how identifying your coordinates allows you to build solutions.",
            date: "June 4, 2026",
            body: `
                <p>One of the biggest lessons I learned growing up with Friedrich's ataxia is that acceptance is the foundation of strength.</p>
                <p>When my coordination began changing, I spent time fighting the reality of it. Designing workarounds begins with seeing our coordinates clearly.</p>
                <blockquote>"Identifying constraints is the first step of construction. It is finding the clearest path on your coordinates."</blockquote>
                <p>In digital design, constraints are normal. We deal with code limits and screen boundaries. We design responsive layouts to fit the exact parameters available. When you treat physical or personal limitations as simple parameters, you focus your energy on what you can build today.</p>
            `
        },
        {
            id: 'skydiving',
            title: "The Skydiving Tape Method",
            tag: "Story Notes",
            desc: "How a roll of tape and a jump from 14,000 feet taught me the reality of daily adaptation.",
            date: "May 22, 2026",
            body: `
                <p>August 27, 2021. I was scheduled to jump out of a airplane. After monsoon rains delayed us three times, the skies cleared and we got the green light to fly.</p>
                <p>Just before boarding, my tandem expert realized a problem: 'We need you to lift and hold your legs up for landing so they don't break. Since you can't control them, we have a problem.'</p>
                <p>He stayed calm and focused on a workaround. He ran to the supply cabinet and returned with a roll of white duck-tape. He taped my legs together so I could lift them as a single unit using my upper body strength. It worked perfectly.</p>
                <blockquote>"When life gives you coordination blocks, find the nearest roll of duck-tape."</blockquote>
                <p>That jump taught me that adaptation is gritty, immediate, and practical. When you want to build a solution, you work with the available parameters to design a bridge.</p>
            `
        },
        {
            id: 'avatar',
            title: "How to Build a Voice Companion Avatar",
            tag: "AI and Accessibility",
            desc: "A step-by-step breakdown on how I trained ChelloAI on my personal guidelines and voice parameters to help write for me.",
            date: "April 15, 2026",
            body: `
                <p>Typing is a physical struggle. As coordination changes, pushing keys is exhausting. That's why I use AI models as my typing assistants.</p>
                <p>ChelloAI was born out of a simple need: I needed a digital helper that could communicate my thoughts in my voice. To build it, I compiled a text corpus detailing my life timeline, my design experiences, and specific conversational parameters.</p>
                <p>The rules I used to train the companion focus on keeping the writing authentic, avoiding marketing buzzwords, and framing challenges positively without seeking pity. By loading this custom data, I now have an assistant that speaks with my direct attitude, acting as a conversational partner.</p>
            `
        },
        {
            id: 'win-matrix',
            title: "The W.I.N. Reframe Matrix",
            tag: "Tools I Use",
            desc: "A practical reflection tool to map out physical, strategic, or budget constraints and decide what outcome to build next.",
            date: "March 2, 2026",
            body: `
                <p>Whether you are a business owner dealing with a tight budget or an individual dealing with a health coordinate, we all face boundaries. I created the W.I.N. framework to audit these limits and find direction.</p>
                <p>The matrix is split into three phases:</p>
                <ol>
                    <li><strong>Warrior Story:</strong> Write down the limitations you are facing. Acknowledge them fully as parameters.</li>
                    <li><strong>Inspiring Impact:</strong> Identify the highest value outcome you can produce within these coordinates.</li>
                    <li><strong>Nurturing Outcomes:</strong> Break down the daily steps. Use AI tools to handle repetitive tasks and save your energy.</li>
                </ol>
                <p>By moving through this matrix, you focus your energy on what you can create from where you are today.</p>
            `
        }
    ],

    tags: ["All", "Story Notes", "AI and Accessibility", "Lessons From Limitation", "Tools I Use"],
    activeTag: "All",

    init() {
        this.tagFilters = document.getElementById('hub-tag-filters');
        this.articlesGrid = document.getElementById('hub-articles-grid');
        this.searchBar = document.getElementById('hub-search');
        
        if (this.tagFilters && this.articlesGrid) {
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
            card.innerHTML = `
                <span class="section-tag" style="font-size:0.8rem;">${art.tag}</span>
                <h3 class="card-title" style="margin-top:5px; font-size:1.3rem;">${art.title}</h3>
                <p style="font-size:0.9rem; color:var(--color-gray-steel); margin-bottom:15px;">${art.desc}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-gray-border); padding-top:10px; margin-top:auto;">
                    <span style="font-size:0.8rem; color:var(--color-gray-steel);">${art.date}</span>
                    <button class="btn btn-outline-teal" style="padding: 6px 12px; font-size:0.8rem;" aria-label="Read ${art.title}">Read Article</button>
                </div>
            `;
            
            // Clicking card opens full article in detail modal
            const readBtn = card.querySelector('button');
            const openModalFn = () => this.showArticleDetail(art);
            
            readBtn.addEventListener('click', openModalFn);
            card.addEventListener('click', (e) => {
                if(e.target !== readBtn) openModalFn();
            });
            
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
                <div class="detail-divider"></div>
                ${art.body}
            `;
            
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();
        }
    }
};
