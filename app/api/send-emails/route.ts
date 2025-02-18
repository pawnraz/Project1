import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const sendEmailSchema = z.object({
	template: z.string().min(1, 'Template is required'),
	subject: z.string().min(1, 'Subject is required'),
	emailSettingsId: z.string().optional(), // Optional: specific email settings to use
	recipients: z.array(
		z
			.object({
				email: z.string().email('Valid email is required'),
			})
			.catchall(z.string())
	),
});

function replacePlaceholders(template: string, data: Record<string, string>) {
	return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => data[key.trim()] || '');
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { template, subject, recipients, emailSettingsId } = sendEmailSchema.parse(body);

		// Fetch email settings
		let emailSettings = await prisma.emailSettings.findFirst({
			where: {
				userId: session.user.id,
				...(emailSettingsId ? { id: emailSettingsId } : { isDefault: true }), // Use specified settings or default
				...(emailSettingsId && { id: emailSettingsId }),
			},
		});

		if (!emailSettings) {
			// If specific settings were requested but not found, or if no default exists
			if (emailSettingsId) {
				return NextResponse.json({ success: false, error: 'Specified email settings not found' }, { status: 404 });
			}

			// Try to get any available settings if no default exists
			const anySettings = await prisma.emailSettings.findFirst({
				where: { userId: session.user.id },
			});

			if (!anySettings) {
				return NextResponse.json(
					{ success: false, error: 'No email settings found. Please configure your email settings first.' },
					{ status: 404 }
				);
			}

			// Use the first available settings
			emailSettings = anySettings;
		}

		// Create transporter with the selected settings
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			secure: process.env.SMTP_SECURE === 'true',
			auth: {
				user: emailSettings.smtpUser,
				pass: emailSettings.smtpPassword,
			},
		});

		// Verify SMTP connection before sending
		try {
			await transporter.verify();
		} catch (error) {
			console.error('SMTP connection error:', error);
			return NextResponse.json(
				{
					success: false,
					error: 'Failed to connect to SMTP server. Please check your email configuration.',
				},
				{ status: 500 }
			);
		}

		// Send emails to all recipients
		const results = await Promise.allSettled(
			recipients.map(async (recipient) => {
				try {
					const emailContent = replacePlaceholders(template, recipient);
					const subjectContent = replacePlaceholders(subject, recipient);

					await transporter.sendMail({
						from: emailSettings.smtpFrom,
						to: recipient.email,
						subject: subjectContent,
						text: emailContent,
					});

					return {
						email: recipient.email,
						status: 'success',
					};
				} catch (error) {
					return {
						email: recipient.email,
						status: 'failed',
						error: error instanceof Error ? error.message : 'Failed to send email',
					};
				}
			})
		);

		// Process results
		const successfulResults = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'success');
		const failedResults = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'failed');

		const successful = successfulResults.length;
		const failed = failedResults.length;

		// Get error messages from failed attempts
		const errors = failedResults
			.map((r) => {
				const result = (r as PromiseFulfilledResult<{ email: string; error?: string }>).value;
				return `${result.email}: ${result.error || 'Unknown error'}`;
			})
			.filter((error, index, self) => self.indexOf(error) === index);

		return NextResponse.json({
			success: successful > 0,
			message: `Successfully sent ${successful} emails${failed > 0 ? `, ${failed} failed` : ''}`,
			...(errors.length > 0 && { errors }),
		});
	} catch (error) {
		console.error('Error sending emails:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({ success: false, error: error.errors[0].message }, { status: 400 });
		}

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send emails',
			},
			{ status: 500 }
		);
	}
}
