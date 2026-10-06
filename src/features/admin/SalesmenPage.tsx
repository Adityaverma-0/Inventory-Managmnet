import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApi } from '../auth/useApi';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v2';

// WHAT: salesmen CRUD + PIN management. Work-day open/close is NOT tracked in
// the admin database, so that is stated honestly rather than enforced.
export default function SalesmenPage() {
  const fetchApi = useApi();
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [location, setLocation] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [editId, setEditId] = useState('');
  const [pinTarget, setPinTarget] = useState('');
  const [pin, setPin] = useState('');
  const [warning, setWarning] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, v, g] = await Promise.all([
        fetchApi(`${API_URL}/admin/salesmen`).then(r => r.json()),
        fetchApi(`${API_URL}/admin/vehicles`).then(r => r.json()),
        fetchApi(`${API_URL}/admin/godowns`).then(r => r.json()),
      ]);
      setSalesmen(s); setVehicles(v); setGodowns(g);
    } catch (e: any) { setError(e.message); }
  }, [fetchApi]);

  useEffect(() => { load(); }, [load]);

  // WHY: a salesman's vehicle must belong to his location; filter the dropdown.
  const vehiclesForLocation = useMemo(() => vehicles.filter(v => !location || v.location_name === location), [vehicles, location]);
  const locations = useMemo(() => Array.from(new Set(godowns.map(g => g.location_name))), [godowns]);

  const save = async () => {
    if (!name || !mobile || !location) return setError('Name, mobile and location are required');
    const res = editId
      ? await fetchApi(`${API_URL}/admin/salesmen/${editId}`, { method: 'PUT', body: JSON.stringify({ name, mobile, location_name: location, vehicle_id: vehicleId || null, status }) })
      : await fetchApi(`${API_URL}/admin/salesmen`, { method: 'POST', body: JSON.stringify({ name, mobile, location_name: location, vehicle_id: vehicleId || null, status }) });
    const body = await res.json();
    if (!res.ok) return setError(body.error || 'Save failed');
    if (body.warning) setWarning(body.warning);
    setName(''); setMobile(''); setLocation(''); setVehicleId(''); setStatus('ACTIVE'); setEditId(''); await load();
  };

  const applyPin = async () => {
    if (!pinTarget || !/^\d{4,6}$/.test(pin)) return setError('Choose a salesman and enter 4-6 digit PIN');
    const res = await fetchApi(`${API_URL}/admin/salesmen/${pinTarget}/set-pin`, { method: 'POST', body: JSON.stringify({ pin }) });
    const body = await res.json();
    if (!res.ok) return setError(body.error || 'PIN set failed');
    setPin(''); alert('PIN saved (shown only once). The PIN itself is never stored or displayed.');
  };

  const resetPin = async (id: string) => {
    await fetchApi(`${API_URL}/admin/salesmen/${id}/reset-pin`, { method: 'POST', body: JSON.stringify({}) });
    alert('PIN cleared'); await load();
  };

  return (
    <div className="space-y-4 dark:text-gray-100">
      <h2 className="text-2xl font-bold">Salesmen</h2>
      {error && <p className="text-red-600">{error}</p>}
      {warning && <p className="text-amber-600 text-sm">{warning} — Note: open work-day enforcement is not possible because the admin database does not store work-day state. This only warns about pending unload requests or remaining vehicle stock.</p>}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <h3 className="font-bold">Add / edit salesman</h3>
        <div className="flex flex-wrap gap-2">
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="Mobile (10 digits)" value={mobile} onChange={e => setMobile(e.target.value)} />
          <select className="border dark:border-gray-600 bg-transparent rounded p-2" value={location} onChange={e => { setLocation(e.target.value); setVehicleId(''); }}>
            <option value="">Location</option>{locations.map(l => <option key={l}>{l}</option>)}
          </select>
          <select className="border dark:border-gray-600 bg-transparent rounded p-2" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
            <option value="">Vehicle (optional)</option>{vehiclesForLocation.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select className="border dark:border-gray-600 bg-transparent rounded p-2" value={status} onChange={e => setStatus(e.target.value)}>
            <option>ACTIVE</option><option>ON_HOLD</option><option>INACTIVE</option>
          </select>
          <button onClick={save} className="bg-blue-600 text-white rounded px-4 py-2">{editId ? 'Update' : 'Add'}</button>
          {editId && <button onClick={() => { setEditId(''); setName(''); setMobile(''); setLocation(''); setVehicleId(''); setStatus('ACTIVE'); }} className="border rounded px-4 py-2">Cancel</button>}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3">
        <h3 className="font-bold">Set / reset PIN</h3>
        <div className="flex flex-wrap gap-2">
          <select className="border dark:border-gray-600 bg-transparent rounded p-2" value={pinTarget} onChange={e => setPinTarget(e.target.value)}>
            <option value="">Select salesman</option>{salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input className="border dark:border-gray-600 bg-transparent rounded p-2" placeholder="New 4-6 digit PIN" value={pin} onChange={e => setPin(e.target.value)} />
          <button onClick={applyPin} className="bg-blue-600 text-white rounded px-4 py-2">Set PIN</button>
        </div>
        <p className="text-xs text-gray-500">The PIN is bcrypt-hashed on the server and is never returned by any API, stored in the audit log, or displayed again.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-500"><tr><th className="p-2">Name</th><th className="p-2">Mobile</th><th className="p-2">Location</th><th className="p-2">Vehicle</th><th className="p-2">Status</th><th className="p-2"></th></tr></thead>
          <tbody>{salesmen.map(s => (
            <tr key={s.id} className="border-t dark:border-gray-700">
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.mobile}</td>
              <td className="p-2">{s.location_name}</td>
              <td className="p-2">{vehicles.find(v => v.id === s.vehicle_id)?.name || '—'}</td>
              <td className="p-2">{s.status}</td>
              <td className="p-2 text-right">
                <button className="text-blue-600 mr-3" onClick={() => { setEditId(s.id); setName(s.name); setMobile(s.mobile); setLocation(s.location_name); setVehicleId(s.vehicle_id || ''); setStatus(s.status); }}>Edit</button>
                <button className="text-red-600" onClick={() => resetPin(s.id)}>Reset PIN</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
