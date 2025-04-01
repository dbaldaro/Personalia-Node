/**
 * Example: Create PDF Print File
 * 
 * This example demonstrates how to:
 * 1. Initialize the Personalia client
 * 2. Request a PDF file with Print quality
 * 3. Poll for completion
 * 4. Download the PDF upon completion
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

async function createPdfPrint() {
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
        "Color": "red",
        "Switch Sides": "0"
      },
      Output: {
        Format: 'PDF' as const,
        Quality: 'Print' as const,
        StrictPolicy: true
      }
    };
    
    console.log('Requesting PDF creation with Print quality...');
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    // Submit the request
    const createResponse = await client.createContent(requestData);
    console.log(`Request submitted successfully. Request ID: ${createResponse.RequestId}`);
    
    // Poll for completion
    console.log('Polling for completion...');
    const startTime = Date.now();
    const contentResponse = await client.pollForContent(createResponse.RequestId, 15, 2000);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Content ready after ${elapsedTime} seconds`);
    
    // Check if we have URLs in the response
    if (!contentResponse.URLs || contentResponse.URLs.length === 0) {
      throw new Error('No URLs found in the response');
    }
    
    // Get the first URL (usually there's only one for PDF)
    const pdfUrl = contentResponse.URLs[0];
    console.log(`PDF URL: ${pdfUrl}`);
    
    // Download the PDF content
    console.log('Downloading PDF file...');
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }
    
    // Get the content as ArrayBuffer and convert to Buffer
    const arrayBuffer = await response.arrayBuffer();
    const content = Buffer.from(arrayBuffer);
    
    // Save the PDF
    const filename = path.join(OUTPUT_DIR, `personalia-print-${createResponse.RequestId}.pdf`);
    fs.writeFileSync(filename, content);
    
    console.log(`PDF saved to: ${filename}`);
    console.log(`File size: ${(content.length / 1024).toFixed(2)} KB`);
    
  } catch (error) {
    console.error('Error creating PDF:', error);
  }
}

// Run the example
createPdfPrint().catch(console.error);

/**
 * To run this example:
 * npx ts-node examples/create-pdf-print.ts
 */
