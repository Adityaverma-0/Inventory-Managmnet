import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', 'utf8');

const OLD = `<p><strong>Salesman:</strong> {invoice.salesmanName || 'N/A'}</p>
          <p><strong>Phone:</strong> {invoice.salesmanPhone || 'N/A'}</p>`;
const NEW = `<p><strong>Salesman:</strong> {invoice.salesmanName || invoice.salesmanId}</p>
          {invoice.salesmanPhone && <p><strong>Phone:</strong> {invoice.salesmanPhone}</p>}`;

const OLD2 = `<div className="flex justify-between"><span>Subtotal:</span> <span>{formatRupees(invoice.subtotalPaise || 0)}</span></div>
          <div className="flex justify-between"><span>CGST ({invoice.cgstPercent}%):</span> <span>{formatRupees(invoice.cgstAmountPaise || 0)}</span></div>
          <div className="flex justify-between"><span>SGST ({invoice.sgstPercent}%):</span> <span>{formatRupees(invoice.sgstAmountPaise || 0)}</span></div>`;
const NEW2 = `{invoice.subtotalPaise ? (
            <>
              <div className="flex justify-between"><span>Subtotal:</span> <span>{formatRupees(invoice.subtotalPaise)}</span></div>
              <div className="flex justify-between"><span>CGST ({invoice.cgstPercent}%):</span> <span>{formatRupees(invoice.cgstAmountPaise || 0)}</span></div>
              <div className="flex justify-between"><span>SGST ({invoice.sgstPercent}%):</span> <span>{formatRupees(invoice.sgstAmountPaise || 0)}</span></div>
            </>
          ) : (
            <div className="flex justify-between font-bold">
               <span>Total:</span>
               <span>{formatRupees(invoice.totalAmountPaise)}</span>
            </div>
          )}`;

// We have to be careful with replace patterns.
if(code.includes(OLD)) code = code.replace(OLD, NEW);
// Replacing the tax breakdown block
code = code.replace(/<div className="flex justify-between mb-1">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/, NEW2);

fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', code);
