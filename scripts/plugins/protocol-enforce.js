// protocol-enforce.js — Capa 3 del .ai-stack para OpenCode
// Inyecta en el system prompt de cada sesión: (1) memoria del Memory Vault
// compartido (mismo generador que usa el hook SessionStart de Claude) y
// (2) un recordatorio ejecutable de @protocol-enforce.
// Mecanismo: hook experimental.chat.system.transform (@opencode-ai/plugin 1.15.0).
// Ejecuta el generador con el BunShell `$` (args interpolados = auto-escapados).

import os from "node:os";
import fs from "node:fs";

import { fileURLToPath } from "node:url";
import path from "node:path";

// Raíz del stack: dos niveles arriba de scripts/plugins/. Sin rutas hardcodeadas.
const AISTACK_HOME = process.env.AISTACK_HOME
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GEN = path.join(AISTACK_HOME, "scripts/hooks/memory-session-start.js");
const MEM = path.join(AISTACK_HOME, "vendor/ecc-memory-vault/memory.js");
const ANTISYC = path.join(AISTACK_HOME, "scripts/hooks/anti-sycophancy.js");

// El detector es CommonJS: importado desde ESM puede llegar en `.default`.
let _antisyc = null;
async function antisyc() {
  if (!_antisyc) {
    const mod = await import(ANTISYC);
    _antisyc = mod.default || mod;
  }
  return _antisyc;
}

const RECORDATORIO = [
  "",
  "---",
  "## ⚙️ Protocolo de arranque — @protocol-enforce (OBLIGATORIO)",
  "Antes de diagnosticar, proponer, planificar, decidir o tocar CUALQUIER archivo, aplicá @protocol-enforce (definido en tu AGENTS.md):",
  "- Idioma: **castellano argentino**, siempre.",
  "- **Regla #1**: diagnosticar -> proponer -> planificar -> esperar un \"sí\" explícito del usuario antes de modificar archivos. Sin excepciones.",
  "- **Regla #2**: no asumir nada; verificar en el código/DB real antes de afirmar.",
  "- **Regla #3**: no extralimitar el scope autorizado.",
  "- Verify-first + tools-check (usar el skill/agente que cubra la tarea).",
  "- Respuestas cortas y al grano.",
  "- **Anti-adulación**: nada de elogios ni de \"tenés razón\" por defecto. Coincidí sólo si lo verificaste; si el usuario se equivoca, decíselo derecho con la evidencia. Buscá activamente el contrapunto y la alternativa mejor. No cambies de posición por presión, sólo ante un dato nuevo. Los fracasos se reportan primero, no al final.",
  "- Aplicá `stop-slop-es` (o `stop-slop-en`) a **lo que le decís al usuario**, no sólo a los archivos: sin muletillas de arranque, sin contrastes binarios armados, sin frases de placa, sin cierres de relleno.",
  `- Memoria compartida: node ${MEM} search "<tema>"  (recuperar)  |  node ${MEM} save --title "<t>" --stdin  (guardar)`,
  "",
  "## 🏁 Cierre — @protocol-end",
  "Cuando el usuario CONFIRMA que la tarea terminó (\"listo\", \"terminamos\", \"@protocol-end\"), ejecutá @protocol-end. Paso 0: `node $AISTACK_HOME/scripts/hooks/session-scope.js --since \"<inicio>\"` para saber qué proyectos tocaste. Después: bitácora nueva en {proyecto}/memorias/, activeContext + progress del memory-bank, Memory Vault, y handoff si queda trabajo a medias. **Editá los archivos existentes agregando lo nuevo — NO los reescribas** (reescribir quema tokens y pierde contenido). Los cambios en $AISTACK_HOME/ se documentan en $WORKSPACE/ai-stack/. Detalle y plantillas: skill `protocol-end`. Nunca cierres por tu cuenta: ofrecelo y esperá confirmación.",
  "",
  "## 💾 Guardado en el Vault (cerrar el loop de memoria)",
  "Durante o al terminar una tarea, si aparece algo reutilizable (una decisión, un gotcha de infra, un runbook, una preferencia del usuario), GUARDALO en el Memory Vault ANTES de cerrar — usá la skill `memory` o `node " + MEM + " save --title \"<t>\" --kind <runbook|decision|fact|lesson> --stdin`. Si dejás trabajo a medias para otro asistente, hacé un handoff: `node " + MEM + " handoff --from opencode --target <claude|codex|...> --title \"<t>\" --stdin`. No dejes el conocimiento solo en la sesión: lo que no se guarda, se pierde.",
].join("\n");

const cache = new Map(); // sessionID -> bloque de memoria (una vez por sesión, como SessionStart)

export const ProtocolEnforcePlugin = async ({ directory, $ }) => {
  console.error("[protocol-enforce] plugin .ai-stack cargado (OpenCode)");

  async function memoria(cwd) {
    try {
      // Canónico multiusuario: el cwd de la sesión, si no el workspace del
      // usuario que corre OpenCode, si no su home. Nada hardcodeado a un usuario.
      const home = process.env.HOME || os.homedir();
      const dir = cwd || (fs.existsSync(home + "/workspace") ? home + "/workspace" : home);
      const out = await $`node ${GEN} --harness opencode --plain --cwd ${dir}`.quiet().text();
      return (out || "").trim();
    } catch {
      return ""; // nunca bloquea la sesión
    }
  }

  return {
    "experimental.chat.system.transform": async (input, output) => {
      try {
        const sid = (input && input.sessionID) || "default";
        if (!cache.has(sid)) cache.set(sid, await memoria(directory));
        const mem = cache.get(sid);
        const bloque = (mem ? mem + "\n" : "") + RECORDATORIO;
        if (Array.isArray(output.system)) output.system.unshift(bloque);
      } catch (e) {
        console.error("[protocol-enforce] transform error:", e && e.message);
      }
    },

    // Enforcement anti-adulación. OpenCode no permite pedir una reescritura como
    // el hook Stop de Claude, así que acá se hace lo determinista: quitar la
    // apertura aduladora del texto ya emitido y dejar registro en el log.
    "experimental.text.complete": async (input, output) => {
      try {
        if (process.env.AISTACK_ANTISYC === "0") return;
        const { detect, strip } = await antisyc();
        const hallazgos = detect(output.text);
        if (!hallazgos.length) return;
        console.error(
          "[protocol-enforce] adulación detectada: " +
            hallazgos.map((h) => `${h.tipo}("${h.frase}")`).join(", ")
        );
        const limpio = strip(output.text);
        if (limpio && limpio !== output.text) output.text = limpio;
      } catch (e) {
        console.error("[protocol-enforce] anti-sycophancy error:", e && e.message);
      }
    },
  };
};
