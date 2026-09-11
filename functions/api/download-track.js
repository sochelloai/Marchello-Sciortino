/**
 * Download Track API Endpoint (Backward Compatibility Wrapper)
 * Delegates all requests to the universal download-gift endpoint.
 */

import { onRequest as downloadGiftRequest } from "./download-gift.js";

export async function onRequest(context) {
    return downloadGiftRequest(context);
}
