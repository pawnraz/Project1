export interface ExcelRow {
  name: string;
  institutionName: string;
  email: string;
}

export interface ExcelUploadResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    records: ExcelRow[];
    totalRecords: number;
  };
  error?: {
    details: string;
  };
}

export interface ExcelValidationError {
  row: number;
  errors: string[];
}
