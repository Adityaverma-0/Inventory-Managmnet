import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', 'utf8');

const OLD_TABLE = `<div className="mt-8 border-t pt-4">
          <div className="flex justify-between font-bold text-xl">
            <span>Total:</span>
            <span>{formatRupees(invoice.totalAmountPaise)}</span>
          </div>
        </div>`;
const NEW_TABLE = `<div className="mt-8 border-t pt-4 text-sm">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>{formatRupees(invoice.subtotalPaise)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>CGST ({invoice.cgstPercent}%):</span>
            <span>{formatRupees(invoice.cgstAmountPaise)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>SGST ({invoice.sgstPercent}%):</span>
            <span>{formatRupees(invoice.sgstAmountPaise)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl mt-4">
            <span>Grand Total:</span>
            <span>{formatRupees(invoice.totalAmountPaise)}</span>
          </div>
        </div>`;

code = code.replace(OLD_TABLE, NEW_TABLE);
fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', code);
