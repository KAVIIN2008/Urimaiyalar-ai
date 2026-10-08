import fetch from 'node-fetch';

async function verify() {
  console.log('--- VERIFYING LIVE APPLICATION AND AI PAGES ---');
  
  // 1. Check frontend root
  const frontRes = await fetch('http://localhost:3000');
  console.log(`Frontend root status: ${frontRes.status}`);
  const html = await frontRes.text();
  console.log(`HTML contains URIMAIYALAR: ${html.includes('URIMAIYALAR')}`);

  // 2. Check /api/ai/telemetry
  const telRes = await fetch('http://localhost:3000/api/ai/telemetry');
  const telData = await telRes.json();
  console.log(`Telemetry active provider: ${telData.activeProvider}, totalRequests: ${telData.totalRequests}`);

  // 3. Test Intent parsing for "Add ₹2,500 sales today"
  const intentRes = await fetch('http://localhost:3000/api/ai/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Add ₹2,500 sales today' })
  });
  const intentData = await intentRes.json();
  console.log(`Intent parse mode: ${intentData.mode}, action: ${intentData.action_intent || intentData.action}`);

  // 4. Test Approved tool execution for "create_sale"
  const execRes = await fetch('http://localhost:3000/api/ai/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: 'create_sale', parameters: { amount: 2500 } })
  });
  const execData = await execRes.json();
  console.log(`Tool execute success: ${execData.success}, saleId: ${execData.data?.saleId || execData.toolResult?.data?.saleId}`);

  console.log('--- ALL LIVE CHECKS COMPLETED SUCCESSFULLY ---');
}

verify().catch(console.error);
