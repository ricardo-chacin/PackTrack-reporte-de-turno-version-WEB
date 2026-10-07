import { useState } from "react";
import axios from "axios";

const PRODUCTOS = [
    "Formato 175", "Formato 250", "Formato 330", "Formato 1000",
];

const emptyFormato = () => ({
  producto: "Formato 330",
  prog_botellas: "", env_botellas: "",
  rechazo: "0", explosiones: "0", rotura: "0",
  masico_a_ini: "", masico_a_fin: "",
  masico_b_ini: "", masico_b_fin: "",
});

const emptyAviso = () => ({ numero: "", descripcion: "" });

/* ─── Estilos inline reutilizables ─────────────────────────────────────────── */
const S = {
  /* fila label + input, igual a la versión de escritorio */
  fieldRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: "1px solid rgba(48,54,61,0.4)",
  },
  fieldLabel: {
    fontSize: 12,
    color: "var(--muted)",
    flexShrink: 0,
    width: 160,
  },
  fieldInput: {
    width: 180,
    padding: "5px 10px",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
    /* eliminar spinners nativos del navegador */
    MozAppearance: "textfield",
  },
  fieldSelect: {
    width: 180,
    padding: "5px 10px",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    color: "var(--text)",
    fontSize: 13,
    outline: "none",
  },
};

/* ─── Componente de una columna de formato ─────────────────────────────────── */
function FormatoFields({ vals, upd, color }) {
  const fields = [
    ["Producto",           "producto",      "select"],
    ["Prog. (botellas)",   "prog_botellas", "number"],
    ["Env. (botellas)",    "env_botellas",  "number"],
    ["Rechazo rotuladora", "rechazo",       "number"],
    ["Explosiones (bot)",  "explosiones",   "number"],
    ["Rotura (bot)",       "rotura",        "number"],
    ["Másico A inicial",   "masico_a_ini",  "number"],
    ["Másico A final",     "masico_a_fin",  "number"],
    ["Másico B inicial",   "masico_b_ini",  "number"],
    ["Másico B final",     "masico_b_fin",  "number"],
  ];

  return (
    <div>
      {fields.map(([label, key, type]) => (
        <div key={key} style={S.fieldRow}>
          <span style={S.fieldLabel}>{label}</span>
          {type === "select" ? (
            <select
              value={vals[key]}
              onChange={e => upd(key, e.target.value)}
              style={{ ...S.fieldSelect, borderColor: color }}
            >
              {PRODUCTOS.map(p => <option key={p}>{p}</option>)}
            </select>
          ) : (
            /* type="text" + inputMode="numeric" evita los spinners y
               permite ingresar números de cualquier cantidad de dígitos */
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={vals[key]}
              onChange={e => {
                // Solo permitir dígitos y punto decimal
                const v = e.target.value;
                if (v === "" || /^[0-9]*\.?[0-9]*$/.test(v)) upd(key, v);
              }}
              placeholder="0"
              style={S.fieldInput}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Componente principal ─────────────────────────────────────────────────── */
export default function FormTurno({ onResultado }) {
  const [turno,       setTurno]       = useState("T1");
  const [linea,       setLinea]       = useState("Línea 3");
  const [f1,          setF1]          = useState(emptyFormato());
  const [tieneF2,     setTieneF2]     = useState(false);
  const [f2,          setF2]          = useState(emptyFormato());
  const [minPerd,     setMinPerd]     = useState("0");
  const [nst,         setNst]         = useState("0");
  const [dpa,         setDpa]         = useState("0");
  const [agua,        setAgua]        = useState("0");
  const [vapor,       setVapor]       = useState("0");
  const [co2,         setCo2]         = useState("0");
  const [fallas,      setFallas]      = useState("");
  const [correctivas, setCorrectivas] = useState("");
  const [cincoW,      setCincoW]      = useState("");
  const [avisos,      setAvisos]      = useState([emptyAviso()]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  function updF1(k, v) { setF1(p => ({ ...p, [k]: v })); }
  function updF2(k, v) { setF2(p => ({ ...p, [k]: v })); }
  function updAviso(i, k, v) {
    setAvisos(prev => prev.map((a, idx) => idx === i ? { ...a, [k]: v } : a));
  }
  function addAviso()  { setAvisos(p => [...p, emptyAviso()]); }
  function delAviso(i) { setAvisos(p => p.filter((_, idx) => idx !== i)); }

  /* helper para inputs de servicios/tiempos */
  function numInput(val, set, label) {
    return (
      <div key={label} style={S.fieldRow}>
        <span style={S.fieldLabel}>{label}</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={val}
          onChange={e => {
            const v = e.target.value;
            if (v === "" || /^[0-9]*\.?[0-9]*$/.test(v)) set(v);
          }}
          placeholder="0"
          style={S.fieldInput}
        />
      </div>
    );
  }

  async function handleCalcular(guardar = false) {
    setError(""); setLoading(true);
    try {
      const body = {
        turno, planta, linea, operador, supervisor,
        formato_f1: {
          producto:      f1.producto,
          prog_botellas: +f1.prog_botellas,
          env_botellas:  +f1.env_botellas,
          rechazo:       +f1.rechazo,
          explosiones:   +f1.explosiones,
          rotura:        +f1.rotura,
          masico_a_ini:  +f1.masico_a_ini,
          masico_a_fin:  +f1.masico_a_fin,
          masico_b_ini:  +f1.masico_b_ini,
          masico_b_fin:  +f1.masico_b_fin,
        },
        formato_f2: tieneF2 ? {
          producto:      f2.producto,
          prog_botellas: +f2.prog_botellas,
          env_botellas:  +f2.env_botellas,
          rechazo:       +f2.rechazo,
          explosiones:   +f2.explosiones,
          rotura:        +f2.rotura,
          masico_a_ini:  +f2.masico_a_ini,
          masico_a_fin:  +f2.masico_a_fin,
          masico_b_ini:  +f2.masico_b_ini,
          masico_b_fin:  +f2.masico_b_fin,
        } : null,
        min_perdidos:  +minPerd,
        nst_demanda:   +nst,
        dpa:           +dpa,
        consumo_agua:  +agua,
        consumo_vapor: +vapor,
        consumo_co2:   +co2,
        comentarios: {
          fallas, correctivas, cinco_w: cincoW,
          avisos: avisos.filter(a => a.numero || a.descripcion),
        },
      };
      const endpoint = guardar ? "/reportes" : "/calcular";
      const res = await axios.post(endpoint, body);
      onResultado(res.data, guardar);
    } catch (e) {
      setError(e.response?.data?.detail || "Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>

      {/* ── Información del turno ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-section-title">Información del turno</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0 24px" }}>
          {/* Turno */}
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Turno</span>
            <select value={turno} onChange={e => setTurno(e.target.value)} style={S.fieldSelect}>
              {["T1","T2","T3","DIA"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          {/* Planta */}
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Planta</span>
            <input type="text" value={planta} onChange={e => setPlanta(e.target.value)}
              placeholder="Planta" style={S.fieldInput} />
          </div>
          {/* Línea */}
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Línea</span>
            <input type="text" value={linea} onChange={e => setLinea(e.target.value)}
              placeholder="Línea" style={S.fieldInput} />
          </div>
          {/* Operador */}
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Operador</span>
            <input type="text" value={operador} onChange={e => setOperador(e.target.value)}
              placeholder="Operador" style={S.fieldInput} />
          </div>
          {/* Supervisor */}
          <div style={S.fieldRow}>
            <span style={S.fieldLabel}>Supervisor</span>
            <input type="text" value={supervisor} onChange={e => setSupervisor(e.target.value)}
              placeholder="Supervisor" style={S.fieldInput} />
          </div>
        </div>
      </div>

      {/* ── Encabezado sección entradas ───────────────────────────────────── */}
      <div style={{
        fontSize: 14, fontWeight: 700, color: "var(--accent)",
        textTransform: "uppercase", letterSpacing: ".06em",
        marginBottom: 10,
      }}>
        Entradas del turno
      </div>

      {/* ── Columnas de formato (lado a lado igual a la app de escritorio) ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: tieneF2 ? "1fr 1fr" : "1fr",
        gap: 14,
        marginBottom: 14,
      }}>
        {/* Formato 1 */}
        <div className="card">
          <div className="form-section-title" style={{ color: "#58a6ff" }}>Formato 1</div>
          <FormatoFields vals={f1} upd={updF1} color="#58a6ff" />
        </div>

        {/* Formato 2 (visible solo si tieneF2) */}
        {tieneF2 && (
          <div className="card">
            <div className="form-section-title" style={{ color: "#f1c40f" }}>Formato 2</div>
            <FormatoFields vals={f2} upd={updF2} color="#f1c40f" />
          </div>
        )}
      </div>

      {/* Botón cambio de formato */}
      <div style={{ marginBottom: 14 }}>
        <button className="btn secondary" onClick={() => setTieneF2(!tieneF2)}>
          {tieneF2 ? "✕  Quitar Formato 2" : "+  Cambio de formato"}
        </button>
      </div>

      {/* ── Servicios y tiempos ───────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-section-title">Servicios y tiempos — turno completo</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0 32px" }}>
          {numInput(minPerd, setMinPerd, "Min. perdidos ext.")}
          {numInput(nst,     setNst,     "NST demanda (min)")}
          {numInput(dpa,     setDpa,     "DPA (min)")}
          {numInput(agua,    setAgua,    "Consumo agua")}
          {numInput(vapor,   setVapor,   "Consumo vapor")}
          {numInput(co2,     setCo2,     "Consumo CO₂")}
        </div>
      </div>

      {/* ── Comentarios ───────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-section-title">Comentarios del turno</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            ["Fallas del turno",        fallas,      setFallas],
            ["Actividades correctivas", correctivas, setCorrectivas],
            ["Análisis 5W",             cincoW,      setCincoW],
          ].map(([label, val, set]) => (
            <div className="field" key={label}>
              <label>{label}</label>
              <textarea
                value={val}
                onChange={e => set(e.target.value)}
                rows={3}
                placeholder="Sin novedad"
                style={{
                  width: "100%", padding: "7px 10px",
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", color: "var(--text)",
                  fontSize: 13, resize: "vertical", outline: "none",
                  fontFamily: "inherit",
                }}
              />
            </div>
          ))}
        </div>

        {/* Avisos / novedades */}
        <div className="form-section-title" style={{ marginBottom: 8 }}>Avisos / novedades</div>
        {avisos.map((av, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <div className="field" style={{ width: 130, margin: 0 }}>
              <input type="text" placeholder="N° aviso"
                value={av.numero} onChange={e => updAviso(i, "numero", e.target.value)} />
            </div>
            <div className="field" style={{ flex: 1, margin: 0 }}>
              <input type="text" placeholder="Descripción"
                value={av.descripcion} onChange={e => updAviso(i, "descripcion", e.target.value)} />
            </div>
            {avisos.length > 1 && (
              <button
                className="btn"
                style={{ padding: "6px 10px", color: "var(--red)", borderColor: "var(--red)" }}
                onClick={() => delAviso(i)}
              >✕</button>
            )}
          </div>
        ))}
        <button className="btn secondary" style={{ marginTop: 4 }} onClick={addAviso}>
          + Agregar aviso
        </button>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: "#2e0d0d", border: "1px solid var(--red)",
          borderRadius: "var(--radius)", padding: "10px 14px",
          marginBottom: 12, color: "var(--red)", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {loading && <div className="spinner" />}

      {/* ── Botones ───────────────────────────────────────────────────────── */}
      {!loading && (
        <div className="btn-row" style={{ marginBottom: 30 }}>
          <button className="btn secondary" onClick={() => handleCalcular(false)}>
            Vista previa
          </button>
          <button className="btn primary" onClick={() => handleCalcular(true)}>
            Calcular y guardar
          </button>
        </div>
      )}
    </div>
  );
}
