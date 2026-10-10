import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/direct-sell/SaleEntry.tsx', 'utf8');

const OLD_IMPORT = `import { getLedger, saveSaleGenerateInvoice, fetchActiveWorkDay, getCustomers } from '../../data/mockApi';`;
const NEW_IMPORT = `import { getLedger, saveSaleGenerateInvoice, fetchActiveWorkDay, getCustomers } from '../../data/mockApi';
import { apiGet } from '../../data/apiClient';`;

const OLD_STATE = `  const [customer, setCustomer] = useState<Customer | undefined>();`;
const NEW_STATE = `  const [customer, setCustomer] = useState<Customer | undefined>();
  const [taxSettings, setTaxSettings] = useState({cgst: 0, sgst: 0});`;

const OLD_EFFECT = `    fetchActiveWorkDay().then(setSummary);`;
const NEW_EFFECT = `    fetchActiveWorkDay().then(setSummary);
    apiGet('/admin/settings/tax').then(t => setTaxSettings(t || {cgst:0, sgst:0})).catch(() => {});`;

const OLD_CALC = `  const cartTotalPaise = useMemo(() => {
    let total = 0;
    for (const [productId, display] of Object.entries(cart)) {
      const p = productMap.get(productId);
      if (p) total += displayToPieces(display, p) * p.pricePaise;
    }
    return total;
  }, [cart]);`;
const NEW_CALC = `  const cartSubtotalPaise = useMemo(() => {
    let total = 0;
    for (const [productId, display] of Object.entries(cart)) {
      const p = productMap.get(productId);
      if (p) total += displayToPieces(display, p) * p.pricePaise;
    }
    return total;
  }, [cart]);
  
  const cgstAmountPaise = Math.round(cartSubtotalPaise * taxSettings.cgst / 100);
  const sgstAmountPaise = Math.round(cartSubtotalPaise * taxSettings.sgst / 100);
  const cartTotalPaise = cartSubtotalPaise + cgstAmountPaise + sgstAmountPaise;`;

const OLD_RENDER = `<div className="mt-8 bg-gray-50 dark:bg-gray-700/50 p-4 shrink-0 border-t dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg dark:text-white">Total:</span>
            <span className="font-bold text-2xl dark:text-blue-400">{formatRupees(cartTotalPaise)}</span>
          </div>`;
const NEW_RENDER = `<div className="mt-8 bg-gray-50 dark:bg-gray-700/50 p-4 shrink-0 border-t dark:border-gray-700">
          {(taxSettings.cgst > 0 || taxSettings.sgst > 0) && (
            <div className="flex flex-col space-y-1 mb-2 text-gray-600 dark:text-gray-300 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupees(cartSubtotalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST ({taxSettings.cgst}%):</span>
                <span>{formatRupees(cgstAmountPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST ({taxSettings.sgst}%):</span>
                <span>{formatRupees(sgstAmountPaise)}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg dark:text-white">Grand Total:</span>
            <span className="font-bold text-2xl dark:text-blue-400">{formatRupees(cartTotalPaise)}</span>
          </div>`;

if(code.includes(OLD_IMPORT)) code = code.replace(OLD_IMPORT, NEW_IMPORT);
if(code.includes(OLD_STATE)) code = code.replace(OLD_STATE, NEW_STATE);
if(code.includes(OLD_EFFECT)) code = code.replace(OLD_EFFECT, NEW_EFFECT);
if(code.includes(OLD_CALC)) code = code.replace(OLD_CALC, NEW_CALC);
if(code.includes(OLD_RENDER)) code = code.replace(OLD_RENDER, NEW_RENDER);

fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /salesman-dashboard/src/features/direct-sell/SaleEntry.tsx', code);
