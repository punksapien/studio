import { NextResponse } from 'next/server';

// Listing appeals have been discontinued. Listings are now managed entirely by
// the Nobridge team, so there is no self-serve rejection appeal flow.
export async function POST() {
  return NextResponse.json(
    { error: 'Listing appeals have been discontinued.' },
    { status: 410 }
  );
}
