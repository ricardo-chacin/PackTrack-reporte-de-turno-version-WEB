import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import axios from "axios";
import { useState } from "react";

function getColor(kpi, valStr) {
  try {
    const v = parseFloat(valStr.replace("%", ""));
    if (["GLY", "OSE"].includes(kpi))
      return v >= 85 ? "green" : v >= 75 ? "yellow" : "red";
    if (kpi === "LEF")
      return v >= 90 ? "green" : v >= 80 ? "yellow" : "red";
    if (kpi.includes("Merma"))
      return v <= 1.0 ? "green" : v <= 2.5 ? "yellow" : "red";
    if (kpi === "Cumplimiento")
      return v >= 100 ? "green" : v >= 90 ? "yellow" : "red";
    if (kpi === "Agua")
      return v <= 1.5 ? "green" : v <= 2.0 ? "yellow" : "red";
    if (kpi === "CO2")
      return v <= 2.0 ? "green" : v <= 2.5 ? "yellow" : "red";
    if (kpi === "Vapor")
      return v <= 40 ? "green" : v <= 50 ? "yellow" : "red";
  } catch (_) {}
  return "neutral";
}

const COLOR_MAP = { green: "#2ecc71", yellow: "#f39c12", red: "#e74c3c", neutral: "#e9ecef" };

const KPI_ORDEN = [
  "HL Envasados","Cumplimiento","GLY","LEF","Merma",
  "OSE","Agua","CO2","Vapor","TE (EPT)"
];

export default function ResultadoTurno({ resultado, guardado, onNuevoTurno, onGuardar }) {
  const { resumen, detalle_f1, detalle_f2, comentarios, turno, fecha, metadata } = resultado;
  const [saving, setSaving] = useState(false);

  async function handleGuardar() {
    setSaving(true);
    try {
      // Si ya tenemos ID real (guardado), no volver a guardar
      if (resultado.id !== "preview") { onGuardar(resultado); return; }
      // Re-guardar vía endpoint (no ideal, pero funcional para demo)
      onGuardar(resultado);
    } finally {
      setSaving(false);
    }
  }

  // Datos gráfica
  const grafKpis = ["GLY", "LEF", "OSE", "Merma"];
  const grafData = grafKpis.map(k => ({
    name: k,
    value: parseFloat(resumen[k]?.replace("%", "") ?? 0),
    color: COLOR_MAP[getColor(k, resumen[k] ?? "0")],
  }));

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#C8102E" }}>
            Reporte de Turno — {turno}
          </h2>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>
            {fecha} · {metadata?.planta} · {metadata?.linea}
            {metadata?.operador && ` · Op: ${metadata.operador}`}
            {metadata?.supervisor && ` · Sup: ${metadata.supervisor}`}
          </p>
        </div>
        <div className="btn-row">
          {!guardado && (
            <button className="btn primary" onClick={handleGuardar} disabled={saving}>
              {saving ? "Guardando…" : "Guardar reporte"}
            </button>
          )}
          {guardado && (
            <span className="badge green" style={{ fontSize: 12, padding: "5px 12px" }}>
              ✓ Guardado · {resultado.id}
            </span>
          )}
          <button className="btn secondary" onClick={onNuevoTurno}>Nuevo turno</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-title">Resumen general del turno</div>
        <div className="kpi-grid">
          {KPI_ORDEN.map(k => (
            <div className="kpi-card" key={k}>
              <div className="kpi-label">{k}</div>
              <div className={`kpi-value ${getColor(k, resumen[k] ?? "0")}`}>
                {resumen[k] ?? "--"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Gráfica + Detalle formatos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

        <div className="card">
          <div className="card-title">Eficiencias clave</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={grafData} layout="vertical"
              margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
              <XAxis type="number" domain={[0, 115]} tick={{ fill: "#8b949e", fontSize: 11 }}
                axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#e9ecef", fontSize: 12, fontWeight: 700 }}
                axisLine={false} tickLine={false} width={38} />
              <Tooltip
                contentStyle={{ background: "#1c2333", border: "1px solid #30363d", borderRadius: 8 }}
                labelStyle={{ color: "#e9ecef" }}
                formatter={v => [`${v.toFixed(1)}%`]} />
              <ReferenceLine x={85} stroke="#555" strokeDasharray="4 2" />
              <ReferenceLine x={90} stroke="#888" strokeDasharray="4 2" />
              <Bar dataKey="value" radius={[0,4,4,0]}
                label={{ position: "right", fill: "#8b949e", fontSize: 11,
                  formatter: v => `${v.toFixed(1)}%` }}>
                {grafData.map((entry, i) => (
                  <rect key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Barras manuales con colores individuales */}
          <div style={{ marginTop: 8 }}>
            {grafData.map(d => (
              <div className="bar-row" key={d.name}>
                <span className="bar-name">{d.name}</span>
                <div className="bar-track">
                  <div className="bar-fill"
                    style={{ width: `${Math.min(d.value, 100)}%`, background: d.color }} />
                </div>
                <span className="bar-pct" style={{ color: d.color }}>{d.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Detalle por formato</div>
          <div className="fmt-grid">
            <FormatoCard detalle={detalle_f1} tag="F1" cls="f1" />
            {detalle_f2 && <FormatoCard detalle={detalle_f2} tag="F2" cls="f2" />}
          </div>
        </div>
      </div>

      {/* ── Comentarios ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-title">Comentarios del turno</div>
          {[
            ["Fallas del turno",       comentarios?.fallas],
            ["Actividades correctivas", comentarios?.correctivas],
            ["Análisis 5W",            comentarios?.cinco_w],
          ].map(([titulo, texto]) => (
            <div className="com-card" key={titulo}>
              <div className="com-title">{titulo}</div>
              <div className="com-text">{texto || "Sin novedad"}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">
            Avisos del turno ({comentarios?.avisos?.length ?? 0})
          </div>
          {comentarios?.avisos?.length > 0
            ? comentarios.avisos.map((av, i) => (
                <div className="aviso-row" key={i}>
                  <span className="av-num">N° {av.numero || "—"}</span>
                  <span className="av-desc">{av.descripcion || "Sin descripción"}</span>
                </div>
              ))
            : <p style={{ color: "var(--muted)", fontSize: 12 }}>Sin avisos registrados.</p>
          }
        </div>
      </div>
    </div>
  );
}

function FormatoCard({ detalle, tag, cls }) {
  const mermaColor = getColor("Merma", detalle?.Merma ?? "0");
  return (
    <div className="fmt-card">
      <div className="fmt-header">
        <span className={`fmt-tag ${cls}`}>{tag}</span>
        <span style={{ fontSize: 10, color: "var(--muted)" }}>{detalle?.Formato}</span>
      </div>
      <div className="fmt-kpis">
        {[
          ["HL Prog.",  detalle?.["HL Programados"]],
          ["HL Env.",   detalle?.["HL Envasados"]],
          ["Másico",    detalle?.["Vol. Másico"]],
          ["Merma",     detalle?.Merma],
        ].map(([l, v]) => (
          <div className="fk" key={l}>
            <div className="fk-l">{l}</div>
            <div className="fk-v"
              style={{ color: l === "Merma" ? COLOR_MAP[mermaColor] : "var(--text)" }}>
              {v ?? "--"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
