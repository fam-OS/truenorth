import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

export async function DELETE(
  _request: Request,
  { params }: { params: { organizationId: string } }
) {
  try {
    await prisma.organization.delete({
      where: { id: params.organizationId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
