# ecc-skills — skills y agentes seleccionados de ECC

**Origen:** `affaan-m/ecc` (MIT, © 2026 Affaan Mustafa), versión **2.2.2**, commit `d3b8a3e`
(2026-09-27). Vendorizado el 2026-09-28.
**Instalación:** un symlink por skill en `$AISTACK_HOME/skills/<nombre>` y uno por agente en
`$AISTACK_HOME/agents/ecc-<nombre>.md`. **Nunca** se corrió `install.sh` de ECC (ver
`ecc-memory-vault/README.md`).

## Qué se trajo (37 skills + 4 agentes)

| Área | Skills |
|---|---|
| Laravel | `laravel-security`, `laravel-verification`, `laravel-patterns`, `laravel-tdd` |
| Django / Celery | `django-security`, `django-celery`, `django-verification`, `django-patterns`, `django-tdd` |
| Bases de datos | `mysql-patterns` (MariaDB), `postgres-patterns`, `database-migrations`, `redis-patterns` |
| Datos de salud y parsing | `healthcare-phi-compliance`, `regex-vs-llm-structured-text` |
| Redes / homelab | `homelab-vlan-segmentation`, `homelab-wireguard-vpn`, `homelab-network-setup`, `homelab-pihole-dns`, `network-config-validation`, `network-interface-health`, `netmiko-ssh-automation`, `cisco-ios-patterns` |
| Infra y operación | `docker-patterns`, `deployment-patterns`, `dashboard-builder`, `production-audit`, `canary-watch` |
| Backend y testing | `backend-patterns`, `api-design`, `python-testing`, `tdd-workflow`, `e2e-testing`, `browser-qa`, `verification-loop`, `click-path-audit` |
| Verificación multi-agente | `santa-method` |

Agentes: `network-config-reviewer`, `php-reviewer`, `django-reviewer`, `healthcare-reviewer`.

**Criterio:** primero lo que cubre tecnologías del workspace que no tenían ningún skill
(Laravel, Django, MariaDB, Postgres, redes/pfSense, Grafana, datos de salud); después los
skills a los que esos remiten.

## Modificaciones respecto del original

| Archivo | Cambio | Por qué |
|---|---|---|
| `docker-patterns` | Sacada la sección "Hardened CLI Installer Harnesses" (probar el instalador de ECC, `terminal-opener`) y ajustada la `description` | Era específica de ECC |
| `tdd-workflow` | El paso 0 ya no corre `scripts/setup-package-manager.js` de ECC; detecta el runner desde lockfile/`package.json` o el runner nativo | El script no existe acá |
| `tdd-workflow` | Quitada la remisión a `bun-runtime` | No se importó |
| `backend-patterns`, `mysql-patterns`, `production-audit` | `security-review` → `security-and-hardening` | `security-review` choca con el skill integrado de Claude Code y no existe en los otros asistentes |
| `dashboard-builder` | Quitadas las remisiones a `research-ops` y `terminal-ops` | Flujos para operar ECC; arrastraban captación de clientes y la API de X |
| `postgres-patterns` | `database-reviewer` + `clickhouse-io` → auditores de `claude-db` | No se importaron |

## Qué NO se trajo, y por qué

- **El plugin `ecc`** y **todos los hooks** (`gateguard`, `delivery-gate`, etc.): instalan todo
  y modifican el comportamiento sin autorización (Regla #1).
- **SEO / marketing / ciberseguridad genérica**: duplican `claude-seo`, `marketingskills` y
  `cybersecurity-skills`.
- **Cripto** (`evm-token-decimals`, `nodejs-keccak256`, `defi-amm-security`, `agent-payment-x402`):
  las billeteras de los proyectos del workspace son libros contables en base propia, no blockchain.
- Lenguajes y rubros sin uso en el workspace (Kotlin, Swift, Rust, Java, Perl, .NET, C++,
  Flutter, logística, energía, trading).

## Actualizar

Sin upstream automático. Clonar ECC en `$WORKSPACE/temp/`, copiar encima los directorios de
esta lista, **volver a aplicar la tabla de modificaciones**, verificar que no queden
remisiones a skills ausentes y correr `bash $AISTACK_HOME/scripts/gen-catalogs.sh`.
