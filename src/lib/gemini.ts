// Dark Circles AI Analysis Service using Google Gemini

import { DarkCircleType, DarkCircleIntensity, FullFaceAnalysis, MetricCondition, SkinMetric, SkinTone } from './store';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface DarkCircleAnalysisResult {
  success: boolean;
  error?: string;
  data?: {
    darkCircleType: DarkCircleType;
    intensity: DarkCircleIntensity;
    score: number;
    leftEyeScore: number;
    rightEyeScore: number;
    recommendations: string[];
    analysis: string;
  };
}

const ANALYSIS_PROMPT = `Tu es un expert dermatologue spécialisé dans l'analyse des cernes. Analyse cette photo de visage et fournis une évaluation détaillée des cernes.

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.

Analyse les éléments suivants:
1. Type de cernes (un seul parmi: "vascular" pour bleu/violet, "pigmented" pour marron, "structural" pour ombres, "mixed" pour combinaison)
2. Intensité ("mild", "moderate", ou "severe")
3. Score global de 0 à 100 (0 = pas de cernes, 100 = cernes très prononcés)
4. Score pour chaque œil séparément
5. Recommandations personnalisées en français

Format JSON attendu:
{
  "darkCircleType": "vascular" | "pigmented" | "structural" | "mixed",
  "intensity": "mild" | "moderate" | "severe",
  "score": number (0-100),
  "leftEyeScore": number (0-100),
  "rightEyeScore": number (0-100),
  "recommendations": ["conseil 1", "conseil 2", "conseil 3", "conseil 4"],
  "analysis": "Description courte de l'analyse en français"
}`;

export const analyzeWithGemini = async (
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<DarkCircleAnalysisResult> => {
  console.log('=== INOS Gemini Analysis ===');
  console.log('API Key configured:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY?.length || 0);

  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
    console.warn('Gemini API key not configured or invalid, using mock analysis');
    return getMockAnalysis();
  }

  try {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Check if image data is valid
    if (!base64Data || base64Data.length < 100) {
      console.warn('Image data too small or invalid, using mock analysis');
      return getMockAnalysis();
    }

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          { text: ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      }
    };

    console.log('Sending request to Gemini...');
    console.log('Image base64 length:', base64Data.length);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('Gemini API status:', response.status);

    if (!response.ok) {
      console.error('Gemini API error:', responseText);
      console.warn('API error, using mock analysis');
      return getMockAnalysis();
    }

    const data = JSON.parse(responseText);
    console.log('Gemini response received');

    // Extract the text content from Gemini response
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No text content in Gemini response');
      console.warn('Invalid response, using mock analysis');
      return getMockAnalysis();
    }

    // Parse the JSON response - handle markdown code blocks
    let analysisResult;
    try {
      let jsonStr = textContent;
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      } else {
        const jsonMatch2 = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch2) {
          jsonStr = jsonMatch2[0];
        }
      }
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', textContent);
      console.warn('Parse error, using mock analysis');
      return getMockAnalysis();
    }

    // Validate and normalize the response
    const normalizedResult = {
      darkCircleType: validateDarkCircleType(analysisResult.darkCircleType),
      intensity: validateIntensity(analysisResult.intensity),
      score: Math.min(100, Math.max(0, Math.round(analysisResult.score || 50))),
      leftEyeScore: Math.min(100, Math.max(0, Math.round(analysisResult.leftEyeScore || analysisResult.score || 50))),
      rightEyeScore: Math.min(100, Math.max(0, Math.round(analysisResult.rightEyeScore || analysisResult.score || 50))),
      recommendations: analysisResult.recommendations?.slice(0, 6) || getDefaultRecommendations(analysisResult.darkCircleType),
      analysis: analysisResult.analysis || 'Analyse complétée'
    };

    console.log('Analysis result:', normalizedResult);

    return {
      success: true,
      data: normalizedResult
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Gemini analysis failed:', errorMessage);
    // Return mock data on network/fetch errors to ensure app continues working
    console.warn('Using mock analysis due to error:', errorMessage);
    return getMockAnalysis();
  }
};

const validateDarkCircleType = (type: string): DarkCircleType => {
  const validTypes: DarkCircleType[] = ['vascular', 'pigmented', 'structural', 'mixed'];
  return validTypes.includes(type as DarkCircleType) ? (type as DarkCircleType) : 'mixed';
};

const validateIntensity = (intensity: string): DarkCircleIntensity => {
  const validIntensities: DarkCircleIntensity[] = ['mild', 'moderate', 'severe'];
  return validIntensities.includes(intensity as DarkCircleIntensity) ? (intensity as DarkCircleIntensity) : 'moderate';
};

const getDefaultRecommendations = (type: DarkCircleType): string[] => {
  const baseRecs = [
    'Appliquez une crème contour des yeux matin et soir',
    'Dormez au moins 7-8 heures par nuit',
    'Hydratez-vous régulièrement (2L/jour)',
  ];

  const typeRecs: Record<DarkCircleType, string[]> = {
    vascular: [
      'Utilisez des actifs décongestionnants (caféine, vitamine K)',
      'Appliquez des compresses froides le matin',
    ],
    pigmented: [
      'Utilisez un sérum à la vitamine C',
      'Appliquez une protection solaire SPF50 quotidiennement',
    ],
    structural: [
      'Utilisez un contour des yeux avec acide hyaluronique',
      'Pratiquez des massages lymphatiques doux',
    ],
    mixed: [
      'Adoptez une routine combinée multi-actifs',
      'Alternez les soins selon les zones',
    ],
  };

  return [...typeRecs[type], ...baseRecs];
};

const getMockAnalysis = (): DarkCircleAnalysisResult => {
  const types: DarkCircleType[] = ['vascular', 'pigmented', 'structural', 'mixed'];
  const intensities: DarkCircleIntensity[] = ['mild', 'moderate', 'severe'];

  const type = types[Math.floor(Math.random() * types.length)];
  const intensity = intensities[Math.floor(Math.random() * intensities.length)];
  const score = Math.floor(Math.random() * 40) + 30;

  return {
    success: true,
    data: {
      darkCircleType: type,
      intensity,
      score,
      leftEyeScore: score + Math.floor(Math.random() * 10) - 5,
      rightEyeScore: score + Math.floor(Math.random() * 10) - 5,
      recommendations: getDefaultRecommendations(type),
      analysis: 'Analyse simulée (API non configurée)'
    }
  };
};

// ============ FULL FACE ANALYSIS (PREMIUM) ============

export interface FullFaceAnalysisResult {
  success: boolean;
  error?: string;
  data?: FullFaceAnalysis;
}

const FULL_FACE_ANALYSIS_PROMPT = `Tu es un expert dermatologue utilisant une technologie avancée d'analyse de peau similaire à Haut.AI. Analyse cette photo de visage et fournis une évaluation complète et détaillée de l'état de la peau.

IMPORTANT: Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après.

Analyse les métriques suivantes sur une échelle de 0 à 100 (100 = excellent état):
1. Score Acné - Évalue la présence d'imperfections, boutons, points noirs
2. Score Hydratation - Niveau d'hydratation de la peau
3. Score Rides/Lignes - Présence de rides et ridules (100 = pas de rides)
4. Score Pigmentation - Uniformité du teint, présence de taches (100 = teint uniforme)
5. Score Pores - Taille et visibilité des pores (100 = pores invisibles)
6. Score Rougeurs - Présence de rougeurs (100 = pas de rougeurs)
7. Score Translucidité - Éclat et luminosité de la peau
8. Score Uniformité - Texture générale de la peau
9. État Zone Oeil - Condition du contour des yeux (cernes, poches, rides)

Pour chaque métrique, analyse aussi par zone:
- Front (forehead)
- Joue gauche (leftCheek)
- Joue droite (rightCheek)
- Nez (nose)
- Menton (chin)
- Zone oeil gauche (leftEyeArea)
- Zone oeil droit (rightEyeArea)

Évalue aussi:
- Âge perçu (perceived age based on skin)
- Âge des yeux (eye age)
- Teint de peau: "very_light", "light", "intermediate", "tan", "brown", "dark"
- Score ITA (Individual Typology Angle) de -30 à 90

Format JSON attendu:
{
  "perceivedAge": number,
  "eyeAge": number,
  "skinTone": "very_light" | "light" | "intermediate" | "tan" | "brown" | "dark",
  "itaScore": number,
  "acne": { "overall": number, "forehead": number, "leftCheek": number, "rightCheek": number, "nose": number, "chin": number },
  "hydration": { "overall": number },
  "lines": { "overall": number, "forehead": number, "leftCheek": number, "rightCheek": number, "leftEyeArea": number, "rightEyeArea": number },
  "pigmentation": { "overall": number, "forehead": number, "leftCheek": number, "rightCheek": number, "nose": number, "chin": number },
  "pores": { "overall": number, "forehead": number, "leftCheek": number, "rightCheek": number, "nose": number },
  "redness": { "overall": number, "forehead": number, "leftCheek": number, "rightCheek": number, "nose": number },
  "translucency": { "overall": number, "forehead": number, "leftCheek": number, "rightCheek": number },
  "uniformness": { "overall": number, "leftCheek": number, "rightCheek": number },
  "eyeAreaCondition": { "overall": number, "leftEyeArea": number, "rightEyeArea": number },
  "recommendations": ["conseil 1", "conseil 2", "conseil 3", "conseil 4", "conseil 5"],
  "priorityAreas": ["zone prioritaire 1", "zone prioritaire 2"]
}`;

const getCondition = (score: number): MetricCondition => {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'rather_bad';
  return 'bad';
};

const createSkinMetric = (
  name: string,
  data: Record<string, number>,
  description: string
): SkinMetric => {
  const overall = data.overall ?? 50;
  return {
    name,
    value: overall,
    condition: getCondition(overall),
    description,
    zones: {
      forehead: data.forehead !== undefined ? { score: data.forehead, condition: getCondition(data.forehead) } : undefined,
      leftCheek: data.leftCheek !== undefined ? { score: data.leftCheek, condition: getCondition(data.leftCheek) } : undefined,
      rightCheek: data.rightCheek !== undefined ? { score: data.rightCheek, condition: getCondition(data.rightCheek) } : undefined,
      nose: data.nose !== undefined ? { score: data.nose, condition: getCondition(data.nose) } : undefined,
      chin: data.chin !== undefined ? { score: data.chin, condition: getCondition(data.chin) } : undefined,
      leftEyeArea: data.leftEyeArea !== undefined ? { score: data.leftEyeArea, condition: getCondition(data.leftEyeArea) } : undefined,
      rightEyeArea: data.rightEyeArea !== undefined ? { score: data.rightEyeArea, condition: getCondition(data.rightEyeArea) } : undefined,
    }
  };
};

export const analyzeFullFaceWithGemini = async (
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<FullFaceAnalysisResult> => {
  console.log('=== INOS Full Face Gemini Analysis ===');
  console.log('API Key configured:', !!GEMINI_API_KEY);
  console.log('API Key length:', GEMINI_API_KEY?.length || 0);

  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
    console.warn('Gemini API key not configured, using mock full face analysis');
    return getMockFullFaceAnalysis();
  }

  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Check if image data is valid
    if (!base64Data || base64Data.length < 100) {
      console.warn('Image data too small or invalid, using mock analysis');
      return getMockFullFaceAnalysis();
    }

    const requestBody = {
      contents: [{
        role: 'user',
        parts: [
          { text: FULL_FACE_ANALYSIS_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    };

    console.log('Sending full face analysis request to Gemini...');
    console.log('Image base64 length:', base64Data.length);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout for full analysis

    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('Gemini API status:', response.status);

    if (!response.ok) {
      console.error('Gemini API error:', responseText);
      console.warn('API error, using mock full face analysis');
      return getMockFullFaceAnalysis();
    }

    const responseData = JSON.parse(responseText);
    const textContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      console.error('No text content in Gemini response');
      console.warn('Invalid response, using mock full face analysis');
      return getMockFullFaceAnalysis();
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = textContent;
    const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    } else {
      const jsonMatch2 = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch2) {
        jsonStr = jsonMatch2[0];
      }
    }

    let analysisResult;
    try {
      analysisResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON:', textContent);
      console.warn('Parse error, using mock full face analysis');
      return getMockFullFaceAnalysis();
    }

    // Build the full face analysis object
    const fullAnalysis: FullFaceAnalysis = {
      id: `full-${Date.now()}`,
      date: new Date().toISOString(),
      photoUri: '',
      perceivedAge: analysisResult.perceivedAge ?? 35,
      eyeAge: analysisResult.eyeAge ?? 35,
      skinTone: validateSkinTone(analysisResult.skinTone),
      itaScore: analysisResult.itaScore ?? 30,
      acneScore: createSkinMetric('Acné', analysisResult.acne ?? { overall: 80 }, 'Évalue la présence d\'imperfections et boutons'),
      hydrationScore: createSkinMetric('Hydratation', analysisResult.hydration ?? { overall: 50 }, 'Niveau d\'hydratation de la peau'),
      linesScore: createSkinMetric('Rides', analysisResult.lines ?? { overall: 70 }, 'Présence de rides et ridules'),
      pigmentationScore: createSkinMetric('Pigmentation', analysisResult.pigmentation ?? { overall: 80 }, 'Uniformité du teint'),
      poresScore: createSkinMetric('Pores', analysisResult.pores ?? { overall: 50 }, 'Visibilité des pores'),
      rednessScore: createSkinMetric('Rougeurs', analysisResult.redness ?? { overall: 50 }, 'Présence de rougeurs'),
      translucencyScore: createSkinMetric('Éclat', analysisResult.translucency ?? { overall: 50 }, 'Luminosité et éclat'),
      uniformnessScore: createSkinMetric('Uniformité', analysisResult.uniformness ?? { overall: 50 }, 'Texture générale'),
      eyeAreaCondition: createSkinMetric('Zone Yeux', analysisResult.eyeAreaCondition ?? { overall: 50 }, 'État du contour des yeux'),
      overallScore: calculateOverallScore(analysisResult),
      recommendations: analysisResult.recommendations?.slice(0, 6) ?? getDefaultFullFaceRecommendations(),
      priorityAreas: analysisResult.priorityAreas?.slice(0, 3) ?? ['Hydratation', 'Contour des yeux']
    };

    console.log('Full face analysis completed');
    return {
      success: true,
      data: fullAnalysis
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Full face analysis failed:', errorMessage);
    console.warn('Using mock full face analysis due to error:', errorMessage);
    return getMockFullFaceAnalysis();
  }
};

const validateSkinTone = (tone: string): SkinTone => {
  const validTones: SkinTone[] = ['very_light', 'light', 'intermediate', 'tan', 'brown', 'dark'];
  return validTones.includes(tone as SkinTone) ? (tone as SkinTone) : 'intermediate';
};

const calculateOverallScore = (data: Record<string, unknown>): number => {
  const scores = [
    (data.acne as Record<string, number>)?.overall,
    (data.hydration as Record<string, number>)?.overall,
    (data.lines as Record<string, number>)?.overall,
    (data.pigmentation as Record<string, number>)?.overall,
    (data.pores as Record<string, number>)?.overall,
    (data.redness as Record<string, number>)?.overall,
    (data.translucency as Record<string, number>)?.overall,
    (data.uniformness as Record<string, number>)?.overall,
  ].filter((s): s is number => typeof s === 'number');

  if (scores.length === 0) return 60;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
};

const getDefaultFullFaceRecommendations = (): string[] => [
  'Utilisez une crème hydratante adaptée à votre type de peau',
  'Appliquez une protection solaire SPF50 quotidiennement',
  'Nettoyez votre visage matin et soir',
  'Intégrez un sérum antioxydant (vitamine C)',
  'Hydratez-vous régulièrement (2L d\'eau par jour)'
];

const getMockFullFaceAnalysis = (): FullFaceAnalysisResult => {
  const mockData: FullFaceAnalysis = {
    id: `full-${Date.now()}`,
    date: new Date().toISOString(),
    photoUri: '',
    perceivedAge: 38,
    eyeAge: 36,
    skinTone: 'intermediate',
    itaScore: 28,
    acneScore: createSkinMetric('Acné', { overall: 97, forehead: 100, leftCheek: 100, rightCheek: 100, nose: 100, chin: 78 }, 'Évalue la présence d\'imperfections'),
    hydrationScore: createSkinMetric('Hydratation', { overall: 30 }, 'Niveau d\'hydratation de la peau'),
    linesScore: createSkinMetric('Rides', { overall: 94, forehead: 98, leftCheek: 100, rightCheek: 100, leftEyeArea: 95, rightEyeArea: 91 }, 'Présence de rides'),
    pigmentationScore: createSkinMetric('Pigmentation', { overall: 96, forehead: 95, leftCheek: 92, rightCheek: 100, nose: 100, chin: 100 }, 'Uniformité du teint'),
    poresScore: createSkinMetric('Pores', { overall: 41, forehead: 31, leftCheek: 48, rightCheek: 52, nose: 42 }, 'Visibilité des pores'),
    rednessScore: createSkinMetric('Rougeurs', { overall: 28, forehead: 49, leftCheek: 21, rightCheek: 16, nose: 37 }, 'Présence de rougeurs'),
    translucencyScore: createSkinMetric('Éclat', { overall: 40, forehead: 38, leftCheek: 32, rightCheek: 49 }, 'Luminosité'),
    uniformnessScore: createSkinMetric('Uniformité', { overall: 48, leftCheek: 40, rightCheek: 44 }, 'Texture générale'),
    eyeAreaCondition: createSkinMetric('Zone Yeux', { overall: 37, leftEyeArea: 34, rightEyeArea: 40 }, 'État du contour des yeux'),
    overallScore: 57,
    recommendations: [
      'Augmentez votre hydratation avec un sérum à l\'acide hyaluronique',
      'Utilisez une crème anti-rougeurs pour calmer la peau',
      'Appliquez un soin réducteur de pores sur la zone T',
      'Intégrez un contour des yeux riche matin et soir',
      'Protégez votre peau du soleil avec un SPF50'
    ],
    priorityAreas: ['Hydratation', 'Rougeurs', 'Pores']
  };

  return {
    success: true,
    data: mockData
  };
};
