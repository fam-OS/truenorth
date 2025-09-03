import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use GET /api/business-units instead.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use POST /api/business-units instead.' },
    { status: 410 }
  );
}