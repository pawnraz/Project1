export interface EmailTemplate {
	id: string;
	userId: string;
	templateText: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface SaveTemplateRequest {
	templateText: string;
}

export interface SaveTemplateResponse {
	success: boolean;
	template: EmailTemplate;
}

export interface GetTemplateResponse {
	success: boolean;
	template: EmailTemplate | null;
}

export type PlaceholderKey = 'name' | 'institution name' | 'email';

export interface TemplateValidationError {
	message: string;
	code: 'INVALID_TEMPLATE' | 'MISSING_PLACEHOLDERS' | 'UNAUTHORIZED';
}

export interface PlaceholderInfo {
	key: PlaceholderKey;
	description: string;
	required: boolean;
}
