import fs from 'fs';

const filePath = '/sessions/jolly-determined-gauss/mnt/admin-dashboard /backend/operations.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetOld = `  app.post('/api/v2/salesman/loads',endpoint(req=>operation(pool,req,'load',async c=>{
    const d=await ownDay(c,req.body.workDayId,req.user,['LOADING','ON_ROUTE']);await activeGodown(c,d.godown_id);
    const items=await productsFor(c,req.body.items);await lockStock(c,[d.godown_id,d.vehicle_id],items.map(i=>i.productId));
    const id=uid();for(const i of items){const qty=await balance(c,d.godown_id,i.productId);if(qty<i.quantityPieces)throw new ApiError(\`Insufficient inventory. Available quantity: \${qty}.\`,409);await ledger(c,'LOAD_OUT',i.productId,i.quantityPieces,d.godown_id,id,d.work_day_id);await ledger(c,'LOAD_IN',i.productId,i.quantityPieces,d.vehicle_id,id,d.work_day_id);}
    await audit(c,'LOAD_STOCK',id,{workDayId:d.work_day_id});return {id,timestamp:Date.now(),vehicleId:d.vehicle_id,warehouseId:d.godown_id,workDayId:d.work_day_id,phase:d.route_started_at?'TOPUP':'START',items:items.map(({productId,quantityPieces})=>({productId,quantityPieces}))};
  })));`;

const replacement = `  app.post('/api/v2/salesman/loads',endpoint(req=>operation(pool,req,'load',async () => {
    throw new ApiError('Direct stock loading without admin approval is disabled. Please submit a stock request.', 403);
  })));

  app.post('/api/v2/salesman/stock-requests',endpoint(req=>operation(pool,req,'stock-request',async c=>{
    const d=await ownDay(c,req.body.workDayId,req.user,['LOADING','ON_ROUTE']);
    await activeGodown(c,d.godown_id);
    const items=await productsFor(c,req.body.items);
    const rawItems=Array.isArray(req.body.items)?req.body.items:[];
    const itemRecords=items.map(i=>{
      const raw=rawItems.find(r=>(r.productId||r.product_id)===i.productId);
      return {
        productId: i.productId,
        productName: i.product.name,
        quantityPieces: i.quantityPieces,
        unitsPerStrip: i.product.units_per_strip,
        piecesPerBox: i.product.pieces_per_box,
        boxes: raw?.boxes ?? 0,
        strips: raw?.strips ?? 0,
        pieces: raw?.pieces ?? 0
      };
    });
    const id=uid(), now=Date.now();
    await c.query(
      'INSERT INTO stock_requests(id,work_day_id,salesman_id,vehicle_id,godown_id,status,items,requested_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, d.work_day_id, d.salesman_id, d.vehicle_id, d.godown_id, 'PENDING', JSON.stringify(itemRecords), now]
    );
    await audit(c,'STOCK_REQUEST_CREATED',id,{workDayId:d.work_day_id,itemCount:itemRecords.length});
    return {id,status:'PENDING',requestedAt:now,workDayId:d.work_day_id,vehicleId:d.vehicle_id,godownId:d.godown_id,items:itemRecords};
  })));

  app.get('/api/v2/salesman/stock-requests',endpoint(async req=>{
    const { rows } = await pool.query(
      \`SELECT sr.*, g.name AS godown_name, v.name AS vehicle_name 
       FROM stock_requests sr 
       LEFT JOIN godowns g ON g.id=sr.godown_id 
       LEFT JOIN vehicles v ON v.id=sr.vehicle_id 
       WHERE sr.salesman_id=$1 
       ORDER BY sr.requested_at DESC LIMIT 50\`,
      [req.user.id]
    );
    return rows.map(r => ({
      id: r.id,
      workDayId: r.work_day_id,
      salesmanId: r.salesman_id,
      vehicleId: r.vehicle_id,
      vehicleName: r.vehicle_name,
      godownId: r.godown_id,
      godownName: r.godown_name,
      status: r.status,
      items: r.items,
      requestedAt: number(r.requested_at),
      processedAt: number(r.processed_at),
      adminNote: r.admin_note
    }));
  }));

  app.get('/api/v2/admin/stock-requests',endpoint(async () => {
    const { rows } = await pool.query(
      \`SELECT sr.*, s.name AS salesman_name, v.name AS vehicle_name, g.name AS godown_name 
       FROM stock_requests sr 
       JOIN salesmen s ON s.id=sr.salesman_id 
       JOIN vehicles v ON v.id=sr.vehicle_id 
       JOIN godowns g ON g.id=sr.godown_id 
       ORDER BY sr.requested_at DESC LIMIT 200\`
    );
    return rows.map(r => ({
      id: r.id,
      workDayId: r.work_day_id,
      salesmanId: r.salesman_id,
      salesmanName: r.salesman_name,
      vehicleId: r.vehicle_id,
      vehicleName: r.vehicle_name,
      godownId: r.godown_id,
      godownName: r.godown_name,
      status: r.status,
      items: r.items,
      requestedAt: number(r.requested_at),
      processedAt: number(r.processed_at),
      adminNote: r.admin_note
    }));
  }));

  app.post('/api/v2/admin/stock-requests/:id/approve',endpoint(req=>operation(pool,req,'approve-stock:'+req.params.id,async c=>{
    const reqRow = (await c.query('SELECT * FROM stock_requests WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
    if (!reqRow) throw new ApiError('Stock request not found.', 404);
    if (reqRow.status === 'APPROVED') return { success: true, id: reqRow.id, status: 'APPROVED' };
    if (reqRow.status !== 'PENDING') throw new ApiError(\`Request is already \${reqRow.status}.\`, 409);

    const d = (await c.query('SELECT * FROM work_days WHERE work_day_id=$1 FOR UPDATE', [reqRow.work_day_id])).rows[0];
    if (!d || d.state === 'CLOSED') throw new ApiError('Associated workday is not active.', 409);
    await activeGodown(c, reqRow.godown_id);

    const items = reqRow.items;
    if (!Array.isArray(items) || !items.length) throw new ApiError('Stock request has no items.', 400);

    await lockStock(c, [reqRow.godown_id, reqRow.vehicle_id], items.map(i => i.productId));

    for (const i of items) {
      const qty = await balance(c, reqRow.godown_id, i.productId);
      if (qty < i.quantityPieces) {
        throw new ApiError(\`Insufficient warehouse inventory for \${i.productName || i.productId}. Available: \${qty}, Requested: \${i.quantityPieces}.\`, 409);
      }
    }

    const loadId = uid();
    for (const i of items) {
      await ledger(c, 'LOAD_OUT', i.productId, i.quantityPieces, reqRow.godown_id, loadId, reqRow.work_day_id);
      await ledger(c, 'LOAD_IN', i.productId, i.quantityPieces, reqRow.vehicle_id, loadId, reqRow.work_day_id);
    }

    const now = Date.now();
    await c.query('UPDATE stock_requests SET status=$1, processed_at=$2 WHERE id=$3', ['APPROVED', now, reqRow.id]);
    await audit(c, 'STOCK_REQUEST_APPROVED', reqRow.id, { loadId, workDayId: reqRow.work_day_id, vehicleId: reqRow.vehicle_id });
    return { success: true, id: reqRow.id, status: 'APPROVED' };
  })));

  app.post('/api/v2/admin/stock-requests/:id/reject',endpoint(req=>operation(pool,req,'reject-stock:'+req.params.id,async c=>{
    const reqRow = (await c.query('SELECT * FROM stock_requests WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
    if (!reqRow) throw new ApiError('Stock request not found.', 404);
    if (reqRow.status === 'REJECTED') return { success: true, id: reqRow.id, status: 'REJECTED' };
    if (reqRow.status === 'APPROVED') throw new ApiError('Cannot reject an already approved request.', 409);
    if (reqRow.status !== 'PENDING') throw new ApiError(\`Request is already \${reqRow.status}.\`, 409);

    const note = req.body?.note ? text(req.body.note, 'Rejection note', false) : null;
    const now = Date.now();
    await c.query('UPDATE stock_requests SET status=$1, processed_at=$2, admin_note=$3 WHERE id=$4', ['REJECTED', now, note, reqRow.id]);
    await audit(c, 'STOCK_REQUEST_REJECTED', reqRow.id, { workDayId: reqRow.work_day_id, note });
    return { success: true, id: reqRow.id, status: 'REJECTED' };
  })));`;

if (!content.includes(targetOld)) {
  console.error("targetOld not found in operations.js");
  process.exit(1);
}

content = content.replace(targetOld, replacement);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched backend/operations.js!");
