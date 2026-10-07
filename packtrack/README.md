# PackTrack — AB InBev · Reporte de Turno
> Aplicación web para gestión de KPIs de envasado por turno.

---

## Estructura del proyecto

```
packtrack/
├── backend/
│   ├── main.py          ← API FastAPI
│   ├── logic.py         ← Cálculos (sin cambios respecto al desktop)
│   ├── storage.py       ← (opcional, para exportar Excel)
│   ├── requirements.txt
│   └── reportes.json    ← Base de datos local (se crea automáticamente)
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   └── components/
    │       ├── FormTurno.jsx
    │       ├── ResultadoTurno.jsx
    │       └── Historial.jsx
    └── package.json
```

---

## Instalación y ejecución

### 1. Backend (FastAPI)

```bash
cd backend

# Crear entorno virtual (recomendado)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / Mac

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
uvicorn main:app --reload --port 8000
```

El backend queda disponible en: **http://localhost:8000**
Documentación automática (Swagger): **http://localhost:8000/docs**

---

### 2. Frontend (React)

En otra terminal:

```bash
cd frontend

# Instalar dependencias (solo la primera vez)
npm install

# Iniciar app
npm start
```

La app queda disponible en: **http://localhost:3000**

> El frontend usa `"proxy": "http://localhost:8000"` en package.json,
> por lo que las llamadas a `/calcular`, `/reportes`, etc. van automáticamente al backend.

---

## Endpoints de la API

| Método | Ruta                  | Descripción                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/`                   | Estado del servidor                      |
| GET    | `/formatos`           | Lista de formatos disponibles            |
| POST   | `/calcular`           | Calcula KPIs sin guardar (vista previa)  |
| POST   | `/reportes`           | Calcula y guarda el reporte              |
| GET    | `/reportes`           | Lista todos los reportes                 |
| GET    | `/reportes/{id}`      | Obtiene un reporte por ID                |
| DELETE | `/reportes/{id}`      | Elimina un reporte                       |

---

## Próximos pasos (roadmap)

- [ ] Autenticación con usuarios por planta / línea
- [ ] Base de datos PostgreSQL (reemplazar JSON local)
- [ ] Dashboard de tendencias semanales / mensuales
- [ ] Exportación a Excel (reutilizando storage.py)
- [ ] Deploy en Railway (backend) + Vercel (frontend)
- [ ] Integración con SAP / sistemas AB InBev vía API REST

---

## Tecnologías

| Capa      | Tecnología                        |
|-----------|-----------------------------------|
| Backend   | Python 3.11 · FastAPI · Uvicorn   |
| Frontend  | React 18 · Recharts · Axios       |
| Datos     | JSON local → PostgreSQL (futuro)  |
| Deploy    | Railway + Vercel (recomendado)    |
