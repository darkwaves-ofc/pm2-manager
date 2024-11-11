// app/api/restart/[id]/route.ts
import { restartProcess } from '@/lib/pm2Actions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const processId = context.params.id;
    if (!processId || typeof processId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing Process ID' },
        { status: 400 }
      );
    }

    const result = await restartProcess(processId);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully restarted process ${processId}`,
    });
  } catch (error) {
    console.error('Error restarting process:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
      
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: errorMessage
      },
      { status: 500 }
    );
  }
}