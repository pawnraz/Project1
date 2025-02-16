'use client';

import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface TemplateEditorProps {
	headers?: string[];
	value: string;
	onChange: (value: string) => void;
	onSave: () => void;
	isSaving: boolean;
	saveButtonText?: string;
}

export function TemplateEditor({
	headers = [],
	value,
	onChange,
	onSave,
	isSaving,
	saveButtonText = 'Save Template',
}: TemplateEditorProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const insertPlaceholder = (placeholder: string) => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const newTemplate = value.substring(0, start) + `{{${placeholder}}}` + value.substring(end);

		onChange(newTemplate);

		// Restore cursor position after React re-render
		setTimeout(() => {
			const newPosition = start + placeholder.length + 4; // 4 for {{ and }}
			textarea.focus();
			textarea.setSelectionRange(newPosition, newPosition);
		}, 0);
	};

	const highlightPlaceholders = (text: string) => {
		return text.replace(
			/\{\{([^}]+)\}\}/g,
			(match) => `<span class="bg-primary/20 text-primary rounded px-1">${match}</span>`
		);
	};

	const handleCopy = () => {
		navigator.clipboard.writeText(value);
		toast.success('Template copied to clipboard');
	};

	return (
		<div className='space-y-4'>
			<div className='mb-6'>
				<h3 className='mb-3 text-sm font-medium'>Available Fields:</h3>
				<div className='flex flex-wrap gap-2'>
					{headers.map((header) => (
						<TooltipProvider key={header}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant='outline' size='sm' onClick={() => insertPlaceholder(header)}>
										{`{{${header}}}`}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Column: {header}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>
			</div>

			<div className='space-y-4'>
				<div className='relative'>
					<Textarea
						ref={textareaRef}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder='Enter your email template here...'
						className='min-h-[200px] resize-y whitespace-pre-wrap font-mono'
					/>
					<div className='absolute right-2 top-2'>
						<Button variant='ghost' size='sm' className='text-xs' onClick={handleCopy}>
							Copy
						</Button>
					</div>
				</div>

				<div className='flex justify-end space-x-2'>
					<Button onClick={onSave} disabled={isSaving || !value.trim()}>
						{saveButtonText}
					</Button>
				</div>
			</div>

			{value && (
				<Card className='max-h-[400px] p-4'>
					<h3 className='mb-4 text-lg font-medium'>Preview</h3>
					<ScrollArea className='h-full max-h-[320px]'>
						<div
							className='prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap'
							dangerouslySetInnerHTML={{
								__html: highlightPlaceholders(value),
							}}
						/>
					</ScrollArea>
				</Card>
			)}
		</div>
	);
}
