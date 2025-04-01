/**
 * Example: Create Content URL
 * 
 * This example demonstrates how to:
 * 1. Initialize the Personalia client
 * 2. Create a content on-demand URL
 * 3. Display the URL for use in a browser or application
 */

import { PersonaliaClient } from '../src';

// Configuration
const API_KEY = '3478b80b33174677acaee07f71538d925086a54dac1c30406e639a9530af41f2';
const TEMPLATE_ID = '0ab2e03f-c183-4cdf-bb2c-3bc6c316b80e';

async function createContentUrl() {
  try {
    // Initialize the client
    console.log('Initializing Personalia client...');
    const client = new PersonaliaClient(API_KEY);
    
    // Prepare request data
    const requestData = {
      TemplateId: TEMPLATE_ID,
      Fields: {
        "Product": "iron",
        "Offer": "20%",
        "Price": "$25",
        "Expiry Date": "2025-04-01",
        "Color": "green", // Different color for this example
        "Switch Sides": "0"
      },
      Output: {
        Format: 'PDF' as const, // Note: Currently only PDF is supported for content URLs
        Quality: 'Display' as const
      }
    };
    
    console.log('Creating content on-demand URL...');
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    // Create the content URL
    const urlResponse = await client.createContentUrl(requestData);
    
    console.log('\nContent URL created successfully:');
    console.log(`URL: ${urlResponse.Url}`);
    console.log('\nThis URL can be:');
    console.log('- Embedded in an iframe');
    console.log('- Used as a download link');
    console.log('- Opened directly in a browser');
    console.log('- Included in emails or other communications');
    
    // Display HTML example
    console.log('\nHTML example for embedding:');
    console.log(`<iframe src="${urlResponse.Url}" width="100%" height="500px" frameborder="0"></iframe>`);
    
    console.log('\nHTML example for download link:');
    console.log(`<a href="${urlResponse.Url}" download="personalia-document.pdf">Download PDF</a>`);
    
  } catch (error) {
    console.error('Error creating content URL:', error);
  }
}

// Run the example
createContentUrl().catch(console.error);

/**
 * To run this example:
 * npx ts-node examples/create-content-url.ts
 */
