'use client';

import { useState } from 'react';
import { ExcelUpload } from '@/components/ExcelUpload';
import { ExcelDataDisplay } from '@/components/ExcelDataDisplay';
import { ExcelRow } from '@/types/excel';

export default function Home() {
	const [uploadedData, setUploadedData] = useState<ExcelRow[]>([]);

	const handleUploadSuccess = (data: ExcelRow[]) => {
		setUploadedData(data);
	};

	return (
		<main className='container mx-auto space-y-8 py-8'>
			<div className='flex flex-col items-center space-y-4'>
				<h1 className='text-2xl font-bold'>Excel Mail Sender</h1>
				<p className='max-w-md text-center text-muted-foreground'>
					Upload an Excel file with recipient details and send personalized emails using templates.
				</p>
			</div>

			<div className='flex flex-col items-center space-y-8'>
				<div className='w-full max-w-xl'>
					<ExcelUpload onUploadSuccess={handleUploadSuccess} />
				</div>
				<ExcelDataDisplay data={uploadedData} />
			</div>
		</main>
	);
}
