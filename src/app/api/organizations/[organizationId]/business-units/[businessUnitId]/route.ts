import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/api-response';

export async function DELETE(
  _request: Request,
  { params }: { params: { orgId: string; businessUnitId: string } }
) {
  try {
    await prisma.businessUnit.delete({
      where: { id: params.businessUnitId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
