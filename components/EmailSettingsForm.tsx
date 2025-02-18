'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { emailSettingsSchema, type EmailSettingsFormData } from '@/validations/email-settings.schema';

type EmailSettings = EmailSettingsFormData & {
	id: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
};

export function EmailSettingsForm() {
	const [emailSettings, setEmailSettings] = useState<EmailSettings[]>([]);
	const [loading, setLoading] = useState(false);
	const [deleting, setDeleting] = useState<string | null>(null);

	const form = useForm<EmailSettingsFormData>({
		resolver: zodResolver(emailSettingsSchema),
		defaultValues: {
			smtpUser: '',
			smtpPassword: '',
			smtpFrom: '',
			isDefault: false,
		},
	});

	const fetchEmailSettings = async () => {
		try {
			const response = await fetch('/api/email-settings');
			if (!response.ok) throw new Error('Failed to fetch email settings');
			const data = await response.json();
			setEmailSettings(data);
		} catch (error) {
			console.error('Error fetching email settings:', error);
			toast.error('Failed to fetch email settings');
		}
	};

	useEffect(() => {
		fetchEmailSettings();
	}, []);

	const onSubmit = async (data: EmailSettingsFormData) => {
		try {
			setLoading(true);
			const response = await fetch('/api/email-settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});

			if (!response.ok) throw new Error('Failed to create email settings');

			await fetchEmailSettings();
			form.reset();
			toast.success('Email settings added successfully');
		} catch (error) {
			console.error('Error creating email settings:', error);
			toast.error('Failed to create email settings');
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		try {
			setDeleting(id);
			const response = await fetch(`/api/email-settings/${id}`, {
				method: 'DELETE',
			});

			if (!response.ok) throw new Error('Failed to delete email settings');

			await fetchEmailSettings();
			toast.success('Email settings deleted successfully');
		} catch (error) {
			console.error('Error deleting email settings:', error);
			toast.error('Failed to delete email settings');
		} finally {
			setDeleting(null);
		}
	};

	return (
		<div className='space-y-6'>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
					<FormField
						control={form.control}
						name='smtpUser'
						render={({ field }) => (
							<FormItem>
								<FormLabel>SMTP User (Email)</FormLabel>
								<FormControl>
									<Input placeholder='smtp@example.com' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='smtpPassword'
						render={({ field }) => (
							<FormItem>
								<FormLabel>SMTP Password</FormLabel>
								<FormControl>
									<Input type='password' placeholder='••••••••' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='smtpFrom'
						render={({ field }) => (
							<FormItem>
								<FormLabel>From Email</FormLabel>
								<FormControl>
									<Input placeholder='from@example.com' {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name='isDefault'
						render={({ field }) => (
							<FormItem className='flex items-center gap-2'>
								<FormControl>
									<Switch checked={field.value} onCheckedChange={field.onChange} />
								</FormControl>
								<FormLabel className='!mt-0'>Set as default</FormLabel>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type='submit' disabled={loading}>
						{loading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
								Adding...
							</>
						) : (
							<>
								<Plus className='mr-2 h-4 w-4' />
								Add Email Settings
							</>
						)}
					</Button>
				</form>
			</Form>

			<div className='space-y-4'>
				<h3 className='text-lg font-medium'>Saved Email Settings</h3>
				{emailSettings.length === 0 ? (
					<p className='text-sm text-muted-foreground'>No email settings found</p>
				) : (
					emailSettings.map((settings) => (
						<Card key={settings.id}>
							<CardContent className='flex items-center justify-between p-4'>
								<div className='space-y-1'>
									<p className='font-medium'>{settings.smtpUser}</p>
									<p className='text-sm text-muted-foreground'>From: {settings.smtpFrom}</p>
									{settings.isDefault && <p className='text-sm text-green-500'>Default</p>}
								</div>
								<Button
									variant='destructive'
									size='icon'
									onClick={() => handleDelete(settings.id)}
									disabled={deleting === settings.id}
								>
									{deleting === settings.id ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Trash2 className='h-4 w-4' />
									)}
								</Button>
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
