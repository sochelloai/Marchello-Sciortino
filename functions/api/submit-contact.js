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
    const { env, request } = context;
    
    // Retrieve credentials and configs from Cloudflare Environment Variables / Secrets
    const apiKey = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_API_KEY"));
    const subdomain = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_SUBDOMAIN"));
    const workspaceId = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_WORKSPACE_ID"));
    const tagName = cleanEnvVar(getEnvVal(env, "CLICKFUNNELS_TAG_NAME")) || "ms-contact-form";

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
        const name = formData.get('name');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const description = formData.get('description');
        const interest = formData.get('interest');
        const file = formData.get('file');

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

        // Upload attachment to file hosting to get a public download link
        let attachmentUrl = "";
        if (file && typeof file === "object" && file.size > 0) {
            const catboxForm = new FormData();
            catboxForm.append("reqtype", "fileupload");
            catboxForm.append("fileToUpload", file);

            try {
                const catboxResponse = await fetch("https://catbox.moe/user/api.php", {
                    method: "POST",
                    body: catboxForm
                });
                if (catboxResponse.ok) {
                    const resultText = await catboxResponse.text();
                    if (resultText && resultText.startsWith("http")) {
                        attachmentUrl = resultText.trim();
                    } else {
                        console.error(`Catbox returned non-URL response: ${resultText}`);
                    }
                } else {
                    console.error(`Catbox upload failed with status ${catboxResponse.status}`);
                }
            } catch (uploadError) {
                console.error("Failed to upload to Catbox:", uploadError);
            }

            // Fallback: If catbox failed or returned an error, try tmpfiles.org
            if (!attachmentUrl) {
                try {
                    const tmpForm = new FormData();
                    tmpForm.append("file", file);
                    const tmpResponse = await fetch("https://tmpfiles.org/api/v1/upload", {
                        method: "POST",
                        body: tmpForm
                    });
                    if (tmpResponse.ok) {
                        const tmpData = await tmpResponse.json();
                        if (tmpData && tmpData.status === "success" && tmpData.data && tmpData.data.url) {
                            attachmentUrl = tmpData.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
                        }
                    } else {
                        console.error(`Tmpfiles upload failed with status ${tmpResponse.status}`);
                    }
                } catch (tmpError) {
                    console.error("Failed to upload to Tmpfiles fallback:", tmpError);
                }
            }
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

        // --- STEP 1: Create or Update Contact ---
        let contactId = null;
        const cleanWorkspaceId = workspaceId;
        const createContactUrl = `https://${cleanSubdomain}.myclickfunnels.com/api/v2/workspaces/${cleanWorkspaceId}/contacts`;
        
        const contactBody = {
            contact: {
                email_address: email,
                first_name: name || "",
                custom_attributes: {
                    attachments: attachmentUrl || "",
                    i_want_to: interest || "",
                    description: description || "",
                    subject: subject || ""
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
                        console.error("Failed to update existing contact's custom attributes:", updateErr);
                    }
                }
            } else {
                await logErrorResponse("Search Contact", searchResponse);
            }

            if (!contactId) {
                const errBody = await contactResponse.clone().text();
                throw new Error(`Failed to create or retrieve contact: ${contactResponse.status} - ${errBody}`);
            }
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
                        color: "teal"
                    }
                })
            });

            if (createTagResponse.ok) {
                const newTagData = await createTagResponse.json();
                tagId = newTagData.id;
            } else {
                await logErrorResponse("Create Tag", createTagResponse);
                console.warn(`Could not create tag definition '${tagName}' automatically.`);
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
                const errBody = await logErrorResponse("Apply Tag", applyTagResponse);
                console.error(`Failed to apply tag: ${applyTagResponse.status} - ${errBody}`);
            }
        } else if (contactId) {
            console.warn(`Tag ID for '${tagName}' could not be resolved; skipping tag application.`);
        }

        return new Response(JSON.stringify({
            success: true,
            contactId: contactId,
            tagId: tagId,
            message: "Lead created and tagged successfully in ClickFunnels."
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
