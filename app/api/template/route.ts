import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { templateSchema } from '@/validations/template.schema';
import { authOptions } from '@/lib/auth';
import { ZodError } from 'zod';

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
		}

		const template = await prisma.emailTemplate.findFirst({
			where: { userId: user.id },
		});

		return NextResponse.json({
			success: true,
			template,
		});
	} catch (error) {
		console.error('Error fetching template:', error);
		return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
		}

		const body = await request.json();
		const validatedData = templateSchema.parse(body);

		const existingTemplate = await prisma.emailTemplate.findFirst({
			where: { userId: user.id },
		});

		const template = existingTemplate
			? await prisma.emailTemplate.update({
					where: { id: existingTemplate.id },
					data: { templateText: validatedData.templateText },
				})
			: await prisma.emailTemplate.create({
					data: {
						userId: user.id,
						templateText: validatedData.templateText,
					},
				});

		return NextResponse.json({
			success: true,
			template,
		});
	} catch (error) {
		console.error('Error saving template:', error);

		if (error instanceof ZodError) {
			return NextResponse.json(
				{
					success: false,
					error: error.errors.map((e) => e.message).join(', '),
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}
