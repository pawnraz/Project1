export interface ExcelRow {
	email: string;
	[key: string]: string;
}

export interface ExcelUploadError {
	code: string;
	details: string;
}

export interface ExcelUploadData {
	headers: string[];
	records: ExcelRow[];
	totalRecords: number;
}

export interface ExcelUploadResponse {
	success: boolean;
	data?: ExcelUploadData;
	error?: ExcelUploadError;
}

export interface SendEmailRequest {
	template: string;
	recipients: ExcelRow[];
}

export interface SendEmailResponse {
	success: boolean;
	message: string;
	errors?: string[];
}
