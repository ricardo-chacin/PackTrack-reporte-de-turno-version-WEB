def calcular_formato(
    formato,
    programada_botellas,
    envasada_botellas,
    botellas_rechazadas,
    botellas_explosiones,
    botellas_rotura,
    a_ini, a_fin,
    b_ini, b_fin,
    formats
):
    """
    Calcula HL y merma para un formato individual (F1 o F2).
    Retorna dict con los valores calculados para ese formato.
    """
    factor = formats[formato]["factor"]

    consumo_a = a_fin - a_ini
    consumo_b = b_fin - b_ini
    total_masicos = consumo_a + consumo_b

    hl_envasados         = round(envasada_botellas   * factor, 2)
    hl_programados       = round(programada_botellas * factor, 2)
    hl_rechazo           = botellas_rechazadas  * factor
    hl_explosiones       = botellas_explosiones * factor
    hl_rotura            = botellas_rotura      * factor

    perdida_masico_llen  = total_masicos - hl_envasados
    perdidas_totales     = perdida_masico_llen + hl_explosiones + hl_rotura + hl_rechazo

    merma = round(
        (perdidas_totales / total_masicos * 100) if total_masicos > 0 else 0.0, 2
    )

    return {
        "formato":          formato,
        "hl_programados":   hl_programados,
        "hl_envasados":     hl_envasados,
        "total_masicos":    round(total_masicos, 2),
        "hl_rechazo":       round(hl_rechazo, 2),
        "hl_explosiones":   round(hl_explosiones, 2),
        "hl_rotura":        round(hl_rotura, 2),
        "merma":            merma,
        "envasada_botellas": envasada_botellas,
        "programada_botellas": programada_botellas,
    }


def calcular_resultados(
    # F1
    formato_f1,
    prog_f1, env_f1,
    rechazo_f1, exp_f1, rotura_f1,
    a_ini_f1, a_fin_f1,
    b_ini_f1, b_fin_f1,
    # Tiempos y servicios (turno completo)
    min_perdidos, nst_demanda, dpa,
    c_agua, c_vapor, c_co2,
    formats,
    # F2 (opcional)
    formato_f2=None,
    prog_f2=0, env_f2=0,
    rechazo_f2=0, exp_f2=0, rotura_f2=0,
    a_ini_f2=0, a_fin_f2=0,
    b_ini_f2=0, b_fin_f2=0,
):
    tt  = 8.0  # horas turno

    # ── Calcular F1 ───────────────────────────────────────────────────
    f1 = calcular_formato(
        formato_f1, prog_f1, env_f1,
        rechazo_f1, exp_f1, rotura_f1,
        a_ini_f1, a_fin_f1, b_ini_f1, b_fin_f1,
        formats
    )

    # ── Calcular F2 si hubo cambio ────────────────────────────────────
    f2 = None
    if formato_f2:
        f2 = calcular_formato(
            formato_f2, prog_f2, env_f2,
            rechazo_f2, exp_f2, rotura_f2,
            a_ini_f2, a_fin_f2, b_ini_f2, b_fin_f2,
            formats
        )

    # ── Totales del turno ─────────────────────────────────────────────
    vel_f1 = formats[formato_f1]["vel"]
    hl_env_total  = f1["hl_envasados"]  + (f2["hl_envasados"]  if f2 else 0)
    hl_prog_total = f1["hl_programados"] + (f2["hl_programados"] if f2 else 0)
    env_bot_total = f1["envasada_botellas"] + (f2["envasada_botellas"] if f2 else 0)
    prog_bot_total = f1["programada_botellas"] + (f2["programada_botellas"] if f2 else 0)
    mas_total     = f1["total_masicos"] + (f2["total_masicos"] if f2 else 0)

    # Merma general
    perd_f1 = f1["total_masicos"] * f1["merma"] / 100
    perd_f2 = (f2["total_masicos"] * f2["merma"] / 100) if f2 else 0
    merma_general = round(
        ((perd_f1 + perd_f2) / mas_total * 100) if mas_total > 0 else 0.0, 2
    )

    # Cumplimiento general
    cumplimiento = round(
        (prog_bot_total / prog_bot_total * 100) if prog_bot_total > 0 else 0.0, 2
    )
    cumplimiento = round(
        (env_bot_total / prog_bot_total * 100) if prog_bot_total > 0 else 0.0, 2
    )

    # Tiempos (turno completo)
    nst = nst_demanda / 60.0
    ost = tt - nst
    st  = ost
    lt  = st - (dpa / 60.0)
    ec  = min_perdidos / 60.0

    ept = env_bot_total / vel_f1 if vel_f1 > 0 else 0.0

    gly = round((env_bot_total / (vel_f1 * st)        * 100) if st > 0        else 0.0, 2)
    lef = round((env_bot_total / (vel_f1 * (lt - ec)) * 100) if (lt-ec) > 0   else 0.0, 2)
    ose = round((ept / ost * 100)                             if ost > 0       else 0.0, 2)

    # Servicios (turno completo)
    agua_ratio  = round(c_agua                             / hl_env_total if hl_env_total > 0 else 0.0, 2)
    vapor_ratio = round(((c_vapor / 2.02) / hl_env_total * 2.7)           if hl_env_total > 0 else 0.0, 2)
    co2_ratio   = round(c_co2                              / hl_env_total if hl_env_total > 0 else 0.0, 2)

    # ── Resultados ────────────────────────────────────────────────────
    resumen = {
        "Cumplimiento": f"{cumplimiento}%",
        "HL Envasados": f"{round(hl_env_total, 2)}",
        "GLY":          f"{gly}%",
        "LEF":          f"{lef}%",
        "Merma":        f"{merma_general}%",
        "OSE":          f"{ose}%",
        "Agua":         f"{agua_ratio}",
        "CO2":          f"{co2_ratio}",
        "Vapor":        f"{vapor_ratio}",
        "TE (EPT)":     f"{round(ept, 2)}",
    }

    detalle_f1 = {
        "Formato":        formato_f1,
        "HL Programados": f"{f1['hl_programados']}",
        "HL Envasados":   f"{f1['hl_envasados']}",
        "Vol. Másico":    f"{f1['total_masicos']}",
        "Merma":          f"{f1['merma']}%",
    }

    detalle_f2 = None
    if f2:
        detalle_f2 = {
            "Formato":        formato_f2,
            "HL Programados": f"{f2['hl_programados']}",
            "HL Envasados":   f"{f2['hl_envasados']}",
            "Vol. Másico":    f"{f2['total_masicos']}",
            "Merma":          f"{f2['merma']}%",
        }

    return resumen, detalle_f1, detalle_f2
