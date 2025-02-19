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
	interval: z.number().min(0).default(0), // Interval in seconds
	cc: z.array(z.string().email('Valid email is required')).optional(),
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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { template, subject, recipients, emailSettingsId, interval, cc } = sendEmailSchema.parse(body);

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

		// Send emails to all recipients sequentially with interval delay
		const results = [];

		console.log(body.cc);
		for (let i = 0; i < recipients.length; i++) {
			try {
				// Add delay before sending each email (except the first one)
				if (interval > 0 && i > 0) {
					await sleep(interval * 1000); // Convert seconds to milliseconds
				}

				const recipient = recipients[i];
				const emailContent = replacePlaceholders(template, recipient);
				const subjectContent = replacePlaceholders(subject, recipient);
				console.log(`Email sent to ${recipient.email} at ${new Date().toISOString()}`);

				await transporter.sendMail({
					from: emailSettings.smtpFrom,
					to: recipient.email,
					cc: body.cc,
					subject: subjectContent,
					text: emailContent,
				});

				results.push({
					status: 'fulfilled',
					value: {
						email: recipient.email,
						status: 'success',
					},
				});
			} catch (error) {
				results.push({
					status: 'fulfilled',
					value: {
						email: recipients[i].email,
						status: 'failed',
						error: error instanceof Error ? error.message : 'Failed to send email',
					},
				});
			}
		}

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
			interval,
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
