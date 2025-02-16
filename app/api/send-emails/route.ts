import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const sendEmailSchema = z.object({
	template: z.string().min(1, 'Template is required'),
	subject: z.string().min(1, 'Subject is required'),
	recipients: z.array(
		z
			.object({
				email: z.string().email('Valid email is required'),
			})
			.catchall(z.string())
	), // Allow any additional string fields
});

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: process.env.SMTP_SECURE === 'true',
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
});

function replacePlaceholders(template: string, data: Record<string, string>) {
	return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => data[key.trim()] || '');
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { template, subject, recipients } = sendEmailSchema.parse(body);

		// Validate SMTP configuration
		if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
			return NextResponse.json({ success: false, error: 'SMTP configuration is missing' }, { status: 500 });
		}

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
					// Use all fields from recipient for placeholder replacement
					const emailContent = replacePlaceholders(template, recipient);
					const subjectContent = replacePlaceholders(subject, recipient);

					await transporter.sendMail({
						from: process.env.SMTP_FROM || process.env.SMTP_USER,
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
			.filter((error, index, self) => self.indexOf(error) === index); // Unique errors only

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
