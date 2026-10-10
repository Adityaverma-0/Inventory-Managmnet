import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', 'utf8');

const OLD_SALESMAN = "<p><strong>Salesman:</strong> {invoice.salesmanId}</p>";
const NEW_SALESMAN = `<p><strong>Salesman:</strong> {invoice.salesmanName || 'N/A'}</p>
          <p><strong>Phone:</strong> {invoice.salesmanPhone || 'N/A'}</p>`;

const OLD_TABLE = "Total: {formatRupees(invoice.totalAmountPaise)}";
// Wait, I need to use the subtotal and taxes.
// Need to find where InvoicePrint uses invoice.
// Actually, I can just use invoice.cgstPercent etc.
// But the OLD_TABLE calculation was simple.
// I will just add the tax rows before total.

const OLD_TOTAL_SECTION = `<div className="text-right text-base font-bold pb-2 border-b border-black">
          Total: {formatRupees(invoice.totalAmountPaise)}
        </div>`;

const NEW_TOTAL_SECTION = `<div className="text-right text-sm py-2 border-b border-black">
          <div className="flex justify-between"><span>Subtotal:</span> <span>{formatRupees(invoice.subtotalPaise || 0)}</span></div>
          <div className="flex justify-between"><span>CGST ({invoice.cgstPercent}%):</span> <span>{formatRupees(invoice.cgstAmountPaise || 0)}</span></div>
          <div className="flex justify-between"><span>SGST ({invoice.sgstPercent}%):</span> <span>{formatRupees(invoice.sgstAmountPaise || 0)}</span></div>
        </div>
        <div className="text-right text-base font-bold py-2 border-b border-black">
          Grand Total: {formatRupees(invoice.totalAmountPaise)}
        </div>`;

code = code.replace(OLD_SALESMAN, NEW_SALESMAN);
code = code.replace(OLD_TOTAL_SECTION, NEW_TOTAL_SECTION);

fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', code);
