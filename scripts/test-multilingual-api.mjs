async function testMultilingual() {
  const cases = [
    { lang: 'Tamil', msg: 'இன்னைக்கு 250 ரூபாய் sales add பண்ணு' },
    { lang: 'Hindi', msg: 'आज 500 रुपये का बिजली बिल expense add करो' },
    { lang: 'Telugu', msg: 'రమేష్ 1000 రూపాయలు చెల్లించాడు payment record చేయండి' },
    { lang: 'Kannada', msg: 'ಅಕ್ಕಿ 20 kg stock update ಮಾಡಿ' },
    { lang: 'Hinglish', msg: 'Aaj ka sales 5000 add kar do' },
    { lang: 'Malayalam Read', msg: 'ഇന്നത്തെ വിൽപ്പന എത്ര?' }
  ];

  for (const c of cases) {
    console.log('\n======================================================');
    console.log(`Sending [${c.lang}]: "${c.msg}"`);
    const res = await fetch('http://localhost:3000/api/assistant/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: c.msg, language: 'auto' })
    });
    const d = await res.json();
    console.log(`Detected Language: ${d.detectedLanguage?.name} (${d.detectedLanguage?.code}) | Script: ${d.detectedLanguage?.script}`);
    console.log(`Mode: ${d.mode}`);
    console.log(`Answer:\n${d.answer}`);
  }
}
testMultilingual().catch(console.error);
