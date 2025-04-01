export interface CreateContentRequest {
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
export interface CreateContentResponse {
    RequestId: string;
}
export interface GetContentResponse {
    Content: string;
    ContentType: string;
}
export interface CreateUrlResponse {
    Url: string;
}
export interface ErrorResponse {
    Reason: string;
    ErrorId?: number;
    ErrorParameters?: Record<string, string>;
}
export interface TemplateInfo {
    Fields: Record<string, {
        Type: string;
        Description?: string;
    }>;
}
