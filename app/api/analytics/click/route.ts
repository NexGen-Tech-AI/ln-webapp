import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Temporarily return success for waitlist launch
  // Full implementation can be added later
  return NextResponse.json({ success: true })
}