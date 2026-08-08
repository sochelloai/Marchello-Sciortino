function cleanEnvVar(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1);
    }
    return clean.trim();
}

function cleanWorkspaceId(val) {
    if (!val) return "";
    let clean = String(val).trim();
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
        clean = clean.slice(1, -1);
    }
    clean = clean.trim();
    const match = clean.match(/\/workspaces\/(\d+)/);
    if (match) {
        return match[1];
    }
    const digitMatch = clean.match(/\b\d+\b/);
    if (digitMatch) {
        return digitMatch[0];
    }
    return clean;
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
    const { env, request } = context;
    
    // Retrieve ClickFunnels credentials from environment variables / secrets
    const apiKey = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_API_KEY"));
    const subdomain = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_SUBDOMAIN"));
    const workspaceId = cleanWorkspaceId(getEnvVal(env, "CLICKFUNNELS_WORKSPACE_ID"));
    const tagName = "free-gifts";

    // 1. Configuration Validation
    if (!apiKey || !subdomain || !workspaceId) {
        const availableKeys = env ? Object.keys(env) : [];
        return new Response(JSON.stringify({
            error: "Configuration Error",
            message: `CLICKFUNNELS_API_KEY, CLICKFUNNELS_SUBDOMAIN, and CLICKFUNNELS_WORKSPACE_ID must be defined. Available keys: [${availableKeys.join(", ")}]`
        }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    try {
        const formData = await request.formData();
        const email = formData.get('email');

        if (!email) {
            return new Response(JSON.stringify({
                error: "Bad Request",
                message: "Email address is required."
            }), {
                status: 400,
                headers: { 
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // Sanitize the subdomain if full URL is supplied
        let cleanSubdomain = subdomain.trim();
        if (cleanSubdomain.includes("://")) {
            cleanSubdomain = cleanSubdomain.split("://")[1];
        }
        if (cleanSubdomain.includes(".")) {
            cleanSubdomain = cleanSubdomain.split(".")[0];
        }

        const commonHeaders = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "MarchelloSciortinoWebsite/1.0"
        };

        // --- STEP 1: Create or Update Contact ---
        let contactId = null;
        const cleanWorkspaceId = workspaceId;
        const createContactUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts`;
        
        const contactBody = {
            contact: {
                email_address: email,
                custom_attributes: {
                    unlocked_free_gifts: "true"
                }
            }
        };

        const contactResponse = await fetch(createContactUrl, {
            method: "POST",
            headers: commonHeaders,
            body: JSON.stringify(contactBody)
        });

        if (contactResponse.ok) {
            const contactData = await contactResponse.json();
            contactId = contactData.id || contactData.public_id;
        } else {
            await logErrorResponse("Create Contact", contactResponse);
            // Fallback: If contact already exists or fails, try to fetch it by email address
            const searchUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts?filter[email_address]=${encodeURIComponent(email)}`;
            const searchResponse = await fetch(searchUrl, {
                method: "GET",
                headers: commonHeaders
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const contactsList = Array.isArray(searchData) ? searchData : (searchData.contacts || []);
                if (contactsList.length > 0) {
                    contactId = contactsList[0].id || contactsList[0].public_id;
                    
                    // Update existing contact custom attributes
                    try {
                        const updateUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/contacts/${contactId}`;
                        const updateResponse = await fetch(updateUrl, {
                            method: "PUT",
                            headers: commonHeaders,
                            body: JSON.stringify(contactBody)
                        });
                        if (!updateResponse.ok) {
                            await logErrorResponse("Update Contact", updateResponse);
                        }
                    } catch (updateErr) {
                        printError("Failed to update existing contact's custom attributes:", updateErr);
                    }
                }
            } else {
                await logErrorResponse("Search Contact", searchResponse);
            }
        }

        if (!contactId) {
            return new Response(JSON.stringify({
                error: "ClickFunnels Error",
                message: "Could not create or locate the contact in ClickFunnels."
            }), {
                status: 502,
                headers: { "Content-Type": "application/json" }
            });
        }

        // --- STEP 2: Find or Create Tag ID ---
        let tagId = null;
        const tagsUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`;
        const tagsResponse = await fetch(tagsUrl, {
            method: "GET",
            headers: commonHeaders
        });

        if (tagsResponse.ok) {
            const tagsData = await tagsResponse.json();
            const tagsList = Array.isArray(tagsData) ? tagsData : (tagsData.contacts_tags || tagsData.tags || []);
            const matchedTag = tagsList.find(t => t.name && t.name.toLowerCase() === tagName.toLowerCase());
            if (matchedTag) {
                tagId = matchedTag.id;
            }
        } else {
            await logErrorResponse("Search Tag", tagsResponse);
        }

        // Try to programmatically create the tag definition if it does not exist
        if (!tagId) {
            const createTagUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags`;
            const createTagResponse = await fetch(createTagUrl, {
                method: "POST",
                headers: commonHeaders,
                body: JSON.stringify({
                    contacts_tag: {
                        name: tagName,
                        color: "gold"
                    }
                })
            });

            if (createTagResponse.ok) {
                const newTagData = await createTagResponse.json();
                tagId = newTagData.id;
            } else {
                await logErrorResponse("Create Tag", createTagResponse);
            }
        }

        // --- STEP 3: Apply the Tag to the Contact ---
        if (contactId && tagId) {
            const applyTagUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/contacts/${contactId}/applied_tags`;
            const applyTagResponse = await fetch(applyTagUrl, {
                method: "POST",
                headers: commonHeaders,
                body: JSON.stringify({
                    contacts_applied_tag: {
                        tag_id: tagId
                    }
                })
            });

            if (!applyTagResponse.ok) {
                await logErrorResponse("Apply Tag", applyTagResponse);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            contactId: contactId,
            tagId: tagId,
            message: "Contact subscribed and tagged with free-gifts successfully in ClickFunnels."
        }), {
            status: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: "API Execution Error",
            message: error.message
        }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
}

async function logErrorResponse(stepName, response) {
    let body = "";
    try {
        body = await response.clone().text();
    } catch (e) {
        body = "(failed to read body)";
    }
    console.error(`[ClickFunnels] ${stepName} failed with status ${response.status}: ${body}`);
    return body;
}

function printError(msg, err) {
    console.error(msg, err);
}
