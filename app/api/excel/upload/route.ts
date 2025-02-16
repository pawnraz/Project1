import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'NO_FILE',
						details: 'No file was uploaded',
					},
				},
				{ status: 400 }
			);
		}

		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer);
		const worksheet = workbook.Sheets[workbook.SheetNames[0]];

		// Convert to JSON with header row
		const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		if (jsonData.length < 2) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'EMPTY_FILE',
						details: 'The Excel file is empty or contains only headers',
					},
				},
				{ status: 400 }
			);
		}

		// Extract headers and convert to lowercase
		const headers = (jsonData[0] as string[]).map((header) => header.toLowerCase().trim());

		// Map the data to our expected format
		const records = jsonData.slice(1).map((row: any) => {
			const record: Record<string, string> = {};
			headers.forEach((header, index) => {
				// Convert all values to strings and handle empty cells
				const value = row[index];
				record[header] = value != null ? String(value).trim() : '';
			});

			// Map to our expected format
			return {
				email: record['email'] || '',
				...record, // Include any additional columns
			};
		});

		// Filter out empty rows (where all required fields are empty)
		const validRecords = records.filter((record) => record.email);

		if (validRecords.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: 'NO_VALID_RECORDS',
						details: 'No valid records found in the Excel file',
					},
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({
			success: true,
			data: {
				headers,
				records: validRecords,
				totalRecords: validRecords.length,
			},
		});
	} catch (error) {
		console.error('Error processing Excel file:', error);
		return NextResponse.json(
			{
				success: false,
				error: {
					code: 'PROCESSING_ERROR',
					details: error instanceof Error ? error.message : 'Failed to process Excel file',
				},
			},
			{ status: 500 }
		);
	}
}
