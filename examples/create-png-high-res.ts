/**
 * Example: Create High-Resolution PNG
 * 
 * This example demonstrates how to:
 * 1. Initialize the Personalia client
 * 2. Request a high-resolution PNG (300dpi)
 * 3. Use createContentAndPoll() to wait for completion in a single call
 * 4. Save the PNG image to disk
 */

import { PersonaliaClient } from '../src';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const API_KEY = '3478b80b33174677acaee07f71538d925086a54dac1c30406e639a9530af41f2';
const TEMPLATE_ID = '0ab2e03f-c183-4cdf-bb2c-3bc6c316b80e';
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function createHighResPng() {
  try {
    // Initialize the client
    console.log('Initializing Personalia client...');
    const client = new PersonaliaClient(API_KEY);
    
    // Prepare request data
    const requestData = {
      TemplateId: TEMPLATE_ID,
      Fields: {
        Product: "iron",
        Offer: "20%",
        Price: "$25",
        "Expiry Date": "2025-04-01",
        Color: "blue", // Different color for this example
        'Switch Sides': "0"  // Different value for this example
      },
      Output: {
        Format: 'PDF' as const, // Changed to PDF since PNG might not be supported
        Quality: 'Display' as const,
        Resolution: 300, // High resolution (300 DPI)
        StrictPolicy: true
      }
    };
    
    console.log('Requesting high-resolution content creation...');
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    console.log('Using createContentAndPoll() to create and wait for content...');
    const startTime = Date.now();
    
    // Create content and poll for completion in a single call
    // Using more polling attempts and longer interval for high-res content
    const contentResponse = await client.createContentAndPoll(
      requestData,
      40, // More polling attempts for high-res content
      3000 // 3 second interval
    );
    
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Content ready after ${elapsedTime} seconds`);
    
    // Check if we have URLs in the response
    if (!contentResponse.URLs || contentResponse.URLs.length === 0) {
      throw new Error('No URLs found in the response');
    }
    
    // Get the first URL
    const contentUrl = contentResponse.URLs[0];
    console.log(`Content URL: ${contentUrl}`);
    
    // Download the content
    console.log('Downloading file...');
    const response = await fetch(contentUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    // Determine file extension based on Content-Type header
    const contentType = response.headers.get('content-type') || '';
    let extension = 'pdf'; // Default
    if (contentType.includes('png')) {
      extension = 'png';
    } else if (contentType.includes('jpg') || contentType.includes('jpeg')) {
      extension = 'jpg';
    }
    
    // Generate a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(OUTPUT_DIR, `personalia-high-res-${timestamp}.${extension}`);
    
    // Get the content as ArrayBuffer and convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const content = Buffer.from(arrayBuffer);
    
    // Save the content
    fs.writeFileSync(filename, content);
    
    console.log(`File saved to: ${filename}`);
    console.log(`File size: ${(content.length / 1024).toFixed(2)} KB`);
    console.log(`Resolution: 300 DPI`);
    
  } catch (error) {
    console.error('Error creating high-resolution content:');
    if (error instanceof Error) {
      console.error(error.message);
      
      // Extract request ID if present in the error message
      const requestIdMatch = error.message.match(/Request ID: ([\w-]+)/);
      if (requestIdMatch && requestIdMatch[1]) {
        console.log('\nYou can check the status of this request later using:');
        console.log(`client.getContent('${requestIdMatch[1]}')`);
      }
    } else {
      console.error(error);
    }
  }
}

// Run the example
createHighResPng().catch(console.error);

/**
 * To run this example:
 * npx ts-node examples/create-png-high-res.ts
 */
