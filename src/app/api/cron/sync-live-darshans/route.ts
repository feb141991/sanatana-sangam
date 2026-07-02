import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS for background jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  // 1. Verify Authorization (Vercel Cron automatically sends a Bearer token we can check, 
  // or we can use a custom secret token defined in env vars)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    return new NextResponse('Missing YOUTUBE_API_KEY', { status: 500 });
  }

  try {
    // 2. Fetch all active channels from database
    const { data: darshans, error: fetchError } = await supabaseAdmin
      .from('live_darshans')
      .select('id, youtube_channel_id');

    if (fetchError || !darshans) {
      throw new Error(`Failed to fetch darshans: ${fetchError?.message}`);
    }

    const updates = [];

    // 3. Query YouTube API for each channel
    for (const darshan of darshans) {
      if (!darshan.youtube_channel_id) continue;

      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${darshan.youtube_channel_id}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        // If a live video is found, extract its ID
        if (data.items && data.items.length > 0) {
          const liveVideoId = data.items[0].id.videoId;
          
          // 4. Update the record in Supabase
          const { error: updateError } = await supabaseAdmin
            .from('live_darshans')
            .update({ 
              current_video_id: liveVideoId, 
              last_synced_at: new Date().toISOString() 
            })
            .eq('id', darshan.id);
            
          if (updateError) {
            console.error(`Failed to update ${darshan.id}:`, updateError);
          } else {
            updates.push({ id: darshan.id, status: 'updated', videoId: liveVideoId });
          }
        } else {
          // Channel is not currently live
          updates.push({ id: darshan.id, status: 'not_live' });
          
          // Optional: You could set current_video_id to null here, 
          // but keeping the last known good video is usually better for UX 
          // as YouTube often processes the stream into a VOD instantly.
        }
      } catch (err) {
        console.error(`YouTube API error for ${darshan.id}:`, err);
        updates.push({ id: darshan.id, status: 'error' });
      }
    }

    return NextResponse.json({ success: true, updates });

  } catch (error: any) {
    console.error('Cron job failed:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
