# Personalia Node.js Client

A TypeScript/Node.js client library for the [Personalia API](https://www.personalia.io/), which allows you to generate personalized or versioned JPG/PNG images and PDF output from your Adobe InDesign templates.

## Installation

```bash
npm install personalia-node
```

## Features

- **Template Field Discovery**: Retrieve template fields to understand what data is required
- **Content Generation**: Create personalized PDFs, PNGs, and JPGs from templates
- **Automatic Polling**: Built-in polling mechanism to wait for content generation completion
- **Content URL Creation**: Generate on-demand URLs that create content when accessed
- **Robust Error Handling**: Comprehensive error handling with detailed error messages
- **TypeScript Support**: Full TypeScript type definitions for improved developer experience

## Quick Start

```typescript
import { PersonaliaClient } from 'personalia-node';
import * as fs from 'fs';
import * as path from 'path';

// Initialize with your API key
const client = new PersonaliaClient('YOUR_API_KEY');

async function generatePDF() {
  try {
    // 1. Create content request
    const createResponse = await client.createContent({
      TemplateId: 'your-template-id',
      Fields: {
        Product: 'iron',
        Offer: '20%',
        Price: '$25',
        'Expiry Date': '2025-04-01'
      },
      Output: {
        Format: 'PDF',
        Quality: 'Print'
      }
    });
    console.log(`Request ID: ${createResponse.RequestId}`);
    
    // 2. Poll for completion
    const contentResponse = await client.pollForContent(createResponse.RequestId);
    
    // 3. Check if content is ready and has URLs
    if (contentResponse.Status === 'Completed' && contentResponse.URLs?.length) {
      // 4. Download the content
      const pdfUrl = contentResponse.URLs[0];
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);
      
      // 5. Save to file
      fs.writeFileSync('output.pdf', content);
      console.log('PDF saved successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
generatePDF();
```

## Complete Workflow Example

Here's a complete example that demonstrates how to:
1. Get template information
2. Create a content request
3. Poll for completion
4. Download and save the content

```typescript
import { PersonaliaClient } from 'personalia-node';
import * as fs from 'fs';
import * as path from 'path';

async function generatePersonalizedContent() {
  // Initialize the client with your API key
  const client = new PersonaliaClient('YOUR_API_KEY');
  const templateId = 'your-template-id';
  const outputDir = './output';
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Step 1: Get template information to understand required fields
    console.log('Getting template information...');
    const templateInfo = await client.getTemplateInfo(templateId);
    console.log('Template fields:');
    templateInfo.Fields.forEach(field => {
      console.log(`- ${field.Name} (${field.Type})`);
    });

    // Step 2: Create content request with the required fields
    console.log('\nSubmitting content creation request...');
    const createResponse = await client.createContent({
      TemplateId: templateId,
      Fields: {
        // Populate with actual field values based on templateInfo.Fields
        Product: 'iron',
        Offer: '20%',
        Price: '$25',
        'Expiry Date': '2025-04-01'
      },
      Output: {
        Format: 'PDF',
        Quality: 'Print',
        StrictPolicy: true
      }
    });
    console.log(`Request submitted. Request ID: ${createResponse.RequestId}`);

    // Step 3: Use the built-in polling mechanism
    console.log('\nPolling for content completion...');
    const contentResponse = await client.pollForContent(
      createResponse.RequestId,
      30,  // Maximum 30 attempts
      2000 // 2 second interval between attempts
    );

    // Step 4: Handle the generated content
    console.log('\nContent details:');
    console.log(`Status: ${contentResponse.Status}`);
    
    if (contentResponse.Status === 'Completed' && contentResponse.URLs?.length) {
      console.log(`Content URLs: ${contentResponse.URLs.length} available`);
      
      // Step 5: Download the content
      const contentUrl = contentResponse.URLs[0];
      console.log(`Downloading from: ${contentUrl}`);
      
      const response = await fetch(contentUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      // Get content type to determine file extension
      const contentType = response.headers.get('content-type') || '';
      let extension = 'pdf'; // Default
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('jpg') || contentType.includes('jpeg')) extension = 'jpg';
      
      // Save the file
      const filename = path.join(outputDir, `personalia-${createResponse.RequestId}.${extension}`);
      const arrayBuffer = await response.arrayBuffer();
      const content = Buffer.from(arrayBuffer);
      fs.writeFileSync(filename, content);
      
      console.log(`File saved to: ${filename}`);
      console.log(`File size: ${(content.length / 1024).toFixed(2)} KB`);
    } else if (contentResponse.Status === 'Failed') {
      console.error(`Content generation failed: ${contentResponse.FailureDescription}`);
    }

    return contentResponse;
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}
```

## API Reference

### `PersonaliaClient`

The main class for interacting with the Personalia API.

#### Constructor

```typescript
const client = new PersonaliaClient(apiKey: string, baseUrl?: string);
```

- `apiKey`: Your Personalia API key (required)
- `baseUrl`: Optional custom API base URL (defaults to 'https://api.personalia.io')

#### Methods

##### `getTemplateInfo`

Retrieves information about a template, including its required fields.

```typescript
async getTemplateInfo(templateId: string): Promise<GetTemplateInfoResponse>
```

Example:
```typescript
const templateInfo = await client.getTemplateInfo('template-123');
console.log(templateInfo.Fields); // Array of field definitions
```

##### `createContent`

Submits a request for content creation (PDF, PNG, or JPG).

```typescript
async createContent(request: CreateContentRequest): Promise<CreateContentResponse>
```

Example:
```typescript
const response = await client.createContent({
  TemplateId: 'template-123',
  Fields: {
    Product: 'iron',
    Offer: '20%',
    Price: '$25',
    'Expiry Date': '2025-04-01'
  },
  Output: {
    Format: 'PDF',
    Quality: 'Print',
    StrictPolicy: true
  }
});
console.log(response.RequestId); // Use this ID to poll for content
```

##### `getContent`

Retrieves the status and URLs for a previously submitted content request.

```typescript
async getContent(requestId: string): Promise<GetContentResponse>
```

Example:
```typescript
const content = await client.getContent('request-123');
if (content.Status === 'Completed' && content.URLs?.length) {
  console.log(`Content available at: ${content.URLs[0]}`);
}
```

##### `pollForContent`

Polls for content completion with automatic retries.

```typescript
async pollForContent(requestId: string, maxAttempts = 30, interval = 2000): Promise<GetContentResponse>
```

Example:
```typescript
// Will automatically retry until content is ready or max attempts reached
const content = await client.pollForContent('request-123', 20, 3000);
if (content.Status === 'Completed') {
  console.log('Content ready for download!');
}
```

##### `createContentUrl`

Creates a content on-demand URL that generates content when accessed.

```typescript
async createContentUrl(request: CreateContentRequest): Promise<CreateUrlResponse>
```

Example:
```typescript
const urlResponse = await client.createContentUrl({
  TemplateId: 'template-123',
  Fields: {
    Product: 'iron',
    Offer: '20%',
    Price: '$25'
  },
  Output: {
    Format: 'PDF',
    Quality: 'Print'
  }
});
console.log(`Content URL: ${urlResponse.Url}`);
```

#### Response Types

##### `GetContentResponse`

Represents the response from the `getContent` and `pollForContent` methods.

```typescript
interface GetContentResponse {
  Status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  URLs?: string[];  // Array of URLs to download the content (when Status is 'Completed')
  FailureDescription?: string; // Description of the failure (when Status is 'Failed')
}
```

##### `CreateContentResponse`

Represents the response from the `createContent` method.

```typescript
interface CreateContentResponse {
  RequestId: string; // ID to use with getContent or pollForContent
}
```

##### `CreateUrlResponse`

Represents the response from the `createContentUrl` method.

```typescript
interface CreateUrlResponse {
  Url: string; // URL that will generate content on demand
}
```

##### `GetTemplateInfoResponse`

Represents the response from the `getTemplateInfo` method.

```typescript
interface GetTemplateInfoResponse {
  TemplateId: string;
  Name: string;
  Fields: TemplateField[];
}

interface TemplateField {
  Name: string;
  Type: string;
  Required: boolean;
  DefaultValue?: string;
}
```

## Examples

The library includes several example scripts in the `examples` directory:

### Get Template Fields

Retrieve the fields required by a template:

```typescript
// examples/get-template-fields.ts
import { PersonaliaClient } from '../src/client';

async function getTemplateFields() {
  const client = new PersonaliaClient('YOUR_API_KEY');
  const templateInfo = await client.getTemplateInfo('YOUR_TEMPLATE_ID');
  
  console.log('Template fields:');
  templateInfo.Fields.forEach(field => {
    console.log(`- ${field.Name} (${field.Type})${field.Required ? ' (Required)' : ''}`);
  });
}
```

### Create PDF (Print Quality)

Generate a high-quality PDF and download it:

```typescript
// examples/create-pdf-print.ts
import { PersonaliaClient } from '../src/client';
import * as fs from 'fs';
import * as path from 'path';

async function createPdfPrint() {
  const client = new PersonaliaClient('YOUR_API_KEY');
  
  // Create content request
  const createResponse = await client.createContent({
    TemplateId: 'YOUR_TEMPLATE_ID',
    Fields: { /* your fields */ },
    Output: {
      Format: 'PDF',
      Quality: 'Print'
    }
  });
  
  // Poll for completion
  const contentResponse = await client.pollForContent(createResponse.RequestId);
  
  // Download and save the PDF
  if (contentResponse.Status === 'Completed' && contentResponse.URLs?.length) {
    const pdfUrl = contentResponse.URLs[0];
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const content = Buffer.from(arrayBuffer);
    
    fs.writeFileSync('output.pdf', content);
  }
}
```

### Create PNG (High Resolution)

Generate a high-resolution PNG image:

```typescript
// examples/create-png-high-res.ts
import { PersonaliaClient } from '../src/client';

async function createPngHighRes() {
  const client = new PersonaliaClient('YOUR_API_KEY');
  
  // Create content request
  const createResponse = await client.createContent({
    TemplateId: 'YOUR_TEMPLATE_ID',
    Fields: { /* your fields */ },
    Output: {
      Format: 'PNG',
      Resolution: 300, // High resolution (300 DPI)
      StrictPolicy: true
    }
  });
  
  // Poll for completion
  const contentResponse = await client.pollForContent(createResponse.RequestId);
  
  // Process the URLs
  if (contentResponse.Status === 'Completed' && contentResponse.URLs?.length) {
    console.log('PNG URLs:');
    contentResponse.URLs.forEach(url => console.log(url));
  }
}
```

### Create Content URL

Generate a URL that creates content on demand:

```typescript
// examples/create-content-url.ts
import { PersonaliaClient } from '../src/client';

async function createContentUrl() {
  const client = new PersonaliaClient('YOUR_API_KEY');
  
  // Create URL request
  const urlResponse = await client.createContentUrl({
    TemplateId: 'YOUR_TEMPLATE_ID',
    Fields: { /* your fields */ },
    Output: {
      Format: 'PDF',
      Quality: 'Display'
    }
  });
  
  console.log(`Content URL: ${urlResponse.Url}`);
  console.log('This URL will generate content on demand when accessed.');
}
```

## Error Handling

The library provides detailed error messages for various scenarios:

```typescript
try {
  const content = await client.getContent('invalid-request-id');
} catch (error) {
  // Handle specific error types
  if (error.message.includes('404')) {
    console.error('Content not found or not ready yet');
  } else if (error.message.includes('401')) {
    console.error('Authentication failed - check your API key');
  } else {
    console.error('An error occurred:', error.message);
  }
}
```

## License

MIT

## Types

### CreateContentRequest

```typescript
interface CreateContentRequest {
  TemplateId: string;
  Fields: Record<string, string | number | boolean>;
  Output?: {
    Format?: 'PDF' | 'JPG' | 'PNG';
    Quality?: 'Display' | 'Print';
    Resolution?: number;
    Package?: boolean;
    StrictPolicy?: boolean;
  };
}
```

### Field Value Formats

- **Numbers**: No comma separator, only 1 decimal point (optional), can be negative
  - Valid: `1000.50`, `-2000`
  - Invalid: `1,000.50`

- **Dates**: Format must be `YYYY-MM-DD`
  - Valid: `2025-02-21`
  - Invalid: `21/02/2025`

- **Booleans**: Use `true`/`false` in TypeScript code
  - The API will convert these to `1`/`0` automatically

### Output Options

- **Format**: 
  - `PDF`: PDF document
  - `JPG`: JPEG image
  - `PNG`: PNG image

- **Quality** (PDF only):
  - `Display`: Optimized for screen viewing
  - `Print`: High-quality print output

- **Resolution** (images only):
  - Range: 72-300 DPI
  - Default: 72

- **Package**:
  - `true`: Compress output into ZIP file
  - `false`: Return single file (default)

- **StrictPolicy**:
  - `true`: Fail on missing assets/fonts/styles (default)
  - `false`: Ignore issues (may cause unexpected results)

## Error Handling

The client includes built-in error handling that will throw errors with descriptive messages. Each error includes an error ID and reason from the API.

```typescript
try {
  await client.createContent({...});
} catch (error) {
  // Error will include API error ID and reason if available
  console.error(error.message);
  // Example: "Personalia API Error 101: API key does not belong to this template"
}
```

## Best Practices

1. **API Key Security**: Never expose your API key in client-side code. Always keep it secure on your server.

2. **Error Handling**: Always implement proper error handling around API calls.

3. **Template Testing**: Use `getTemplateInfo` to validate your template fields before submitting content requests.

4. **Output Format**: Choose the appropriate output format and quality for your use case:
   - Use `PDF` with `Print` quality for documents that need to be printed
   - Use `JPG`/`PNG` with appropriate resolution for web/screen display

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
