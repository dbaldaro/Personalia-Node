import { CreateContentRequest, CreateContentResponse, GetContentResponse, CreateUrlResponse, TemplateInfo } from './types';
export declare class PersonaliaClient {
    private readonly client;
    private readonly baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    /**
     * Submits a request for an image or PDF document creation.
     * @param request The create content request parameters
     * @returns A promise that resolves to the create content response
     */
    createContent(request: CreateContentRequest): Promise<CreateContentResponse>;
    /**
     * Gets the content for a previously submitted request.
     * @param requestId The ID of the content request
     * @returns A promise that resolves to the content response
     */
    getContent(requestId: string): Promise<GetContentResponse>;
    /**
     * Creates a content on-demand URL.
     * @param request The create content request parameters
     * @returns A promise that resolves to the create URL response
     */
    createContentUrl(request: CreateContentRequest): Promise<CreateUrlResponse>;
    /**
     * Gets information about a template's fields.
     * @param templateId The ID of the template
     * @returns A promise that resolves to the template info
     */
    getTemplateInfo(templateId: string): Promise<TemplateInfo>;
    /**
     * Polls for content completion until it's ready or maximum attempts are reached.
     * @param requestId The ID of the content request to poll for
     * @param maxAttempts Maximum number of polling attempts (default: 30)
     * @param interval Polling interval in milliseconds (default: 2000)
     * @returns A promise that resolves to the content response when ready
     * @throws Error if content is not ready after maximum attempts
     */
    pollForContent(requestId: string, maxAttempts?: number, interval?: number): Promise<GetContentResponse>;
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
    createContentAndPoll(request: CreateContentRequest, maxAttempts?: number, interval?: number): Promise<GetContentResponse>;
}
