import { z } from 'zod';

export const emailSettingsSchema = z.object({
	smtpUser: z.string().email('Please enter a valid email'),
	smtpPassword: z.string().min(1, 'SMTP password is required'),
	smtpFrom: z.string().email('Please enter a valid email'),
	isDefault: z.boolean().default(false),
});

export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
