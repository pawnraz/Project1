import { z } from 'zod';

const REQUIRED_PLACEHOLDERS = ['name', 'institution name'] as const;
const OPTIONAL_PLACEHOLDERS = ['email'] as const;

const validatePlaceholders = (text: string) => {
	const placeholderRegex = /\{\{([^}]+)\}\}/g;
	const matches: string[] = [];
	let match;

	while ((match = placeholderRegex.exec(text)) !== null) {
		matches.push(match[1].trim());
	}

	// Check if all required placeholders are present
	const missingRequired = REQUIRED_PLACEHOLDERS.filter((placeholder) => !matches.includes(placeholder));

	if (missingRequired.length > 0) {
		return false;
	}

	// Validate that all placeholders are either required or optional
	const validPlaceholders = [...REQUIRED_PLACEHOLDERS, ...OPTIONAL_PLACEHOLDERS];
	const invalidPlaceholders = matches.filter((match) => !validPlaceholders.includes(match as any));

	return invalidPlaceholders.length === 0;
};

export const templateSchema = z.object({
	templateText: z
		.string()
		.min(1, 'Template text cannot be empty')
		.refine(
			validatePlaceholders,
			'Template must include all required placeholders ({{name}}, {{institution name}}) and only use valid placeholders'
		),
});

export type TemplateSchema = z.infer<typeof templateSchema>;

export const templateResponseSchema = z.object({
	success: z.boolean(),
	template: z
		.object({
			id: z.string(),
			userId: z.string(),
			templateText: z.string(),
			createdAt: z.date(),
			updatedAt: z.date(),
		})
		.nullable(),
});

export type TemplateResponseSchema = z.infer<typeof templateResponseSchema>;
