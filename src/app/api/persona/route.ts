import { NextResponse, NextRequest } from "next/server";
import { sunoApi } from "@/lib/SunoApi";
import { corsHeaders } from "@/lib/utils";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url);
      const personaId = url.searchParams.get('id');
      const page = url.searchParams.get('page');

      if (personaId == null) {
        return new NextResponse(JSON.stringify({ error: 'Missing parameter id' }), {
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

      const pageNumber = page ? parseInt(page) : 1;
      const personaInfo = await (await sunoApi(apiKey)).getPersonaPaginated(personaId, pageNumber);

      return new NextResponse(JSON.stringify(personaInfo), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      logger.error({ error: error.response?.data || error.message }, 'Error fetching persona');
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
