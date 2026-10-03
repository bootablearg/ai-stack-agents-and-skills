#!/usr/bin/env python3
"""findings.py — registro de hallazgos de security-scan-verified.

Lleva el estado de cada hallazgo y calcula el conteo final. El modelo decide los
veredictos; este script los guarda, valida las transiciones y cuenta. Ningún número del
reporte sale de lo que el modelo "recuerda": sale de este archivo.

Sólo biblioteca estándar de Python 3.9+. Licencia MIT (la del repositorio ai-stack).

Uso:
  findings.py init   --dir D --target RUTA --nivel {rapido,estandar,profundo}
  findings.py ingest --dir D ARCHIVO...        # SARIF 2.1.0 o JSON de cyber-neo scan_secrets.py
  findings.py add    --dir D --titulo T --archivo F --linea N --severidad S [--cwe CWE-89] [--regla R] [--fuente modelo]
  findings.py set    --dir D ID ESTADO --motivo "..." [--evidencia RUTA] [--de ID]
  findings.py list   --dir D [--estado ESTADO]
  findings.py tally  --dir D [--estricto]
  findings.py report --dir D --out ARCHIVO.md
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path

LEDGER = "findings.json"

# Transiciones permitidas. Todo lo que no está acá, el script lo rechaza.
TRANSICIONES = {
    "nuevo": {"confirmado", "descartado", "duplicado"},
    "confirmado": {"parche-propuesto", "aceptado-sin-parche"},
    "parche-propuesto": {"parche-verificado", "parche-rechazado"},
    "parche-rechazado": {"parche-propuesto", "aceptado-sin-parche"},
    "parche-verificado": {"aplicado", "aceptado-sin-parche"},
    "descartado": set(),
    "duplicado": set(),
    "aplicado": set(),
    "aceptado-sin-parche": set(),
}
# Pendiente = sin veredicto, o con un parche que todavía no pasó la verificación.
PENDIENTES = {"nuevo", "parche-propuesto", "parche-rechazado"}
SEVERIDADES = ["critica", "alta", "media", "baja", "info"]
SARIF_NIVEL = {"error": "alta", "warning": "media", "note": "baja", "none": "info"}
CWE_RE = re.compile(r"CWE[-_ ]?(\d{1,4})", re.I)


def ahora() -> str:
    return dt.datetime.now().astimezone().isoformat(timespec="seconds")


def cargar(d: Path) -> dict:
    p = d / LEDGER
    if not p.exists():
        sys.exit(f"No existe {p}. Corré primero: findings.py init --dir {d} ...")
    return json.loads(p.read_text())


def guardar(d: Path, data: dict) -> None:
    p = d / LEDGER
    tmp = p.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False))
    tmp.replace(p)


def enmascarar(texto: str) -> str:
    """Nunca guardar un secreto en claro: deja los 4 primeros caracteres de cada token largo."""
    return re.sub(r"[A-Za-z0-9_\-:+/=]{12,}", lambda m: m.group(0)[:4] + "…[oculto]", texto or "")


def fid(regla: str, archivo: str, linea: int | None, titulo: str) -> str:
    base = f"{regla}|{archivo}|{linea or 0}|{titulo}".encode()
    return "F" + hashlib.sha1(base).hexdigest()[:7]


def normalizar_sev(s: str | None) -> str:
    s = (s or "").lower()
    alias = {"critical": "critica", "crítica": "critica", "high": "alta", "medium": "media",
             "moderate": "media", "low": "baja", "informational": "info"}
    s = alias.get(s, s)
    return s if s in SEVERIDADES else "media"


def nuevo_hallazgo(data: dict, *, regla, archivo, linea, titulo, severidad, cwe, fuente, evidencia="") -> str | None:
    i = fid(regla, archivo, linea, titulo)
    if i in data["hallazgos"]:
        return None
    data["hallazgos"][i] = {
        "id": i, "regla": regla, "archivo": archivo, "linea": linea, "titulo": titulo,
        "severidad": normalizar_sev(severidad), "cwe": cwe, "fuente": fuente,
        "evidencia_origen": enmascarar(evidencia)[:300], "estado": "nuevo",
        "historial": [{"estado": "nuevo", "cuando": ahora(), "motivo": f"ingresado desde {fuente}"}],
    }
    return i


def cmd_init(a) -> None:
    d = Path(a.dir)
    d.mkdir(parents=True, exist_ok=True)
    if (d / LEDGER).exists() and not a.force:
        sys.exit(f"{d / LEDGER} ya existe. Usá --force para empezar de cero.")
    guardar(d, {"version": 1, "target": a.target, "nivel": a.nivel, "creado": ahora(), "hallazgos": {}})
    print(f"Registro creado en {d / LEDGER} (nivel {a.nivel}, target {a.target})")


def ingest_sarif(data: dict, doc: dict, origen: str) -> int:
    n = 0
    for run in doc.get("runs", []):
        tool = run.get("tool", {}).get("driver", {})
        herramienta = tool.get("name", origen)
        reglas = {r.get("id"): r for r in tool.get("rules", []) or []}
        for r in run.get("results", []) or []:
            rid = r.get("ruleId") or "sin-regla"
            loc = (r.get("locations") or [{}])[0].get("physicalLocation", {})
            archivo = loc.get("artifactLocation", {}).get("uri", "?")
            linea = loc.get("region", {}).get("startLine")
            msg = (r.get("message") or {}).get("text", rid)
            regla = reglas.get(rid, {})
            sev = r.get("properties", {}).get("security-severity") or regla.get("properties", {}).get("problem.severity")
            if sev and re.fullmatch(r"[\d.]+", str(sev)):
                v = float(sev); sev = "critica" if v >= 9 else "alta" if v >= 7 else "media" if v >= 4 else "baja"
            sev = sev or SARIF_NIVEL.get(r.get("level") or regla.get("defaultConfiguration", {}).get("level", "warning"), "media")
            tags = " ".join(regla.get("properties", {}).get("tags", []) + [json.dumps(r.get("taxa", []))])
            m = CWE_RE.search(tags)
            cwe = f"CWE-{int(m.group(1))}" if m else None
            if nuevo_hallazgo(data, regla=f"{herramienta}:{rid}", archivo=archivo, linea=linea,
                              titulo=msg.split("\n")[0][:160], severidad=sev, cwe=cwe, fuente=herramienta):
                n += 1
    return n


def ingest_secretos(data: dict, doc: dict) -> int:
    n = 0
    for f in doc.get("findings", []):
        if nuevo_hallazgo(data, regla=f"cyber-neo:secret:{f.get('type', '?')}", archivo=f.get("file", "?"),
                          linea=f.get("line"), titulo=f"Secreto en el código: {f.get('type', '?')}",
                          severidad=f.get("severity"), cwe="CWE-798", fuente="cyber-neo scan_secrets",
                          evidencia=f.get("evidence", "")):
            n += 1
    return n


def cmd_ingest(a) -> None:
    d = Path(a.dir); data = cargar(d); total = 0
    for p in a.archivos:
        doc = json.loads(Path(p).read_text())
        if isinstance(doc, dict) and "runs" in doc:
            n = ingest_sarif(data, doc, Path(p).stem)
        elif isinstance(doc, dict) and "findings" in doc:
            n = ingest_secretos(data, doc)
        else:
            sys.exit(f"{p}: formato no reconocido (esperaba SARIF con 'runs' o JSON de scan_secrets con 'findings')")
        print(f"{p}: {n} hallazgos nuevos"); total += n
    guardar(d, data)
    print(f"Total ingresado: {total}. En el registro: {len(data['hallazgos'])}")


def cmd_add(a) -> None:
    d = Path(a.dir); data = cargar(d)
    i = nuevo_hallazgo(data, regla=a.regla or "revision-manual", archivo=a.archivo, linea=a.linea,
                       titulo=a.titulo, severidad=a.severidad, cwe=a.cwe, fuente=a.fuente)
    if not i:
        sys.exit("Ese hallazgo ya está en el registro (mismo archivo, línea, regla y título).")
    guardar(d, data); print(i)


def cmd_set(a) -> None:
    d = Path(a.dir); data = cargar(d)
    h = data["hallazgos"].get(a.id) or sys.exit(f"No existe el hallazgo {a.id}")
    actual, destino = h["estado"], a.estado
    if destino not in TRANSICIONES.get(actual, set()):
        permitidos = ", ".join(sorted(TRANSICIONES.get(actual, set()))) or "ninguno (estado final)"
        sys.exit(f"{a.id}: no se puede pasar de '{actual}' a '{destino}'. Desde '{actual}' se puede ir a: {permitidos}")
    if not a.motivo or len(a.motivo.strip()) < 15:
        sys.exit("Cada cambio de estado necesita un --motivo concreto (15 caracteres como mínimo): qué se verificó y cómo.")
    if destino == "duplicado":
        if not a.de or a.de not in data["hallazgos"] or a.de == a.id:
            sys.exit("Un duplicado necesita --de ID con otro hallazgo existente.")
    if destino in ("confirmado", "parche-verificado") and not a.evidencia:
        sys.exit(f"'{destino}' necesita --evidencia: la ruta al archivo con la verificación (salida de fp-check, test, revisión).")
    if a.evidencia and not Path(a.evidencia).exists():
        sys.exit(f"--evidencia {a.evidencia}: el archivo no existe.")
    h["estado"] = destino
    h["historial"].append({"estado": destino, "cuando": ahora(), "motivo": a.motivo.strip(),
                           "evidencia": a.evidencia, "de": a.de})
    guardar(d, data); print(f"{a.id}: {actual} → {destino}")


def cmd_list(a) -> None:
    data = cargar(Path(a.dir))
    for h in sorted(data["hallazgos"].values(), key=lambda x: (SEVERIDADES.index(x["severidad"]), x["archivo"])):
        if a.estado and h["estado"] != a.estado:
            continue
        print(f"{h['id']}  {h['estado']:<20} {h['severidad']:<7} {h['cwe'] or '-':<8} {h['archivo']}:{h['linea'] or '-'}  {h['titulo'][:80]}")


def contar(data: dict) -> dict:
    hs = list(data["hallazgos"].values())
    por_estado = {e: 0 for e in TRANSICIONES}
    for h in hs:
        por_estado[h["estado"]] += 1
    confirmados = [h for h in hs if any(x["estado"] == "confirmado" for x in h["historial"])]
    por_sev = {s: sum(1 for h in confirmados if h["severidad"] == s) for s in SEVERIDADES}
    pendientes = [h["id"] for h in hs if h["estado"] in PENDIENTES]
    return {"total": len(hs), "por_estado": por_estado, "confirmados": len(confirmados),
            "confirmados_por_severidad": por_sev, "pendientes": pendientes}


def cmd_tally(a) -> None:
    t = contar(cargar(Path(a.dir)))
    print(json.dumps(t, indent=2, ensure_ascii=False))
    if a.estricto and t["pendientes"]:
        sys.exit(f"Quedan {len(t['pendientes'])} hallazgos sin estado final: {', '.join(t['pendientes'])}")


def cmd_report(a) -> None:
    data = cargar(Path(a.dir)); t = contar(data)
    L = [f"# Escaneo de seguridad verificado — {data['target']}", "",
         f"- Nivel: **{data['nivel']}** · iniciado {data['creado']} · reporte {ahora()}",
         f"- Hallazgos registrados: **{t['total']}** · confirmados: **{t['confirmados']}** · sin cerrar: **{len(t['pendientes'])}**",
         "", "> Los números de este reporte los calcula `findings.py` desde el registro; no los escribe el modelo.", "",
         "## Conteo por estado", "", "| Estado | Cantidad |", "|---|---|"]
    L += [f"| {e} | {n} |" for e, n in t["por_estado"].items() if n]
    L += ["", "## Confirmados por severidad", "", "| Severidad | Cantidad |", "|---|---|"]
    L += [f"| {s} | {n} |" for s, n in t["confirmados_por_severidad"].items()]
    L += ["", "## Hallazgos", "", "| ID | Estado | Severidad | CWE | Ubicación | Título |", "|---|---|---|---|---|---|"]
    for h in sorted(data["hallazgos"].values(), key=lambda x: (SEVERIDADES.index(x["severidad"]), x["estado"])):
        L.append(f"| {h['id']} | {h['estado']} | {h['severidad']} | {h['cwe'] or '-'} | `{h['archivo']}:{h['linea'] or '-'}` | {h['titulo'].replace('|', '/')} |")
    L += ["", "## Detalle de lo confirmado", ""]
    for h in data["hallazgos"].values():
        if not any(x["estado"] == "confirmado" for x in h["historial"]):
            continue
        L += [f"### {h['id']} — {h['titulo']}", "", f"`{h['archivo']}:{h['linea'] or '-'}` · {h['severidad']} · {h['cwe'] or 'sin CWE'} · origen: {h['fuente']}", ""]
        L += [f"- **{x['estado']}** ({x['cuando']}): {x['motivo']}" + (f" — evidencia: `{x['evidencia']}`" if x.get("evidencia") else "") for x in h["historial"]]
        L.append("")
    if t["pendientes"]:
        L += ["## ⚠️ Sin cerrar", "", "Estos hallazgos no tienen veredicto final; el escaneo no está terminado:", ""]
        L += [f"- {i}" for i in t["pendientes"]]
    Path(a.out).write_text("\n".join(L) + "\n")
    print(f"Reporte escrito en {a.out}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Registro de hallazgos de security-scan-verified")
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("init"); p.add_argument("--dir", required=True); p.add_argument("--target", required=True)
    p.add_argument("--nivel", choices=["rapido", "estandar", "profundo"], required=True); p.add_argument("--force", action="store_true")
    p = sp.add_parser("ingest"); p.add_argument("--dir", required=True); p.add_argument("archivos", nargs="+")
    p = sp.add_parser("add"); p.add_argument("--dir", required=True); p.add_argument("--titulo", required=True)
    p.add_argument("--archivo", required=True); p.add_argument("--linea", type=int); p.add_argument("--severidad", required=True)
    p.add_argument("--cwe"); p.add_argument("--regla"); p.add_argument("--fuente", default="revision-modelo")
    p = sp.add_parser("set"); p.add_argument("--dir", required=True); p.add_argument("id"); p.add_argument("estado", choices=list(TRANSICIONES))
    p.add_argument("--motivo", required=True); p.add_argument("--evidencia"); p.add_argument("--de")
    p = sp.add_parser("list"); p.add_argument("--dir", required=True); p.add_argument("--estado")
    p = sp.add_parser("tally"); p.add_argument("--dir", required=True); p.add_argument("--estricto", action="store_true")
    p = sp.add_parser("report"); p.add_argument("--dir", required=True); p.add_argument("--out", required=True)
    a = ap.parse_args()
    {"init": cmd_init, "ingest": cmd_ingest, "add": cmd_add, "set": cmd_set,
     "list": cmd_list, "tally": cmd_tally, "report": cmd_report}[a.cmd](a)


if __name__ == "__main__":
    main()
