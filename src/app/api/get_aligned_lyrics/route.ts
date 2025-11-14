import { NextResponse, NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const song_id = url.searchParams.get('song_id');

      if (!song_id) {
        return new NextResponse(JSON.stringify({ error: 'Song ID is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Get API key from Authorization header or environment variable
      const authHeader = req.headers.get('authorization');
      const apiKey = authHeader?.replace('Bearer ', '') || process.env.SUNO_API_KEY;

      const lyricAlignment = await (await sunoApi(apiKey)).getLyricAlignment(song_id);


      return new NextResponse(JSON.stringify(lyricAlignment), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      console.error('Error fetching lyric alignment:', error.response?.data || error.message);
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.msg || error.message || 'Internal server error';

      return new NextResponse(JSON.stringify({ error: errorMessage }), {
        status,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } else {
    return new NextResponse('Method Not Allowed', {
      headers: {
        Allow: 'GET',
        ...corsHeaders
      },
      status: 405
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}