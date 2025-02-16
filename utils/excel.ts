import * as XLSX from 'xlsx';
import { ExcelRow, ExcelValidationError } from '@/types/excel';
import { excelRowSchema } from '@/validations/excel.schema';

export const parseExcelFile = async (
	file: Buffer
): Promise<{
	data?: ExcelRow[];
	errors?: ExcelValidationError[];
}> => {
	try {
		const workbook = XLSX.read(file, { type: 'buffer' });
		const worksheet = workbook.Sheets[workbook.SheetNames[0]];

		// Convert worksheet to JSON
		const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

		if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
			throw new Error('Invalid Excel file format or empty file');
		}

		const errors: ExcelValidationError[] = [];
		const validRows: ExcelRow[] = [];

		// Validate required columns exist
		const firstRow = jsonData[0] as Record<string, unknown>;
		const requiredColumns = ['name', 'institution name', 'email'];
		console.log(Object.keys(firstRow));
		const missingColumns = requiredColumns.filter(
			(col) =>
				!Object.keys(firstRow)
					.map((k) => k.toLowerCase())
					.includes(col)
		);

		if (missingColumns.length > 0) {
			throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
		}

		// Process each row
		jsonData.forEach((row: Record<string, unknown>, index) => {
			const rowData = {
				name: String(row['name'] ?? ''),
				institutionName: String(row['institution name'] ?? ''),
				email: String(row['email'] ?? ''),
			};

			const validation = excelRowSchema.safeParse(rowData);

			if (!validation.success) {
				errors.push({
					row: index + 2, // Add 2 to account for 0-based index and header row
					errors: validation.error.errors.map((err) => err.message),
				});
			} else {
				validRows.push(validation.data);
			}
		});

		if (errors.length > 0) {
			return { errors };
		}

		return { data: validRows };
	} catch (error) {
		throw error instanceof Error ? error : new Error('Failed to parse Excel file');
	}
};
