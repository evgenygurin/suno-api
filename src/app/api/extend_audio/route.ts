import { NextResponse, NextRequest } from "next/server";
import { DEFAULT_MODEL, sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { audio_id, prompt, continue_at, tags, negative_tags, title, model, wait_audio } = body;

      if (!audio_id) {
        return new NextResponse(JSON.stringify({ error: 'Audio ID is required' }), {
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

      const audioInfo = await (await sunoApi(apiKey))
        .extendAudio(audio_id, prompt, continue_at, tags || '', negative_tags || '', title, model || DEFAULT_MODEL, wait_audio || false);

      return new NextResponse(JSON.stringify(audioInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error extending audio');
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
        Allow: 'POST',
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