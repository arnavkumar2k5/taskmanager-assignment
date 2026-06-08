import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    await query('SELECT 1');
    return NextResponse.json(
      { success: true, message: 'OK', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Database connection failed' },
      { status: 503 }
    );
  }
}
