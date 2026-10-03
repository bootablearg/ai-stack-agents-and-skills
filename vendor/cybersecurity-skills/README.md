# cybersecurity-skills — subconjunto instalado en este host

**Origen:** [`mukul975/Anthropic-Cybersecurity-Skills`](https://github.com/mukul975/anthropic-cybersecurity-skills)
· Apache-2.0 · clonado el **2026-09-22** (v1.3.0, 818 skills).

> 🪤 **No es de Anthropic.** El nombre del repositorio lo sugiere y no lo es: es un
> proyecto de la comunidad, de `mukul975`. Conviene saberlo antes de citarlo como oficial.

## Qué se instaló, y por qué no todo

Del catálogo original de **818 skills se instalaron 233**, elegidos por lo que este host
corre de verdad. El corte no es de gusto: es de **presupuesto de contexto**.

La instalación fue en dos tandas el mismo día: primero 174 defensivos, y después los 59
ofensivos —red team, pentesting, purple team— cuando el usuario decidió que entraran. Su
argumento, y tenía razón: *«18.000 tokens en un contexto de 1M es algo que aún me puedo dar
el lujo de tener»*. La recomendación previa de dejarlos afuera era conservadora de más.

Cada sesión de cada asistente carga el nombre y la descripción de todos los skills
disponibles antes de escribir una línea. Medido sobre el repositorio:

| | Tokens por arranque |
|---|---|
| Los skills que ya había en el stack | ~18.400 |
| Los 818 del repositorio | ~90.400 |
| Los 174 defensivos | ~17.400 |
| **Los 233 instalados (defensivos + ofensivos)** | **~23.800** |
| Catálogo completo del stack, con todo | ~42.700 · **4,3% de una ventana de 1M** |

Meter los 818 quintuplicaba el catálogo en cada arranque, para los cuatro asistentes y en
todos los proyectos. El tope lo puso el usuario el 2026-09-22: que lo instalado no sumara más de
lo que ya pesaba el catálogo entero.

### Los ocho subdominios que entraron

| Subdominio | Skills | Por qué en este host |
|---|---|---|
| `web-application-security` | 42 | Las aplicaciones web y los WordPress del workspace |
| `api-security` | 28 | Las APIs propias y las integraciones |
| `incident-response` | 26 | Respuesta a incidentes sobre WordPress y servidores propios |
| `vulnerability-management` | 25 | Seguimiento de CVEs de plugins y dependencias |
| `devsecops` | 18 | El pipeline de GitLab |
| `cryptography` | 16 | Cifrado de PII (AES-GCM) y búsqueda por HMAC |
| `phishing-defense` | 15 | Infraestructura de correo propia: PMG, mailcow, Brevo |
| `application-security` | 4 | Barato y del mismo eje |
| `red-teaming` | 33 | Auditar la seguridad de lo que desarrollamos acá |
| `penetration-testing` | 21 | Ídem |
| `offensive-security` · `red-team` · `purple-team` | 5 | Ídem |

### Lo que se dejó afuera, y por qué

- **`threat-hunting` (58), `soc-operations` (35), `threat-intelligence` (52)** — asumen un
  SOC con turnos, un SIEM alimentado y una fuente de inteligencia. Acá hay Grafana, Loki y
  Uptime Kuma, que no es lo mismo.
- **`digital-forensics` (41), `malware-analysis` (39)** — valiosos el día que haya un
  incidente, caros todos los días que no.
- **`container-security` (33)** — un solo host con Docker y nada de Kubernetes.
- **`ot-ics-security` (28)** — Modbus, DNP3, SCADA. No hay planta industrial.
**Lo ofensivo SÍ entró**, por decisión del usuario del 2026-09-22: sirve para auditar la
seguridad de los productos que se desarrollan en este host. Los 34 `exploiting-*` ya venían
dentro de `web-application-security` y `api-security`.

## Cómo está instalado

Los skills viven acá y se publican con **un symlink por skill** en
`$AISTACK_HOME/skills/`, a un solo nivel. Es el mismo patrón que usan `marketingskills`
y la colección de Trail of Bits, y no es decorativo: **Claude Code sólo descubre
`skills/<nombre>/SKILL.md` a UN nivel de profundidad**. Una colección anidada es invisible.

🪤 **Ninguno de los 174 trae la clave `paths:` en su frontmatter** —se verificó uno por
uno—. Esa clave hace que Claude Code descarte el skill entero, sin aviso; ya pasó en este
host con los skills de Go en septiembre. Si algún día se actualiza esta colección desde el
origen, hay que volver a comprobarlo.

## Actualizar

```bash
git clone --depth 1 https://github.com/mukul975/anthropic-cybersecurity-skills.git /tmp/cs
# copiar SÓLO los subdominios de la tabla de arriba, y volver a medir el costo
# antes de sumar ninguno nuevo
$AISTACK_HOME/scripts/gen-catalogs.sh
```
