#!/usr/bin/env python3
"""gen-proyectos.py — índice de proyectos del workspace (PROYECTOS.md).

Cada proyecto se describe a sí mismo en la cabecera YAML de
`{proyecto}/.agent-zero/memory-bank/projectbrief.md`. Este script junta esas cabeceras con
datos que saca solo del disco (bitácoras, último cierre, piezas del estándar) y escribe el
mismo PROYECTOS.md en dos lugares:

  $WORKSPACE_ROOT/PROYECTOS.md     (default ~/workspace)       — lo leen todos los usuarios
  $AISTACK_BRAIN/PROYECTOS.md      (default ~/.workspace/brain) — capa liviana del usuario

Si una carpeta no puede llevar la cabecera adentro (código de un tercero que se empaqueta
entero, carpeta de un cliente), la cabecera va en `$WORKSPACE_ROOT/.proyectos.d/<carpeta>.md`.
La del proyecto, si existe, manda.

También crea `$AISTACK_BRAIN/{proyecto}/summary.md` cuando falta. Nunca pisa uno existente:
los resúmenes escritos a mano sobreviven.

Determinista: sin fecha de generación, para que dos corridas seguidas den el mismo archivo.
Sólo escribe si el contenido cambió.

    python3 $AISTACK_HOME/scripts/gen-proyectos.py           # genera
    python3 $AISTACK_HOME/scripts/gen-proyectos.py --check   # sale con 1 si algo cambiaría

Cabecera esperada (los campos que falten se muestran como «sin declarar»):

    ---
    proyecto: nombre
    que_es: una línea
    estado: activo | en pausa | dado de baja
    incluye: qué temas van acá
    no_incluye: qué temas no van acá aunque parezcan relacionados
    servidores: hosts o ambientes
    leer_primero: [README.md, .agent-zero/memory-bank/activeContext.md]
    ---
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(os.environ.get("WORKSPACE_ROOT") or Path.home() / "workspace")
BRAIN = Path(os.environ.get("AISTACK_BRAIN") or Path.home() / ".workspace" / "brain")
# No son proyectos. Los que empiezan con punto tampoco (config de editores y asistentes).
EXCLUIDOS = {"temp"}
# Recursos compartidos: no son proyectos, pero los agentes tienen que saber que existen.
RECURSOS = {"credentials": "Almacén de credenciales de toda la infraestructura. El índice "
            "de qué archivo abrir para cada sistema está en `credentials/README.md`; ahí no "
            "hay valores. Los secretos se leen al usarlos y no se copian ni se muestran."}
# Cabeceras alternativas: $WORKSPACE_ROOT/.proyectos.d/<carpeta>.md, mismo formato. Para
# carpetas donde no se puede escribir (código de terceros, entregables de un cliente).
ALTERNATIVAS = ".proyectos.d"
CAMPOS = ["que_es", "estado", "incluye", "no_incluye", "servidores", "leer_primero"]
SD = "sin declarar"


def cabecera(brief: Path) -> dict:
    try:
        txt = brief.read_text(encoding="utf-8", errors="replace")
    except FileNotFoundError:
        return {}
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    if not m:
        return {}
    out = {}
    for linea in m.group(1).splitlines():
        k, sep, v = linea.partition(":")
        if not sep or linea.startswith((" ", "\t", "#")):
            continue
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            v = [x.strip().strip("'\"") for x in v[1:-1].split(",") if x.strip()]
        elif len(v) >= 2 and v[0] == v[-1] and v[0] in "'\"":
            v = v[1:-1]
        out[k.strip()] = v
    return out


def datos_disco(p: Path) -> dict:
    mem = sorted(f.name for f in (p / "memorias").glob("*.md")) if (p / "memorias").is_dir() else []
    fechas = [m.group(0).replace("_", "-") for f in mem if (m := re.match(r"\d{4}_\d{2}_\d{2}", f))]
    cierre = None
    try:
        cierre = json.loads((p / ".agent-zero" / "last-close.json").read_text())["lastClose"][:10]
    except Exception:
        pass
    mb = p / ".agent-zero" / "memory-bank"
    piezas = {
        "projectbrief": (mb / "projectbrief.md").is_file(),
        "activeContext": (mb / "activeContext.md").is_file(),
        "progress": (mb / "progress.md").is_file(),
        "decisions": (mb / "decisions.md").is_file(),
        ".ecc": (p / ".ecc").is_dir(),
        "memorias/": (p / "memorias").is_dir(),
    }
    entrada = [n for n in ("CLAUDE.md", "README.md") if (p / n).is_file()]
    return {"memorias": len(mem), "ultima": max(fechas) if fechas else None, "cierre": cierre,
            "faltan": [k for k, ok in piezas.items() if not ok], "entrada": entrada}


def celda(v) -> str:
    if isinstance(v, list):
        v = ", ".join(f"`{x}`" for x in v)
    return str(v or SD).replace("|", "\\|").replace("\n", " ")


def generar() -> tuple[str, list[tuple[str, dict]]]:
    proyectos = []
    for p in sorted(ROOT.iterdir(), key=lambda x: x.name.lower()):
        if not p.is_dir() or p.name.startswith(".") or p.name in EXCLUIDOS or p.name in RECURSOS:
            continue
        cab = cabecera(p / ".agent-zero" / "memory-bank" / "projectbrief.md")
        if not cab:  # carpeta que no puede llevar la cabecera adentro (ajena, de un cliente)
            cab = cabecera(ROOT / ALTERNATIVAS / f"{p.name}.md")
        d = datos_disco(p)
        if not cab.get("leer_primero"):
            cab["leer_primero"] = d["entrada"] or SD
        proyectos.append((p.name, {**{c: cab.get(c) for c in CAMPOS}, **d, "con_cabecera": bool(cab.get("que_es"))}))

    L = ["# Proyectos del workspace", "",
         "> Generado por `$AISTACK_HOME/scripts/gen-proyectos.py`. **No editar a mano:** cada",
         "> proyecto se describe en la cabecera de su `.agent-zero/memory-bank/projectbrief.md`.",
         "> La sección «Límites» dice dónde va cada tema; ante la duda, mirá ahí antes de escribir.",
         "", "| Proyecto | Qué es | Estado | Bitácoras | Última | Leer primero |", "|---|---|---|---|---|---|"]
    for n, d in proyectos:
        L.append(f"| [`{n}`]({n}/) | {celda(d['que_es'])} | {celda(d['estado'])} | {d['memorias']} | "
                 f"{d['ultima'] or '—'} | {celda(d['leer_primero'])} |")
    L += ["", "## Recursos compartidos (no son proyectos)", ""]
    for n, txt in RECURSOS.items():
        if (ROOT / n).is_dir():
            L.append(f"- **`{n}/`** — {txt}")
    L += [f"- **`{n}/`** — excluido: no es un proyecto." for n in sorted(EXCLUIDOS) if (ROOT / n).is_dir()]
    L += ["", "## Límites de cada proyecto", ""]
    for n, d in proyectos:
        L += [f"### {n}", "", f"- **Incluye:** {celda(d['incluye'])}", f"- **No incluye:** {celda(d['no_incluye'])}",
              f"- **Servidores:** {celda(d['servidores'])}"]
        if d["cierre"]:
            L.append(f"- **Último cierre:** {d['cierre']}")
        if d["faltan"]:
            L.append(f"- **Le falta del estándar:** {', '.join(f'`{x}`' for x in d['faltan'])}")
        L.append("")
    return "\n".join(L).rstrip() + "\n", proyectos


def resumen(n: str, d: dict) -> str:
    return (f"# {n} — resumen acotado\n\n**Ruta real:** `{ROOT / n}`\n\n## Qué es\n- {celda(d['que_es'])}\n\n"
            f"## Leer primero\n" + "\n".join(f"- `{ROOT / n / x}`" for x in (d['leer_primero'] if isinstance(d['leer_primero'], list) else [])) + "\n")


def escribir(path: Path, txt: str) -> bool:
    try:
        if path.read_text(encoding="utf-8") == txt:
            return False
    except FileNotFoundError:
        pass
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(txt, encoding="utf-8")
    return True


def main() -> int:
    txt, proyectos = generar()
    destinos = [ROOT / "PROYECTOS.md", BRAIN / "PROYECTOS.md"]
    if "--check" in sys.argv:
        cambia = [str(p) for p in destinos if not p.is_file() or p.read_text(encoding="utf-8") != txt]
        print("\n".join(cambia) or "al día")
        return 1 if cambia else 0
    for p in destinos:
        print(("escrito   " if escribir(p, txt) else "sin cambio"), p)
    for n, d in proyectos:
        s = BRAIN / n / "summary.md"
        if not s.exists():
            escribir(s, resumen(n, d))
            print("resumen   ", s)
    return 0


if __name__ == "__main__":
    sys.exit(main())
