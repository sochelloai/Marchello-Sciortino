/**
 * Hub Module - Controls blog database, tag filtering, and dynamic article rendering.
 */
const Hub = {
    articles: [
        {
            id: 'acceptance',
            title: "Acceptance is Not Quitting",
            tag: "Lessons From Limitation",
            desc: "Understanding the difference between throwing in the towel and acknowledging your real design constraints.",
            date: "June 4, 2026",
            body: `
                <p>One of the biggest lessons I learned growing up with Friedrich's ataxia is that acceptance is completely different from giving up. In fact, acceptance is the absolute foundation of strength.</p>
                <p>When my coordination began failing, I spent a lot of time fighting the reality of it. I tried to convince myself that I just wasn't trying hard enough, or that my exhaustion was normal. But you cannot design a workaround for a problem you refuse to see.</p>
                <blockquote>"Accepting your constraints is not giving up. It is looking at the coordinates of your map and choosing the smartest path forward."</blockquote>
                <p>In digital marketing, constraints are normal. We deal with code limits, narrow bandwidths, and screen boundaries. We don't complain that the screen is small—we design a responsive layout that fits it. When you treat physical or personal limitations as simple design constraints, the self-pity drops away, and you can finally get back to building.</p>
            `
        },
        {
            id: 'skydiving',
            title: "The Skydiving Tape Method",
            tag: "Story Notes",
            desc: "A story about white duck-tape, tandem skydiving at 14,000 feet, and why solving details is about raw adaptation.",
            date: "May 22, 2026",
            body: `
                <p>August 27, 2021. I was scheduled to jump out of a perfectly good airplane. After monsoon rains delayed us three times, the skies cleared and we got the green light to fly up and fall down.</p>
                <p>Just before boarding, my tandem expert realized a problem: 'We need you to lift and hold your legs up for landing so they don't break. Since you can't control them, we have a problem.'</p>
                <p>He didn't panic or tell me I couldn't jump. Instead, he ran to the supply cabinet and returned with a roll of white duck-tape. He taped my legs together so I could lift them as a single unit using my upper body strength. It worked perfectly.</p>
                <blockquote>"When life gives you coordination blocks, find the nearest roll of duck-tape."</blockquote>
                <p>That jump taught me that adaptation isn't polished or corporate. It is gritty, immediate, and practical. When you want to achieve an outcome, you don't accept defeat because of a limitation—you grab the tape and design a bridge.</p>
            `
        },
        {
            id: 'avatar',
            title: "How to Build a Voice Companion Avatar",
            tag: "AI and Accessibility",
            desc: "A step-by-step breakdown on how I trained ChelloAI on my personal guidelines and voice parameters to help write for me.",
            date: "April 15, 2026",
            body: `
                <p>Typing is a nightmare. As fine motor movements fade, pushing keys is exhausting and takes me hours. That's why I turned AI models into my physical extensions.</p>
                <p>ChelloAI was born out of a simple need: I needed a partner that could communicate my thoughts without me having to type every word. To build it, I created a text corpus detailing my life timeline, my chiropractic treatment experiences, and specific conversational parameters.</p>
                <p>Key rules I used to train the companion:</p>
                <ul>
                    <li><strong>No Pity:</strong> Never write replies that seek sympathy or use expressions like 'victim' or 'suffering from.'</li>
                    <li><strong>No Buzzwords:</strong> Exclude terms like 'synergize' or 'optimize'—write like a real friend.</li>
                    <li><strong>Direct Value:</strong> Focus on solving problems with no-fluff answers.</li>
                </ul>
                <p>By using localized data loading, I now have an assistant that speaks with my direct attitude, acting as a conversational and creative partner.</p>
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
                    <li><strong>Warrior Story:</strong> Write down the limitations you are facing. Stop defending them. Acknowledge them fully as parameters.</li>
                    <li><strong>Inspiring Impact:</strong> Ask: What is the highest value outcome we can still produce within these exact coordinates? What is the digital proof of capacity?</li>
                    <li><strong>Nurturing Outcomes:</strong> Break down the daily steps required. What tools (like AI or automation) can take over the mechanical tasks to save your energy?</li>
                </ol>
                <p>By moving through this matrix, you stop looking at what you lost and start focusing on what you can still create from where you are today.</p>
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
