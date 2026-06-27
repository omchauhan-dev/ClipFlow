import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Make sure you created this file earlier

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // -----------------------------------------------------------
    // THE FIX: Post a "Ticket" to the Database instead of calling Localhost
    // -----------------------------------------------------------
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        { 
          prompt: prompt, 
          status: 'pending' // This signals your Python Worker to start
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Write Error:", error);
      throw new Error(error.message);
    }

    // Return the Job ID immediately. 
    // The frontend will use this ID to check if the image is ready later.
    return NextResponse.json({ success: true, jobId: data.id });

  } catch (error: any) {
    console.error('Error queuing job:', error);
    return NextResponse.json({ 
        error: 'Failed to queue image generation job.' 
    }, { 
        status: 500 
    });
  }
}