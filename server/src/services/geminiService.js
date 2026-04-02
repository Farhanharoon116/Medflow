import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize only if API key exists
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// ── Symptom Checker ──────────────────────────────────────────────────
export const checkSymptoms = async ({ symptoms, age, gender, history }) => {
  // Graceful fallback if AI is unavailable
  if (!genAI) {
    return {
      error: true,
      fallback: true,
      message: 'AI service not configured. Please add GEMINI_API_KEY to .env',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a clinical decision support assistant helping a doctor.
Patient: ${age} year old ${gender}.
Medical history: ${history || 'None provided'}.
Current symptoms: ${symptoms}.

Respond ONLY with valid JSON in this exact format, no extra text:
{
  "conditions": ["condition1", "condition2", "condition3"],
  "riskLevel": "low",
  "suggestedTests": ["test1", "test2"],
  "reasoning": "Brief clinical reasoning in 2-3 sentences"
}

riskLevel must be exactly one of: low, medium, high`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini adds them
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    console.error('Gemini symptom check error:', error.message);
    return {
      error: true,
      fallback: true,
      message: 'AI temporarily unavailable. System continues without AI assistance.',
    };
  }
};

// ── Prescription Explanation for Patient ────────────────────────────
export const explainPrescription = async ({ medicines, diagnosis, instructions, language = 'english' }) => {
  if (!genAI) {
    return { error: true, fallback: true, message: 'AI service not configured.' };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const medicineList = medicines
      .map((m) => `${m.name} ${m.dosage} - ${m.frequency} for ${m.duration}`)
      .join(', ');

    const langInstruction =
      language === 'urdu'
        ? 'Respond in simple Urdu (Roman Urdu is fine, easy to understand for Pakistani patients).'
        : 'Respond in simple English that a non-medical person can understand.';

    const prompt = `${langInstruction}

A doctor prescribed the following for a patient diagnosed with: ${diagnosis}.
Medicines: ${medicineList}.
${instructions ? `Additional instructions: ${instructions}` : ''}

Write a friendly, easy-to-understand explanation for the patient covering:
1. What the diagnosis means in simple terms
2. What each medicine does and why it was prescribed
3. Important lifestyle recommendations
4. What symptoms to watch out for that require immediate attention

Keep it warm, simple, and reassuring. No medical jargon.`;

    const result = await model.generateContent(prompt);
    return { success: true, explanation: result.response.text() };
  } catch (error) {
    console.error('Gemini explanation error:', error.message);
    return { error: true, fallback: true, message: 'AI temporarily unavailable.' };
  }
};

// ── Risk Flag Detection ──────────────────────────────────────────────
export const detectRiskPatterns = async ({ recentDiagnoses, patientAge, chronicConditions }) => {
  if (!genAI) return { error: true, fallback: true };

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a clinical risk assessment tool.
Patient age: ${patientAge}.
Chronic conditions: ${chronicConditions?.join(', ') || 'None'}.
Recent diagnoses in last 3 months: ${recentDiagnoses?.join(', ') || 'None'}.

Respond ONLY with valid JSON:
{
  "hasRisk": true,
  "riskLevel": "medium",
  "patterns": ["pattern1", "pattern2"],
  "recommendation": "Brief recommendation for the doctor"
}`;

    const result = await model.generateContent(prompt);
    const clean = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (error) {
    return { error: true, fallback: true };
  }
};