import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard,
  Car,
  Wrench,
  CalendarRange,
  LogOut,
  Trash2,
  Plus,
  RefreshCw,
  ListOrdered,
  User as UserIcon,
  Lock,
  KeyRound,
} from "lucide-react";
import { api } from "./api";

const VEHICLE_TYPES = ["A", "B", "C"];

// Magaca la muujiyo (display label) — xogta database-ka gudaheeda
// wali waa A/B/C, kaliya bandhigga (UI) ayaa la beddelay.
const VEHICLE_LABELS = {
  A: "A",
  B: "B Cusub",
  C: "B Duqda",
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   COUNT-UP NUMBER (odometer-style animated stat value)
   ============================================================ */
function CountUp({ value, prefix = "$", decimals = 2 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const duration = 500;
    const start = performance.now();

    let raf;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{prefix}{display.toFixed(decimals)}</>;
}

/* ============================================================
   AUTH SCREEN
   ============================================================ */
function AuthScreen({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.login({ username, password });
      onLoggedIn(res.data || { username });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-eyebrow">
          <Car size={13} style={{ verticalAlign: "-2px", marginRight: "5px" }} />
          Fleet Ledger
        </div>
        <h1 className="auth-title">Soo gal akoonkaaga</h1>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <div className="input-icon-wrap">
              <UserIcon size={16} className="input-icon" />
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingLeft: "36px" }}
              />
            </div>
          </div>
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Sugid…" : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center", width: "100%" }}>
                <KeyRound size={15} /> Gal
              </span>
            )}
          </button>
        </form>

        <div className="auth-switch">
          Akoon cusub kaliya maamulaha nidaamka ayaa kuu sameyn kara.
        </div>
      </div>
    </div>
  );
}

const SOMALI_MONTHS = [
  "", "Jannaayo", "Febraayo", "Maarso", "Abriil", "Maayo", "Juun",
  "Luulyo", "Ogosto", "Sebtembar", "Oktoobar", "Nofembar", "Diseembar"
];

/* ============================================================
   MINI BAR CHART (highlights the best month)
   ============================================================ */
function MonthlyBarChart({ data, accent = "#d99a3d" }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">Xog kuma filna in chart la sameeyo.</div>;
  }

  const max = Math.max(...data.map((d) => d.totalAmount));
  const bestIndex = data.findIndex((d) => d.totalAmount === max);

  return (
    <div className="bar-chart">
      {data.map((d, i) => {
        const heightPct = max > 0 ? (d.totalAmount / max) * 100 : 0;
        const isBest = i === bestIndex;
        return (
          <div className="bar-col" key={`${d.year}-${d.month}`}>
            <div className="bar-track">
              <div className="bar-value">${d.totalAmount.toFixed(0)}</div>
              <div
                className={`bar-fill ${isBest ? "bar-fill-best" : ""}`}
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  background: isBest ? accent : undefined,
                  animationDelay: `${i * 0.04}s`,
                }}
                title={`$${d.totalAmount.toFixed(2)}`}
              />
            </div>
            <div className="bar-label">{SOMALI_MONTHS[d.month].slice(0, 3)}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   DASHBOARD VIEW
   ============================================================ */
function DashboardView() {
  const [vehicleTotals, setVehicleTotals] = useState([]);
  const [technicalTotals, setTechnicalTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [vRes, tRes] = await Promise.all([
        api.getAllVehicleMonthlyTotals(),
        api.getAllTechnicalMonthlyTotals(),
      ]);
      setVehicleTotals(vRes.data || []);
      setTechnicalTotals(tRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bestVehicleMonth = vehicleTotals.reduce(
    (best, cur) => (!best || cur.totalAmount > best.totalAmount ? cur : best),
    null
  );
  const bestTechnicalMonth = technicalTotals.reduce(
    (best, cur) => (!best || cur.totalAmount > best.totalAmount ? cur : best),
    null
  );

  if (loading) {
    return <div className="view-enter loading-state">Dashboard-ka waa la soo saarayaa…</div>;
  }

  return (
    <div className="view-enter">
      <div className="section-head">
        <div className="section-title">
          <LayoutDashboard size={18} style={{ verticalAlign: "-3px", marginRight: "8px" }} />
          Dashboard
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="hero-grid">
        <div className="hero-card hero-card-amber">
          <div className="hero-eyebrow">Bisha Ugu Lacagta Badan — Baabuurta</div>
          {bestVehicleMonth ? (
            <>
              <div className="hero-month">
                {SOMALI_MONTHS[bestVehicleMonth.month]} {bestVehicleMonth.year}
              </div>
              <div className="hero-value">
                <CountUp value={bestVehicleMonth.totalAmount} />
              </div>
            </>
          ) : (
            <div className="hero-empty">Weli xog kuma filna</div>
          )}
        </div>

        <div className="hero-card hero-card-teal">
          <div className="hero-eyebrow">Bisha Ugu Lacagta Badan — Dakhliga Farsamada</div>
          {bestTechnicalMonth ? (
            <>
              <div className="hero-month">
                {SOMALI_MONTHS[bestTechnicalMonth.month]} {bestTechnicalMonth.year}
              </div>
              <div className="hero-value">
                <CountUp value={bestTechnicalMonth.totalAmount} />
              </div>
            </>
          ) : (
            <div className="hero-empty">Weli xog kuma filna</div>
          )}
        </div>
      </div>

      <div className="chart-panel">
        <div className="chart-panel-title">Dakhliga Baabuurta — Bil kasta</div>
        <MonthlyBarChart data={vehicleTotals} accent="#d99a3d" />
      </div>

      <div className="chart-panel">
        <div className="chart-panel-title">Dakhliga Farsamada — Bil kasta</div>
        <MonthlyBarChart data={technicalTotals} accent="#5cb8a6" />
      </div>
    </div>
  );
}

/* ============================================================
   ALL RECORDS VIEW (grouped by month, with cumulative running total)
   ============================================================ */
function AllRecordsView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Wax filter ah lama gelinayo si loo helo DHAMMAAN xogta diiwaangashan
      const res = await api.getVehicleData({});
      setRows(res.data || []);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Kooxee (group) xogta bil kasta, kadibna kala saar taariikh ahaan (hore -> dambe)
  const groups = {};
  for (const r of rows) {
    const d = new Date(r.entryDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = { year: d.getFullYear(), month: d.getMonth() + 1, entries: [] };
    groups[key].entries.push(r);
  }

  const sortedKeys = Object.keys(groups).sort(); // "2026-01" < "2026-07" ascending
  let cumulative = 0;
  const monthBlocks = sortedKeys.map((key) => {
    const g = groups[key];
    const monthTotal = g.entries.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    cumulative += monthTotal;
    return { ...g, key, monthTotal, cumulativeTotal: cumulative };
  });

  // Muuji bilaha ugu dambeeya kore (bishii ugu dambeysay marka hore)
  const displayBlocks = [...monthBlocks].reverse();

  return (
    <div className="view-enter">
      <div className="section-head">
        <div className="section-title">
          <CalendarRange size={18} style={{ verticalAlign: "-3px", marginRight: "8px" }} />
          Diiwaanka Oo Dhan
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">Diiwaanka waa la soo saarayaa…</div>
      ) : displayBlocks.length === 0 ? (
        <div className="empty-state">Weli diiwaan lama gelin.</div>
      ) : (
        displayBlocks.map((block, idx) => (
          <div className="month-group" key={block.key} style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="month-group-header">
              <div className="month-group-title">
                {SOMALI_MONTHS[block.month]} {block.year}
              </div>
              <div className="month-group-totals">
                <div className="month-group-stat">
                  <span className="month-group-stat-label">Bishan</span>
                  <span className="month-group-stat-value">
                    <CountUp value={block.monthTotal} />
                  </span>
                </div>
                <div className="month-group-stat month-group-stat-cumulative">
                  <span className="month-group-stat-label">Wadar Isku-taal (Bilaha oo dhan)</span>
                  <span className="month-group-stat-value">
                    <CountUp value={block.cumulativeTotal} />
                  </span>
                </div>
              </div>
            </div>

            <div className="table-wrap" style={{ marginBottom: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Taariikh</th>
                    <th>Nooca</th>
                    <th>Lacag</th>
                    <th>Sharaxaad</th>
                  </tr>
                </thead>
                <tbody>
                  {block.entries.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.entryDate).toLocaleDateString()}</td>
                      <td><span className={`type-badge ${r.vehicleType}`}>{VEHICLE_LABELS[r.vehicleType]}</span></td>
                      <td className="amount-cell">${Number(r.amount).toFixed(2)}</td>
                      <td>{r.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ============================================================
   VEHICLE DATA VIEW
   ============================================================ */
function VehicleDataView({ userId }) {
  const [type, setType] = useState("A");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ entryDate: todayISO(), amount: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getVehicleData({ userId, vehicleType: type });
      setRows(res.data || []);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, type]);

  useEffect(() => { load(); }, [load]);

  const totalForType = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const addEntry = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.addVehicleData({
        userId,
        vehicleType: type,
        entryDate: form.entryDate,
        amount: parseFloat(form.amount),
        description: form.description,
      });
      setForm({ entryDate: todayISO(), amount: "", description: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeEntry = async (id) => {
    try {
      await api.deleteVehicleData(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="view-enter">
      <div className="section-head">
        <div className="section-title">
          <Car size={18} style={{ verticalAlign: "-3px", marginRight: "8px" }} />
          Xogta Baabuurta
        </div>
      </div>

      <div className="vehicle-pills">
        {VEHICLE_TYPES.map((t) => (
          <button
            key={t}
            className={`pill ${type === t ? `active-${t}` : ""}`}
            onClick={() => setType(t)}
          >
            {VEHICLE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="stat-strip">
        <div className="stat-card">
          <div className="stat-label">Wadarta {VEHICLE_LABELS[type]}</div>
          <div className="stat-value"><CountUp value={totalForType} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tirada Diiwaanka</div>
          <div className="stat-value"><CountUp value={rows.length} prefix="" decimals={0} /></div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="form-panel">
        <form className="form-grid" onSubmit={addEntry}>
          <div className="field" style={{ margin: 0 }}>
            <label>Taariikh</label>
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Lacag ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Sharaxaad</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="ikhtiyaari"
            />
          </div>
          <button className="btn btn-primary">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center", width: "100%" }}>
              <Plus size={15} /> Ku dar
            </span>
          </button>
        </form>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-state">Xogta waa la soo saarayaa…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Weli xog uma jirto {VEHICLE_LABELS[type]}. Ku dar diiwaan cusub kore.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Taariikh</th>
                <th>Nooca</th>
                <th>Lacag</th>
                <th>Sharaxaad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.entryDate).toLocaleDateString()}</td>
                  <td><span className={`type-badge ${r.vehicleType}`}>{VEHICLE_LABELS[r.vehicleType]}</span></td>
                  <td className="amount-cell">${Number(r.amount).toFixed(2)}</td>
                  <td>{r.description || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn danger" onClick={() => removeEntry(r.id)}>
                        <Trash2 size={13} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                        Tirtir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TECHNICAL INCOME VIEW
   ============================================================ */
function TechnicalIncomeView() {
  const [type, setType] = useState("A");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ month: todayISO().slice(0, 7) + "-01", amount: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getTechnicalIncome({ vehicleType: type });
      setRows(res.data || []);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { load(); }, [load]);

  const addEntry = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.addTechnicalIncome({
        vehicleType: type,
        month: form.month,
        amount: parseFloat(form.amount),
        description: form.description,
      });
      setForm({ month: todayISO().slice(0, 7) + "-01", amount: "", description: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeEntry = async (id) => {
    try {
      await api.deleteTechnicalIncome(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="view-enter">
      <div className="section-head">
        <div className="section-title">
          <Wrench size={18} style={{ verticalAlign: "-3px", marginRight: "8px" }} />
          Dakhliga Farsamada
        </div>
      </div>

      <div className="vehicle-pills">
        {VEHICLE_TYPES.map((t) => (
          <button
            key={t}
            className={`pill ${type === t ? `active-${t}` : ""}`}
            onClick={() => setType(t)}
          >
            {VEHICLE_LABELS[t]}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="form-panel">
        <form className="form-grid" onSubmit={addEntry}>
          <div className="field" style={{ margin: 0 }}>
            <label>Bisha</label>
            <input
              type="date"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Lacag ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Sharaxaad</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="ikhtiyaari"
            />
          </div>
          <button className="btn btn-primary">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", justifyContent: "center", width: "100%" }}>
              <Plus size={15} /> Ku dar
            </span>
          </button>
        </form>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-state">Xogta waa la soo saarayaa…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Weli dakhli farsamo uma jiro {VEHICLE_LABELS[type]}.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Bisha</th>
                <th>Nooca</th>
                <th>Lacag</th>
                <th>Sharaxaad</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.month).toLocaleDateString(undefined, { year: "numeric", month: "long" })}</td>
                  <td><span className={`type-badge ${r.vehicleType}`}>{VEHICLE_LABELS[r.vehicleType]}</span></td>
                  <td className="amount-cell">${Number(r.amount).toFixed(2)}</td>
                  <td>{r.description || "—"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-btn danger" onClick={() => removeEntry(r.id)}>
                        <Trash2 size={13} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
                        Tirtir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MONTHLY REPORT VIEW
   ============================================================ */
function ReportView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getMonthlyReport(year, month);
      setRows(res.data || []);
    } catch (err) {
      setRows([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);

  return (
    <div className="view-enter">
      <div className="section-head">
        <div className="section-title">
          <CalendarRange size={18} style={{ verticalAlign: "-3px", marginRight: "8px" }} />
          Warbixinta Bille
        </div>
      </div>

      <div className="form-panel">
        <div className="form-grid">
          <div className="field" style={{ margin: 0 }}>
            <label>Sanad</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Bil (1-12)</label>
            <input type="number" min="1" max="12" value={month} onChange={(e) => setMonth(Number(e.target.value))} />
          </div>
          <button className="btn btn-ghost" onClick={load}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <RefreshCw size={14} /> Cusboonaysii
            </span>
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="stat-strip">
        {VEHICLE_TYPES.map((t) => {
          const found = rows.find((r) => r.vehicleType === t);
          return (
            <div className="stat-card" key={t}>
              <div className="stat-label">{VEHICLE_LABELS[t]}</div>
              <div className="stat-value"><CountUp value={found?.totalAmount || 0} /></div>
            </div>
          );
        })}
        <div className="stat-card">
          <div className="stat-label">Wadarta Guud</div>
          <div className="stat-value"><CountUp value={grandTotal} /></div>
        </div>
      </div>

      <div className="table-wrap">
        {loading ? (
          <div className="loading-state">Warbixinta waa la soo saarayaa…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Xog uma jirto bishan la doortay.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nooca</th>
                <th>Wadarta Lacagta</th>
                <th>Tirada Diiwaanka</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.vehicleType}>
                  <td><span className={`type-badge ${r.vehicleType}`}>{VEHICLE_LABELS[r.vehicleType]}</span></td>
                  <td className="amount-cell">${Number(r.totalAmount).toFixed(2)}</td>
                  <td>{r.totalEntries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   APP SHELL
   ============================================================ */
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");

  if (!user) {
    return <AuthScreen onLoggedIn={setUser} />;
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark"><Car size={16} /></div>
          <div className="brand-name">Fleet Ledger</div>
        </div>
        <div className="topbar-user">
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <UserIcon size={14} />
            {user.username}
          </span>
          <button className="btn btn-ghost" style={{ width: "auto", padding: "6px 14px" }} onClick={() => setUser(null)}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <LogOut size={14} /> Ka bax
            </span>
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
          <span className="tab-inner"><LayoutDashboard size={15} /> Dashboard</span>
        </button>
        <button className={`tab ${tab === "vehicle" ? "active" : ""}`} onClick={() => setTab("vehicle")}>
          <span className="tab-inner"><Car size={15} /> Xogta Baabuurta</span>
        </button>
        <button className={`tab ${tab === "technical" ? "active" : ""}`} onClick={() => setTab("technical")}>
          <span className="tab-inner"><Wrench size={15} /> Dakhliga Farsamada</span>
        </button>
        <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>
          <span className="tab-inner"><CalendarRange size={15} /> Warbixin Bille</span>
        </button>
        <button className={`tab ${tab === "records" ? "active" : ""}`} onClick={() => setTab("records")}>
          <span className="tab-inner"><ListOrdered size={15} /> Diiwaanka Oo Dhan</span>
        </button>
      </div>

      <div className="content" key={tab}>
        {tab === "dashboard" && <DashboardView />}
        {tab === "vehicle" && <VehicleDataView userId={user.id || 0} />}
        {tab === "technical" && <TechnicalIncomeView />}
        {tab === "report" && <ReportView />}
        {tab === "records" && <AllRecordsView />}
      </div>
    </div>
  );
}
