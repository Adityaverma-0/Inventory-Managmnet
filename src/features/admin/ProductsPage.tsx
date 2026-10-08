import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../auth/useApi';
import { formatRupees, rupeesToPaise } from '../../domain/money';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v2';

// WHAT: products CRUD — name, price per piece (Rs), active flag, and
// Box/Strip/Piece conversion ratios with a live preview.
export default function ProductsPage() {
  const fetchApi = useApi();
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [pricePerPiece, setPricePerPiece] = useState('');
  const [unitsPerStrip, setUnitsPerStrip] = useState('');
  const [stripsPerBox, setStripsPerBox] = useState('');
  const [active, setActive] = useState(true);
  const [editId, setEditId] = useState('');
  const [search, setSearch] = useState('');
  const [metadata, setMetadata] = useState({ sku: '', barcode: '', hsn: '', uom: '' });

  const load = useCallback(async () => {
    try { const res = await fetchApi(`${API_URL}/admin/products`); const data = await res.json(); if (!res.ok || !Array.isArray(data)) throw new Error(data.error || 'Could not load products.'); setProducts(data); }
    catch (e: any) { setError(e.message); }
  }, [fetchApi]);
  useEffect(() => { load(); }, [load]);

  // WHAT: the live preview — `1 Box = S Strips = P Pieces` — shown while typing.
  const preview = useMemo(() => {
    const s = +stripsPerBox || 0; const u = +unitsPerStrip || 0;
    if (!s || !u) return null;
    return `1 Box = ${s} Strip${s > 1 ? 's' : ''} = ${s * u} Pieces`;
  }, [stripsPerBox, unitsPerStrip]);

  const validationError = useMemo(() => {
    if (!name.trim()) return 'Name required';
    if (pricePerPiece === '' || isNaN(+pricePerPiece) || +pricePerPiece < 0) return 'Price must be a non-negative number';
    if (!(+unitsPerStrip > 0) || !(+stripsPerBox > 0)) return 'Pieces per strip and strips per box must be > 0';
    return '';
  }, [name, pricePerPiece, unitsPerStrip, stripsPerBox]);

  const save = async () => {
    if (validationError) return setError(validationError);
    try {
    const payload = {
      name: name.trim(),
      price_paise: rupeesToPaise(+pricePerPiece),
      units_per_strip: +unitsPerStrip,
      strips_per_box: +stripsPerBox,
      pieces_per_box: +unitsPerStrip * +stripsPerBox,
      active,
      ...Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, value.trim() || null])),
    };
    const res = editId
      ? await fetchApi(`${API_URL}/admin/products/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetchApi(`${API_URL}/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) return setError((await res.json()).error || 'Save failed');
    setName(''); setPricePerPiece(''); setUnitsPerStrip(''); setStripsPerBox(''); setActive(true); setEditId(''); setMetadata({ sku: '', barcode: '', hsn: '', uom: '' }); await load();
    } catch (e: any) { setError(e.message || 'Could not save product.'); }
  };

  const filtered = useMemo(() => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);

  return (
    <div className="space-y-4 dark:text-gray-100">
      <h2 className="text-2xl font-bold">Products</h2>
      {error && <p className="text-red-600">{error}</p>}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <h3 className="font-bold">Add / edit product</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="Price per piece (Rs)" value={pricePerPiece} onChange={e => setPricePerPiece(e.target.value)} />
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="Pieces per strip" value={unitsPerStrip} onChange={e => setUnitsPerStrip(e.target.value)} />
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="Strips per box" value={stripsPerBox} onChange={e => setStripsPerBox(e.target.value)} />
          {(['sku', 'barcode', 'hsn', 'uom'] as const).map(field => <label key={field} className="text-sm">{field.toUpperCase()} (optional)<input className="border dark:border-gray-600 bg-transparent rounded p-2 w-full" value={metadata[field]} maxLength={field === 'hsn' ? 20 : field === 'uom' ? 30 : 100} onChange={e => setMetadata(current => ({ ...current, [field]: e.target.value }))} /></label>)}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>
        {preview && <p className="text-green-600 text-sm font-semibold">{preview}</p>}
        {validationError && <p className="text-amber-600 text-sm">{validationError}</p>}
        <div className="flex gap-2">
          <button onClick={save} className="bg-blue-600 text-white rounded px-4 py-2">{editId ? 'Update' : 'Add'}</button>
          {editId && <button onClick={() => { setEditId(''); setName(''); setPricePerPiece(''); setUnitsPerStrip(''); setStripsPerBox(''); setActive(true); setMetadata({ sku: '', barcode: '', hsn: '', uom: '' }); }} className="border rounded px-4 py-2">Cancel</button>}
        </div>
        <p className="text-xs text-gray-500">Price/conversion edits change only future calculations; historical ledger entries keep their original snapshot.</p>
      </div>
      <input className="border dark:border-gray-600 bg-transparent rounded p-2 w-full" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500"><tr><th className="p-2">Name</th><th className="p-2">Price/piece</th><th className="p-2">Conversion</th><th className="p-2">Active</th><th className="p-2"></th></tr></thead>
          <tbody>{filtered.map(p => (
            <tr key={p.id} className="border-t dark:border-gray-700">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{formatRupees(p.price_paise)}</td>
              <td className="p-2">1 Box = {p.strips_per_box} Strips = {p.pieces_per_box} Pieces</td>
              <td className="p-2">{p.active ? 'Yes' : 'No'}</td>
              <td className="p-2 text-right"><button className="text-blue-600" onClick={() => { setEditId(p.id); setName(p.name); setPricePerPiece(String(p.price_paise / 100)); setUnitsPerStrip(String(p.units_per_strip)); setStripsPerBox(String(p.strips_per_box)); setActive(!!p.active); setMetadata({ sku: p.sku || '', barcode: p.barcode || '', hsn: p.hsn || '', uom: p.uom || '' }); }}>Edit</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
