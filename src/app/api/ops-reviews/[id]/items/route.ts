import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createOpsReviewItemSchema } from '@/lib/validations/ops-review-item';
import { handleError } from '@/lib/api-response';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const items = await prisma.opsReviewItem.findMany({
      where: { opsReviewId: params.id },
      include: { owner: true, team: true, opsReview: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const json = await request.json();
    const data = createOpsReviewItemSchema.parse({ ...json, opsReviewId: params.id });

    const created = await prisma.opsReviewItem.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        targetMetric: data.targetMetric ?? null,
        actualMetric: data.actualMetric ?? null,
        quarter: data.quarter as any,
        year: data.year,
        opsReviewId: data.opsReviewId,
        teamId: data.teamId,
        ownerId: data.ownerId ?? null,
      },
      include: { owner: true, team: true, opsReview: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
