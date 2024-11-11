// pages/api/restart/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { restartProcess } from '@/lib/pm2Actions';

interface ResponseData {
  success: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { id } = req.query;

    // Validate process ID
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing Process ID'
      });
    }

    // Restart the process
    await restartProcess(id);
    
    return res.status(200).json({
      success: true,
      message: `Successfully restarted process ${id}`
    });

  } catch (error) {
    console.error('Error restarting process:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
      
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: errorMessage
    });
  }
}