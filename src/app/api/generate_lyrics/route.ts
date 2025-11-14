import { NextResponse, NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { prompt } = body;

      // Get API key from Authorization header or environment variable
      const authHeader = req.headers.get('authorization');
      const apiKey = authHeader?.replace('Bearer ', '') || process.env.SUNO_API_KEY;

      const lyrics = await (await sunoApi(apiKey)).generateLyrics(prompt);

      return new NextResponse(JSON.stringify(lyrics), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error generating lyrics');
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