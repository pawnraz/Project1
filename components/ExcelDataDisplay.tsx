import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ExcelRow } from '@/types/excel';
import { TemplateEditor } from './TemplateEditor';

interface ExcelDataDisplayProps {
	data: ExcelRow[];
}

export function ExcelDataDisplay({ data }: ExcelDataDisplayProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [template, setTemplate] = useState('');
	const [subject, setSubject] = useState('');

	if (!data.length) return null;

	const handleSendEmails = async () => {
		if (!template) {
			toast.error('Please create an email template first');
			return;
		}

		if (!subject) {
			toast.error('Please enter an email subject');
			return;
		}

		setIsSending(true);
		try {
			const response = await fetch('/api/send-emails', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					template,
					subject,
					recipients: data,
				}),
			});

			const result = await response.json();

			if (result.success) {
				toast.success(result.message);
				if (result.errors?.length) {
					// Show errors in a separate toast if some emails failed
					toast.error(
						<div className='space-y-2'>
							<p>Some emails failed to send:</p>
							<ul className='list-disc pl-4'>
								{result.errors.map((error: string, index: number) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</div>
					);
				}
				setIsDialogOpen(false);
			} else {
				throw new Error(result.error);
			}
		} catch (error) {
			console.error('Error sending emails:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to send emails');
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Card className='w-full'>
			<CardHeader className='flex flex-row items-center justify-between'>
				<CardTitle>Uploaded Data ({data.length} records)</CardTitle>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger asChild>
						<Button>
							<Mail className='mr-2 h-4 w-4' />
							Send Emails
						</Button>
					</DialogTrigger>
					<DialogContent className='max-w-4xl'>
						<DialogHeader>
							<DialogTitle>Send Personalized Emails</DialogTitle>
							<DialogDescription>
								Create your email template using the placeholders below. The email will be sent to all recipients with
								their respective data.
							</DialogDescription>
						</DialogHeader>
						<div className='mt-4 space-y-6'>
							<div className='space-y-2'>
								<Label htmlFor='subject'>Email Subject</Label>
								<Input
									id='subject'
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
									placeholder='Enter email subject (supports all column placeholders)'
								/>
								<p className='text-sm text-muted-foreground'>
									You can use any column name as a placeholder in the subject line
								</p>
							</div>
							<div className='space-y-2'>
								<Label>Email Content</Label>
								<TemplateEditor
									value={template}
									onChange={setTemplate}
									onSave={handleSendEmails}
									isSaving={isSending}
									saveButtonText={isSending ? 'Sending...' : 'Send Emails'}
									headers={Object.keys(data[0] || {})}
								/>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				<div className='rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								{Object.keys(data[0] || {}).map((header) => (
									<TableHead key={header}>
										{header.charAt(0).toUpperCase() + header.slice(1).replace(/([A-Z])/g, ' $1')}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.map((row, index) => (
								<TableRow key={index}>
									{Object.keys(data[0] || {}).map((header) => (
										<TableCell key={header}>{row[header]}</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}
