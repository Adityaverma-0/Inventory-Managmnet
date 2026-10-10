import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', 'utf8');

const OLD_TABLE = `<div className="text-right text-sm py-2 border-b border-black">
          <div className="flex justify-between"><span>Subtotal:</span> <span>{formatRupees(invoice.subtotalPaise || 0)}</span></div>
          <div className="flex justify-between"><span>CGST ({invoice.cgstPercent}%):</span> <span>{formatRupees(invoice.cgstAmountPaise || 0)}</span></div>
          <div className="flex justify-between"><span>SGST ({invoice.sgstPercent}%):</span> <span>{formatRupees(invoice.sgstAmountPaise || 0)}</span></div>
        </div>
        <div className="text-right text-base font-bold py-2 border-b border-black">
          Grand Total: {formatRupees(invoice.totalAmountPaise)}
        </div>`;

const NEW_TABLE = `        {invoice.subtotalPaise ? (
          <>
            <div className="text-right text-sm py-2 border-b border-black">
              <div className="flex justify-between"><span>Subtotal:</span> <span>{formatRupees(invoice.subtotalPaise)}</span></div>
              <div className="flex justify-between"><span>CGST ({invoice.cgstPercent}%):</span> <span>{formatRupees(invoice.cgstAmountPaise)}</span></div>
              <div className="flex justify-between"><span>SGST ({invoice.sgstPercent}%):</span> <span>{formatRupees(invoice.sgstAmountPaise)}</span></div>
            </div>
            <div className="text-right text-base font-bold py-2 border-b border-black flex justify-between">
              <span>Grand Total:</span>
              <span>{formatRupees(invoice.totalAmountPaise)}</span>
            </div>
          </>
        ) : (
          <div className="text-right text-base font-bold py-2 border-b border-black flex justify-between">
             <span>Total:</span>
             <span>{formatRupees(invoice.totalAmountPaise)}</span>
          </div>
        )}`;

if(code.includes(OLD_TABLE)) {
    code = code.replace(OLD_TABLE, NEW_TABLE);
    
    // Also patch salesman
    const OLD_SALESMAN = `<p><strong>Salesman:</strong> {invoice.salesmanName || 'N/A'}</p>
          <p><strong>Phone:</strong> {invoice.salesmanPhone || 'N/A'}</p>`;
    const NEW_SALESMAN = `<p><strong>Salesman:</strong> {invoice.salesmanName || invoice.salesmanId}</p>
          {invoice.salesmanPhone && <p><strong>Phone:</strong> {invoice.salesmanPhone}</p>}`;
    code = code.replace(OLD_SALESMAN, NEW_SALESMAN);
    
    fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/InvoicePrint.tsx', code);
    console.log("Patched successfully");
} else {
    console.log("OLD_TABLE not found");
}
