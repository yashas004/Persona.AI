import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, transcript } = await req.json();

    // Return default scores since external AI service is not available
    const visionScores = {
      eyeContact: 70,
      posture: 70,
      expression: 70,
      bodyLanguage: 70,
      feedback: "AI analysis temporarily unavailable. Using default scores."
    };

    // Analyze voice quality and speech content
    const voiceScores = transcript && transcript.length > 20
      ? {
          clarity: 70,
          pace: 70,
          tone: 70,
          engagement: 70,
          feedback: 'AI analysis temporarily unavailable. Using default scores.'
        }
      : { clarity: 70, pace: 70, tone: 70, engagement: 70, feedback: 'Not enough speech data yet.' };

    if (transcript && transcript.length > 20) {
      console.log('Voice analysis completed with default scores');
    }

    return new Response(
      JSON.stringify({
        vision: visionScores,
        voice: voiceScores,
        overall: Math.round(
          (visionScores.eyeContact + visionScores.posture + 
           voiceScores.clarity + voiceScores.engagement) / 4
        )
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-presentation function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
