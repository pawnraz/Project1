'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { ExcelUploadResponse, ExcelRow } from '@/types/excel';

interface ExcelUploadProps {
	onUploadSuccess: (data: ExcelRow[]) => void;
}

const REQUIRED_COLUMNS = ['email'];

export function ExcelUpload({ onUploadSuccess }: ExcelUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const validateColumns = (headers: string[]) => {
		const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
		const missingColumns = REQUIRED_COLUMNS.filter((col) => !normalizedHeaders.includes(col));

		if (missingColumns.length > 0) {
			throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
		}
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		const validTypes = [
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-excel',
		];

		if (!validTypes.includes(file.type)) {
			toast.error('Please upload a valid Excel file (.xlsx or .xls)');
			return;
		}

		try {
			setIsUploading(true);
			setError(null);
			setUploadProgress(0);

			const formData = new FormData();
			formData.append('file', file);

			// Simulate upload progress
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 10, 90));
			}, 100);

			const response = await fetch('/api/excel/upload', {
				method: 'POST',
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			const result: ExcelUploadResponse = await response.json();

			if (!response.ok) {
				throw new Error(result.error?.details || 'Failed to upload file');
			}
			if (result.data?.headers) {
				validateColumns(result.data.headers);
			}

			if (result.data?.records) {
				onUploadSuccess(result.data.records);
				toast.success(`Successfully loaded ${result.data.records.length} records`);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An error occurred while uploading the file';
			setError(errorMessage);
			toast.error(errorMessage);
		} finally {
			setIsUploading(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const files = e.dataTransfer.files;
		if (files.length > 0 && fileInputRef.current) {
			fileInputRef.current.files = files;
			handleFileChange({ target: fileInputRef.current } as any);
		}
	};

	return (
		<Card className='p-6'>
			<div className='w-full space-y-4' onDragOver={handleDragOver} onDrop={handleDrop}>
				<div className='flex flex-col items-center space-y-4 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary/50'>
					<Upload className='h-8 w-8 text-muted-foreground' />
					<div className='space-y-2 text-center'>
						<h3 className='font-medium'>Upload Excel File</h3>
						<p className='text-sm text-muted-foreground'>Drag and drop your Excel file here, or click to browse</p>
						<p className='text-xs text-muted-foreground'>Required columns: {REQUIRED_COLUMNS.join(', ')}</p>
					</div>
					<Input
						ref={fileInputRef}
						type='file'
						accept='.xlsx,.xls'
						onChange={handleFileChange}
						disabled={isUploading}
						className='cursor-pointer'
						aria-label='Upload Excel file'
					/>
				</div>

				{isUploading && (
					<div className='space-y-2'>
						<Progress value={uploadProgress} className='w-full' />
						<p className='text-center text-sm text-muted-foreground'>Uploading and processing file...</p>
					</div>
				)}

				{error && (
					<Alert variant='destructive'>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</div>
		</Card>
	);
}
