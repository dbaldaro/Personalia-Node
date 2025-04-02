"use strict";
/**
 * Error handling for Personalia API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERSONALIA_ERRORS = exports.PersonaliaError = void 0;
exports.parseApiError = parseApiError;
class PersonaliaError extends Error {
    constructor(message, statusCode, errorCode, errorId) {
        super(message);
        this.name = 'PersonaliaError';
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.errorId = errorId;
    }
}
exports.PersonaliaError = PersonaliaError;
// Map of Personalia error IDs to descriptive messages and fixes
exports.PERSONALIA_ERRORS = {
    '101': {
        message: 'API key does not belong to this template.',
        fix: 'Copy the correct API key from the template\'s workspace in the Personalia dashboard and paste it into your API call.'
    },
    '102': {
        message: 'Invalid or missing API key.',
        fix: 'Copy the correct API key from the template\'s workspace in the Personalia dashboard and paste it into your API call.'
    },
    '103': {
        message: 'Invalid Template ID.',
        fix: 'Copy the correct template ID from the Personalia dashboard and paste it into your API call.'
    },
    '104': {
        message: 'Invalid value(s) in the Output section.',
        fix: 'Fix your API call. Check the Output section and validate that all the values of the parameters are valid.'
    },
    '105': {
        message: 'Unable to fetch more than the maximum allowed Fetch URLs.',
        fix: 'Contact the designer to reduce the number of Fetch URLs in the template in uCreate.'
    },
    '106': {
        message: 'Unable to fetch more than the maximum allowed total size of all Fetch URLs.',
        fix: 'Reduce the Fetch URL sizes so that the total size of all Fetch URLs does not exceed the maximum. Alternatively, use different images.'
    },
    '107': {
        message: 'Failed to fetch the Fetch URL or it timed out.',
        fix: 'Correct the image or the URL. Alternatively, use a different image.'
    },
    '108': {
        message: 'Invalid/unsupported image format in Fetch URL.',
        fix: 'Use a different image format. Only PNG & JPG are supported.'
    },
    '109': {
        message: 'Invalid JSON syntax.',
        fix: 'Fix your API call. Check the JSON and validate that all mandatory parameters are included and that their types are valid.'
    },
    '111': {
        message: 'Input field is missing in the API call.',
        fix: 'Fix your API call. Validate that all expected input fields are included.'
    },
    '112': {
        message: 'Invalid date format in input field.',
        fix: 'Fix your API call. Expected date format is YYYY-MM-DD (e.g., 2023-07-24).'
    },
    '113': {
        message: 'Invalid number format in input field.',
        fix: 'Fix your API call. Valid number format is: No comma separator allowed, only 1 period (optional) and it can be a negative number.'
    },
    '114': {
        message: 'Invalid Fetch protocol. It must be HTTP or HTTPS.',
        fix: 'Fix your API call. Use HTTP/HTTPS in the Fetch URL.'
    },
    '117': {
        message: 'Insufficient credits.',
        fix: 'Insufficient credits remaining this month for your account. To increase the number of credits, upgrade your subscription plan.'
    },
    '118': {
        message: 'Unsupported output format.',
        fix: 'Only PDF is supported.'
    },
    '1000': {
        message: 'Something went wrong.',
        fix: 'Contact support.'
    },
    '1001': {
        message: 'Invalid logic in a rule.',
        fix: 'Contact the designer to check the rules defined in uCreate.'
    },
    '1002': {
        message: 'Something went wrong in a design document.',
        fix: 'Contact the designer to fix the document in uCreate.'
    },
    '1003': {
        message: 'Input value(s) resulted in invalid barcode generation.',
        fix: 'Contact the designer to fix the rule logic defined in uCreate.'
    },
    '1004': {
        message: 'No output. This may be due to Skip or Abort logic defined in uCreate.',
        fix: 'Contact the designer to fix the rule logic defined in uCreate.'
    },
    '1005': {
        message: 'Input value(s) resulted in division by zero.',
        fix: 'Contact the designer to fix the rule logic defined in uCreate.'
    },
    '1006': {
        message: 'Missing graphic or text asset detected.',
        fix: 'Contact the designer to fix the design and include the asset in uCreate.'
    },
    '1007': {
        message: 'Missing style detected.',
        fix: 'Contact the designer to fix the design and include the style in uCreate.'
    },
    '1008': {
        message: 'Missing font detected.',
        fix: 'Contact the designer to fix the design and include the font in uCreate.'
    },
    '1009': {
        message: 'Text overflow detected.',
        fix: 'Contact the designer to fix the design in uCreate either by copyfitting or truncating the input value.'
    }
};
/**
 * Parse API error response and create a PersonaliaError with detailed information
 */
function parseApiError(error) {
    // Default error message
    let message = 'An unknown error occurred';
    let statusCode = 500;
    let errorCode;
    let errorId;
    // Extract error details from the response
    if (error.response) {
        statusCode = error.response.status;
        // Extract error details from response data
        const responseData = error.response.data;
        if (responseData) {
            // Extract error message
            if (responseData.message) {
                message = responseData.message;
            }
            else if (responseData.error) {
                message = responseData.error;
            }
            // Extract error code and ID
            if (responseData.errorCode) {
                errorCode = responseData.errorCode;
            }
            if (responseData.errorId) {
                errorId = responseData.errorId;
                // Add specific error information if available
                if (errorId && exports.PERSONALIA_ERRORS[errorId]) {
                    const errorInfo = exports.PERSONALIA_ERRORS[errorId];
                    message = `${message}: ${errorInfo.message} - ${errorInfo.fix}`;
                }
            }
        }
    }
    else if (error.request) {
        // Request was made but no response received
        message = 'No response received from the server. Please check your network connection.';
        statusCode = 0;
    }
    else if (error.message) {
        // Error setting up the request
        message = error.message;
    }
    return new PersonaliaError(message, statusCode, errorCode, errorId);
}
