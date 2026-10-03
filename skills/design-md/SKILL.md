---
name: design-md
description: Revisa y convierte archivos DESIGN.md — el formato de Google Labs que describe la identidad visual de un sitio (colores, tipografías, medidas y componentes) para que un agente la entienda. Usalo para detectar contraste por debajo de la norma AA, encontrar tokens definidos que ningún componente usa, comparar dos versiones de un tema, o convertir los tokens a Tailwind, CSS o W3C Design Tokens. Todo determinista, sin modelo de lenguaje.
license: Apache-2.0
metadata:
  author: Google Labs
  upstream: google-labs-code/design.md@9bf8eae
  cli: "@google/design.md@0.4.0"
  instalado: 2026-09-17
---

# design.md — revisar y convertir la identidad visual

## Qué es

`DESIGN.md` es un formato de archivo publicado por Google Labs. En la cabecera lleva
los valores exactos (colores, tipografías, radios de borde, espaciados) en YAML, y en el
cuerpo lleva la explicación en palabras de por qué se eligió cada uno.

El programa que lo acompaña **no consulta ningún modelo de lenguaje y no sale a la red.**
Corre localmente, da siempre el mismo resultado sobre el mismo archivo, y no consume
presupuesto de tokens.

## Cómo se invoca

```bash
$AISTACK_HOME/scripts/designmd-local <comando> [argumentos]
```

| Comando | Qué hace |
|---|---|
| `lint <archivo>` | Revisa el archivo y lista los problemas encontrados |
| `diff <viejo> <nuevo>` | Compara dos archivos y muestra qué cambió entre uno y otro |
| `export <archivo> --format <f>` | Convierte los tokens a otro formato |
| `spec` | Imprime la definición completa del formato |

Formatos de `export`: `css-tailwind` (Tailwind v4, bloque `@theme`), `json-tailwind`
(Tailwind v3), `dtcg` (W3C Design Tokens) y `css-vars` (variables CSS).

## Qué detecta el `lint`

- **`contrast-ratio`** — un color de texto sobre su fondo que queda por debajo del
  mínimo de la norma WCAG AA (4,5 a 1 para texto normal). Devuelve el par exacto y la
  relación medida.
- **`orphaned-tokens`** — un color definido en el archivo que ningún componente usa.
- Errores de estructura del propio archivo.

Las dos primeras reglas son las que hacen que valga la pena: revisan **todos** los temas
sin tener que activar ninguno ni sacar capturas de pantalla.

## Regla de uso obligatoria

**Un `DESIGN.md` de un proyecto se genera con un script; nunca se escribe ni se edita a
mano.**

El motivo es concreto. Si los colores de un proyecto están guardados en una base de datos
y además alguien escribe un `DESIGN.md` a mano, la misma información queda en dos lugares.
El día que alguien cambia un color en la base, el `DESIGN.md` conserva el color viejo y
nadie se entera. En un proyecto real esto ya pasó: el archivo `_tokens.json` de la carpeta de
documentación es una copia del 24 de julio, y para el 17 de septiembre la base tenía tres
temas más, otros identificadores y otro tema activo.

Los archivos de ejemplo (ver abajo) sí están escritos a mano, porque son documentación de
sitios ajenos y no tienen una base detrás.

## Material de consulta

`$AISTACK_HOME/vendor/awesome-design-md/design-md/` tiene **73 archivos `DESIGN.md` de
sitios reales** (Stripe, Linear, Figma, Apple, Airbnb, Shopify y otros), recopilados por
VoltAgent. Sirven para ver cómo se estructura un archivo antes de escribir el generador
de un proyecto nuevo.

## Procedencia

- Formato y programa: `google-labs-code/design.md`, licencia Apache-2.0. El programa
  está fijado en la versión `@google/design.md@0.4.0` dentro de
  `vendor/design-md-cli/`, y corre sobre Node (no necesita `bun`, que sólo hace falta
  para compilarlo desde el código fuente).
- Ejemplos: `voltagent/awesome-design-md`, licencia MIT.
- Los cuatro skills de terceros que trae el repositorio de Google (`ink`, `tdd`,
  `agent-dx-cli-scale`, `typed-service-contracts`) **no se instalaron**: vienen de otros
  repositorios por su `skills-lock.json`, y `tdd` ya existe en este stack.
