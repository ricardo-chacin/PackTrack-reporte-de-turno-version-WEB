import pandas as pd
import os
from datetime import datetime
from tkinter import messagebox


def guardar_en_excel(datos_entrada, resumen, comentarios=None, det_f1=None, det_f2=None):
    nombre_archivo = "registro_reportes.xlsx"

    registro = {"Fecha_Registro": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
    registro.update(datos_entrada)

    # Resumen general
    for k, v in resumen.items():
        if isinstance(v, str) and "%" in v:
            try:    registro[k] = float(v.replace("%", ""))
            except: registro[k] = v
        else:
            registro[k] = v

    # Detalle F1
    if det_f1:
        for k, v in det_f1.items():
            llave = f"F1_{k.replace(' ', '_')}"
            try:    registro[llave] = float(str(v).replace("%", ""))
            except: registro[llave] = v

    # Detalle F2
    if det_f2:
        for k, v in det_f2.items():
            llave = f"F2_{k.replace(' ', '_')}"
            try:    registro[llave] = float(str(v).replace("%", ""))
            except: registro[llave] = v

    # Comentarios
    if comentarios:
        registro["Comentario_Fallas"]      = comentarios.get("fallas", "")
        registro["Comentario_Correctivas"] = comentarios.get("correctivas", "")
        registro["Comentario_5W"]          = comentarios.get("cinco_w", "")
        # Guardar lista de avisos: cada aviso en columnas Aviso_1_Num, Aviso_1_Desc, etc.
        avisos = comentarios.get("avisos", [])
        for i, av in enumerate(avisos, start=1):
            registro[f"Aviso_{i}_Numero"]      = av.get("numero", "")
            registro[f"Aviso_{i}_Descripcion"] = av.get("descripcion", "")
            registro[f"Aviso_{i}_Estado"]       = "ABIERTO" if av.get("numero") else ""

    df_nuevo = pd.DataFrame([registro])

    try:
        if not os.path.exists(nombre_archivo):
            df_nuevo.to_excel(nombre_archivo, index=False, engine='openpyxl')
        else:
            with pd.ExcelWriter(nombre_archivo, engine='openpyxl',
                                mode='a', if_sheet_exists='overlay') as writer:
                try:
                    df_existente = pd.read_excel(nombre_archivo)
                    df_final = pd.concat([df_existente, df_nuevo], ignore_index=True)
                    df_final.to_excel(writer, index=False, sheet_name='Sheet1')
                except Exception:
                    df_nuevo.to_excel(nombre_archivo, index=False, engine='openpyxl')

        messagebox.showinfo("Éxito", f"Reporte guardado en {nombre_archivo}")
        return True
    except Exception as e:
        messagebox.showerror("Error de Guardado",
            f"No se pudo guardar.\nAsegurate de que el Excel no esté abierto.\nError: {str(e)}")
        return False
