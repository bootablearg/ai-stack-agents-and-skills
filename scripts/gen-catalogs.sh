#!/usr/bin/env bash
# gen-catalogs.sh — regenera los catálogos exhaustivos del cerebro compartido (.ai-stack).
# Auto-genera SKILLS_CATALOG.md y AGENTS_CATALOG.md leyendo el frontmatter real de cada
# SKILL.md / agente. Correr cada vez que se agregan/quitan skills o agentes.
#
#   bash $AISTACK_HOME/scripts/gen-catalogs.sh
#
set -euo pipefail
ROOT="${AISTACK_HOME:-$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )}"
SK="$ROOT/skills"
AG="$ROOT/agents"
GS="$ROOT/gstack"
TODAY="$(date +%F)"

# Extrae el valor de una key del primer bloque YAML frontmatter.
# Soporta valor en línea (description: foo) y block scalar (description: |\n  foo\n  bar).
fm() { # $1=file $2=key
  awk -v k="$2" 'BEGIN{fm=0; inblk=0; buf=""}
    /^---[[:space:]]*$/{ fm++; if(inblk){print buf; exit} next }
    fm!=1 { next }
    inblk==1 {
      if ($0 ~ /^[[:space:]]/ || $0 ~ /^[[:space:]]*$/) { l=$0; sub(/^[[:space:]]+/,"",l); buf=(buf==""?l:buf" "l); next }
      else { print buf; exit }
    }
    $0 ~ ("^"k":") {
      v=$0; sub(/^[A-Za-z_-]+:[[:space:]]*/,"",v)
      if (v=="|"||v=="|-"||v==">"||v==">-"||v=="") { inblk=1; next }
      gsub(/^["'"'"']|["'"'"']$/,"",v); print v; exit
    }
    END{ if(inblk==1) print buf }' "$1"
}
# Limpia para celda de tabla markdown: sin pipes, sin saltos, recortada.
clean() { tr '\n' ' ' | sed 's/|/\//g; s/  */ /g; s/^ *//; s/ *$//' | cut -c1-170 | iconv -f utf-8 -t utf-8 -c; }

############################ SKILLS_CATALOG.md ############################
OUT="$SK/SKILLS_CATALOG.md"
{
echo "# Skills Catalog — cerebro compartido (.ai-stack/skills)"
echo
echo "> ⚙️ AUTO-GENERADO por \`scripts/gen-catalogs.sh\` el $TODAY. NO editar a mano — se sobrescribe."
echo "> Es el mismo listado para Claude Code, OpenCode, Codex, Gemini y Copilot. Invocación en Claude Code: \`/skill <nombre>\`; en los demás, pedir que lean \`\$AISTACK_HOME/skills/<nombre>/SKILL.md\`. Ubicación: \`~/.claude/skills/\` → \`\$AISTACK_HOME/skills/\`."
echo
echo "## Skills top-level (individuales)"
echo
echo "| Skill | Invocación | Descripción |"
echo "|-------|-----------|-------------|"
for d in "$SK"/*/; do
  d=${d%/}; b=$(basename "$d")
  [ -f "$d/SKILL.md" ] || continue
  case "$b" in marketingskills|claude-seo|claude-blog|cyber-neo|claude-db|_deprecated) continue;; esac
  desc=$(fm "$d/SKILL.md" description | clean)
  echo "| \`$b\` | \`/skill $b\` | ${desc:-—} |"
done
for col in claude-seo claude-blog marketingskills claude-db taste ui-ux-pro-max; do
  [ -d "$SK/$col" ] || continue
  n=$(find -L "$SK/$col" -maxdepth 2 -name SKILL.md | wc -l | tr -d ' ')
  echo
  echo "## Colección: \`$col\` ($n skills)"
  echo
  echo "| Skill | Invocación | Descripción |"
  echo "|-------|-----------|-------------|"
  for d in "$SK/$col"/*/; do
    d=${d%/}; b=$(basename "$d")
    [ -f "$d/SKILL.md" ] || continue
    desc=$(fm "$d/SKILL.md" description | clean)
    echo "| \`$b\` | \`/skill $b\` | ${desc:-—} |"
  done
done
echo
echo "## Colección: \`cyber-neo\` (security)"
echo
echo "Pre-push security scanning (OWASP/CWE, secrets). Ver \`\$AISTACK_HOME/skills/cyber-neo/README.md\`."
# skills/synced/<cuenta>/<skill>/ lo escribe Claude Code al sincronizar los skills de la
# cuenta de claude.ai. Son markdown legibles por cualquier asistente, pero el contenido
# lo maneja la sincronización: no se editan a mano.
if [ -d "$SK/synced" ]; then
  n=$(find -L "$SK/synced" -mindepth 3 -maxdepth 3 -name SKILL.md | wc -l | tr -d ' ')
  echo
  echo "## Sincronizados desde claude.ai (\`skills/synced/\`, $n skills)"
  echo
  echo "Los escribe la sincronización de Claude Code con la cuenta de claude.ai (en Claude se invocan como \`anthropic-skills:<nombre>\`). No editar a mano."
  echo
  echo "| Skill | Ruta | Descripción |"
  echo "|-------|------|-------------|"
  find -L "$SK/synced" -mindepth 3 -maxdepth 3 -name SKILL.md | sort | while read -r f; do
    d=$(dirname "$f"); b=$(basename "$d")
    desc=$(fm "$f" description | clean)
    echo "| \`$b\` | \`${d#$ROOT/}\` | ${desc:-—} |"
  done
fi
} > "$OUT"
echo "✅ $OUT ($(grep -c '^| `' "$OUT") entradas)"

############################ AGENTS_CATALOG.md ############################
OUT="$AG/AGENTS_CATALOG.md"
{
echo "# Agents Catalog — cerebro compartido (.ai-stack/agents)"
echo
echo "> ⚙️ AUTO-GENERADO por \`scripts/gen-catalogs.sh\` el $TODAY. NO editar a mano — se sobrescribe."
echo "> Invocación: \`\"Activate <Agente> mode\"\` o \`\"<Agente>, <tarea>\"\`. Ubicación: \`~/.claude/agents/\` → \`\$AISTACK_HOME/agents/\`."
echo "> Librería fuente categorizada (más amplia): \`\$AISTACK_HOME/agents-lib/\`."
echo
# divisiones ordenadas por cantidad
divs=$(for f in "$AG"/*.md; do bn=$(basename "$f"); [ "$bn" = README.md ] && continue; echo "${bn%%-*}"; done | sort | uniq -c | sort -rn | awk '{print $2}')
total=$(ls "$AG"/*.md | grep -vc README.md)
echo "**Total: $total agentes activos.**"
echo
for div in $divs; do
  echo "## $div"
  echo
  echo "| Agente | Descripción |"
  echo "|--------|-------------|"
  for f in "$AG/$div"-*.md; do
    [ -f "$f" ] || continue
    name=$(fm "$f" name | clean); [ -z "$name" ] && name=$(basename "$f" .md)
    desc=$(fm "$f" description | clean)
    echo "| \`$name\` | ${desc:-—} |"
  done
  echo
done
} > "$OUT"
echo "✅ $OUT ($(grep -c '^| `' "$OUT") agentes)"

############################ GSTACK (resumen) ############################
OUT="$GS/GSTACK_CATALOG.md"
{
echo "# GStack Catalog — cerebro compartido (.ai-stack/gstack)"
echo
echo "> ⚙️ AUTO-GENERADO por \`scripts/gen-catalogs.sh\` el $TODAY."
echo "> GStack = pipelines de orquestación (plan→build→QA→deploy) y tools de diseño/review. Ver \`MANIFEST.md\`."
echo
echo "| Tool | Descripción |"
echo "|------|-------------|"
for d in "$GS"/*/; do
  d=${d%/}; b=$(basename "$d")
  [ "$b" = lib ] && continue
  if [ -f "$d/SKILL.md" ]; then desc=$(fm "$d/SKILL.md" description | clean); else desc=""; fi
  echo "| \`$b\` | ${desc:-—} |"
done
} > "$OUT"
echo "✅ $OUT ($(grep -c '^| `' "$OUT") tools)"
# Vista plana para OpenCode (un enlace por nombre de skill): evita los "duplicate skill name".
python3 "$ROOT/scripts/gen-opencode-skills.py"
echo "Listo — catálogos regenerados ($TODAY)."
