export async function onRequestPost(context) {
    const { env, request } = context;
    
    // Retrieve credentials and configs from Cloudflare Environment Variables / Secrets
    const apiKey = env.CLICKFUNNELS_API_KEY;
    const subdomain = env.CLICKFUNNELS_SUBDOMAIN;
    const tagName = env.CLICKFUNNELS_TAG_NAME || "ms-contact-form";

    // 1. Configuration Validation
    if (!apiKey || !subdomain) {
        return new Response(JSON.stringify({
            error: "Configuration Error",
            message: "CLICKFUNNELS_API_KEY and CLICKFUNNELS_SUBDOMAIN must be defined in Cloudflare Variables and Secrets."
        }), {
            status: 500,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    try {
        const payload = await request.json();
        const { name, email, subject, description, interest, attachmentName } = payload;

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

        const commonHeaders = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
        };

        // --- STEP 1: Create or Update Contact ---
        let contactId = null;
        const createContactUrl = `https://${subdomain}.myclickfunnels.com/api/v2/contacts`;
        
        const contactBody = {
            contact: {
                email_address: email,
                first_name: name || "",
                custom_attributes: {
                    subject: subject || "",
                    interest: interest || "",
                    description: description || "",
                    attachment: attachmentName || ""
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
            // Fallback: If contact already exists or fails, try to fetch it by email address
            const searchUrl = `https://${subdomain}.myclickfunnels.com/api/v2/contacts?filter[email_address]=${encodeURIComponent(email)}`;
            const searchResponse = await fetch(searchUrl, {
                method: "GET",
                headers: commonHeaders
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const contactsList = Array.isArray(searchData) ? searchData : (searchData.contacts || []);
                if (contactsList.length > 0) {
                    contactId = contactsList[0].id || contactsList[0].public_id;
                }
            }

            if (!contactId) {
                const errBody = await contactResponse.text();
                throw new Error(`Failed to create or retrieve contact: ${contactResponse.status} - ${errBody}`);
            }
        }

        // --- STEP 2: Find or Create Tag ID ---
        let tagId = null;
        const tagsUrl = `https://${subdomain}.myclickfunnels.com/api/v2/contacts/tags?filter[name]=${encodeURIComponent(tagName)}`;
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
        }

        // Try to programmatically create the tag definition if it does not exist
        if (!tagId) {
            const createTagUrl = `https://${subdomain}.myclickfunnels.com/api/v2/contacts/tags`;
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
                console.warn(`Could not create tag definition '${tagName}' automatically.`);
            }
        }

        // --- STEP 3: Apply the Tag to the Contact ---
        if (contactId && tagId) {
            const applyTagUrl = `https://${subdomain}.myclickfunnels.com/api/v2/contacts/${contactId}/applied_tags`;
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
                const errBody = await applyTagResponse.text();
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
