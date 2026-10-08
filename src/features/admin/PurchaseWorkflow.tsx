import { useCallback, useEffect, useState } from 'react';
import { useApi } from '../auth/useApi';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v2';

export default function PurchaseWorkflow() {
  const fetchApi = useApi();
  const [godowns, setGodowns] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');

  const [invoiceRef, setInvoiceRef] = useState('');
  const [selectedGodown, setSelectedGodown] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Line items
  const [lines, setLines] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [g, p] = await Promise.all([fetchApi(`${API_URL}/admin/godowns`), fetchApi(`${API_URL}/admin/products`)]);
      setGodowns(await g.json());
      setProducts(await p.json());
    } catch (e: any) { setError(e.message); }
  }, [fetchApi]);

  useEffect(() => { load(); }, [load]);

  const handleAddLine = () => {
    setLines([...lines, { productId: '', quantity: '', unit: 'BOX' }]);
  };

  const handleUpdateLine = (index: number, field: string, value: string) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  



  const handleSubmit = async () => {
    if (!invoiceRef || !selectedGodown) return setError('Invoice Ref and Godown are required.');
    if (lines.length === 0) return setError('At least one line item is required.');

    for (const line of lines) {
      if (!line.productId || !line.quantity || Number(line.quantity) <= 0) {
        return setError('All lines must have a selected product and a positive quantity.');
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const mappedLines = lines.map(line => {
        const prod = products.find(p => p.id === line.productId);
        const pieces = Number(line.quantity) * (line.unit === 'BOX' ? (prod?.pieces_per_box ?? 1) : line.unit === 'STRIP' ? (prod?.units_per_strip ?? 1) : 1);
        return {
          product_id: line.productId,
          quantity_pieces: pieces
        };
      });

      const res = await fetchApi(`${API_URL}/admin/purchases`, {
        method: 'POST',
        body: JSON.stringify({
          invoice_ref: invoiceRef,
          godown_id: selectedGodown,
          lines: mappedLines
        }),
      });

      if (!res.ok) {
         const body = await res.json();
         if (body.error && body.error.includes('duplicate key value')) {
            throw new Error('This invoice has already been processed.');
         }
         throw new Error(body.error || 'Failed to post atomic purchase receipt.');
      }

      setSuccess(`Receipt ${invoiceRef} successfully posted to Stock Ledger.`);
      setLines([]);
      setInvoiceRef('');
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 dark:text-gray-100">
      <h2 className="text-2xl font-bold">Purchase Workflow (Godown Receipt)</h2>
      {error && <p className="text-red-600 bg-red-100 p-2 rounded">{error}</p>}
      {success && <p className="text-green-600 bg-green-100 p-2 rounded">{success}</p>}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <h3 className="font-bold">1. Review & Validation</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4 dark:border-gray-700">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Supplier Invoice Reference</label>
            <input
              className="border dark:border-gray-600 bg-transparent rounded p-2 w-full"
              placeholder="e.g. INV-2026-904"
              value={invoiceRef}
              onChange={e => setInvoiceRef(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Receiving Godown</label>
            <select
              value={selectedGodown}
              onChange={e => setSelectedGodown(e.target.value)}
              className="border dark:border-gray-600 bg-transparent rounded p-2 w-full"
            >
              <option value="">Select an active godown</option>
              {godowns.map(g => <option key={g.id} value={g.id}>{g.name} - {g.location_name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Invoice Line Items</span>
            <button onClick={handleAddLine} className="text-sm text-blue-600 font-bold">+ Add Line Manually</button>
          </div>

          {lines.length === 0 ? (
             <div className="text-center p-4 py-8 text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded">
               No lines mapped yet. Extract a document or add manually.
             </div>
          ) : (
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="flex flex-col gap-1 border dark:border-gray-700 rounded p-2">
                  {line.extractedName && (
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Extracted: <strong>{line.extractedName}</strong></span>
                      <span className={`font-bold ${line.status === 'MATCHED' ? 'text-green-600' : line.status === 'REVIEW_REQUIRED' ? 'text-orange-500' : 'text-blue-500'}`}>
                        {line.status || 'MANUAL'}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                    <select
                      value={line.productId}
                      onChange={e => handleUpdateLine(idx, 'productId', e.target.value)}
                      className="border dark:border-gray-600 bg-transparent rounded p-2 flex-1 min-w-[200px]"
                    >
                      <option value="">Map to Product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>

                    <input
                      type="number" min="0"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={e => handleUpdateLine(idx, 'quantity', e.target.value)}
                      className="border dark:border-gray-600 bg-transparent rounded p-2 w-20"
                    />

                    <select
                      value={line.unit}
                      onChange={e => handleUpdateLine(idx, 'unit', e.target.value)}
                      className="border dark:border-gray-600 bg-transparent rounded p-2 w-24"
                    >
                      <option>BOX</option>
                      <option>STRIP</option>
                      <option>PIECE</option>
                    </select>
                    
                    {line.unitPrice !== undefined && (
                        <div className="text-sm px-2 w-20 text-right">
                          ₹{line.unitPrice}
                        </div>
                    )}
                    {line.lineTotal !== undefined && (
                        <div className="text-sm px-2 w-24 font-bold text-right">
                          ₹{line.lineTotal}
                        </div>
                    )}

                    <button onClick={() => handleRemoveLine(idx)} className="text-red-500 font-bold px-2 ml-auto">X</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2">
        <h3 className="font-bold">2. Atomic Receipt Approval</h3>
        <p className="text-xs text-gray-500">
          Approving this receipt enforces a strict ACID transaction on the backend. This will atomically
          update the immutable stock ledger and increment the physical inventory at the selected godown.
          Duplicate posting is guarded by the Invoice Reference idempotency key.
        </p>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || lines.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-3 font-bold w-full sm:w-auto"
        >
          {isSubmitting ? 'Posting Atomic Receipt...' : 'Approve & Post Receipt'}
        </button>
      </div>

    </div>
  );
}
