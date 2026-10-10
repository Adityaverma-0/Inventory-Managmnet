import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', 'utf8');

const OLD_SALESMAN = `<p><strong>Salesman:</strong> {invoice.salesmanName || 'N/A'}</p>
          <p><strong>Phone:</strong> {invoice.salesmanPhone || 'N/A'}</p>`;
const NEW_SALESMAN = `<p><strong>Salesman:</strong> {invoice.salesmanName || invoice.salesmanId}</p>
          {invoice.salesmanPhone && <p><strong>Phone:</strong> {invoice.salesmanPhone}</p>}`;

const OLD_TABLE = `<div className="text-right text-sm py-2 border-b border-black">
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

const NEW_TABLE = `<div className="text-right text-sm py-2 border-b border-black">
          {invoice.subtotalPaise ? (
            <>
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
            </>
          ) : (
            <div className="flex justify-between font-bold text-xl">
               <span>Total:</span>
               <span>{formatRupees(invoice.totalAmountPaise)}</span>
            </div>
          )}
        </div>`;

if(code.includes(OLD_SALESMAN)) code = code.replace(OLD_SALESMAN, NEW_SALESMAN);
if(code.includes(OLD_TABLE)) {
    code = code.replace(OLD_TABLE, NEW_TABLE);
    fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("OLD_TABLE not found");
}
