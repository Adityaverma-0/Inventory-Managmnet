import fs from 'fs';
let code = fs.readFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js', 'utf8');

const OLD_BLOCK = `    if(total!==b.totalAmountPaise)throw new ApiError('Product prices changed. Refresh and review the sale.',409);
    if(b.paymentMode==='UPI')text(b.paymentRef,'UPI reference');
    let customer=null;if(b.customerId && b.customerId!=='walk-in'){customer=(await c.query('SELECT * FROM customers WHERE id=$1 FOR UPDATE',[b.customerId])).rows[0];if(!customer)throw new ApiError('Customer not found.');}
    if(b.paymentMode==='CREDIT' && !customer)throw new ApiError('A customer is required for credit sales.');
    const before=number(customer?.outstanding_balance_paise),after=before+(b.paymentMode==='CREDIT'?total:0);
    if(b.paymentMode==='CREDIT' && customer.credit_limit_paise!==null && after>number(customer.credit_limit_paise))throw new ApiError('Customer credit limit exceeded.',409);
    const id=uid(),timestamp=Date.now(),counter=d.invoice_counter+1,invoiceNumber=\`\${d.vehicle_id}-\${dateString(d.calendar_date).replaceAll('-','')}-\${id.slice(0,8)}\`;
    await c.query('INSERT INTO invoices(id,invoice_number,created_at,calendar_date,work_day_id,salesman_id,vehicle_id,outlet_id,customer_id,customer_name,total_amount_paise,payment_mode,payment_ref,previous_balance_paise,new_balance_paise) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)',[id,invoiceNumber,timestamp,d.calendar_date,d.work_day_id,d.salesman_id,d.vehicle_id,customer?.id||null,customer?.id||null,customer?.name||'Walk-in',total,b.paymentMode,b.paymentRef||null,before,after]);
    for(const i of items){await c.query('INSERT INTO sale_items(invoice_id,product_id,quantity_pieces,line_total_paise,product_snapshot) VALUES($1,$2,$3,$4,$5)',[id,i.productId,i.quantityPieces,i.lineTotalPaise,productDto(i.product)]);await ledger(c,'SALE',i.productId,i.quantityPieces,d.vehicle_id,id,d.work_day_id);}
    await c.query('INSERT INTO accounting_ledger(id,timestamp,type,amount_paise,customer_id,invoice_id,work_day_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid(),timestamp,'SALES_'+b.paymentMode,total,customer?.id||null,id,d.work_day_id]);
    if(b.paymentMode==='CREDIT')await c.query("INSERT INTO accounting_ledger(id,timestamp,type,amount_paise,customer_id,invoice_id,work_day_id) VALUES($1,$2,'CUSTOMER_RECEIVABLE',$3,$4,$5,$6)",[uid(),timestamp,total,customer.id,id,d.work_day_id]);`;

const NEW_BLOCK = `    const taxRes = await c.query("SELECT data FROM app_settings WHERE id='tax'");
    const taxData = taxRes.rows[0]?.data || {cgst:0, sgst:0};
    const cgst_percent = Number(taxData.cgst) || 0;
    const sgst_percent = Number(taxData.sgst) || 0;
    const cgst_amount_paise = Math.round(total * cgst_percent / 100);
    const sgst_amount_paise = Math.round(total * sgst_percent / 100);
    const grand_total = total + cgst_amount_paise + sgst_amount_paise;

    if(grand_total!==b.totalAmountPaise)throw new ApiError('Product prices or tax rates changed. Refresh and review the sale.',409);
    if(b.paymentMode==='UPI')text(b.paymentRef,'UPI reference');
    let customer=null;if(b.customerId && b.customerId!=='walk-in'){customer=(await c.query('SELECT * FROM customers WHERE id=$1 FOR UPDATE',[b.customerId])).rows[0];if(!customer)throw new ApiError('Customer not found.');}
    if(b.paymentMode==='CREDIT' && !customer)throw new ApiError('A customer is required for credit sales.');
    const before=number(customer?.outstanding_balance_paise),after=before+(b.paymentMode==='CREDIT'?grand_total:0);
    if(b.paymentMode==='CREDIT' && customer.credit_limit_paise!==null && after>number(customer.credit_limit_paise))throw new ApiError('Customer credit limit exceeded.',409);
    const id=uid(),timestamp=Date.now(),counter=d.invoice_counter+1,invoiceNumber=\`\${d.vehicle_id}-\${dateString(d.calendar_date).replaceAll('-','')}-\${id.slice(0,8)}\`;
    
    await c.query('INSERT INTO invoices(id,invoice_number,created_at,calendar_date,work_day_id,salesman_id,vehicle_id,outlet_id,customer_id,customer_name,total_amount_paise,payment_mode,payment_ref,previous_balance_paise,new_balance_paise,cgst_percent,sgst_percent,cgst_amount_paise,sgst_amount_paise,subtotal_paise) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)',[id,invoiceNumber,timestamp,d.calendar_date,d.work_day_id,d.salesman_id,d.vehicle_id,customer?.id||null,customer?.id||null,customer?.name||'Walk-in',grand_total,b.paymentMode,b.paymentRef||null,before,after,cgst_percent,sgst_percent,cgst_amount_paise,sgst_amount_paise,total]);
    for(const i of items){await c.query('INSERT INTO sale_items(invoice_id,product_id,quantity_pieces,line_total_paise,product_snapshot) VALUES($1,$2,$3,$4,$5)',[id,i.productId,i.quantityPieces,i.lineTotalPaise,productDto(i.product)]);await ledger(c,'SALE',i.productId,i.quantityPieces,d.vehicle_id,id,d.work_day_id);}
    await c.query('INSERT INTO accounting_ledger(id,timestamp,type,amount_paise,customer_id,invoice_id,work_day_id) VALUES($1,$2,$3,$4,$5,$6,$7)',[uid(),timestamp,'SALES_'+b.paymentMode,grand_total,customer?.id||null,id,d.work_day_id]);
    if(b.paymentMode==='CREDIT')await c.query("INSERT INTO accounting_ledger(id,timestamp,type,amount_paise,customer_id,invoice_id,work_day_id) VALUES($1,$2,'CUSTOMER_RECEIVABLE',$3,$4,$5,$6)",[uid(),timestamp,grand_total,customer.id,id,d.work_day_id]);`;

if (code.includes(OLD_BLOCK)) {
    code = code.replace(OLD_BLOCK, NEW_BLOCK);
    fs.writeFileSync('/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js', code);
    console.log("Successfully patched operations.js");
} else {
    console.log("Could not find OLD_BLOCK");
}
