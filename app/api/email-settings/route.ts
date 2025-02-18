import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emailSettingsSchema } from '@/validations/email-settings.schema';

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const emailSettings = await prisma.emailSettings.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		return NextResponse.json(emailSettings);
	} catch (error) {
		console.error('Error fetching email settings:', error);
		return NextResponse.json({ error: 'Failed to fetch email settings' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const validatedData = emailSettingsSchema.parse(body);

		// If this is set as default, unset other defaults
		if (validatedData.isDefault) {
			await prisma.emailSettings.updateMany({
				where: {
					userId: session.user.id,
					isDefault: true,
				},
				data: {
					isDefault: false,
				},
			});
		}

		const emailSettings = await prisma.emailSettings.create({
			data: {
				...validatedData,
				userId: session.user.id,
			},
		});

		return NextResponse.json(emailSettings);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		console.error('Error creating email settings:', error);
		return NextResponse.json({ error: 'Failed to create email settings' }, { status: 500 });
	}
}
