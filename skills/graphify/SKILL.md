---
name: graphify
description: Genera o actualiza un grafo técnico local de un repositorio mediante Graphify, sólo sobre código y sin LLM, red, documentos, imágenes ni plugins upstream. Usar cuando necesites orientar una exploración o comprender relaciones de código en un repositorio Git limpio dentro de ~/workspace.
---

# Graphify local aislado

## Uso

```bash
$AISTACK_HOME/scripts/graphify-local "$PWD"
```

Para recalcular aun si no detecta cambios:

```bash
$AISTACK_HOME/scripts/graphify-local "$PWD" --force
```

## Contrato de seguridad

- Sólo acepta directorios locales dentro de `~/workspace`.
- Sólo procesa repositorios Git no-bare y sin cambios pendientes.
- Indexa exclusivamente código AST con `--code-only`; no usa LLM ni analiza documentos, PDFs, imágenes, URLs o contenido remoto.
- Excluye `.git`, `.ecc`, `.agent-zero`, `.opencode`, `.env`, credenciales, secretos, dependencias, entornos virtuales y la salida previa.
- Aplica un límite de 5.000 archivos, 200 MiB y 120 segundos; ante duda omite el análisis.
- Agrega sólo `graphify-out/` a `.git/info/exclude`; no modifica `.gitignore`, archivos fuente ni configuración del proyecto.
- El resultado es local y no reemplaza `AGENTS.md`, memoria de proyecto ni Memory Vault.

## Salida

Los artefactos quedan en `graphify-out/`. Consultá `GRAPH_REPORT.md` y `graph.json` como ayuda de navegación, verificando siempre el código real antes de decidir o modificar.

## No automatizar

No agregues plugins upstream, hooks que intercepten Bash, MCP HTTP, extras `all`, backends LLM, bases de datos, ingest remoto ni análisis multimodal sin una autorización específica del usuario.
