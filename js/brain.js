/**
 * Brain Module - Handles rendering the interactive neural SVG map and modal display.
 */
const Brain = {
    nodes: [
        {
            id: 'mind',
            label: "My Mind",
            tag: 'Core Mission',
            isCenter: true,
            x: 400, y: 250, r: 50,
            quote: "The most powerful resource I have is how I think. Friedrich's ataxia has changed my physical coordinates, and I focus my energy on digital design and creation."
        },
        {
            id: 'resilience',
            label: 'Resilience',
            tag: 'Warrior Path',
            x: 180, y: 150, r: 35,
            quote: "Acceptance means adapting. I design around my physical parameters to keep building creative projects. Being a warrior is about finding a way forward with what I have today."
        },
        {
            id: 'adaptation',
            label: 'Adaptation',
            tag: 'Daily Systems',
            x: 620, y: 150, r: 35,
            quote: "When simple movements require assistance, I adapt. I design systems that let me build digital products despite physical strain."
        },
        {
            id: 'ai',
            label: 'AI Amplification',
            tag: 'Technology',
            x: 300, y: 380, r: 35,
            quote: "AI acts as my typing speed. When writing became a physical struggle, I configured prompt templates to help me build websites and draft articles."
        },
        {
            id: 'faith',
            label: 'Faith & Purpose',
            tag: 'Spiritual Foundation',
            x: 500, y: 380, r: 35,
            quote: "My faith provides the foundation to persevere. I know that more is possible than most people realize, with a little shift in perspective."
        },
        {
            id: 'family',
            label: 'Family & Legacy',
            tag: 'Support Structure',
            x: 180, y: 320, r: 35,
            quote: "My parents, David and Alicia, are my daily aids. Dave's chronic Lyme taught us early about adapting. I'm building a professional legacy of digital design to contribute to those I love."
        },
        {
            id: 'speaking',
            label: 'Speaking Topics',
            tag: 'Keynotes',
            x: 620, y: 320, r: 35,
            quote: "I deliver keynote talks that share the reality of progressive limitations and how to build practical momentum."
        },
        {
            id: 'aim',
            label: 'Accessible AIM',
            tag: 'Future Initiative',
            x: 400, y: 80, r: 35,
            quote: "Accessible AIM is an initiative where I share prompt setups to help others with physical limitations use AI as a creative assistant."
        }
    ],

    init() {
        const container = document.getElementById('brain-map-container');
        const listGrid = document.getElementById('brain-list-grid');
        
        if (container) {
            this.renderSVG(container);
        }
        if (listGrid) {
            this.renderList(listGrid);
        }
    },

    renderSVG(container) {
        // Build SVG element
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 800 500");
        svg.setAttribute("class", "brain-svg");
        svg.setAttribute("aria-label", "Neural Brain Map showing Marchello's core themes. Keyboard navigate using the backup directory buttons below.");
        svg.setAttribute("role", "img");

        // 1. Draw connection lines from outlying nodes to the center node
        const center = this.nodes.find(n => n.isCenter);
        this.nodes.forEach(node => {
            if (node.isCenter) return;
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", center.x);
            line.setAttribute("y1", center.y);
            line.setAttribute("x2", node.x);
            line.setAttribute("y2", node.y);
            line.setAttribute("class", "brain-connection");
            svg.appendChild(line);
        });

        // 2. Draw nodes and text labels
        this.nodes.forEach(node => {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("class", `brain-node ${node.isCenter ? 'center-node' : ''}`);
            g.setAttribute("tabindex", "0"); // make keyboard focusable
            g.setAttribute("role", "button");
            g.setAttribute("aria-label", `${node.label} - ${node.tag}. Click to read notes.`);

            // Draw circle
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", node.x);
            circle.setAttribute("cy", node.y);
            circle.setAttribute("r", node.r);
            g.appendChild(circle);

            // Draw label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", node.x);
            text.setAttribute("y", node.y + 5);
            text.textContent = node.label;
            g.appendChild(text);

            // Bind click & key Enter events
            g.addEventListener('click', () => this.showDetail(node));
            g.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showDetail(node);
                }
            });

            svg.appendChild(g);
        });

        container.innerHTML = '';
        container.appendChild(svg);
    },

    renderList(container) {
        container.innerHTML = '';
        this.nodes.forEach(node => {
            const btn = document.createElement('button');
            btn.className = 'brain-list-btn';
            btn.textContent = node.label;
            btn.setAttribute('aria-label', `View details on ${node.label}`);
            
            btn.addEventListener('click', () => this.showDetail(node));
            container.appendChild(btn);
        });
    },

    showDetail(node) {
        const modal = document.getElementById('detail-modal');
        const tag = document.getElementById('detail-node-tag');
        const title = document.getElementById('detail-node-title');
        const body = document.getElementById('detail-node-body');
        
        if (modal && title && body) {
            tag.textContent = node.tag;
            title.textContent = node.label;
            
            body.innerHTML = `
                <blockquote>"${node.quote}"</blockquote>
                <p>I work daily within these coordinates, adapting my strategies to maintain high execution quality and achieve impact without pity.</p>
            `;
            
            // Activate modal
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            
            // Shift focus inside modal
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) closeBtn.focus();
        }
    }
};
