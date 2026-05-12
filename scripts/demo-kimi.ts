/**
 * Kimi API Demo - Generate detailed vehicle content
 * Run: npx tsx scripts/demo-kimi.ts
 */

const KIMI_API_KEY = process.env.KIMI_API_KEY || 'sk-cNBTimwVO72sH92kjA06KWAtIvLo9Dmi6RhAdbqqsHniPW25';
const KIMI_BASE_URL = 'https://api.moonshot.ai/v1';

interface VehicleContent {
  headline: string;
  tagline: string;
  description: string;
  keyFeatures: string[];
  specifications: {
    category: string;
    items: { label: string; value: string }[];
  }[];
  whyBuy: string[];
  ctaText: string;
}

async function generateVehicleContent(vehicleName: string, basicInfo?: string): Promise<VehicleContent> {
  const prompt = `You are a professional automotive copywriter for a Hyundai dealership in Australia.

Generate compelling, detailed marketing content for the ${vehicleName}.

${basicInfo ? `Basic info available: ${basicInfo}` : ''}

Return a JSON object with this exact structure:
{
  "headline": "Attention-grabbing headline (max 10 words)",
  "tagline": "Short memorable tagline (max 8 words)",
  "description": "2-3 paragraph detailed description highlighting the vehicle's appeal, target audience, and key benefits. Write in Australian English.",
  "keyFeatures": ["Feature 1", "Feature 2", ...] // 6-8 standout features
  "specifications": [
    {
      "category": "Performance",
      "items": [{"label": "Engine", "value": "..."}, ...]
    },
    {
      "category": "Dimensions",
      "items": [{"label": "Length", "value": "..."}, ...]
    },
    {
      "category": "Safety",
      "items": [{"label": "ANCAP Rating", "value": "..."}, ...]
    }
  ],
  "whyBuy": ["Reason 1", "Reason 2", ...] // 4-5 compelling reasons to buy
  "ctaText": "Call-to-action button text"
}

Important:
- Use Australian spelling (colour, metre, etc.)
- Reference Australian conditions (long highway drives, city parking, etc.)
- Be factually accurate about Hyundai vehicles
- Make it compelling but not exaggerated`;

  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: 'You are an expert automotive marketing copywriter. Always respond with valid JSON only, no markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kimi API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  // Parse JSON from response
  try {
    // Handle potential markdown code blocks
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse response:', content);
    throw new Error('Failed to parse Kimi response as JSON');
  }
}

// Demo: Generate content for a vehicle
async function runDemo() {
  console.log('🚗 Kimi API Demo - Vehicle Content Generator\n');
  console.log('=' .repeat(50));

  const testVehicles = [
    { name: 'Hyundai IONIQ 5', info: 'All-electric SUV, coming soon to Australia' },
    { name: 'Hyundai INSTER', info: 'Compact electric city car, expected 2025' },
  ];

  for (const vehicle of testVehicles) {
    console.log(`\n📝 Generating content for: ${vehicle.name}\n`);

    try {
      const content = await generateVehicleContent(vehicle.name, vehicle.info);

      console.log('✅ Generated Content:\n');
      console.log(`HEADLINE: ${content.headline}`);
      console.log(`TAGLINE: ${content.tagline}\n`);
      console.log('DESCRIPTION:');
      console.log(content.description);
      console.log('\nKEY FEATURES:');
      content.keyFeatures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
      console.log('\nSPECIFICATIONS:');
      content.specifications.forEach(spec => {
        console.log(`  ${spec.category}:`);
        spec.items.forEach(item => console.log(`    - ${item.label}: ${item.value}`));
      });
      console.log('\nWHY BUY:');
      content.whyBuy.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
      console.log(`\nCTA: "${content.ctaText}"`);
      console.log('\n' + '='.repeat(50));

    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
  }
}

runDemo().catch(console.error);
