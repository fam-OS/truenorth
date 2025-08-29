import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { updateOpsReviewItemSchema } from '@/lib/validations/ops-review-item';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  try {
    const item = await prisma.opsReviewItem.findUnique({
      where: { id: itemId },
      include: { owner: true, team: true, opsReview: true },
    });
    if (!item || item.opsReviewId !== id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  try {
    const existing = await prisma.opsReviewItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.opsReviewId !== id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const json = await request.json();
    const parsed = updateOpsReviewItemSchema.parse(json);

    // Ensure we don't allow changing opsReviewId to another review implicitly
    if (parsed.opsReviewId && parsed.opsReviewId !== id) {
      return NextResponse.json({ error: 'Cannot move item to a different review' }, { status: 400 });
    }

    const updated = await prisma.opsReviewItem.update({
      where: { id: itemId },
      data: {
        ...(parsed.title !== undefined && { title: parsed.title }),
        ...(parsed.description !== undefined && { description: parsed.description ?? null }),
        ...(parsed.targetMetric !== undefined && { targetMetric: parsed.targetMetric }),
        ...(parsed.actualMetric !== undefined && { actualMetric: parsed.actualMetric }),
        ...(parsed.quarter !== undefined && { quarter: parsed.quarter as any }),
        ...(parsed.year !== undefined && { year: parsed.year as number }),
        ...(parsed.teamId !== undefined && { team: { connect: { id: parsed.teamId } } }),
        ...(parsed.ownerId !== undefined && (parsed.ownerId
          ? { owner: { connect: { id: parsed.ownerId } } }
          : { owner: { disconnect: true } })),
      },
      include: { owner: true, team: true, opsReview: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: err.issues },
        { status: 400 }
      );
    }
    const error = err as Error;
    return NextResponse.json(
      { error: 'Failed to update item', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params;
  try {
    const existing = await prisma.opsReviewItem.findUnique({ where: { id: itemId } });
    if (!existing || existing.opsReviewId !== id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.opsReviewItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
