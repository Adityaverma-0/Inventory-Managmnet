"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  Cloud,
  ExternalLink,
  MapPin,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import {
  api,
  dateTime,
  outboxList,
  outboxPut,
  requestId,
  useMutation,
  useHistory,
  type OutboxEntry,
} from "./client";
import {
  HistoryPagination,
  Modal,
  Badge,
  Button,
  DataTable,
  Empty,
  ErrorNotice,
  Field,
  Input,
  Panel,
  SearchInput,
  useApp,
} from "./ui";
export function SettingsPage() {
  const { state, refresh, notify, online } = useApp();
  const mutation = useMutation(refresh);
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  return (
    <div className="sd-grid sd-grid-equal">
      {state.user.role === "owner" && (
        <Panel
          title="Business settings"
          subtitle="Business dates, contact information and foreground location preferences"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              try {
                await mutation.run("settings.save", {
                  businessName: f.get("businessName"),
                  timezone: f.get("timezone"),
                  phone: f.get("phone"),
                  address: f.get("address"),
                  trackingInterval: Number(f.get("trackingInterval")),
                  staleMinutes: Number(f.get("staleMinutes")),
                  retentionDays: Number(f.get("retentionDays")),
                });
                notify("Business settings saved");
              } catch {}
            }}
          >
            <div className="sd-form">
              <Field label="Business name">
                <Input
                  name="businessName"
                  defaultValue={state.settings.businessName}
                  required
                />
              </Field>
              <Field label="Timezone">
                <Input
                  name="timezone"
                  defaultValue={state.settings.timezone}
                  required
                  list="timezone-options"
                />
                <datalist id="timezone-options">
                  <option>Asia/Kolkata</option>
                  <option>UTC</option>
                </datalist>
              </Field>
              <Field label="Phone">
                <Input
                  name="phone"
                  type="tel"
                  defaultValue={state.settings.phone}
                />
              </Field>
              <Field label="Address">
                <Input name="address" defaultValue={state.settings.address} />
              </Field>
              <Field label="Location capture interval (seconds)">
                <Input
                  name="trackingInterval"
                  type="number"
                  min={15}
                  max={3600}
                  defaultValue={state.settings.trackingInterval}
                  required
                />
              </Field>
              <Field label="Location stale after (minutes)">
                <Input
                  name="staleMinutes"
                  type="number"
                  min={1}
                  max={1440}
                  defaultValue={state.settings.staleMinutes}
                  required
                />
              </Field>
              <Field label="Location retention (days)">
                <Input
                  name="retentionDays"
                  type="number"
                  min={1}
                  max={365}
                  defaultValue={state.settings.retentionDays}
                  required
                />
              </Field>
            </div>
            <ErrorNotice error={mutation.error} />
            <div className="sd-form-actions">
              <Button busy={mutation.busy} disabled={!online}>
                Save business settings
              </Button>
            </div>
          </form>
        </Panel>
      )}
      <div className="sd-stack">
        <Panel
          title="Your account"
          subtitle="Your administrator manages profile and access changes"
        >
          <div className="sd-split-row">
            <span>Name</span>
            <strong>{state.user.name}</strong>
          </div>
          <div className="sd-split-row">
            <span>Email</span>
            <strong>{state.user.email}</strong>
          </div>
          <div className="sd-split-row">
            <span>Role</span>
            <Badge tone="blue">
              {state.user.role === "owner"
                ? "Owner / Administrator"
                : "Salesman"}
            </Badge>
          </div>
        </Panel>
        <Panel
          title="Change password"
          subtitle="Use a unique password with at least 12 characters"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              setPasswordError("");
              if (f.get("newPassword") !== f.get("confirmPassword")) {
                setPasswordError("New passwords do not match.");
                return;
              }
              setPasswordBusy(true);
              try {
                await api("/auth", {
                  action: "password",
                  currentPassword: f.get("currentPassword"),
                  newPassword: f.get("newPassword"),
                });
                notify("Password updated.");
                form.reset();
              } catch (e) {
                setPasswordError(
                  e instanceof Error ? e.message : "Password change failed",
                );
              } finally {
                setPasswordBusy(false);
              }
            }}
          >
            <div className="sd-stack">
              <Field label="Current password">
                <Input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label="New password">
                <Input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </Field>
              <Field label="Confirm new password">
                <Input
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </Field>
            </div>
            <ErrorNotice error={passwordError} />
            <div className="sd-form-actions">
              <Button busy={passwordBusy} disabled={!online}>
                Update password
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
export function AuditPage() {
  const { state } = useApp();
  const [search, setSearch] = useState("");
  const history = useHistory<import("@/lib/domain/types").AuditEvent>(
    "audit",
    { search },
    state.serverTime,
  );
  return (
    <Panel
      title="Audit trail"
      subtitle="Actors, actions and their recorded context"
    >
      <div className="sd-toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search action, person or detail…"
        />
      </div>
      <DataTable
        headers={["When", "Actor", "Action", "Detail", "Record"]}
        rows={history.items.map((a) => [
          dateTime(a.createdAt, state.settings.timezone),
          a.actorName,
          // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
          <Badge>{a.action}</Badge>,
          // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
          <details>
            <summary className="sd-text-link">View recorded details</summary>
            <pre className="sd-extracted">{a.detail}</pre>
          </details>,
          // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
          <span className="sd-mono">{a.entityId?.slice(0, 12) || "—"}</span>,
        ])}
      />
      <HistoryPagination {...history} />
    </Panel>
  );
}
export function NotificationsPage() {
  const { state, navigate } = useApp();
  const owner = state.user.role === "owner";
  const alerts: {
    id: string;
    title: string;
    detail: string;
    tone: string;
    action: () => void;
    label: string;
  }[] = [];
  if (state.pendingStockRequests)
    alerts.push({
      id: "stock-requests",
      title: "Stock requests awaiting approval",
      detail: `${state.pendingStockRequests} return, allocation or discrepancy request(s)`,
      tone: "amber",
      action: () => navigate("warehouse-stock"),
      label: "Review stock requests",
    });
  for (const i of state.invoices) {
    if (i.status === "READY_FOR_APPROVAL" && owner)
      alerts.push({
        id: i.id,
        title: "Purchase invoice ready for approval",
        detail: `${i.supplier || i.fileName} · ${i.invoiceNumber || "Invoice number not confirmed"}`,
        tone: "amber",
        action: () => navigate("invoices"),
        label: "Review invoices",
      });
    if (i.extractionStatus === "FAILED" && owner)
      alerts.push({
        id: i.id + "extract",
        title: "Invoice extraction needs attention",
        detail: i.extractionError || i.fileName,
        tone: "red",
        action: () => navigate("invoices"),
        label: "Open invoice",
      });
  }
  for (const r of state.reports) {
    if (
      (r.status === "SUBMITTED" && owner) ||
      ["REJECTED", "REOPENED"].includes(r.status)
    )
      alerts.push({
        id: r.id,
        title:
          r.status === "SUBMITTED"
            ? "Daily report awaiting approval"
            : "Daily report needs corrections",
        detail: `${r.vehicleName} · ${r.day} · revision ${r.revision}${r.decisionReason ? " · " + r.decisionReason : ""}`,
        tone: r.status === "SUBMITTED" ? "amber" : "red",
        action: () => navigate("daily"),
        label: "Open daily reports",
      });
  }
  for (const b of state.balances) {
    const p = state.products.find((p) => p.id === b.productId);
    if (p && p.minStock > b.quantity)
      alerts.push({
        id: b.locationId + b.productId,
        title: `Low stock · ${p.name}`,
        detail: `${b.quantity} base units available; threshold ${p.minStock}`,
        tone: "amber",
        action: () => navigate("inventory"),
        label: "View stock",
      });
  }
  return (
    <Panel
      title="Operational notifications"
      subtitle={`${alerts.length} items currently need attention · notifications clear when the underlying item is resolved`}
    >
      {alerts.length ? (
        alerts.map((a) => (
          <div className="sd-split-row" key={a.id}>
            <div className="sd-inline">
              <span className="sd-activity-icon">
                <Bell size={16} />
              </span>
              <div>
                <h3>{a.title}</h3>
                <p>{a.detail}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={a.action}>
              {a.label}
            </Button>
          </div>
        ))
      ) : (
        <Empty
          title="You're all caught up"
          description="Pending approvals, report corrections, extraction failures and low stock appear here."
          icon={<CheckCheck size={26} />}
        />
      )}
    </Panel>
  );
}
export function SyncPage() {
  const { state, refresh, notify, online } = useApp();
  const [cancelEntry, setCancelEntry] = useState<OutboxEntry | null>(null);
  const [entries, setEntries] = useState<OutboxEntry[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    try {
      setEntries(await outboxList(state.user.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open device drafts");
    }
  }, [state.user.id]);
  useEffect(() => {
    // Restore this account's durable browser queue on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  async function retry(entry: OutboxEntry) {
    setBusy(entry.id);
    setError("");
    try {
      const result = await api<{ reference?: string; message: string }>(
        "/action",
        { action: "sale.create", data: entry.data, requestId: entry.id },
      );
      await outboxPut({
        ...entry,
        state: "Confirmed",
        error: "",
        reference: result.reference,
      });
      notify("Sale confirmed by the server.");
      await refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Request failed";
      await outboxPut({ ...entry, state: "Failed", error: message });
      setError(message);
    } finally {
      await load();
      setBusy("");
    }
  }
  const pending = entries.filter(
    (e) => e.state === "Pending" || e.state === "Failed",
  );
  return (
    <>
      <div className={`sd-notice ${online ? "sd-success" : "sd-warning"}`}>
        <span className="sd-inline">
          {online ? <Cloud size={17} /> : <WifiOff size={17} />}
          <strong>
            {online ? "Connected to the workspace" : "Currently offline"}
          </strong>
        </span>
        {online
          ? "You can retry pending sales after reviewing their outcome below."
          : "Draft sales stay on this device. They are not committed stock movements."}
      </div>
      <div className="sd-grid sd-grid-equal" style={{ marginBottom: 22 }}>
        <Panel
          title="Device queue"
          subtitle="Private to this signed-in account on this browser"
        >
          <div className="sd-info-grid">
            <div>
              <small>Pending / failed</small>
              <strong>{pending.length}</strong>
            </div>
            <div>
              <small>Confirmed</small>
              <strong>
                {entries.filter((e) => e.state === "Confirmed").length}
              </strong>
            </div>
          </div>
        </Panel>
        <Panel
          title="Latest server refresh"
          subtitle={dateTime(state.serverTime, state.settings.timezone)}
        >
          <p style={{ fontSize: 12, marginBottom: 14 }}>
            Displayed stock includes server-confirmed activity. Pending local
            sales are shown separately and remain subject to stock and day
            checks.
          </p>
          <Button
            variant="secondary"
            onClick={async () => {
              await refresh();
              await load();
            }}
          >
            <RefreshCw size={14} />
            Refresh status
          </Button>
        </Panel>
      </div>
      <ErrorNotice error={error} />
      <Panel
        title="Sales saved on this device"
        subtitle="Retries use the original request. A failed request remains visible until it is resolved."
      >
        <DataTable
          headers={["Saved", "Sale scope", "State", "Result / error", "Action"]}
          rows={entries.map((entry) => {
            const data = entry.data as {
              vehicleId: string;
              day: string;
              lines: unknown[];
            };
            return [
              dateTime(entry.createdAt),
              // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
              <div>
                {state.vehicles.find((v) => v.id === data.vehicleId)?.name ||
                  "Prior assigned vehicle"}
                <small className="sd-sub">
                  {data.day} · {data.lines?.length || 0} lines
                </small>
              </div>,
              // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
              <Badge>{entry.state}</Badge>,
              // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
              <div>
                {entry.reference ||
                  entry.error ||
                  "Waiting for server confirmation"}
                <small className="sd-sub sd-mono">
                  Request {entry.id.slice(0, 8)}
                </small>
              </div>,
              entry.state === "Pending" || entry.state === "Failed" ? (
                <div className="sd-row-actions">
                  <Button
                    busy={busy === entry.id}
                    disabled={!online || !!busy}
                    variant="secondary"
                    onClick={() => retry(entry)}
                  >
                    Retry original sale
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!online || !!busy}
                    onClick={() => setCancelEntry(entry)}
                  >
                    Resolve / cancel
                  </Button>
                </div>
              ) : (
                <span className="sd-legend">
                  {entry.state === "Cancelled"
                    ? "Cancelled before posting"
                    : "Confirmed on server"}
                </span>
              ),
            ];
          })}
          empty="No queued sales on this device"
        />
      </Panel>
      <Modal
        open={!!cancelEntry}
        onClose={() => setCancelEntry(null)}
        title="Resolve an unposted sale"
        description="The server checks the original request before cancellation. A confirmed sale cannot be cancelled here."
      >
        <div className="sd-notice">
          If this sale is still unposted, cancellation prevents a delayed retry
          from posting it. You can then create a reviewed replacement sale. The
          cancelled record stays visible on this device.
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!cancelEntry) return;
            setBusy(cancelEntry.id);
            setError("");
            try {
              const result = await api<{
                state: "CONFIRMED" | "CANCELLED";
                result?: { reference?: string };
              }>(`/requests/${cancelEntry.id}`, {
                action: "cancel",
                data: cancelEntry.data,
              });
              await outboxPut({
                ...cancelEntry,
                state: result.state === "CONFIRMED" ? "Confirmed" : "Cancelled",
                reference: result.result?.reference,
                error:
                  result.state === "CANCELLED"
                    ? "Cancelled by user after server verification. No sale was posted."
                    : "",
              });
              notify(
                result.state === "CONFIRMED"
                  ? "This sale had already posted. Its confirmed result has been restored."
                  : "Unposted request cancelled. You can now enter a reviewed replacement.",
              );
              setCancelEntry(null);
              await load();
              await refresh();
            } catch (e) {
              setError(
                e instanceof Error
                  ? e.message
                  : "Unable to resolve this request",
              );
            } finally {
              setBusy("");
            }
          }}
        >
          <label className="sd-check">
            <input type="checkbox" required />I reviewed this pending sale and
            want to cancel it if it has not posted.
          </label>
          <ErrorNotice error={error} />
          <div className="sd-form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCancelEntry(null)}
            >
              Keep request
            </Button>
            <Button busy={!!busy} disabled={!online}>
              Check & cancel unposted sale
            </Button>
          </div>
        </form>
      </Modal>
      <div className="sd-notice">
        Resolve failed sales before submitting a daily report. A changed
        assignment, closed day, changed packaging or insufficient stock can
        require administrator review. Do not enter the same sale again while its
        outcome is uncertain.
      </div>
    </>
  );
}
export function TrackingPage() {
  const { state, refresh, online } = useApp();
  const owner = state.user.role === "owner";
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState("");
  const [vehicle, setVehicle] = useState(state.vehicles[0]?.id || "");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const active = useRef(false);
  const latest = useMemo(() => {
    const map = new Map<string, (typeof state.locationSamples)[number]>();
    for (const s of state.locationSamples) {
      const previous = map.get(s.vehicleId);
      if (!previous || new Date(s.capturedAt) > new Date(previous.capturedAt))
        map.set(s.vehicleId, s);
    }
    return map;
  }, [state]);
  function stop() {
    active.current = false;
    setSharing(false);
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }
  useEffect(
    () => () => {
      active.current = false;
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  function capture() {
    if (!active.current) return;
    if (!navigator.geolocation) {
      setError("Location is unavailable in this browser.");
      stop();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (!active.current) return;
        try {
          await api("/action", {
            action: "location.record",
            requestId: requestId(),
            data: {
              vehicleId: vehicle,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              capturedAt: new Date(pos.timestamp).toISOString(),
            },
          });
          if (active.current) {
            setLast(new Date(pos.timestamp).toISOString());
            setError("");
            await refresh();
          }
        } catch (e) {
          setError(
            e instanceof Error ? e.message : "Location could not be sent",
          );
        }
      },
      (e) => {
        setError(
          e.code === 1
            ? "Location permission was denied. Enable it in browser settings to share."
            : e.code === 2
              ? "Location is unavailable. Check device location services."
              : "Location request timed out. It will retry while sharing is on.",
        );
        if (e.code === 1) stop();
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  }
  return (
    <>
      <div className="sd-notice">
        These are last-known phone positions, with device accuracy and age.
        Foreground sharing requires permission and an open page; it is not
        independent vehicle GPS or guaranteed background tracking.
      </div>
      {!owner && (
        <Panel
          title="Share your foreground location"
          subtitle="Sharing stops when you leave this page or sign out."
        >
          <div className="sd-form">
            <Field label="Assigned vehicle">
              <select
                value={vehicle}
                disabled={sharing}
                onChange={(e) => setVehicle(e.target.value)}
              >
                {state.vehicles.map((v) => (
                  <option value={v.id} key={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="sd-inline">
              <Badge tone={sharing ? "green" : "blue"}>
                {sharing ? "Sharing enabled" : "Sharing stopped"}
              </Badge>
              {last && <small>Last sent {dateTime(last)}</small>}
            </div>
          </div>
          <ErrorNotice error={error} />
          <div className="sd-form-actions">
            {sharing ? (
              <Button variant="danger" onClick={stop}>
                Stop sharing
              </Button>
            ) : (
              <Button
                disabled={!online || !vehicle}
                onClick={() => {
                  active.current = true;
                  setSharing(true);
                  capture();
                  timer.current = setInterval(
                    capture,
                    state.settings.trackingInterval * 1000,
                  );
                }}
              >
                <MapPin size={15} />
                Start location sharing
              </Button>
            )}
          </div>
        </Panel>
      )}
      <Panel
        title={owner ? "Last-known locations" : "My last-known location"}
        subtitle={`Stale after ${state.settings.staleMinutes} minutes · device-reported accuracy`}
        className="sd-location-list"
      >
        <DataTable
          headers={[
            "Vehicle / salesman",
            "Last captured",
            "Accuracy",
            "Coordinates",
            "Status",
            "Map",
          ]}
          rows={state.vehicles.map((v) => {
            const s = latest.get(v.id);
            const stale = s
              ? (new Date(state.serverTime).getTime() -
                  new Date(s.capturedAt).getTime()) /
                  60000 >
                state.settings.staleMinutes
              : true;
            return [
              // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
              <div>
                <strong>{v.name}</strong>
                <small className="sd-sub">
                  {s?.userName ||
                    state.users.find((u) => u.id === v.salesmanId)?.name ||
                    "Unassigned"}
                </small>
              </div>,
              s ? dateTime(s.capturedAt) : "No position shared",
              s ? `± ${Math.round(s.accuracy)} m` : "—",
              s ? `${s.latitude.toFixed(5)}, ${s.longitude.toFixed(5)}` : "—",
              // eslint-disable-next-line react/jsx-key -- DataTable supplies the keyed wrapper for this cell.
              <Badge tone={!s ? "blue" : stale ? "amber" : "green"}>
                {!s ? "Unavailable" : stale ? "Stale" : "Recent"}
              </Badge>,
              s ? (
                <a
                  className="sd-btn sd-secondary"
                  href={`https://www.openstreetmap.org/?mlat=${s.latitude}&mlon=${s.longitude}#map=16/${s.latitude}/${s.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={13} />
                  Open map
                </a>
              ) : (
                <span className="sd-legend">No coordinates</span>
              ),
            ];
          })}
        />
      </Panel>
    </>
  );
}
