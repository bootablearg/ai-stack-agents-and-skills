# Codex Agent Guide — <proyecto>

**Cómo Codex integra Agency Agents y accede al Memory Bank.**

---

## Rol de Codex

**Codex ejecuta tareas mecánicas:**
- Rsync (DEV → QA → PROD)
- Artisan batch (migraciones, seeders, commandos en N ambientes)
- Writes de archivos con sudo (respeta permisos www-data)
- Deploys multi-ambiente
- Operaciones MySQL directas

**Claude Code (agente principal) maneja:**
- Decisiones de arquitectura
- Code review + seguridad
- Implementación de lógica de negocio
- Diagnósticos complejos

**División:** Claude piensa, Codex ejecuta.

---

## Memory Bank Compartido

Codex accede al mismo Memory Bank que Claude Code:

```
$PROJECT_ROOT/.agent-zero/memory-bank/
├── toc.md                 ← Empezar acá (índice)
├── projectRules.md        ← Reglas críticas (nunca saltear QA, etc.)
├── systemPatterns.md      ← Patrones de deploy (rsync, artisan batch)
├── build-deployment.md    ← Steps exactos de build + health checks
├── techContext.md         ← Stack, credenciales, herramientas
└── database-schema.md     ← Estructura de DB
```

**Antes de ejecutar:** Codex lee `toc.md` → sección relevante → procede.

---

## Catálogo de Agentes Disponibles

**Ubicación global:** `~/.claude/agents/` (184 agentes)
**Invocación:** `"Activate [Agent Name] mode"` o `"[Agent Name], [task]"`

### Engineering (26 agentes)

| Agente | Para qué |
|--------|----------|
| `engineering-senior-developer` | Implementación Laravel/Livewire/FluxUI |
| `engineering-backend-architect` | Diseño de API, microservicios, DB schema |
| `engineering-frontend-developer` | UI components, CSS, responsive |
| `engineering-mobile-app-builder` | iOS/Android, React Native, Flutter |
| `engineering-ai-engineer` | ML models, pipelines, AI features |
| `engineering-devops-automator` | CI/CD, Docker, infraestructura |
| `engineering-security-engineer` | **OBLIGATORIO** — auditoría de seguridad OWASP |
| `engineering-database-optimizer` | Queries lentas, indexes, schema |
| `engineering-code-reviewer` | Code review, bugs, mejoras |
| `engineering-git-workflow-master` | Branching, commits, PRs |
| `engineering-technical-writer` | Documentación técnica, READMEs |
| `engineering-software-architect` | Arquitectura de sistemas, DDD |
| `engineering-sre` | SLOs, error budgets, observabilidad |
| `engineering-rapid-prototyper` | POC rápido, MVP throwaway |
| `engineering-incident-response-commander` | Incidentes en producción |
| `engineering-solidity-smart-contract` | Contratos inteligentes EVM |
| `engineering-codebase-onboarding` | Onboarding a codebase desconocida |
| `engineering-threat-detection` | SIEM, MITRE ATT&CK, detección |
| `engineering-filament-optimization` | Panel Filament PHP |
| `engineering-data-engineer` | Pipelines de datos, lakehouse |
| `engineering-email-intelligence` | Extracción de datos de emails |
| `engineering-voice-ai-integration` | Pipelines de transcripción de audio |
| `engineering-cms-developer` | WordPress, Drupal |
| `engineering-weechat-mini-program` | WeChat Mini Programs |
| `engineering-feishu-integration` | Feishu/Lark integrations |
| `engineering-autonomous-optimization` | Optimización continua de sistemas |

### Design (8 agentes)

| Agente | Para qué |
|--------|----------|
| `design-ui-designer` | UI visual, design systems, componentes |
| `design-ux-researcher` | Tests de usabilidad, insights |
| `design-ux-architect` | CSS systems, arquitectura de UX |
| `design-brand-guardian` | Identidad de marca, consistencia |
| `design-visual-storyteller` | Narrativa visual, multimedia |
| `design-whimsy-injector` | Personalidad y delight en UI |
| `design-image-prompt-engineer` | Prompts para generación de imágenes |
| `design-inclusive-visuals` | Representación, diversidad |

### Marketing (29+ agentes)

| Agente | Para qué |
|--------|----------|
| `marketing-growth-hacker` | Adquisición, loops virales, experimentos |
| `marketing-content-creator` | Copy, calendarios, campañas |
| `marketing-seo-specialist` | SEO técnico y de contenido |
| `marketing-social-media-strategist` | Estrategia multi-plataforma |
| `marketing-tiktok-strategist` | TikTok, algoritmo, virales |
| `marketing-instagram-curator` | Instagram, visual storytelling |
| `marketing-twitter-engager` | Twitter/X, comunidad |
| `marketing-linkedin-content-creator` | LinkedIn, thought leadership |
| `marketing-reddit-community-builder` | Reddit, comunidades |
| `marketing-video-optimization` | YouTube, retención, chaptering |
| `marketing-ai-citation-strategist` | Visibilidad en ChatGPT/Claude/Gemini |
| `marketing-app-store-optimizer` | ASO, conversión en app stores |
| `marketing-book-co-author` | Libros, thought leadership |
| `marketing-cross-border-ecommerce` | Amazon, Shopee, Lazada, AliExpress |
| `marketing-livestream-commerce-coach` | Douyin, Taobao Live, Kuaishou |
| `marketing-private-domain-operator` | WeChat SCRM, comunidades privadas |
| `marketing-short-video-editing-coach` | CapCut, Premiere, DaVinci |
| `marketing-podcast-strategist` | Podcasts, audio, distribución |
| `marketing-china-market-localization` | Go-to-market China |
| `marketing-carousel-growth-engine` | Carruseles TikTok/Instagram |
| `marketing-baidu-seo` | SEO Baidu, China market |
| `marketing-bilibili-content` | Bilibili, UP主 |
| `marketing-douyin-strategist` | Douyin, corto-video, live commerce |
| `marketing-kuaishou-strategist` | Kuaishou, ciudades tier 3/4 |
| `marketing-xiaohongshu-specialist` | Xiaohongshu (RED) |
| `marketing-wechat-official-account` | WeChat OA |
| `marketing-zhihu-strategist` | Zhihu, thought leadership |
| `marketing-weibo-strategist` | Weibo, viral, trending |
| `marketing-china-ecommerce-operator` | Taobao, Tmall, Pinduoduo, JD |

### Paid Media (7 agentes)

| Agente | Para qué |
|--------|----------|
| `paid-media-ppc-campaign-strategist` | Google Ads, campañas search |
| `paid-media-search-query-analyst` | Análisis de search queries, negatives |
| `paid-media-auditor` | Auditoría completa de cuentas ads |
| `paid-media-tracking-measurement` | GTM, GA4, conversiones, CAPI |
| `paid-media-ad-creative-strategist` | Creatividades, RSA, copy de anuncios |
| `paid-media-programmatic-display` | Display, DV360, programmatic |
| `paid-media-paid-social-strategist` | Meta, LinkedIn, TikTok ads |

### Sales (9 agentes)

| Agente | Para qué |
|--------|----------|
| `sales-outbound-strategist` | Prospecting, cold outreach |
| `sales-discovery-coach` | Discovery calls, metodología |
| `sales-deal-strategist` | MEDDPICC, deal qualification |
| `sales-engineer` | Presales, demos, POC |
| `sales-proposal-strategist` | RFPs, propuestas ganadoras |
| `sales-pipeline-analyst` | Pipeline health, forecast |
| `sales-account-strategist` | Land-and-expand, QBRs |
| `sales-coach` | Coaching de reps, call review |
| `sales-outreach` | B2B outreach, prospecting |

### Product (5 agentes)

| Agente | Para qué |
|--------|----------|
| `product-sprint-prioritizer` | Priorización de sprint, roadmap |
| `product-trend-researcher` | Tendencias, oportunidades |
| `product-feedback-synthesizer` | Síntesis de feedback de usuarios |
| `product-behavioral-nudge-engine` | Psicología, motivación de usuarios |
| `product-manager` | Estrategia de producto, go-to-market |

### Testing (8 agentes)

| Agente | Para qué |
|--------|----------|
| `testing-evidence-collector` | **OBLIGATORIO bugs** — evidencia visual de issues |
| `testing-reality-checker` | **GATE DE PROD** — validar si algo es deployable |
| `testing-test-results-analyzer` | Análisis de resultados de tests |
| `testing-performance-benchmarker` | Benchmarks, profiling |
| `testing-api-tester` | Tests de API, validación |
| `testing-tool-evaluator` | Evaluación de herramientas |
| `testing-workflow-optimizer` | Optimización de procesos |
| `testing-accessibility-auditor` | WCAG, screen readers |

### Project Management (6 agentes)

| Agente | Para qué |
|--------|----------|
| `project-studio-producer` | Portfolio de proyectos, recursos |
| `project-shepherd` | Coordinación cross-funcional |
| `project-studio-operations` | Ops de estudio, procesos |
| `project-experiment-tracker` | A/B tests, hipótesis |
| `project-senior-project-manager` | Scope, timelines, spec |
| `project-jira-workflow-steward` | Jira, Git workflow |

### Finance (5 agentes)

| Agente | Para qué |
|--------|----------|
| `finance-bookkeeper-controller` | Contabilidad, reconciliaciones |
| `finance-financial-analyst` | Modeling, forecasting |
| `finance-fpa-analyst` | FP&A, presupuesto, varianza |
| `finance-investment-researcher` | Due diligence, valuaciones |
| `finance-tax-strategist` | Optimización fiscal |

### Support (6 agentes)

| Agente | Para qué |
|--------|----------|
| `support-analytics-reporter` | Dashboards, KPIs, data insights |
| `support-infrastructure-maintainer` | Reliability, performance |
| `support-legal-compliance-checker` | Compliance legal multi-jurisdicción |
| `support-executive-summary-generator` | Resúmenes ejecutivos C-suite |
| `support-responder` | Customer support |
| `support-finance-tracker` | Tracking financiero |

### Specialized (20+ agentes)

| Agente | Para qué |
|--------|----------|
| `specialized-compliance-auditor` | **OBLIGATORIO** — KYC, pagos, privacidad |
| `specialized-blockchain-security` | Smart contracts, DeFi audits |
| `specialized-mcp-builder` | MCP servers para agentes AI |
| `specialized-document-generator` | PDFs, PPTX, DOCX programáticos |
| `specialized-automation-governance` | n8n, governance de automatizaciones |
| `specialized-agents-orchestrator` | Orquestación de pipelines de agentes |
| `specialized-legal-document-review` | Contratos, cláusulas de riesgo |
| `specialized-legal-client-intake` | Intake de clientes legales |
| `specialized-loan-officer-assistant` | Préstamos, hipotecas |
| `specialized-real-estate` | Compra/venta inmobiliaria |
| `specialized-healthcare-marketing` | Marketing healthcare compliance |
| `specialized-government-digital` | ToG, licitaciones gobierno China |
| `specialized-french-consulting` | Mercado ESN/SI freelance Francia |
| `specialized-korean-business` | Business culture coreana |
| `specialized-zk-steward` | Zettelkasten, knowledge management |
| `specialized-chief-of-staff` | Coordinación ejecutiva |

---

## Agentes Obligatorios para <proyecto>

| Situación | Agente |
|-----------|--------|
| Cualquier cambio de código | `engineering-security-engineer` |
| Cualquier cambio que toca pagos/KYC | `specialized-compliance-auditor` |
| Bugs — encontrar evidencia | `testing-evidence-collector` |
| Gate antes de deploy a PROD | `testing-reality-checker` |
| DB queries lentas | `engineering-database-optimizer` |
| Bug nuevo o hotfix | `engineering-incident-response-commander` |
| Feature UI nueva | `design-ui-designer` + `design-ux-architect` |
| SEO / meta tags | `marketing-seo-specialist` |
| Deploy / infraestructura | `engineering-devops-automator` |

---

## Tareas Comunes de Codex

### Deploy Multi-Ambiente

```
Tarea: Propagar Brand A DEV a Brand A QA
Autorización: Claude Code aprobó
Patrón: systemPatterns.md#Rsync DEV→QA→PROD
```

Codex verifica paths → rsync con exclusiones → npm install + build → artisan optimize:clear → health check → reporta.

### Artisan Batch

```
Tarea: Correr migraciones en Brand A DEV + QA
Comando: migrate
Autorización: Claude Code aprobó
```

Codex lee paths de cada ambiente → ejecuta artisan migrate → reporta resultado por ambiente.

### Backfill SQL

```
Tarea: Actualizar tabla design_themes en Brand A DEV
Archivo: $PROJECT_ROOT/temp/backfill.sql
Autorización: Claude Code aprobó
```

Codex valida que el SQL file exista → ejecuta mysql → reporta rows afectadas.

### Write de Archivo con Sudo

```
Tarea: Escribir ThemeService.php en Brand A QA
Contenido: $PROJECT_ROOT/temp/theme_service_qa.php
Destino: $PROJECT_ROOT/brand-a/qa/www/app/Services/ThemeService.php
```

Codex copia desde temp → sudo cp → sudo chown www-data → limpia temp → verifica.

---

## Reglas de Seguridad

1. **Verificar paths** antes de ejecutar (nunca asumir que existen)
2. **Fail fast** — primer error detiene todo (set -e)
3. **Nunca saltear QA** — siempre DEV → QA → PROD
4. **Autorización explícita** — Codex no ejecuta sin "Claude Code aprobó"
5. **Operaciones destructivas** — preguntar siempre (DROP TABLE, reset --hard, etc.)
6. **Health check** después de cada deploy

---

## Autorización Requerida

Codex ejecuta SOLO si Claude Code autoriza explícitamente:

```
"Propagar Brand A DEV a QA (aprobado)" → Ejecutar
"Actualizar todas las DBs"           → Ambiguo, rechazar
"DELETE todos los usuarios"          → Destructivo sin rollback, rechazar
```

---

**Última actualización:** 2026-05-19 por Claude Code
