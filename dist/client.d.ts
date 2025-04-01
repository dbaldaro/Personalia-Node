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
}
