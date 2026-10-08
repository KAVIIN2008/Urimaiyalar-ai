import { MultiAgentSystem } from './src/utils/multiAgent.ts';

// Mock DB
const mockDb = {
  sales: [{ invoiceNo: 'INV-1', total: 5000 }],
  customers: [{ name: 'Kumar', outstandingBalance: 2000 }],
  products: [{ name: 'Rice', currentStock: 2, minStock: 5 }]
};

// Mock AI Client
const mockAi = {
  models: {
    generateContent: async ({ contents }: any) => {
      const prompt = contents;
      if (prompt.includes('Supervisor Agent')) {
        return { text: 'FINANCE_AGENT' };
      }
      if (prompt.includes('Finance & Ledger Agent')) {
        return { text: 'Based on the records, Kumar owes ₹2000.' };
      }
      return { text: 'GENERAL_AGENT' };
    }
  }
};

async function runTest() {
  const agent = new MultiAgentSystem(mockAi as any, mockDb, 'en');
  console.log('Testing Finance Query...');
  const res = await agent.execute('How much does Kumar owe?');
  console.log('Result:', res);
}

runTest();
