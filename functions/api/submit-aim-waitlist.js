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
    
    // Retrieve credentials and configs from Cloudflare Environment Variables / Secrets
    const apiKey = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_API_KEY"));
    const subdomain = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_SUBDOMAIN"));
    const workspaceId = cleanWorkspaceId(getEnvVal(env, "CLICKFUNNELS_WORKSPACE_ID"));
    const primaryTagName = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_AIM_TAG_NAME")) || 
                           cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_TAG_NAME")) || 
                           "Waitlist (Accessible AIM)";

    // 1. Configuration Validation
    if (!apiKey || !subdomain || !workspaceId) {
        const availableKeys = env ? Object.keys(env) : [];
        return new Response(JSON.stringify({
            error: "Configuration Error",
            message: `CLICKFUNNELS_API_KEY, CLICKFUNNELS_SUBDOMAIN, and CLICKFUNNELS_WORKSPACE_ID must be defined in Cloudflare Variables and Secrets. Available keys: [${availableKeys.join(", ")}]`
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
        const name = formData.get('name') || "";
        const email = formData.get('email');
        const role = formData.get('role') || "";

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

        // Sanitize the subdomain if a full URL was pasted
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

        const cleanWorkspaceId = workspaceId;

        // --- STEP 1: Find or Create Tag ID for Accessible AIM Waitlist ---
        let tagId = null;
        let resolvedTagName = primaryTagName;

        const normalizeTag = (str) => (str || "").toLowerCase().replace(/[\s_()\-]+/g, "");
        const targetNorm = normalizeTag(primaryTagName);

        // 1a. List existing workspace tags to locate any matching tag
        const listTagsUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags`;
        try {
            const tagsResponse = await fetch(listTagsUrl, {
                method: "GET",
                headers: commonHeaders
            });

            if (tagsResponse.ok) {
                const tagsData = await tagsResponse.json();
                const tagsList = Array.isArray(tagsData) ? tagsData : (tagsData.contacts_tags || tagsData.tags || []);
                
                let matched = tagsList.find(t => t.name && t.name.toLowerCase() === primaryTagName.toLowerCase());
                if (!matched) {
                    matched = tagsList.find(t => t.name && normalizeTag(t.name) === targetNorm);
                }
                if (!matched) {
                    // Fuzzy match variants for Accessible AIM Waitlist
                    matched = tagsList.find(t => t.name && (
                        normalizeTag(t.name) === "waitlistaccessibleaim" ||
                        normalizeTag(t.name) === "accessibleaimwaitlist" ||
                        normalizeTag(t.name) === "accessibleaimwaylist" ||
                        normalizeTag(t.name) === "accessibleaim" ||
                        normalizeTag(t.name) === "aimwaitlist" ||
                        normalizeTag(t.name) === "aim"
                    ));
                }

                if (matched) {
                    tagId = parseInt(matched.id, 10);
                    resolvedTagName = matched.name;
                }
            } else {
                await logErrorResponse("List Workspace Tags", tagsResponse);
            }
        } catch (tagListErr) {
            console.error("[ClickFunnels] Error fetching tags list:", tagListErr);
        }

        // 1b. If not found in workspace list, try query filter fallback
        if (!tagId) {
            try {
                const filterUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags?filter%5Bname%5D=${encodeURIComponent(primaryTagName)}`;
                const filterResponse = await fetch(filterUrl, {
                    method: "GET",
                    headers: commonHeaders
                });
                if (filterResponse.ok) {
                    const filterData = await filterResponse.json();
                    const list = Array.isArray(filterData) ? filterData : (filterData.contacts_tags || filterData.tags || []);
                    if (list.length > 0 && list[0].id) {
                        tagId = parseInt(list[0].id, 10);
                        resolvedTagName = list[0].name;
                    }
                }
            } catch (filterErr) {
                console.error("[ClickFunnels] Error querying tag filter:", filterErr);
            }
        }

        // 1c. If tag still does not exist, create it with a valid 6-character hex color code
        if (!tagId) {
            try {
                const createTagUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts/tags`;
                const createTagResponse = await fetch(createTagUrl, {
                    method: "POST",
                    headers: commonHeaders,
                    body: JSON.stringify({
                        contacts_tag: {
                            name: primaryTagName,
                            color: "#0AD8AD"
                        }
                    })
                });

                if (createTagResponse.ok) {
                    const newTagData = await createTagResponse.json();
                    tagId = parseInt(newTagData.id, 10);
                    resolvedTagName = newTagData.name || primaryTagName;
                } else {
                    const errBody = await logErrorResponse("Create Tag", createTagResponse);
                    if (createTagResponse.status === 422 || errBody.includes("taken")) {
                        const retryList = await fetch(listTagsUrl, { method: "GET", headers: commonHeaders });
                        if (retryList.ok) {
                            const rData = await retryList.json();
                            const rList = Array.isArray(rData) ? rData : (rData.contacts_tags || rData.tags || []);
                            const rMatch = rList.find(t => t.name && (t.name.toLowerCase() === primaryTagName.toLowerCase() || normalizeTag(t.name) === targetNorm));
                            if (rMatch) {
                                tagId = parseInt(rMatch.id, 10);
                                resolvedTagName = rMatch.name;
                            }
                        }
                    }
                }
            } catch (createErr) {
                console.error("[ClickFunnels] Error creating tag:", createErr);
            }
        }

        // --- STEP 2: Create or Update Contact ---
        let contactId = null;
        const createContactUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts`;
        
        const contactPayload = {
            email_address: email,
            first_name: name || "",
            custom_attributes: {
                role: role || ""
            }
        };

        const contactBody = {
            contact: contactPayload
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
            const searchUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts?filter%5Bemail_address%5D=${encodeURIComponent(email)}`;
            const searchResponse = await fetch(searchUrl, {
                method: "GET",
                headers: commonHeaders
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const contactsList = Array.isArray(searchData) ? searchData : (searchData.contacts || []);
                if (contactsList.length > 0) {
                    contactId = contactsList[0].id || contactsList[0].public_id;
                    
                    // Update existing contact custom attributes (preserving previous attributes and NEVER overwriting tags)
                    try {
                        const existingAttrs = (contactsList[0] && typeof contactsList[0].custom_attributes === 'object' && contactsList[0].custom_attributes !== null)
                            ? contactsList[0].custom_attributes
                            : {};
                        const updateBody = {
                            contact: {
                                first_name: name || contactsList[0].first_name || "",
                                custom_attributes: {
                                    ...existingAttrs,
                                    role: role || existingAttrs.role || ""
                                }
                            }
                        };
                        const updateUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/contacts/${contactId}`;
                        const updateResponse = await fetch(updateUrl, {
                            method: "PUT",
                            headers: commonHeaders,
                            body: JSON.stringify(updateBody)
                        });
                        if (!updateResponse.ok) {
                            await logErrorResponse("Update Contact", updateResponse);
                        }
                    } catch (updateErr) {
                        console.error("Failed to update existing contact's custom attributes:", updateErr);
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

        // --- STEP 3: Explicitly Apply the Tag to the Contact ---
        let tagApplied = Boolean(tagId);
        if (contactId && tagId) {
            try {
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

                if (applyTagResponse.ok) {
                    tagApplied = true;
                } else if (applyTagResponse.status === 422) {
                    tagApplied = true;
                } else {
                    const errBody = await logErrorResponse("Apply Tag", applyTagResponse);
                    console.error(`Failed to apply tag: ${applyTagResponse.status} - ${errBody}`);
                }
            } catch (applyErr) {
                console.error("[ClickFunnels] Error calling applied_tags:", applyErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            contactId: contactId,
            tagId: tagId,
            tagName: resolvedTagName,
            tagged: tagApplied,
            message: tagApplied
                ? `Lead waitlisted and tagged with '${resolvedTagName}' successfully in ClickFunnels.`
                : "Lead waitlisted in ClickFunnels, but tag could not be resolved or applied."
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
