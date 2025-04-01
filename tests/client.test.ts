import { PersonaliaClient } from '../src/client';
import { CreateContentRequest, GetContentResponse } from '../src/types';

// Test configuration
const API_KEY = '3478b80b33174677acaee07f71538d925086a54dac1c30406e639a9530af41f2';
const TEMPLATE_ID = '0ab2e03f-c183-4cdf-bb2c-3bc6c316b80e';
const EXPECTED_FIELDS = {
  "Product": "iron",
  "Offer": "20%",
  "Price": "$25 ",
  "Expiry Date": "2025-04-01",
  "Color": "red",
  "Switch Sides": "0"
};

// We'll use the client's built-in pollForContent method instead of a custom polling function

describe('PersonaliaClient', () => {
  let client: PersonaliaClient;
  
  beforeAll(() => {
    client = new PersonaliaClient(API_KEY);
  });
  
  describe('Template Information', () => {
    it('should retrieve template information with correct fields', async () => {
      const templateInfo = await client.getTemplateInfo(TEMPLATE_ID);
      
      // Verify the template ID
      expect(templateInfo.TemplateId).toBe(TEMPLATE_ID);
      
      // Verify all expected fields are present in the template info
      const fieldNames = templateInfo.Fields.map(field => field.Name);
      Object.keys(EXPECTED_FIELDS).forEach(expectedField => {
        expect(fieldNames).toContain(expectedField);
      });
    });
  });
  
  describe('Content Creation', () => {
    it('should create content successfully', async () => {
      // Create the content request
      const request: CreateContentRequest = {
        TemplateId: TEMPLATE_ID,
        Fields: EXPECTED_FIELDS,
        Output: {
          Format: 'PDF', // The API only supports PDF format for content creation
          Quality: 'Display'
        }
      };
      
      // Submit the request
      const createResponse = await client.createContent(request);
      
      // Verify the response has a request ID
      expect(createResponse).toHaveProperty('RequestId');
      expect(typeof createResponse.RequestId).toBe('string');
      expect(createResponse.RequestId.length).toBeGreaterThan(0);
    });
    
    it('should have a createContentAndPoll method', () => {
      // Verify the method exists and is a function
      expect(client.createContentAndPoll).toBeDefined();
      expect(typeof client.createContentAndPoll).toBe('function');
    });
    
    // This test is commented out because it would make an actual API call and wait for polling
    // Uncomment and use it for manual testing if needed
    /*
    it('should create content and poll for completion in a single call', async () => {
      // Create the content request
      const request: CreateContentRequest = {
        TemplateId: TEMPLATE_ID,
        Fields: EXPECTED_FIELDS,
        Output: {
          Format: 'PDF',
          Quality: 'Display'
        }
      };
      
      // Create content and poll for completion in a single call
      const contentResponse = await client.createContentAndPoll(request, 15, 2000);
      
      // Verify the content response
      expect(contentResponse).toHaveProperty('Status');
      expect(contentResponse.Status).toBe('Completed');
      expect(contentResponse).toHaveProperty('URLs');
      expect(Array.isArray(contentResponse.URLs)).toBe(true);
      expect(contentResponse.URLs?.length).toBeGreaterThan(0);
      expect(contentResponse.URLs?.[0]).toContain('https://');
    }, 40000); // Increase timeout to 40 seconds for this test
    */
    
    // This test is commented out because polling might take too long or be unreliable in a test environment
    // Uncomment and use it for manual testing if needed
    /*
    it('should poll for content completion', async () => {
      // This test requires a valid RequestId from a previous content creation
      const requestId = 'REPLACE_WITH_VALID_REQUEST_ID';
      
      // Poll for completion
      const contentResponse = await client.pollForContent(requestId, 15, 2000);
      
      // Verify the content response
      expect(contentResponse).toHaveProperty('Status');
      expect(contentResponse.Status).toBe('Completed');
      expect(contentResponse).toHaveProperty('URLs');
      expect(Array.isArray(contentResponse.URLs)).toBe(true);
      expect(contentResponse.URLs?.length).toBeGreaterThan(0);
      expect(contentResponse.URLs?.[0]).toContain('https://');
    }, 40000); // Increase timeout to 40 seconds for this test
    */
  });
  
  describe('Content URL Creation', () => {
    it('should create a content URL', async () => {
      // Create the content request
      const request: CreateContentRequest = {
        TemplateId: TEMPLATE_ID,
        Fields: EXPECTED_FIELDS,
        Output: {
          Format: 'PDF', // The API only supports PDF format for URL creation
          Quality: 'Display'
        }
      };
      
      // Submit the request for URL
      const urlResponse = await client.createContentUrl(request);
      
      // Verify the URL response
      expect(urlResponse).toHaveProperty('Url');
      expect(urlResponse.Url).toContain('https://');
    });
  });
});
