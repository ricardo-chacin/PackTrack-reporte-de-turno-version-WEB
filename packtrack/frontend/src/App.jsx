import { useState } from "react";
import FormTurno from "./components/FormTurno";
import ResultadoTurno from "./components/ResultadoTurno";
import Historial from "./components/Historial";
import "./App.css";

const TABS = ["Nuevo turno", "Historial"];

export default function App() {
  const [tab, setTab] = useState("Nuevo turno");
  const [resultado, setResultado] = useState(null);
  const [guardado, setGuardado]   = useState(false);

  function handleResultado(res, saved = false) {
    setResultado(res);
    setGuardado(saved);
  }

  function handleNuevoTurno() {
    setResultado(null);
    setGuardado(false);
    setTab("Nuevo turno");
  }

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="nav-logo">
            <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M20 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm0 11H4V9h16v9zM4 5h16v1H4z"/>
            </svg>
          </div>
          <div>
            <span className="nav-title">PackTrack</span>
            <span className="nav-sub">AB InBev · Envasado</span>
          </div>
        </div>
        <div className="nav-tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`nav-tab ${tab === t ? "active" : ""}`}
              onClick={() => { setTab(t); setResultado(null); }}
            >{t}</button>
          ))}
        </div>
      </nav>

      {/* ── Contenido ── */}
      <main className="main-content">
        {tab === "Nuevo turno" && !resultado && (
          <FormTurno onResultado={handleResultado} />
        )}
        {tab === "Nuevo turno" && resultado && (
          <ResultadoTurno
            resultado={resultado}
            guardado={guardado}
            onNuevoTurno={handleNuevoTurno}
            onGuardar={(res) => handleResultado(res, true)}
          />
        )}
        {tab === "Historial" && (
          <Historial />
        )}
      </main>
    </div>
  );
}
