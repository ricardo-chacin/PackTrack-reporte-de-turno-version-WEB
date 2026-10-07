import { useEffect, useState } from "react";
import axios from "axios";

export default function Historial() {
  const [reportes, setReportes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [detalle,  setDetalle]  = useState(null);

  useEffect(() => {
    axios.get("/reportes")
      .then(r => setReportes(r.data.items))
      .catch(() => setError("No se pudo cargar el historial."))
      .finally(() => setLoading(false));
  }, []);

  async function handleEliminar(id) {
    if (!window.confirm(`¿Eliminar reporte ${id}?`)) return;
    await axios.delete(`/reportes/${id}`);
    setReportes(p => p.filter(r => r.id !== id));
    if (detalle?.id === id) setDetalle(null);
  }

  if (loading) return <div className="spinner" />;
  if (error)   return <p style={{ color: "var(--red)" }}>{error}</p>;

  if (detalle) return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }}
        onClick={() => setDetalle(null)}>← Volver al historial</button>
      <DetalleReporte r={detalle} />
    </div>
  );

  if (reportes.length === 0)
    return <p style={{ color: "var(--muted)" }}>No hay reportes guardados todavía.</p>;

  return (
    <div className="card">
      <div className="card-title">Historial de turnos ({reportes.length})</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Fecha</th><th>Turno</th><th>Planta / Línea</th>
              <th>HL Env.</th><th>Cumplimiento</th><th>GLY</th><th>Merma</th>
              <th>Operador</th><th></th>
            </tr>
          </thead>
          <tbody>
            {reportes.map(r => (
              <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => setDetalle(r)}>
                <td style={{ fontSize: 11, color: "var(--muted)" }}>{r.id}</td>
                <td>{r.fecha}</td>
                <td><span className="badge green">{r.turno}</span></td>
                <td style={{ color: "var(--muted)" }}>
                  {r.metadata?.planta} · {r.metadata?.linea}
                </td>
                <td>{r.resumen?.["HL Envasados"]}</td>
                <td><ColorVal kpi="Cumplimiento" v={r.resumen?.Cumplimiento} /></td>
                <td><ColorVal kpi="GLY" v={r.resumen?.GLY} /></td>
                <td><ColorVal kpi="Merma" v={r.resumen?.Merma} /></td>
                <td style={{ color: "var(--muted)" }}>{r.metadata?.operador || "—"}</td>
                <td onClick={e => { e.stopPropagation(); handleEliminar(r.id); }}
                  style={{ color: "var(--red)", cursor: "pointer", fontSize: 12 }}>
                  Eliminar
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColorVal({ kpi, v }) {
  if (!v) return <span style={{ color: "var(--muted)" }}>—</span>;
  const num = parseFloat(v.replace("%", ""));
  let color = "#8b949e";
  if (["GLY","OSE"].includes(kpi))
    color = num >= 85 ? "#2ecc71" : num >= 75 ? "#f39c12" : "#e74c3c";
  else if (kpi === "Merma")
    color = num <= 1.0 ? "#2ecc71" : num <= 2.5 ? "#f39c12" : "#e74c3c";
  else if (kpi === "Cumplimiento")
    color = num >= 100 ? "#2ecc71" : num >= 90 ? "#f39c12" : "#e74c3c";
  return <span style={{ color, fontWeight: 600 }}>{v}</span>;
}

function DetalleReporte({ r }) {
  const kpis = ["HL Envasados","Cumplimiento","GLY","LEF","Merma","OSE","Agua","CO2","Vapor","TE (EPT)"];
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#C8102E" }}>
          {r.id} — Turno {r.turno}
        </h2>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          {r.fecha} · {r.metadata?.planta} · {r.metadata?.linea}
        </p>
      </div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-title">KPIs del turno</div>
        <div className="kpi-grid">
          {kpis.map(k => (
            <div className="kpi-card" key={k}>
              <div className="kpi-label">{k}</div>
              <div className="kpi-value neutral">{r.resumen?.[k] ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="card">
          <div className="card-title">Formatos</div>
          <p style={{ fontSize: 13 }}>
            <strong style={{ color: "#58a6ff" }}>F1:</strong> {r.detalle_f1?.Formato} —
            Merma: {r.detalle_f1?.Merma} · HL Env: {r.detalle_f1?.["HL Envasados"]}
          </p>
          {r.detalle_f2 && (
            <p style={{ fontSize: 13, marginTop: 6 }}>
              <strong style={{ color: "#f1c40f" }}>F2:</strong> {r.detalle_f2?.Formato} —
              Merma: {r.detalle_f2?.Merma} · HL Env: {r.detalle_f2?.["HL Envasados"]}
            </p>
          )}
        </div>
        <div className="card">
          <div className="card-title">Comentarios</div>
          {[["Fallas","fallas"],["Correctivas","correctivas"],["5W","cinco_w"]].map(([t,k]) => (
            <p key={k} style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#C8102E", fontWeight: 600 }}>{t}:</span>{" "}
              <span style={{ color: "var(--muted)" }}>{r.comentarios?.[k] || "Sin novedad"}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
