import axios, { AxiosInstance } from 'axios';
import {
  CreateContentRequest,
  CreateContentResponse,
  GetContentResponse,
  CreateUrlResponse,
  TemplateInfo,
  ErrorResponse,
} from './types';
import { PersonaliaError, parseApiError } from './errors';

export class PersonaliaClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string = 'https://api.personalia.io';

  constructor(apiKey: string, baseUrl?: string) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.baseUrl = baseUrl || this.baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `ApiKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      response => response,
      error => {
        // Parse the error and convert it to a PersonaliaError with detailed information
        throw parseApiError(error);
      }
    );
  }

  /**
   * Submits a request for an image or PDF document creation.
   * @param request The create content request parameters
   * @returns A promise that resolves to the create content response
   */
  async createContent(request: CreateContentRequest): Promise<CreateContentResponse> {
    const response = await this.client.post<CreateContentResponse>('/v1/content', request);
    return response.data;
  }

  /**
   * Gets the content for a previously submitted request.
   * @param requestId The ID of the content request
   * @returns A promise that resolves to the content response
   */
  async getContent(requestId: string): Promise<GetContentResponse> {
    const response = await this.client.get<GetContentResponse>('/v1/content', {
      params: { requestId }
    });
    return response.data;
  }

  /**
   * Creates a content on-demand URL.
   * @param request The create content request parameters
   * @returns A promise that resolves to the create URL response
   */
  async createContentUrl(request: CreateContentRequest): Promise<CreateUrlResponse> {
    const response = await this.client.post<CreateUrlResponse>('/v1/content/url', request);
    return response.data;
  }

  /**
   * Gets information about a template's fields.
   * @param templateId The ID of the template
   * @returns A promise that resolves to the template info
   */
  async getTemplateInfo(templateId: string): Promise<TemplateInfo> {
    const response = await this.client.get<TemplateInfo>(`/v1/content/templates/${templateId}/info`);
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
  async pollForContent(requestId: string, maxAttempts = 30, interval = 2000): Promise<GetContentResponse> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for request ID: ${requestId}...`);
        
        // Make the request with detailed logging
        try {
          const response = await this.client.get('/v1/content', {
            params: { requestId }
          });
          console.log(`API Response Status: ${response.status} ${response.statusText}`);
          
          // Log the response data in a readable format
          console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
          
          // Check if the content is ready based on the Status field
          if (response.data.Status === 'Completed') {
            return response.data;
          } else if (response.data.Status === 'Failed') {
            const errorMessage = response.data.FailureDescription || 'Unknown error';
            throw new PersonaliaError(`Content generation failed: ${errorMessage}`, 200, undefined, response.data.ErrorId);
          } else if (response.data.Status === 'InProgress') {
            // Content is still being processed
            console.log(`Content is in progress, attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
          } else {
            // Unexpected status
            console.log(`Unexpected status: ${response.data.Status}, attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
          }
        } catch (error: any) {
          // Convert to PersonaliaError if it's not already
          const personaliaError = error instanceof PersonaliaError 
            ? error 
            : parseApiError(error);
          
          // Log detailed information about the error
          console.log(`API Error: ${personaliaError.message}`);
          console.log(`Status Code: ${personaliaError.statusCode}, Error Code: ${personaliaError.errorCode || 'N/A'}, Error ID: ${personaliaError.errorId || 'N/A'}`);
          
          // Check for specific error conditions that indicate we should continue polling
          if (personaliaError.statusCode === 404) {
            // 404 indicates content not ready yet
            console.log(`Content not ready yet (404), attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
          } else if (personaliaError.errorId === '111') {
            // Missing field error - this is a permanent error, no need to retry
            throw personaliaError;
          } else if (['105', '106', '107', '108'].includes(personaliaError.errorId || '')) {
            // Fetch URL errors - these are permanent errors, no need to retry
            throw personaliaError;
          } else if (personaliaError.errorId === '117') {
            // Insufficient credits - this is a permanent error, no need to retry
            throw personaliaError;
          } else if (personaliaError.message.toLowerCase().includes('processing') || 
                    personaliaError.message.toLowerCase().includes('in progress')) {
            // Still processing
            console.log(`Content still processing, attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
          } else {
            // For other errors, throw them
            throw personaliaError;
          }
        }
      } catch (error) {
        // If this is a PersonaliaError that indicates we should stop polling, rethrow it
        if (error instanceof PersonaliaError) {
          // Check if this is an error that means we should stop polling
          const errorId = error.errorId;
          const permanentErrorIds = ['101', '102', '103', '104', '109', '111', '112', '113', '114', '117', '118'];
          
          if (errorId && permanentErrorIds.includes(errorId)) {
            console.error('Polling stopped due to permanent error:', error.message);
            throw error;
          }
          
          // For other Personalia errors, we might want to continue polling
          const isStillProcessing = error.message.toLowerCase().includes('processing') || 
                                   error.message.toLowerCase().includes('in progress');
          
          if (isStillProcessing) {
            console.log(`Content still processing, attempt ${attempts + 1}/${maxAttempts}. Waiting ${interval/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            attempts++;
            continue;
          }
        }
        
        // For any other errors, log and rethrow
        console.error('Polling failed with error:', error);
        throw error;
      }
    }
    
    const totalTime = (maxAttempts * interval) / 1000;
    throw new PersonaliaError(
      `Content not ready after ${maxAttempts} attempts (${totalTime} seconds). The request ID ${requestId} may still be processing. You can try retrieving it later with getContent().`,
      408, // Request Timeout
      undefined,
      undefined
    );
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
  async createContentAndPoll(
    request: CreateContentRequest,
    maxAttempts = 30,
    interval = 2000
  ): Promise<GetContentResponse> {
    // First create the content
    const createResponse = await this.createContent(request);
    console.log(`Content creation request submitted. Request ID: ${createResponse.RequestId}`);
    console.log(`Polling for completion (max ${maxAttempts} attempts, ${interval/1000}s interval)...`);
    
    try {
      // Then poll for completion
      return await this.pollForContent(createResponse.RequestId, maxAttempts, interval);
    } catch (error) {
      // Add the request ID to the error message for reference
      if (error instanceof PersonaliaError) {
        // Enhance the error message with the request ID
        error.message = `${error.message}\nRequest ID: ${createResponse.RequestId}`;
      } else if (error instanceof Error) {
        // Convert to PersonaliaError if it's not already
        const personaliaError = new PersonaliaError(
          `${error.message}\nRequest ID: ${createResponse.RequestId}`,
          500, // Internal Server Error as default
          undefined,
          undefined
        );
        throw personaliaError;
      }
      throw error;
    }
  }
}
