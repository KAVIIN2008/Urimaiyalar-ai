import { Router } from 'express';
import { prisma } from '../lib/db';
import { generateAiCompletion } from '../lib/aiClient';

const router = Router();

// Webhook for incoming WhatsApp Messages (Twilio / Meta format)
router.post('/webhook', async (req, res) => {
  try {
    const incomingMessage = req.body.Body || req.body.message || '';
    const senderPhone = req.body.From || req.body.sender || 'Unknown';
    const shopId = '6d7904e5-69ac-469a-95a7-7ad5e9d4c73a';

    console.log(`[WhatsApp Bot] Received message from ${senderPhone}: ${incomingMessage}`);

    if (!incomingMessage) {
      return res.status(400).json({ error: 'Message body is missing.' });
    }

    // Step 1: Prompt AI to act as a WhatsApp Retail Bot
    const prompt = `You are URIMAIYALAR AI, an intelligent WhatsApp assistant for Indian retail store owners.
    The shop owner sent you this message via WhatsApp: "${incomingMessage}"
    
    Determine the intent and extract relevant data. 
    Respond with a strictly formatted JSON object containing:
    {
      "intent": "REPORT" | "ADD_SALE" | "ADD_EXPENSE" | "GENERAL_QUERY",
      "extractedData": {
        "amount": null or number,
        "productName": null or string,
        "quantity": null or number
      }
    }`;

    const aiRes = await generateAiCompletion({
      prompt,
      systemPrompt: 'You are an intelligent retail WhatsApp parser. Return only valid JSON.',
      temperature: 0.1,
      maxTokens: 150,
      jsonMode: true,
    });

    let raw = aiRes.text || '';
    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { intent: 'GENERAL_QUERY', extractedData: {} };
    }

    let replyMessage = '';

    // Step 2: Execute Database Actions based on AI Intent
    if (parsed.intent === 'REPORT') {
      const summaryInfo = await prisma.sale.aggregate({
        where: { shopId },
        _sum: { total: true }
      });
      const lowStockCount = await prisma.product.count({
        where: { shopId, currentStock: { lte: 5 } } // Assume 5 is low stock threshold
      });

      replyMessage = `📊 *URIMAIYALAR Daily Report*\n\n💰 Total Sales: ₹${summaryInfo._sum.total || 0}\n⚠️ Low Stock Items: ${lowStockCount}\n\nType "stock" to see which items are low.`;
    } 
    else if (parsed.intent === 'ADD_SALE') {
      const amt = parsed.extractedData.amount || 0;
      const product = parsed.extractedData.productName || 'General Item';
      
      await prisma.sale.create({
        data: {
          shopId,
          invoiceNo: `WA-INV-${Date.now().toString().slice(-4)}`,
          customerName: 'WhatsApp Quick Sale',
          total: amt,
          subtotal: amt,
          paymentType: 'cash',
          amountPaid: amt,
          balanceDue: 0,
        }
      });
      replyMessage = `✅ *Sale Recorded Successfully*\nItem: ${product}\nAmount: ₹${amt}\n\nInvoice has been generated in your dashboard.`;
    } 
    else if (parsed.intent === 'ADD_EXPENSE') {
      const amt = parsed.extractedData.amount || 0;
      
      await prisma.expense.create({
        data: {
          shopId,
          title: 'WhatsApp Quick Expense',
          category: 'miscellaneous',
          amount: amt,
        }
      });
      replyMessage = `✅ *Expense Recorded*\nAmount: ₹${amt}\n\nThis has been deducted from your daily profit calculation.`;
    }
    else {
      // General NLP reply
      const chatPrompt = `You are the URIMAIYALAR AI WhatsApp bot. Reply briefly and kindly to the owner's message: "${incomingMessage}". Keep it under 2 sentences. Use emojis.`;
      const chatRes = await generateAiCompletion({
        prompt: chatPrompt,
        maxTokens: 100,
        temperature: 0.7,
      });
      replyMessage = chatRes.text || 'வணக்கம்! How can I help you manage your store today?';
    }

    console.log(`[WhatsApp Bot] Replying: ${replyMessage}`);

    // Step 3: Return Response
    // If Twilio: return TwiML XML format
    // If Meta / Standard API: return JSON
    res.json({
      success: true,
      reply: replyMessage
    });

  } catch (error) {
    console.error('[WhatsApp Bot] Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process WhatsApp webhook' });
  }
});

export default router;
