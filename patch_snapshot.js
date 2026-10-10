import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js', 'utf8');

const OLD_MAP = "newBalancePaise:number(i.new_balance_paise),status:i.status,items:items.filter";
const NEW_MAP = "newBalancePaise:number(i.new_balance_paise),status:i.status,cgstPercent:number(i.cgst_percent),sgstPercent:number(i.sgst_percent),cgstAmountPaise:number(i.cgst_amount_paise),sgstAmountPaise:number(i.sgst_amount_paise),subtotalPaise:number(i.subtotal_paise),items:items.filter";

if (code.includes(OLD_MAP)) {
    code = code.replace(OLD_MAP, NEW_MAP);
    fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js', code);
    console.log("Successfully patched snapshot");
} else {
    console.log("Could not find OLD_MAP");
}
