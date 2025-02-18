import { z } from 'zod';

export const emailSettingsSchema = z.object({
	smtpUser: z.string().email('Please enter a valid email'),
	smtpPassword: z.string().min(1, 'SMTP password is required'),
	smtpFrom: z.string().min(1, 'From email is required'),
	isDefault: z.boolean().default(false),
});

export type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;
