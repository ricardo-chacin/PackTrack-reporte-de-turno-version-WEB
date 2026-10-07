"""
PackTrack — Backend FastAPI
AB InBev · Línea de Envasado
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json, os

from logic import calcular_resultados

app = FastAPI(title="PackTrack API", version="1.0.0")

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # En producción: dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Formatos disponibles ──────────────────────────────────────────────────────
FORMATS = {
    "Costeñita 175":       {"factor": 0.00175, "vel": 60000},
    "Águila original 250": {"factor": 0.00250, "vel": 50000},
    "Águila light 250":    {"factor": 0.00250, "vel": 50000},
    "Póker 250":           {"factor": 0.00250, "vel": 50000},
    "Águila Original 330": {"factor": 0.00330, "vel": 42000},
    "Águila light 330":    {"factor": 0.00330, "vel": 42000},
    "Pilsen 330":          {"factor": 0.00330, "vel": 42000},
    "Póker 330":           {"factor": 0.00330, "vel": 42000},
}

DB_FILE = "reportes.json"

# ── Modelos Pydantic ──────────────────────────────────────────────────────────
class FormatoData(BaseModel):
    producto: str
    prog_botellas: float
    env_botellas: float
    rechazo: float = 0
    explosiones: float = 0
    rotura: float = 0
    masico_a_ini: float
    masico_a_fin: float
    masico_b_ini: float
    masico_b_fin: float

class Aviso(BaseModel):
    numero: str = ""
    descripcion: str = ""

class Comentarios(BaseModel):
    fallas: str = ""
    correctivas: str = ""
    cinco_w: str = ""
    avisos: List[Aviso] = []

class TurnoRequest(BaseModel):
    turno: str                          # T1, T2, T3, DIA
    fecha: Optional[str] = None         # YYYY-MM-DD (opcional, default hoy)
    planta: str = "Bogotá"
    linea: str = "Línea 3"
    operador: str = ""
    supervisor: str = ""
    formato_f1: FormatoData
    formato_f2: Optional[FormatoData] = None
    # Servicios y tiempos
    min_perdidos: float = 0
    nst_demanda: float = 0
    dpa: float = 0
    consumo_agua: float = 0
    consumo_vapor: float = 0
    consumo_co2: float = 0
    comentarios: Comentarios = Comentarios()

class TurnoResponse(BaseModel):
    id: str
    fecha: str
    turno: str
    resumen: dict
    detalle_f1: dict
    detalle_f2: Optional[dict] = None
    comentarios: dict
    metadata: dict

# ── Persistencia simple en JSON ───────────────────────────────────────────────
def leer_db() -> list:
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def guardar_db(data: list):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"app": "PackTrack", "version": "1.0.0", "status": "running"}

@app.get("/formatos")
def get_formatos():
    """Retorna lista de formatos disponibles."""
    return {"formatos": list(FORMATS.keys())}

@app.post("/calcular", response_model=TurnoResponse)
def calcular_turno(req: TurnoRequest):
    """
    Calcula los KPIs del turno sin guardar.
    Útil para previsualizar antes de confirmar.
    """
    if req.formato_f1.producto not in FORMATS:
        raise HTTPException(400, f"Formato '{req.formato_f1.producto}' no existe.")
    if req.formato_f2 and req.formato_f2.producto not in FORMATS:
        raise HTTPException(400, f"Formato F2 '{req.formato_f2.producto}' no existe.")

    f2 = req.formato_f2
    resumen, det_f1, det_f2 = calcular_resultados(
        req.formato_f1.producto,
        req.formato_f1.prog_botellas, req.formato_f1.env_botellas,
        req.formato_f1.rechazo, req.formato_f1.explosiones, req.formato_f1.rotura,
        req.formato_f1.masico_a_ini, req.formato_f1.masico_a_fin,
        req.formato_f1.masico_b_ini, req.formato_f1.masico_b_fin,
        req.min_perdidos, req.nst_demanda, req.dpa,
        req.consumo_agua, req.consumo_vapor, req.consumo_co2,
        FORMATS,
        f2.producto        if f2 else None,
        f2.prog_botellas   if f2 else 0,
        f2.env_botellas    if f2 else 0,
        f2.rechazo         if f2 else 0,
        f2.explosiones     if f2 else 0,
        f2.rotura          if f2 else 0,
        f2.masico_a_ini    if f2 else 0,
        f2.masico_a_fin    if f2 else 0,
        f2.masico_b_ini    if f2 else 0,
        f2.masico_b_fin    if f2 else 0,
    )

    fecha = req.fecha or datetime.now().strftime("%Y-%m-%d")
    return TurnoResponse(
        id="preview",
        fecha=fecha,
        turno=req.turno,
        resumen=resumen,
        detalle_f1=det_f1,
        detalle_f2=det_f2,
        comentarios=req.comentarios.model_dump(),
        metadata={
            "planta": req.planta,
            "linea": req.linea,
            "operador": req.operador,
            "supervisor": req.supervisor,
        }
    )

@app.post("/reportes", response_model=TurnoResponse, status_code=201)
def guardar_reporte(req: TurnoRequest):
    """Calcula y guarda el reporte del turno."""
    resultado = calcular_turno(req)

    # Generar ID único
    db = leer_db()
    nuevo_id = f"RPT-{datetime.now().strftime('%Y%m%d%H%M%S')}-{len(db)+1:04d}"
    resultado.id = nuevo_id

    # Guardar en DB
    db.append(resultado.model_dump())
    guardar_db(db)

    return resultado

@app.get("/reportes")
def listar_reportes(skip: int = 0, limit: int = 50):
    """Lista los últimos reportes guardados."""
    db = leer_db()
    total = len(db)
    items = list(reversed(db))[skip: skip + limit]
    return {"total": total, "items": items}

@app.get("/reportes/{reporte_id}")
def get_reporte(reporte_id: str):
    """Obtiene un reporte por ID."""
    db = leer_db()
    for r in db:
        if r["id"] == reporte_id:
            return r
    raise HTTPException(404, "Reporte no encontrado.")

@app.delete("/reportes/{reporte_id}")
def eliminar_reporte(reporte_id: str):
    """Elimina un reporte por ID."""
    db = leer_db()
    nueva_db = [r for r in db if r["id"] != reporte_id]
    if len(nueva_db) == len(db):
        raise HTTPException(404, "Reporte no encontrado.")
    guardar_db(nueva_db)
    return {"deleted": reporte_id}
