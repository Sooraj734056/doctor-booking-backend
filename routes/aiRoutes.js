const express = require('express');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

const createFallbackGuidance = (symptoms, duration, age, notes) => {
  const text = `${symptoms} ${notes}`.toLowerCase();
  const redFlags = ['chest pain', 'breathing', 'shortness of breath', 'faint', 'severe bleeding', 'stroke', 'unconscious'];
  const moderateFlags = ['fever', 'vomit', 'diarrhea', 'pain', 'headache', 'cough'];

  let urgency = 'Low';
  if (redFlags.some((flag) => text.includes(flag))) {
    urgency = 'High';
  } else if (moderateFlags.some((flag) => text.includes(flag))) {
    urgency = 'Medium';
  }

  return {
    source: 'fallback',
    urgency,
    summary:
      urgency === 'High'
        ? 'Your symptoms may need urgent in-person medical attention.'
        : urgency === 'Medium'
        ? 'Your symptoms look moderate. A doctor consultation is recommended soon.'
        : 'Your symptoms currently look mild. Monitor and follow basic care.',
    possibleCauses: [
      'General viral or bacterial infection',
      'Lifestyle or stress-related trigger',
      'Condition that needs clinical evaluation for confirmation',
    ],
    nextSteps: [
      'Book a doctor consultation for personalized diagnosis.',
      'Track symptom severity, timing, and triggers.',
      'Stay hydrated and rest unless advised otherwise by a doctor.',
    ],
    warningSigns: [
      'Chest pain, severe breathing trouble, confusion, or fainting',
      'Persistent high fever or worsening symptoms',
      'Severe dehydration or uncontrolled vomiting',
    ],
    disclaimer:
      'This is educational guidance only and not a medical diagnosis. For emergencies, contact local emergency services immediately.',
    meta: { age, duration },
  };
};

const parseOutputText = (data) => {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const blocks = data?.output || [];
  for (const block of blocks) {
    const content = block?.content || [];
    for (const item of content) {
      if (item?.type === 'output_text' && item?.text) return item.text;
      if (item?.type === 'text' && item?.text) return item.text;
    }
  }
  return '';
};

router.post('/health-assistant', protect, async (req, res) => {
  const { symptoms = '', duration = '', age = '', notes = '' } = req.body || {};

  if (!symptoms || !String(symptoms).trim()) {
    return res.status(400).json({ message: 'Symptoms are required.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.json(createFallbackGuidance(symptoms, duration, age, notes));
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
    const systemPrompt =
      'You are a careful healthcare triage assistant. Provide educational guidance only, never diagnose with certainty. ' +
      'Always include urgency level (Low/Medium/High), likely possibilities, next steps, warning signs, and a safety disclaimer. ' +
      'Keep response concise, practical, and easy for patients.';

    const userPrompt = `Patient details:
- Age: ${age || 'Not provided'}
- Symptoms: ${symptoms}
- Duration: ${duration || 'Not provided'}
- Extra notes: ${notes || 'None'}

Return strictly in JSON with keys:
urgency, summary, possibleCauses(array), nextSteps(array), warningSigns(array), disclaimer.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.json(createFallbackGuidance(symptoms, duration, age, notes));
    }

    const outputText = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';


    let parsed;
    try {
      parsed = JSON.parse(outputText);
    } catch (jsonErr) {
      parsed = {
        urgency: 'Medium',
        summary: outputText,
        possibleCauses: ['Please consult a doctor for structured diagnosis.'],
        nextSteps: ['Book consultation and share full symptom history.'],
        warningSigns: ['If symptoms rapidly worsen, seek urgent medical care.'],
        disclaimer:
          'This is educational guidance only and not a medical diagnosis. For emergencies, contact local emergency services immediately.',
      };
    }

    return res.json({
      source: 'openai',
      ...parsed,
    });
  } catch (error) {
    console.error('AI assistant route error:', error.message);
    return res.json(createFallbackGuidance(symptoms, duration, age, notes));
  }
});

module.exports = router;
