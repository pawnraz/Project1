import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const emailSettings = await prisma.emailSettings.findUnique({
			where: { id: params.id },
		});

		if (!emailSettings) {
			return NextResponse.json({ error: 'Email settings not found' }, { status: 404 });
		}

		if (emailSettings.userId !== session.user.id) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await prisma.emailSettings.delete({
			where: { id: params.id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error deleting email settings:', error);
		return NextResponse.json({ error: 'Failed to delete email settings' }, { status: 500 });
	}
}
