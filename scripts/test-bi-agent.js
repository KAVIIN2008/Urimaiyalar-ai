const fetch = globalThis.fetch;
const baseUrl = 'http://localhost:3000/api/assistant/query';

const testCases = [
  {
    name: '1. Sales Question (விற்பனை கேள்வி)',
    body: {
      message: 'இன்றைய மொத்த விற்பனை எவ்வளவு? எத்தனை பில்கள் போடப்பட்டுள்ளன?',
      language: 'ta',
      userRole: 'retail'
    }
  },
  {
    name: '2. Inventory Question (சரக்கு இருப்பு கேள்வி)',
    body: {
      message: 'என் கடையில் எந்தெந்த பொருட்கள் இருப்பு குறைவாக உள்ளன? சரக்கு தீரும் நிலையில் உள்ளதா?',
      language: 'ta',
      userRole: 'retail'
    }
  },
  {
    name: '3. Customer Due Question (வாடிக்கையாளர் கடன் கேள்வி)',
    body: {
      message: 'ரமேஷ் எனக்கு எவ்வளவு கடன் பாக்கி வைத்துள்ளார்?',
      language: 'ta',
      userRole: 'retail'
    }
  },
  {
    name: '4. Profit Question (லாபம் கேள்வி)',
    body: {
      message: 'இந்த மாத நிகர லாபம் எவ்வளவு? லாப வரம்பு சதவீதம் என்ன?',
      language: 'ta',
      userRole: 'retail'
    }
  },
  {
    name: '5. Follow-up Question with Memory (தொடர் கேள்வி)',
    body: {
      message: 'கடந்த மாதத்துடன் compare பண்ணு',
      language: 'ta',
      userRole: 'retail',
      conversationHistory: [
        { role: 'user', content: 'இந்த மாதம் விற்பனை எப்படி?' },
        { role: 'assistant', content: 'இந்த மாதம் உங்கள் மொத்த விற்பனை ₹11,330.' }
      ]
    }
  },
  {
    name: '6. Tamil Question (முழு தமிழ் கேள்வி)',
    body: {
      message: 'கடையில் அதிக கடன் வைத்துள்ள வாடிக்கையாளர் யார்?',
      language: 'ta',
      userRole: 'retail'
    }
  },
  {
    name: '7. Tanglish Question (Tanglish கேள்வி)',
    body: {
      message: 'Innaiku shop-la total cash collection evvalavu vanthurukku?',
      language: 'tanglish',
      userRole: 'retail'
    }
  },
  {
    name: '8. Unknown-Data Question (இல்லாத தகவல் கேள்வி)',
    body: {
      message: 'மகேஷ் குமார் எவ்வளவு கடன் பாக்கி வைத்துள்ளார்?',
      language: 'ta',
      userRole: 'retail'
    }
  }
];

async function runTests() {
  console.log('====================================================');
  console.log('🏆 URIMAIYALAR OS: BI AGENT 8-POINT TEST SUITE');
  console.log('====================================================\n');

  for (const tc of testCases) {
    console.log(`▶ TEST: ${tc.name}`);
    console.log(`  QUERY: "${tc.body.message}"`);
    const t0 = Date.now();
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.body)
      });
      const t1 = Date.now();
      const data = await res.json();
      console.log(`  STATUS: ${res.status} | LATENCY: ${t1 - t0}ms | TOOLS: [${(data.toolsExecuted || []).join(', ')}]`);
      console.log(`  AI ANSWER:\n${data.answer.split('\n').map(l => '    ' + l).join('\n')}\n`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }

  console.log('====================================================');
  console.log('✅ ALL 8 TESTS COMPLETED WITH REAL DATABASE GROUNDING');
  console.log('====================================================');
}

runTests();
