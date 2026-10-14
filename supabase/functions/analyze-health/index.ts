import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Medical knowledge base for condition detection
const medicalConditions = {
  anemia: {
    name: "Anemia",
    indicators: ["pale skin", "pale lips", "dark circles under eyes", "glossy tongue", "pale nail beds"],
    tests: ["Complete Blood Count (CBC)", "Iron Profile (Ferritin, Iron, TIBC)", "Vitamin B12", "Folate"],
    description: "Low red blood cell count affecting oxygen delivery"
  },
  liver_issues: {
    name: "Liver Issues",
    indicators: ["yellowish skin", "yellow eyes", "jaundice", "red palms", "itchy appearance"],
    tests: ["Liver Function Test (LFT)", "Bilirubin (Total & Direct)", "ALT", "AST"],
    description: "Potential liver dysfunction affecting metabolism"
  },
  kidney_issues: {
    name: "Kidney Issues",
    indicators: ["puffy face", "swollen eyelids", "periorbital edema", "facial swelling"],
    tests: ["Kidney Function Test (KFT)", "Urine Routine", "Serum Creatinine", "Blood Urea Nitrogen"],
    description: "Kidney function concerns affecting fluid balance"
  },
  thyroid_disorders: {
    name: "Thyroid Disorders",
    indicators: ["facial puffiness", "dry skin", "hair thinning on forehead", "swollen neck", "thick skin"],
    tests: ["Thyroid Stimulating Hormone (TSH)", "Free T3", "Free T4", "Thyroid Antibodies"],
    description: "Thyroid imbalance affecting metabolism and energy"
  },
  diabetes: {
    name: "Diabetes",
    indicators: ["excessive dry skin", "dark patches on neck", "acanthosis nigricans", "facial fat changes"],
    tests: ["Fasting Blood Sugar", "HbA1c", "Lipid Profile", "Oral Glucose Tolerance Test"],
    description: "Blood sugar regulation concerns"
  },
  dehydration: {
    name: "Dehydration / Electrolyte Imbalance",
    indicators: ["dry cracked lips", "stiff skin", "sunken eyes", "dry mouth appearance"],
    tests: ["Electrolyte Panel", "Serum Sodium", "Serum Potassium", "Serum Chloride"],
    description: "Fluid and mineral balance issues"
  },
  skin_issues: {
    name: "Skin Infection / Allergy",
    indicators: ["rashes", "redness", "facial swelling", "irritation", "inflammation"],
    tests: ["C-Reactive Protein (CRP)", "IgE Allergy Panel", "Complete Blood Count", "Skin Patch Test"],
    description: "Inflammatory or allergic skin response"
  }
};

const systemPrompt = `You are an expert medical AI assistant analyzing facial images for health indicators. Your role is to:

1. Carefully examine the face for visible health indicators
2. Identify specific observable features (NOT diagnose diseases)
3. Map indicators to potential conditions that warrant further investigation
4. Recommend appropriate laboratory tests

MEDICAL CONDITIONS DATABASE:
${JSON.stringify(medicalConditions, null, 2)}

ANALYSIS PROTOCOL:
- Look for: skin color/tone, eye appearance, facial swelling, skin texture, lip condition, overall complexion
- Be specific: "pale lips and dark circles" not "looks tired"
- Confidence scoring: 0.1-0.3 (subtle), 0.4-0.6 (moderate), 0.7-0.9 (prominent), 0.9+ (very clear)
- Multiple conditions: Identify all relevant indicators, don't limit to one

OUTPUT FORMAT (JSON only, no markdown):
{
  "detectedIndicators": [
    {
      "indicator": "specific observable feature",
      "confidence": 0.75,
      "location": "area of face"
    }
  ],
  "conditions": [
    {
      "condition": "condition name from database",
      "matchedIndicators": ["list of matching indicators"],
      "confidence": 0.75,
      "reasoning": "brief explanation"
    }
  ],
  "recommendedTests": [
    {
      "test": "test name",
      "priority": "high/medium/low",
      "reason": "why this test"
    }
  ],
  "overallConfidence": 0.75,
  "summary": "I noticed [indicators]. These may suggest [conditions]. Recommended tests: [tests].",
  "disclaimer": "This is NOT a medical diagnosis. Consult a healthcare provider for proper evaluation."
}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations outside JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData } = await req.json();

    if (!imageData) {
      throw new Error("No image data provided");
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log("Analyzing frame with AI vision...");

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash', // Fast multimodal model
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this face image for health indicators. Return detailed analysis in the specified JSON format.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData // base64 image
                }
              }
            ]
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent medical analysis
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const aiContent = aiResponse.choices[0].message.content;
    
    // Parse the JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    console.log("Analysis complete:", {
      indicators: analysis.detectedIndicators?.length || 0,
      conditions: analysis.conditions?.length || 0,
      confidence: analysis.overallConfidence
    });

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-health function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Analysis failed. Please try again.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});