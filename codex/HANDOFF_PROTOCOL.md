# Protocolo de Handoff Claude → Codex

## Cómo funciona

1. **Claude** escribe el plan de tarea en `$PROJECT_ROOT/temp/codex_task_YYYYMMDD_HHMMSS.md`
2. **El usuario** abre ese archivo en su screen de Codex y lo ejecuta
3. **Codex** escribe progreso en `$PROJECT_ROOT/temp/codex_progress.jsonl`  
4. **Claude** monitorea ese archivo en tiempo real con `tail -f`

---

## Formato del archivo de tarea (Claude escribe esto)

```markdown
# Tarea Codex — YYYY-MM-DD HH:MM

## Contexto
[Breve descripción de qué es y por qué]

## Prerequisitos
- [ ] Backup en $PROJECT_ROOT/temp/backup_YYYYMMDD/
- [ ] Verificar que Brand A DEV esté en estado correcto

## Pasos a ejecutar

### Paso 1 — [Nombre]
```bash
# Comando exacto a ejecutar
cd $PROJECT_ROOT/brand-a/dev/www
php8.2 artisan ...
```
Reportar: `{"step":1,"status":"ok","msg":"descripción del resultado"}`

### Paso 2 — [Nombre]
...

## Validación post-ejecución
- [ ] Verificar X con: `comando de verificación`
- [ ] Verificar Y con: `comando de verificación`

## Rollback si falla
```bash
# Cómo deshacer si algo sale mal
```
```

---

## Formato de progreso (Codex escribe esto)

Cada línea en `$PROJECT_ROOT/temp/codex_progress.jsonl` es un JSON:

```json
{"step": 1, "status": "start", "msg": "Iniciando backup...", "ts": "2026-05-21T10:30:00"}
{"step": 1, "status": "ok", "msg": "Backup creado en /temp/backup_20260521/", "ts": "2026-05-21T10:30:15"}
{"step": 2, "status": "start", "msg": "Tokenizando geography/index.blade.php...", "ts": "2026-05-21T10:30:16"}
{"step": 2, "status": "ok", "msg": "35 hardcodes reemplazados", "ts": "2026-05-21T10:30:18"}
{"step": "DONE", "status": "ok", "msg": "Tarea completa. 38 archivos, 630 reemplazos.", "ts": "2026-05-21T10:45:00"}
```

**Función bash helper para Codex:**
```bash
progress() {
  local step="$1" status="$2" msg="$3"
  local ts=$(date -u +"%Y-%m-%dT%H:%M:%S")
  echo "{\"step\":\"$step\",\"status\":\"$status\",\"msg\":\"$msg\",\"ts\":\"$ts\"}" \
    >> $PROJECT_ROOT/temp/codex_progress.jsonl
}

# Uso:
progress 1 "start" "Iniciando backup"
# ... hacer el backup ...
progress 1 "ok" "Backup creado"
```

---

## Cómo Claude monitorea en tiempo real

Una vez que el usuario inicia Codex en su screen, Claude corre:

```bash
# Limpiar el archivo de progreso anterior
> $PROJECT_ROOT/temp/codex_progress.jsonl

# Luego usa: Monitor tool con este comando
tail -f $PROJECT_ROOT/temp/codex_progress.jsonl
```

Cada línea que Codex escribe llega como notificación a Claude vía el `Monitor` tool.

---

## Ejemplo de handoff real

**Claude dice al usuario:**
> "Esta tarea la delego a Codex. El plan está en `$PROJECT_ROOT/temp/codex_task_20260521_103000.md`.  
> Abrí tu screen de Codex y ejecutá ese plan. Yo voy a estar monitoreando el progreso en tiempo real."

**Claude corre en background:**
```bash
tail -f $PROJECT_ROOT/temp/codex_progress.jsonl
```

**Usuario en su screen:**
```bash
# Lee el plan
cat $PROJECT_ROOT/temp/codex_task_20260521_103000.md
# Ejecuta
```

**Claude recibe notificaciones** por cada línea que Codex escribe → puede dar feedback, parar si algo falla, aprobar siguiente paso.
