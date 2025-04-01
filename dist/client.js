"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonaliaClient = void 0;
const axios_1 = __importDefault(require("axios"));
class PersonaliaClient {
    constructor(apiKey, baseUrl) {
        this.baseUrl = 'https://api.personalia.io';
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.baseUrl = baseUrl || this.baseUrl;
        this.client = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `ApiKey ${apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        // Add response interceptor to handle errors
        this.client.interceptors.response.use(response => response, error => {
            var _a;
            // If we have a response with data
            if ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) {
                const errorData = error.response.data;
                // Check if we have the expected error fields
                if (errorData.Reason) {
                    throw new Error(`Personalia API Error ${errorData.ErrorId || 'unknown'}: ${errorData.Reason}`);
                }
                // If not, include as much information as possible
                const statusCode = error.response.status;
                const statusText = error.response.statusText;
                throw new Error(`API Error (${statusCode} ${statusText}): ${JSON.stringify(errorData)}`);
            }
            // For network errors or other issues
            if (error.message) {
                throw new Error(`Network Error: ${error.message}`);
            }
            throw error;
        });
    }
    /**
     * Submits a request for an image or PDF document creation.
     * @param request The create content request parameters
     * @returns A promise that resolves to the create content response
     */
    async createContent(request) {
        const response = await this.client.post('/v1/content', request);
        return response.data;
    }
    /**
     * Gets the content for a previously submitted request.
     * @param requestId The ID of the content request
     * @returns A promise that resolves to the content response
     */
    async getContent(requestId) {
        const response = await this.client.get('/v1/content', {
            params: { requestId }
        });
        return response.data;
    }
    /**
     * Creates a content on-demand URL.
     * @param request The create content request parameters
     * @returns A promise that resolves to the create URL response
     */
    async createContentUrl(request) {
        const response = await this.client.post('/v1/content/url', request);
        return response.data;
    }
    /**
     * Gets information about a template's fields.
     * @param templateId The ID of the template
     * @returns A promise that resolves to the template info
     */
    async getTemplateInfo(templateId) {
        const response = await this.client.get(`/v1/content/templates/${templateId}/info`);
        return response.data;
    }
    /**
     * Polls for content completion until it's ready or maximum attempts are reached.
     * @param requestId The ID of the content request to poll for
     * @param maxAttempts Maximum number of polling attempts (default: 30)
     * @param interval Polling interval in milliseconds (default: 2000)
     * @returns A promise that resolves to the content response when ready
     * @throws Error if content is not ready after maximum attempts
     */
    async pollForContent(requestId, maxAttempts = 30, interval = 2000) {
        var _a, _b, _c, _d;
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for request ID: ${requestId}...`);
                // Make the request with detailed logging
                let response;
                try {
                    response = await this.client.get('/v1/content', {
                        params: { requestId }
                    });
                    console.log(`API Response Status: ${response.status} ${response.statusText}`);
                    console.log(`Response Headers:`, response.headers);
                    // Log the response data in a readable format
                    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
                    // Check if the content is ready based on the Status field
                    if (response.data.Status === 'Completed') {
                        return response.data;
                    }
                    else if (response.data.Status === 'Failed') {
                        throw new Error(`Content generation failed: ${response.data.FailureDescription || 'Unknown error'}`);
                    }
                    else {
                        // Still processing, continue polling
                        console.log(`Content still processing, attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval / 1000} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, interval));
                        attempts++;
                    }
                }
                catch (requestError) {
                    // Log detailed information about the error response
                    console.log(`API Error Status: ${((_a = requestError.response) === null || _a === void 0 ? void 0 : _a.status) || 'unknown'} ${((_b = requestError.response) === null || _b === void 0 ? void 0 : _b.statusText) || ''}`);
                    console.log(`Error Response:`, ((_c = requestError.response) === null || _c === void 0 ? void 0 : _c.data) || requestError.message);
                    // Check for 404 which might indicate content not ready yet
                    if (((_d = requestError.response) === null || _d === void 0 ? void 0 : _d.status) === 404) {
                        console.log(`Content not ready yet (404), attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval / 1000} seconds...`);
                        await new Promise(resolve => setTimeout(resolve, interval));
                        attempts++;
                    }
                    else {
                        throw requestError; // Re-throw for other errors
                    }
                }
            }
            catch (error) {
                // Check for various conditions that indicate the content is still processing
                const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
                const isStillProcessing = (errorMessage.includes('not found') ||
                    errorMessage.includes('not ready') ||
                    errorMessage.includes('processing'));
                if (isStillProcessing) {
                    console.log(`Content not ready yet, attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, interval));
                    attempts++;
                }
                else {
                    // If it's another error, throw it
                    console.error('Polling failed with error:', error);
                    throw error;
                }
            }
        }
        const totalTime = (maxAttempts * interval) / 1000;
        throw new Error(`Content not ready after ${maxAttempts} attempts (${totalTime} seconds). The request ID ${requestId} may still be processing. You can try retrieving it later with getContent().`);
    }
    /**
     * Creates content and polls for its completion in a single operation.
     * This method combines createContent and pollForContent for convenience.
     *
     * @param request The create content request parameters
     * @param maxAttempts Maximum number of polling attempts (default: 30)
     * @param interval Polling interval in milliseconds (default: 2000)
     * @returns A promise that resolves to the content response when ready
     * @throws Error if content creation fails or if content is not ready after maximum attempts
     */
    async createContentAndPoll(request, maxAttempts = 30, interval = 2000) {
        // First create the content
        const createResponse = await this.createContent(request);
        console.log(`Content creation request submitted. Request ID: ${createResponse.RequestId}`);
        console.log(`Polling for completion (max ${maxAttempts} attempts, ${interval / 1000}s interval)...`);
        try {
            // Then poll for completion
            return await this.pollForContent(createResponse.RequestId, maxAttempts, interval);
        }
        catch (error) {
            // Add the request ID to the error message for reference
            if (error instanceof Error) {
                error.message = `${error.message}\nRequest ID: ${createResponse.RequestId}`;
            }
            throw error;
        }
    }
}
exports.PersonaliaClient = PersonaliaClient;
