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
            if ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) {
                const errorData = error.response.data;
                throw new Error(`Personalia API Error ${errorData.ErrorId}: ${errorData.Reason}`);
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
        const response = await this.client.get(`/v1/content/${requestId}`);
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
}
exports.PersonaliaClient = PersonaliaClient;
