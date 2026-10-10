import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js', 'utf8');

const OLD_QUERY = "const rawInvoices = (await c.query('SELECT * FROM invoices WHERE salesman_id=$1 ORDER BY created_at',[user.id])).rows;";
const NEW_QUERY = "const rawInvoices = (await c.query('SELECT i.*, s.name as salesman_name, s.phone as salesman_phone FROM invoices i JOIN salesmen s ON i.salesman_id = s.id WHERE i.salesman_id=$1 ORDER BY i.created_at',[user.id])).rows;";

const OLD_MAP = "workDayId:i.work_day_id,salesmanId:i.salesman_id";
const NEW_MAP = "workDayId:i.work_day_id,salesmanId:i.salesman_id,salesmanName:i.salesman_name,salesmanPhone:i.salesman_phone";

if (code.includes(OLD_QUERY)) {
    code = code.replace(OLD_QUERY, NEW_QUERY);
    code = code.replace(OLD_MAP, NEW_MAP);
    fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js', code);
    console.log("Successfully patched snapshot salesman info");
} else {
    console.log("Could not find OLD_QUERY");
}
