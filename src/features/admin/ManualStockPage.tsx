import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../auth/useApi';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v2';

export default function ManualStockPage() {
  const fetchApi = useApi();
  const [godowns, setGodowns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  
  const [selectedGodown, setSelectedGodown] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('OTHER');
  const [note, setNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [gRes, pRes] = await Promise.all([
        fetchApi(`${API_URL}/admin/godowns`),
        fetchApi(`${API_URL}/admin/products`)
      ]);
      const g = await gRes.json();
      const p = await pRes.json();
      console.log('Loaded products:', p);
      setGodowns(g);
      setProducts(p);
    } catch (e) { console.error('Error loading data:', e); }
  }, [fetchApi]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadStock = async (godownId: string) => {
    if (!godownId) return;
    try {
      const res = await fetchApi(`${API_URL}/admin/godowns/${godownId}/stock`);
      const s = await res.json();
      console.log('Loaded stock:', s);
      setStock(s);
    } catch (e) {
      console.error('Error loading stock:', e);
      setStock([]);
    }
  };

  useEffect(() => { loadStock(selectedGodown); }, [selectedGodown]);

  const filteredProducts = products.filter(p => 
    p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('Search term:', searchTerm, 'Filtered products:', filteredProducts.length);

  const handleSubmit = async () => {
    if (!selectedGodown || !productId || !Number(quantity)) return;
    setIsSubmitting(true);
    try {
      await fetchApi(`${API_URL}/admin/stock/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            godown_id: selectedGodown,
            product_id: productId,
            quantity_pieces: Number(quantity),
            kind: 'IN', // Manual Add
            reason,
            note
        })
      });
      setMessage('Stock added successfully');
      setQuantity(''); setNote('');
      loadStock(selectedGodown);
    } catch (e: any) { setMessage('Error: ' + e.message); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6 dark:text-gray-100">
      <h2 className="text-2xl font-bold">Manual Stock Management</h2>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <label className="block text-sm mb-2">Select Warehouse</label>
        <select value={selectedGodown} onChange={e => setSelectedGodown(e.target.value)} className="w-full p-2 border rounded bg-transparent">
          <option value="">-- Select --</option>
          {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {selectedGodown && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-bold mb-4">Add Manual Stock</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Search Product..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="w-full p-2 border rounded bg-transparent" 
              />
              <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full p-2 border rounded bg-transparent">
                <option value="">Select Product</option>
                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="Quantity (pieces)" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
              <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-2 border rounded bg-transparent">
                <option value="OPENING_STOCK">Opening Stock</option>
                <option value="OTHER">Other</option>
              </select>
              <input placeholder="Note" value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
              <button disabled={isSubmitting} onClick={handleSubmit} className="w-full bg-blue-600 text-white p-2 rounded">Add Stock</button>
              {message && <p className="text-sm p-2">{message}</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h3 className="font-bold mb-4">Current Stock</h3>
            <table className="w-full text-sm">
              <thead className="text-left dark:text-gray-400"><tr><th>Product</th><th>Qty</th></tr></thead>
              <tbody>{stock.map(s => <tr key={s.product_id}><td>{s.product_name}</td><td>{s.quantity_pieces}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
