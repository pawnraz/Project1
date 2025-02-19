import { useEffect, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ExcelRow } from '@/types/excel';
import { TemplateEditor } from './TemplateEditor';

interface EmailSettings {
	id: string;
	smtpUser: string;
	smtpFrom: string;
	isDefault: boolean;
}

interface ExcelDataDisplayProps {
	data: ExcelRow[];
}

export function ExcelDataDisplay({ data }: ExcelDataDisplayProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSending, setIsSending] = useState(false);
	const [template, setTemplate] = useState('');
	const [subject, setSubject] = useState('');
	const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
	const [selectedEmailSettings, setSelectedEmailSettings] = useState<string>('');
	const [isLoadingSettings, setIsLoadingSettings] = useState(true);
	const [interval, setInterval] = useState(0);
	const [cc, setCc] = useState<string[]>([]);
	const [ccInput, setCcInput] = useState('');

	useEffect(() => {
		const fetchEmailSettings = async () => {
			try {
				const response = await fetch('/api/email-settings');
				if (!response.ok) throw new Error('Failed to fetch email settings');
				const data = await response.json();
				setEmailSettings(data);

				// Set default email settings if available
				const defaultSettings = data.find((settings: EmailSettings) => settings.isDefault);
				if (defaultSettings) {
					setSelectedEmailSettings(defaultSettings.id);
				} else if (data.length > 0) {
					setSelectedEmailSettings(data[0].id);
				}
			} catch (error) {
				console.error('Error fetching email settings:', error);
				toast.error('Failed to fetch email settings');
			} finally {
				setIsLoadingSettings(false);
			}
		};

		fetchEmailSettings();
	}, []);

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

		if (!selectedEmailSettings) {
			toast.error('Please select email settings to use');
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
					interval,
					emailSettingsId: selectedEmailSettings,
					cc: cc.length > 0 ? cc : undefined,
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

	const handleAddCc = () => {
		if (ccInput.trim()) {
			const email = ccInput.trim();
			if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				setCc([...cc, email]);
				setCcInput('');
			} else {
				toast.error('Please enter a valid email address');
			}
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
					<DialogContent className='max-h-[90dvh] max-w-4xl overflow-y-auto'>
						<DialogHeader>
							<DialogTitle>Send Personalized Emails</DialogTitle>
							<DialogDescription>
								Create your email template using the placeholders below. The email will be sent to all recipients with
								their respective data.
							</DialogDescription>
						</DialogHeader>
						<div className='mt-4 space-y-6'>
							<div className='space-y-2'>
								<Label htmlFor='emailSettings'>Send From</Label>
								{isLoadingSettings ? (
									<p className='text-sm text-muted-foreground'>Loading email settings...</p>
								) : emailSettings.length === 0 ? (
									<p className='text-sm text-muted-foreground'>
										No email settings found. Please configure your email settings first.
									</p>
								) : (
									<Select value={selectedEmailSettings} onValueChange={setSelectedEmailSettings}>
										<SelectTrigger>
											<SelectValue placeholder='Select email settings' />
										</SelectTrigger>
										<SelectContent>
											{emailSettings.map((settings) => (
												<SelectItem key={settings.id} value={settings.id}>
													{settings.smtpFrom}
													{settings.isDefault && ' (Default)'}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
							</div>
							<div className='space-y-2'>
								<Label htmlFor='cc'>CC Recipients</Label>
								<div className='flex gap-2'>
									<Input
										id='cc'
										value={ccInput}
										onChange={(e) => setCcInput(e.target.value)}
										placeholder='Enter email and press Enter'
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												handleAddCc();
											}
										}}
									/>
									<Button type='button' variant='secondary' onClick={handleAddCc}>
										Add
									</Button>
								</div>
								{cc.length > 0 && (
									<div className='mt-2 flex flex-wrap gap-2'>
										{cc.map((email, index) => (
											<div key={index} className='flex items-center gap-1 rounded-md bg-secondary px-2 py-1'>
												<span className='text-sm'>{email}</span>
												<button
													onClick={() => setCc(cc.filter((_, i) => i !== index))}
													className='text-muted-foreground hover:text-foreground'
												>
													×
												</button>
											</div>
										))}
									</div>
								)}
							</div>
							<div className='flex items-center gap-4'>
								<div className='flex-1'>
									<Label htmlFor='interval'>Send Interval (seconds)</Label>
									<Input
										id='interval'
										type='number'
										min={0}
										value={interval}
										onChange={(e) => {
											const value = parseInt(e.target.value) || 0;
											if (value < 0) return;
											setInterval(value);
										}}
										placeholder='Enter interval in seconds'
										className='w-full'
									/>
								</div>
							</div>
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
