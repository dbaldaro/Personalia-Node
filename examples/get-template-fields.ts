/**
 * Example: Get Template Fields
 * 
 * This example demonstrates how to retrieve field information for a template.
 * It shows how to:
 * 1. Initialize the Personalia client
 * 2. Fetch template field information
 * 3. Display the field names and types
 */

import { PersonaliaClient } from '../src';

// Configuration
const API_KEY = '3478b80b33174677acaee07f71538d925086a54dac1c30406e639a9530af41f2';
const TEMPLATE_ID = '0ab2e03f-c183-4cdf-bb2c-3bc6c316b80e';

async function getTemplateFields() {
  try {
    // Initialize the client
    console.log('Initializing Personalia client...');
    const client = new PersonaliaClient(API_KEY);
    
    // Get template information
    console.log(`Fetching template information for template ID: ${TEMPLATE_ID}...`);
    const templateInfo = await client.getTemplateInfo(TEMPLATE_ID);
    
    // Display template information
    console.log('\nTemplate Information:');
    console.log(`Template ID: ${templateInfo.TemplateId}`);
    console.log('\nFields:');
    
    // Display each field with its type
    templateInfo.Fields.forEach(field => {
      console.log(`- ${field.Name} (${field.Type})`);
    });
    
    // Show example usage
    console.log('\nExample usage for content creation:');
    console.log(JSON.stringify({
      TemplateId: TEMPLATE_ID,
      Fields: templateInfo.Fields.reduce((acc, field) => {
        // Generate example values based on field type
        let exampleValue;
        switch (field.Type.toLowerCase()) {
          case 'string':
            exampleValue = `Example ${field.Name}`;
            break;
          case 'number':
            exampleValue = 100;
            break;
          case 'boolean':
            exampleValue = '1'; // '1' for true, '0' for false
            break;
          case 'date':
            exampleValue = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            break;
          default:
            exampleValue = 'Example value';
        }
        acc[field.Name] = exampleValue;
        return acc;
      }, {} as Record<string, any>)
    }, null, 2));
    
  } catch (error) {
    console.error('Error fetching template fields:', error);
  }
}

// Run the example
getTemplateFields().catch(console.error);

/**
 * To run this example:
 * npx ts-node examples/get-template-fields.ts
 */
