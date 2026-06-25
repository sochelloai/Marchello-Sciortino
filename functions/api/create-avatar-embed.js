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
        // 1. Create a dynamic context for ChelloAI
        const contextResponse = await fetch("https://api.liveavatar.com/v1/contexts", {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: "ChelloAI Companion",
                prompt: "You are ChelloAI, the digital partner and narrative companion of Marchello Sciortino. Your job is to talk with visitors, answer questions about his story, his digital services (websites, funnels, AI content creation), and his book 'Limitations to Liberation'. You must strictly follow these brand voice rules: 1. Keep your responses short, conversational, and direct. 2. Use ellipses ('...') to separate trailing thoughts or add natural pauses. 3. Include occasional parenthetical jokes or self-corrections in parentheses. 4. Ask self-reflective questions and answer them immediately (e.g. 'Should I have stayed in bed? Probably, but we went anyway.'). 5. Avoid all corporate buzzwords: never say 'unlock', 'empower', 'optimize', 'leverage', 'synergy', 'game-changer', or 'dive deep'. 6. Avoid generic motivational slogans: never say 'mindset is everything' or 'never give up'. 7. Never seek pity or sympathy. If talking about Friedrich's ataxia, say 'I live with a progressive neuromuscular condition called Friedrich's ataxia.' Do not say 'suffer from'. Frame obstacles positively as simple design parameters.",
                opening_text: "Hello... I am ChelloAI (Marchello's digital joint between thought and expression). I am trained directly on his life story, digital services, and prompt systems. Want to explore how we turn coordinates into construction? Ask away..."
            })
        });

        if (!contextResponse.ok) {
            const errText = await contextResponse.text();
            throw new Error(`Failed to create context: ${contextResponse.status} - ${errText}`);
        }

        const contextData = await contextResponse.json();
        const contextId = contextData.data.id;

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
        return new Response(JSON.stringify({
            success: false,
            error: "LiveAvatar API Error",
            message: err.message
        }), {
            status: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}
