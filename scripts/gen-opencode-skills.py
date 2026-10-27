#!/usr/bin/env python3
"""gen-opencode-skills.py — vista plana de skills para OpenCode ($AISTACK_HOME/skills-opencode).

Por qué existe: OpenCode busca skills con `{skill,skills}/**/SKILL.md`, recorriendo TODAS las
subcarpetas. `skills/` tiene colecciones (marketingskills/, claude-seo/, …) y, para que Claude
Code (que mira un solo nivel) las vea, enlaces sueltos de primer nivel a los mismos skills.
OpenCode encuentra cada uno dos veces y registra "duplicate skill name" en cada arranque.

Esta vista tiene UN enlace por nombre de skill. `~/.config/opencode/skill` de cada usuario
apunta acá en lugar de a `skills/`. `skills/` no cambia: Claude Code sigue igual.

Reglas:
- El nombre es el `name:` del frontmatter.
- Gana el skill de primer nivel de `skills/` (el que ve Claude Code); si no hay, el primero
  de las colecciones en orden alfabético de ruta. Los choques se informan por salida.
- Enlaces relativos: la vista sirve en cualquier copia del árbol.
- Se arma en una carpeta temporal y se reemplaza entera: no quedan enlaces huérfanos.

    python3 $AISTACK_HOME/scripts/gen-opencode-skills.py

Lo llama gen-catalogs.sh: correr eso al agregar o sacar un skill.
"""
from __future__ import annotations

import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(os.environ.get("AISTACK_HOME") or Path(__file__).resolve().parents[1])
SKILLS = ROOT / "skills"
VIEW = ROOT / "skills-opencode"


def nombre(skill_md: Path) -> str | None:
    try:
        txt = skill_md.read_text(errors="replace")[:4000]
    except OSError:
        return None
    m = re.match(r"^---\s*\n(.*?)\n---", txt, re.S)
    if not m:
        return None
    n = re.search(r"^name:\s*['\"]?([^'\"\n]+?)['\"]?\s*$", m.group(1), re.M)
    return n.group(1).strip() if n else None


def main() -> int:
    candidatos: list[tuple[int, str, Path]] = []  # (prioridad, ruta para ordenar, carpeta del skill)
    for dp, dns, fns in os.walk(SKILLS, followlinks=True):
        dns.sort()
        if "SKILL.md" in fns:
            d = Path(dp)
            nivel = len(d.relative_to(SKILLS).parts)
            candidatos.append((0 if nivel == 1 else 1, str(d.relative_to(SKILLS)), d))
    candidatos.sort()

    elegido: dict[str, Path] = {}
    choques: dict[str, set[str]] = {}
    for _, _, d in candidatos:
        n = nombre(d / "SKILL.md")
        if not n or "/" in n:
            continue
        if n in elegido:
            if os.path.realpath(elegido[n]) != os.path.realpath(d):
                choques.setdefault(n, {str(elegido[n].relative_to(SKILLS))}).add(str(d.relative_to(SKILLS)))
            continue
        elegido[n] = d

    tmp = VIEW.with_name(VIEW.name + ".tmp")
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    anidados = []
    for n, d in sorted(elegido.items()):
        os.symlink(os.path.relpath(d, VIEW), tmp / n)
        extra = [p for p in d.rglob("SKILL.md") if p.parent != d]
        if extra:
            anidados.append((n, len(extra)))
    (tmp / "README.md").write_text(
        "# skills-opencode — generado, no editar\n\n"
        "Vista plana de `skills/` para OpenCode: un enlace por nombre de skill.\n"
        "La genera `scripts/gen-opencode-skills.py` (desde `gen-catalogs.sh`).\n"
    )
    if VIEW.exists() or VIEW.is_symlink():
        old = VIEW.with_name(VIEW.name + ".old")
        shutil.rmtree(old, ignore_errors=True)
        VIEW.rename(old)
        tmp.rename(VIEW)
        shutil.rmtree(old, ignore_errors=True)
    else:
        tmp.rename(VIEW)

    print(f"✅ {VIEW} ({len(elegido)} skills, de {len(candidatos)} SKILL.md encontrados)")
    for n, rutas in sorted(choques.items()):
        print(f"   ⚠️  nombre repetido por skills distintos: {n} → se usa {elegido[n].relative_to(SKILLS)}; "
              f"quedan afuera: {', '.join(sorted(rutas - {str(elegido[n].relative_to(SKILLS))}))}")
    for n, k in anidados:
        print(f"   ⚠️  {n}: su carpeta contiene {k} SKILL.md más; OpenCode los va a ver duplicados")
    return 0


if __name__ == "__main__":
    sys.exit(main())
