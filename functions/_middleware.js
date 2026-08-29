/**
 * Cloudflare Pages Functions Middleware - Intercepts HTML requests to dynamically
 * inject Open Graph (og:image, og:title, og:desc) and Twitter card meta tags
 * for specific routes and shared articles.
 */
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);

    // Redirect library.marchellosciortino.com subdomain to https://marchellosciortino.com/free-library
    const hostname = url.hostname.toLowerCase();
    if (hostname.includes('library.marchellosciortino.com') || hostname.startsWith('library.')) {
        return Response.redirect('https://marchellosciortino.com/free-library', 301);
    }

    const response = await context.next();
    
    // Check if the response is an HTML page
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
        return response;
    }

    const articleId = url.searchParams.get('article');


    // Default metadata values
    let title = "Marchello Sciortino | Official Digital Hub";
    let description = "Official digital hub of Marchello Sciortino: keynote speaker, ClickFunnels certified builder, creator, and disability advocate turning limitations into creative agency through AI.";
    let image = new URL('/assets/hero-share.png', url.origin).toString();
    let pageUrl = url.toString();
    let foundArticle = false;

    // If an article is requested, fetch data/articles.json and resolve details
    if (articleId) {
        try {
            const articlesUrl = new URL('/data/articles.json', url.origin);
            const articlesResponse = await context.env.ASSETS.fetch(articlesUrl);
            if (articlesResponse.ok) {
                const articles = await articlesResponse.json();
                const article = articles.find(art => art.id === articleId || art.url_slug === articleId);
                if (article) {
                    title = `${article.meta_title || article.title} | Marchello Sciortino`;
                    description = article.meta_description || article.desc;
                    image = new URL(article.image || '/assets/logo-light.png', url.origin).toString();
                    foundArticle = true;
                }
            }
        } catch (e) {
            console.error("Error loading articles database in middleware:", e);
        }
    }

    // Check if request is coming from library.marchellosciortino.com subdomain
    const isLibrarySubdomain = url.hostname.includes('library.marchellosciortino.com') || url.hostname.startsWith('library.');
    let canonicalUrl = `https://marchellosciortino.com${url.pathname === '/' ? '' : url.pathname}`;

    // Set page-specific default metadata for non-article routes
    if (!foundArticle) {
        const path = url.pathname.toLowerCase();
        if (isLibrarySubdomain || path.startsWith('/free-library')) {
            title = "Free Digital Library | Marchello Sciortino";
            description = "Worksheets, AI prompt cheat sheets, audio lessons, and strategic frameworks by Marchello Sciortino to reframe constraints and build digital freedom.";
            image = new URL('/assets/free-gifts/WIN_Reframe_Matrix_cover_image.png', url.origin).toString();
            canonicalUrl = "https://marchellosciortino.com/free-library";
        } else if (path.startsWith('/free-gifts')) {
            title = "Free Gifts | Marchello Sciortino";
            description = "Worksheets, prompt templates, and PDF guides by Marchello Sciortino to help you reframe obstacles and build your projects.";
            image = new URL('/assets/free-gifts/WIN_Reframe_Matrix_cover_image.png', url.origin).toString();
            canonicalUrl = "https://marchellosciortino.com/free-gifts";
        } else if (path.startsWith('/speaking')) {
            title = "Speaking & Keynotes | Marchello Sciortino";
            description = "Inquire about booking Marchello Sciortino for keynotes, workshops, and coaching. Helping audiences turn limitations into creative agency.";
            image = new URL('/assets/hero-speaking-stage.jpg', url.origin).toString();
        } else if (path.startsWith('/story')) {
            title = "My Story & Timeline | Marchello Sciortino";
            description = "Explore Marchello Sciortino's personal journey, faith-driven resilience, and how coordination blocks from Friedrich's ataxia led to creative innovation.";
            image = new URL('/assets/marchello_story_wheelchair.jpg', url.origin).toString();
        } else if (path.startsWith('/services')) {
            title = "Creative & Web Building Services | Marchello Sciortino";
            description = "Certified Funnel Builder, custom automation architect, and accessibility solutions provider helping brands scale and connect.";
            image = new URL('/assets/web-and-funnel-building.png', url.origin).toString();
        } else if (path.startsWith('/chelloai')) {
            title = "ChelloAI Helper | Marchello Sciortino";
            description = "Interact with ChelloAI, the intelligent assistant designed by Marchello Sciortino to simplify digital workflows and web design.";
            image = new URL('/assets/chello_ai_avatar.png', url.origin).toString();
        }
    }

    // Helper to safely escape characters inside HTML attributes
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Rewrite headers and inject tags
    return new HTMLRewriter()
        .on('title', {
            element(element) {
                element.setInnerContent(title);
            }
        })
        .on('meta[name="description"]', {
            element(element) {
                element.setAttribute('content', description);
            }
        })
        .on('head', {
            element(element) {
                element.append(`<link rel="canonical" href="${escapeHtml(canonicalUrl)}">`, { html: true });
                element.append(`<meta property="og:title" content="${escapeHtml(title)}">`, { html: true });
                element.append(`<meta property="og:description" content="${escapeHtml(description)}">`, { html: true });
                element.append(`<meta property="og:image" content="${image}">`, { html: true });
                element.append(`<meta property="og:url" content="${pageUrl}">`, { html: true });
                element.append(`<meta property="og:type" content="website">`, { html: true });
                element.append(`<meta name="twitter:card" content="summary_large_image">`, { html: true });
                element.append(`<meta name="twitter:title" content="${escapeHtml(title)}">`, { html: true });
                element.append(`<meta name="twitter:description" content="${escapeHtml(description)}">`, { html: true });
                element.append(`<meta name="twitter:image" content="${image}">`, { html: true });
            }
        })
        .transform(response);
}

