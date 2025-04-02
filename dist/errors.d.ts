/**
 * Error handling for Personalia API
 */
export declare class PersonaliaError extends Error {
    statusCode: number;
    errorCode?: number;
    errorId?: string;
    constructor(message: string, statusCode: number, errorCode?: number, errorId?: string);
}
interface ErrorMapping {
    [key: string]: {
        message: string;
        fix: string;
    };
}
export declare const PERSONALIA_ERRORS: ErrorMapping;
/**
 * Parse API error response and create a PersonaliaError with detailed information
 */
export declare function parseApiError(error: any): PersonaliaError;
export {};
