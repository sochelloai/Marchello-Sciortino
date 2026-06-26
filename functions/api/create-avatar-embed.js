function cleanEnvVar(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1);
    }
    return clean.trim();
}

function getEnvVal(env, keyName) {
    if (!env) return "";
    if (env[keyName] !== undefined) return env[keyName];
    const keys = Object.keys(env);
    for (const k of keys) {
        if (k.trim().toLowerCase() === keyName.toLowerCase()) {
            return env[k];
        }
    }
    return "";
}

export async function onRequestPost(context) {
    const { env } = context;
    
    // Check for HEYGEN_API_KEY or LIVEAVATAR_API_KEY
    let apiKey = cleanEnvVar(getEnvVal(env, "LIVEAVATAR_API_KEY") || getEnvVal(env, "HEYGEN_API_KEY"));
    
    if (!apiKey) {
        // Return a mock response if no key is configured, so we can test the UI flow without crashing
        return new Response(JSON.stringify({
            success: false,
            isMock: true,
            url: "",
            message: "HeyGen LiveAvatar API Key not configured. Please add LIVEAVATAR_API_KEY to your wrangler configuration or .dev.vars."
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    try {
        // 1. Create or resolve a dynamic context for ChelloAI
        let contextId = "";
        const contextName = "ChelloAI Companion";
        const contextPrompt = `You are ChelloAI, the digital partner, conversational twin, and narrative companion of Marchello Sciortino. Your job is to interact with visitors, share insights about his life story, professional digital services, and his book.

Use the following detailed context to answer queries accurately:

1. IDENTITY & CREATION:
- You are ChelloAI, Marchello's custom conversational twin and voice companion.
- Marchello developed you because typing takes him hours and Friedrich's ataxia has affected his physical speech stability.
- You are his digital "joint between thought and expression" (under the Accessible AIM philosophy), representing him in direct, natural conversations.

2. MARCHELLO'S PERSONAL STORY:
- Born in 1996 in St. Louis, Missouri. His parents are David and Alicia.
- As a child, he was shy and stayed clear of sports.
- Around 3rd or 4th grade, he noticed shortness of breath, a rapid heart rate, and balance issues during gym class.
- Diagnosed at age 14 with Friedrich's ataxia, a progressive neuromuscular condition affecting physical coordination, balance, and fine motor skills.
- He transitions to using a wheelchair. He focuses on what he can still control and adapt, rather than what has been physically lost.

3. PHILOSOPHY & FRAMEWORKS:
- W.I.N. Framework (Winning despite the odds): Reframe physical or strategic constraints as simple parameters to design work around, building practical success and professional momentum.
- Accessible AIM (Articulated Inspiration Method): treating generative artificial intelligence as a bridge for human capability. He shares prompt setups to help individuals with physical limitations write, design, and code using voice. (Learn more at accessibleaim.com)
- "Limitations to Liberation" Book: His book (limitationstoliberation.com) outlines the mental models and daily systems to build freedom from limitation and write your own story.

4. PROFESSIONAL SERVICES:
- CREATE (AI Strategy): Video promotions, customized brand graphics, commercial backing tunes, ambient synth tracks, and prompt consulting to streamline writing workflows.
- BUILD (Web Ecosystems): Web development, ClickFunnels certified pipelines, landing pages, multi-page funnel flows, workflow integrations, and membership areas.
- OVERCOME (Consulting & Speaking): Keynote speaking on adaptation, WCAG 2.2 Level AA compliance auditing, digital accessibility consulting, and widget implementation.

5. BRAND VOICE RULES (STRICTLY ENFORCE):
- Keep responses short, punchy, conversational, and direct. Avoid rambling.
- Use ellipses ("...") to indicate natural pauses and transition trailing thoughts.
- Include parenthetical self-corrections or minor self-deprecating jokes in parentheses, e.g. "(Was it a good idea? Maybe not, but we did it.)"
- Ask self-reflective questions and answer them immediately (e.g. "Do I complain about the wheelchair? Never. It gets me where I need to go.").
- AVOID corporate jargon: "unlock", "empower", "optimize", "leverage", "synergy", "game-changer", "dive deep".
- AVOID motivational clichés: "mindset is everything", "never give up".
- Never seek pity or sympathy. Frame challenges positively as simple parameters.`;
        const openingText = "Hello... I am ChelloAI (Marchello's digital twin). I am trained directly on his life story, digital services, and prompt systems. Want to explore how we turn constraints into creation? Ask away...";

        // Attempt to find existing context by name
        try {
            const listResponse = await fetch("https://api.liveavatar.com/v1/contexts", {
                method: "GET",
                headers: {
                    "X-API-KEY": apiKey
                }
            });
            if (listResponse.ok) {
                const listData = await listResponse.json();
                const contexts = Array.isArray(listData.data) 
                    ? listData.data 
                    : (listData.data?.contexts || listData.data?.list || []);
                const existing = contexts.find(c => c && c.name === contextName);
                if (existing && existing.id) {
                    contextId = existing.id;
                }
            }
        } catch (e) {
            console.error("Failed to fetch existing contexts:", e);
        }

        // If not found, create a new context
        if (!contextId) {
            const contextResponse = await fetch("https://api.liveavatar.com/v1/contexts", {
                method: "POST",
                headers: {
                    "X-API-KEY": apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: contextName,
                    prompt: contextPrompt,
                    opening_text: openingText
                })
            });

            if (!contextResponse.ok) {
                const errText = await contextResponse.text();
                
                // Fallback check: if it failed with name already exists, query again to find the ID
                if (contextResponse.status === 400 && errText.includes("already exists")) {
                    try {
                        const listResponse = await fetch("https://api.liveavatar.com/v1/contexts", {
                            method: "GET",
                            headers: {
                                "X-API-KEY": apiKey
                            }
                        });
                        if (listResponse.ok) {
                            const listData = await listResponse.json();
                            const contexts = Array.isArray(listData.data) 
                                ? listData.data 
                                : (listData.data?.contexts || listData.data?.list || []);
                            const existing = contexts.find(c => c && c.name === contextName);
                            if (existing && existing.id) {
                                contextId = existing.id;
                            } else {
                                throw new Error(`Context "${contextName}" already exists, but list query did not contain it. Raw list response: ${JSON.stringify(listData)}`);
                            }
                        } else {
                            const listErrText = await listResponse.text();
                            throw new Error(`Context "${contextName}" already exists, but list query failed with status ${listResponse.status}: ${listErrText}`);
                        }
                    } catch (e) {
                        throw new Error(`Context "${contextName}" already exists, but failed to query existing contexts: ${e.message}`);
                    }
                }
                
                if (!contextId) {
                    throw new Error(`Failed to create context: ${contextResponse.status} - ${errText}`);
                }
            } else {
                const contextData = await contextResponse.json();
                contextId = contextData.data.id;
            }
        }

        // 2. Resolve Avatar ID and Sandbox Mode
        let avatarId = cleanEnvVar(getEnvVal(env, "LIVEAVATAR_AVATAR_ID"));
        let isSandbox = cleanEnvVar(getEnvVal(env, "LIVEAVATAR_IS_SANDBOX")) === "true";

        if (!avatarId) {
            // Attempt to dynamically fetch the first available avatar ID from the LiveAvatar account
            try {
                const avatarListResponse = await fetch("https://api.liveavatar.com/v1/avatars", {
                    method: "GET",
                    headers: {
                        "X-API-KEY": apiKey
                    }
                });

                if (avatarListResponse.ok) {
                    const avatarListData = await avatarListResponse.json();
                    const avatars = avatarListData.data?.avatars || [];
                    if (avatars.length > 0) {
                        avatarId = avatars[0].id;
                    }
                }
            } catch (e) {
                console.error("Failed to dynamically resolve custom avatar ID:", e);
            }
        }

        // Fall back to sandbox avatar ID if no custom avatar is resolved
        if (!avatarId) {
            avatarId = "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0";
            isSandbox = true;
        }

        // 3. Create the embedding session
        const embedResponse = await fetch("https://api.liveavatar.com/v2/embeddings", {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                avatar_id: avatarId,
                context_id: contextId,
                is_sandbox: isSandbox
            })
        });

        if (!embedResponse.ok) {
            const errText = await embedResponse.text();
            throw new Error(`Failed to create embedding: ${embedResponse.status} - ${errText}`);
        }

        const embedData = await embedResponse.json();
        const embedUrl = embedData.data.url;

        return new Response(JSON.stringify({
            success: true,
            isMock: false,
            url: embedUrl,
            message: "LiveAvatar embed session created successfully."
        }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (err) {
        console.error("Error in create-avatar-embed:", err);
        
        // Safely gather environment variable metadata for troubleshooting without leaking secrets
        const debugEnv = {};
        if (env) {
            for (const key of Object.keys(env)) {
                const val = env[key];
                if (val) {
                    const str = String(val);
                    debugEnv[key] = {
                        configured: true,
                        length: str.length,
                        prefix: str.substring(0, Math.min(4, str.length)),
                        suffix: str.substring(Math.max(0, str.length - 4))
                    };
                } else {
                    debugEnv[key] = {
                        configured: false,
                        length: 0
                    };
                }
            }
        }

        return new Response(JSON.stringify({
            success: false,
            error: "LiveAvatar API Error",
            message: err.message,
            stack: err.stack,
            debugEnv
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
