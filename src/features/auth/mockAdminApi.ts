
// Simple LocalStorage DB wrapper
const getDB = (key: string, defaultValue: any) => {
  const data = localStorage.getItem(`admin_mock_${key}`);
  return data ? JSON.parse(data) : defaultValue;
};
const saveDB = (key: string, value: any) => localStorage.setItem(`admin_mock_${key}`, JSON.stringify(value));

// Seed default data if empty
if (!localStorage.getItem('admin_mock_godowns')) {
  saveDB('godowns', [{ id: 'g1', name: 'Main Godown', location_name: 'HQ' }]);
  saveDB('products', [{ id: 'p1', name: 'Apple', price_paise: 5000, units_per_strip: 10, strips_per_box: 10, pieces_per_box: 100, active: true }]);
  saveDB('salesmen', [{ id: 's1', name: 'Ramesh Field', phone: '9999999999' }]);
  saveDB('vehicles', [{ id: 'v1', name: 'Van 01', plate: 'MP-09-AB-1234' }]);
  saveDB('stock_history', []);
  saveDB('stock_ledger', []);
  saveDB('audit_log', []);
  saveDB('purchases', []);
}

function logAudit(action: string, entity: string, details: any) {
  const logs = getDB('audit_log', []);
  logs.unshift({ id: Date.now().toString(), timestamp: Date.now(), action, entity, details: JSON.stringify(details) });
  saveDB('audit_log', logs);
}

// Intercept function replacing `fetch`
export async function handleMockApi(urlStr: string, options: RequestInit): Promise<Response> {
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname.replace('/api/v2', '');
  const method = options.method || 'GET';

  const ok = (data: any = {}) => new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const error = (msg: string, status = 400) => new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json' } });

  const getBody = () => options.body ? JSON.parse(options.body as string) : {};

  await new Promise(r => setTimeout(r, 200)); // Simulate slight network delay

  try {
    // --- MASTER DATA ---
    if (path.match(/^\/admin\/(godowns|products|salesmen|vehicles)$/) && method === 'GET') {
      const type = path.split('/')[2];
      return ok(getDB(type, []));
    }

    if (path.match(/^\/admin\/(godowns|products|salesmen|vehicles)$/) && method === 'POST') {
      const type = path.split('/')[2];
      const data = getDB(type, []);
      const body = getBody();
      if (type === 'salesmen' && body.password) {
        body.password_hash = 'mock_hash';
        body.active = true;
        delete body.password;
      }
      const item = { id: Date.now().toString(), ...body };
      data.push(item);
      saveDB(type, data);
      logAudit(`CREATE_${type.toUpperCase()}`, item.id, item);
      return ok(item);
    }

    const putMatch = path.match(/^\/admin\/(godowns|products|salesmen|vehicles)\/(.+)$/);
    if (putMatch && method === 'PUT') {
      const type = putMatch[1];
      const id = putMatch[2];
      const data = getDB(type, []);
      const index = data.findIndex((d: any) => d.id === id);
      if (index === -1) return error('Not found', 404);
      data[index] = { ...data[index], ...getBody() };
      saveDB(type, data);
      logAudit(`UPDATE_${type.toUpperCase()}`, id, getBody());
      return ok(data[index]);
    }

    // --- STOCK & GODOWNS & VEHICLES ---
    const stockMatch = path.match(/^\/admin\/(godowns|vehicles)\/(.+)\/stock$/);
    if (stockMatch && method === 'GET') {
      const gId = stockMatch[2];
      const ledger = getDB('stock_ledger', []);
      const products = getDB('products', []);
      const stock: any[] = [];
      products.forEach((p: any) => {
         let qty = 0;
         ledger.filter((l:any) => l.godown_id === gId && l.product_id === p.id).forEach((l:any) => {
            if (l.kind.includes('PLUS') || l.kind === 'IN') qty += l.quantity_pieces;
            if (l.kind.includes('MINUS') || l.kind === 'OUT') qty -= l.quantity_pieces;
         });
         // Even if qty is 0, we can omit or include. The UI handles it.
         if(qty > 0) {
            stock.push({ product_id: p.id, product_name: p.name, quantity_pieces: qty, price_paise: p.price_paise, strips_per_box: p.strips_per_box, units_per_strip: p.units_per_strip, pieces_per_box: p.pieces_per_box });
         }
      });
      return ok(stock);
    }

    const histMatch = path.match(/^\/admin\/(godowns|vehicles)\/(.+)\/history$/);
    if (histMatch && method === 'GET') {
      const gId = histMatch[2];
      let history = getDB('stock_history', []);
      history = history.filter((h:any) => h.godown_id === gId).sort((a:any, b:any) => b.timestamp - a.timestamp);
      return ok(history);
    }

    if (path === '/admin/stock/adjust' && method === 'POST') {
      const body = getBody();
      const ledger = getDB('stock_ledger', []);
      const history = getDB('stock_history', []);
      const entry = { id: Date.now().toString(), timestamp: Date.now(), ...body };
      ledger.push(entry);
      history.push(entry);
      saveDB('stock_ledger', ledger);
      saveDB('stock_history', history);
      logAudit('STOCK_ADJUSTMENT', body.godown_id, body);
      return ok(entry);
    }


    if (path === '/admin/extract-invoice' && method === 'POST') {
       // Mock deterministic extraction for test
       return ok({
          success: true,
          invoice_number: 'INV-2026-904',
          invoice_date: '2026-10-07',
          supplier: 'ABC Supplier',
          amount: 10000,
          items: [
             { description: 'Apple', quantity: 5, unit: 'BOX', sku: 'p1' },
             { description: 'Orange', quantity: 10, unit: 'BOX', sku: null }
          ]
       });
    }

    // --- PURCHASES (New UI) ---
    if (path === '/admin/purchases' && method === 'POST') {
      const body = getBody();
      const ledger = getDB('stock_ledger', []);
      const history = getDB('stock_history', []);
      const purchases = getDB('purchases', []);

      const purchaseEntry = { id: Date.now().toString(), timestamp: Date.now(), ...body };
      purchases.push(purchaseEntry);

      body.lines.forEach((line: any) => {
         const entry = { id: Date.now().toString() + Math.random(), timestamp: Date.now(), godown_id: body.godown_id, product_id: line.product_id, quantity_pieces: line.quantity_pieces, kind: 'IN', reason: 'PURCHASE_RECEIPT', note: 'Inv: ' + body.invoice_ref };
         ledger.push(entry);
         history.push(entry);
      });

      saveDB('stock_ledger', ledger);
      saveDB('stock_history', history);
      saveDB('purchases', purchases);
      logAudit('PURCHASE_RECEIPT', body.invoice_ref, body);
      return ok(purchaseEntry);
    }

    // --- UNLOAD REQUESTS (Approval Dashboard) ---
    if (path === '/unload-requests' && method === 'GET') {
      // Because salesman writes to IndexedDB and not localStorage, simulating this fully is hard
      // without bridging. But for "working" admin demo, we'll return a mock request if none exist.
      const reqs = getDB('unload_requests', [
        { id: 'req001', status: 'PENDING', requestedAt: Date.now(), requestData: { salesmanId: 's1', vehicleId: 'v1', calendarDate: '2026-10-07', cashCollected: 500, paymentTotals: {total:500, cash:500} } }
      ]);
      return ok(reqs);
    }

    if (path.match(/^\/unload-requests\/(.+)\/approve$/) && method === 'POST') {
      const id = path.match(/^\/unload-requests\/(.+)\/approve$/)![1];
      const reqs = getDB('unload_requests', []);
      const req = reqs.find((r:any) => r.id === id);
      if (req) { req.status = 'APPROVED'; saveDB('unload_requests', reqs); logAudit('APPROVE_REPORT', id, {}); }
      return ok({success: true});
    }

    if (path.match(/^\/unload-requests\/(.+)\/send-back$/) && method === 'POST') {
      const id = path.match(/^\/unload-requests\/(.+)\/send-back$/)![1];
      const reqs = getDB('unload_requests', []);
      const req = reqs.find((r:any) => r.id === id);
      if (req) { req.status = 'SENT_BACK'; saveDB('unload_requests', reqs); logAudit('REJECT_REPORT', id, getBody()); }
      return ok({success: true});
    }

    // --- AUDIT LOG ---
    if (path === '/admin/audit' && method === 'GET') {
       return ok(getDB('audit_log', []));
    }

    // Any other get
    if (method === 'GET') return ok([]);

    return error('Unmocked route');
  } catch(e: any) {
    return error(e.message, 500);
  }
}
