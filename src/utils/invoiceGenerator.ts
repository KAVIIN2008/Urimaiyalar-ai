// Bill/Invoice PDF Generator using browser-native print
// No external library needed — generates professional invoices

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  customerName: string;
  customerPhone?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentType: string;
  amountPaid: number;
  balanceDue: number;
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const itemRows = data.items.map((item, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:600;color:#0f172a;">${item.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;text-align:center;">${item.quantity} ${item.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;text-align:right;">₹${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#0f172a;text-align:right;">₹${item.total.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${data.invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #fff; color: #0f172a; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div style="max-width:700px;margin:0 auto;padding:40px 32px;">
    
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #10b981;">
      <div>
        <h1 style="font-size:24px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">${data.businessName}</h1>
        <p style="font-size:12px;color:#64748b;margin-top:4px;">${data.businessAddress}</p>
        <p style="font-size:12px;color:#64748b;">Ph: ${data.businessPhone}</p>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28px;font-weight:900;color:#10b981;letter-spacing:-1px;">INVOICE</div>
        <p style="font-size:12px;color:#64748b;margin-top:4px;font-weight:600;">${data.invoiceNo}</p>
        <p style="font-size:12px;color:#64748b;">Date: ${data.date}</p>
      </div>
    </div>

    <!-- Customer Info -->
    <div style="background:#f8fafc;border-radius:12px;padding:16px 20px;margin-bottom:24px;border:1px solid #e2e8f0;">
      <div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Bill To</div>
      <div style="font-size:15px;font-weight:700;color:#0f172a;">${data.customerName}</div>
      ${data.customerPhone ? `<div style="font-size:12px;color:#64748b;">Ph: ${data.customerPhone}</div>` : ''}
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#0f172a;">
          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Rate</th>
          <th style="padding:10px 12px;text-align:right;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;">
      <div style="width:260px;">
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b;">
          <span>Subtotal</span><span>₹${data.subtotal.toFixed(2)}</span>
        </div>
        ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#10b981;">
          <span>Discount</span><span>-₹${data.discount.toFixed(2)}</span>
        </div>` : ''}
        ${data.tax > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#64748b;">
          <span>Tax</span><span>₹${data.tax.toFixed(2)}</span>
        </div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:900;color:#0f172a;border-top:2px solid #0f172a;margin-top:8px;">
          <span>Total</span><span>₹${data.total.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#64748b;">
          <span>Paid</span><span style="color:#10b981;font-weight:700;">₹${data.amountPaid.toFixed(2)}</span>
        </div>
        ${data.balanceDue > 0 ? `<div style="display:flex;justify-content:space-between;padding:8px 12px;font-size:13px;font-weight:700;background:#fef2f2;border-radius:8px;color:#dc2626;margin-top:4px;">
          <span>Balance Due</span><span>₹${data.balanceDue.toFixed(2)}</span>
        </div>` : `<div style="display:flex;justify-content:space-between;padding:8px 12px;font-size:13px;font-weight:700;background:#f0fdf4;border-radius:8px;color:#16a34a;margin-top:4px;">
          <span>Status</span><span>✅ PAID IN FULL</span>
        </div>`}
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;">Thank you for your business! • Powered by Urimaiyalar OS</p>
      <p style="font-size:10px;color:#cbd5e1;margin-top:4px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
    </div>

    <!-- Print Button (hidden on print) -->
    <div class="no-print" style="text-align:center;margin-top:32px;">
      <button onclick="window.print()" style="background:#10b981;color:white;border:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;">
        🖨️ Print / Save as PDF
      </button>
      <button onclick="window.close()" style="background:#f1f5f9;color:#475569;border:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;margin-left:12px;">
        Close
      </button>
    </div>
  </div>
</body>
</html>`;
}

export function openInvoicePrintWindow(data: InvoiceData): void {
  const html = generateInvoiceHTML(data);
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

// WhatsApp share invoice summary
export function shareInvoiceViaWhatsApp(data: InvoiceData): void {
  const lines = [
    `🧾 *${data.businessName}*`,
    `Invoice: ${data.invoiceNo}`,
    `Date: ${data.date}`,
    ``,
    `Customer: ${data.customerName}`,
    ``,
    `--- Items ---`,
    ...data.items.map((item, i) => `${i + 1}. ${item.productName} × ${item.quantity} ${item.unit} = ₹${item.total}`),
    ``,
    `*Subtotal:* ₹${data.subtotal}`,
    data.discount > 0 ? `*Discount:* -₹${data.discount}` : '',
    `*Total:* ₹${data.total}`,
    `*Paid:* ₹${data.amountPaid}`,
    data.balanceDue > 0 ? `*Balance Due:* ₹${data.balanceDue}` : `✅ *Fully Paid*`,
    ``,
    `_Powered by Urimaiyalar OS_`,
  ].filter(Boolean).join('\n');

  const encoded = encodeURIComponent(lines);
  const url = data.customerPhone
    ? `https://wa.me/91${data.customerPhone.replace(/\D/g, '')}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
