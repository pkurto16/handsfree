import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { x, y } = await request.json();

    // Ensure coordinates are valid numbers
    if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Invalid coordinates');
    }

    // Round coordinates
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Client-side mouse movement will be handled by the EyeTracker component
    return NextResponse.json({
      success: true,
      coordinates: { x: roundedX, y: roundedY }
    });
  } catch (error) {
    console.error('Error processing coordinates:', error);
    return NextResponse.json(
      { message: 'Failed to process coordinates', error: String(error) },
      { status: 500 }
    );
  }
}