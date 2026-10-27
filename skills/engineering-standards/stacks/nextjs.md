# Next.js · React · TypeScript · Node

Rige para apps web hechas con Next.js (App Router) sobre Node, escritas en TypeScript. Cubre
también los procesos Node de la misma app (workers, scripts de mantenimiento). Para la base
de datos, leé además `stacks/postgres.md`.

🪤 **Next.js cambia de convenciones entre versiones mayores.** Antes de escribir, leé la guía
que trae instalada la versión del proyecto (`node_modules/next/dist/docs/`) y hacé caso a los
avisos de deprecación. Lo que sigue no reemplaza esa guía: fija cómo se ordena el código.

## Layout (N3)

```
src/
  domain/          Entidades, objetos de valor y reglas puras. Sin I/O.
  application/     Casos de uso y puertos (interfaces que define el consumidor).
  infrastructure/  Adaptadores: base, auth, mensajería, APIs externas, config.
  app/             Rutas de Next: page.tsx, layout.tsx, route.ts, actions.ts.
  ui/              Componentes de React reutilizables.
tests/             e2e (Playwright) y tests de integración contra la base.
```

En N2 (herramienta o módulo sin dominio propio) alcanza con `src/core/` (lógica pura) y
`src/adapters/`. En N1, un archivo.

## Regla de dependencia

| Capa | Puede importar | No puede importar |
|---|---|---|
| `domain` | sólo `domain` | `next`, `react`, el ORM, `process`, `fetch`, cualquier SDK |
| `application` | `domain`, `application` | `infrastructure`, `app`, `ui`, `next`, el ORM |
| `infrastructure` | `application`, `domain`, librerías | `app`, `ui` |
| `app` | todo lo anterior y `ui` | — |
| `ui` | `domain` (sólo tipos), `ui` | `infrastructure`, el ORM |

La fuerza `dependency-cruiser` en el pipeline (configuración abajo). Un import prohibido
rompe el build: no es una sugerencia.

## Entrada delgada

`page.tsx`, `route.ts` y las Server Actions hacen cuatro cosas y nada más:

1. Validar la entrada con Zod.
2. Resolver quién pide (sesión → `Actor`).
3. Llamar a **un** caso de uso.
4. Traducir el resultado a respuesta, redirección o estado de UI.

```ts
"use server";
export async function cocineEsto(form: FormData) {
  const entrada = CocineEstoEntrada.parse(Object.fromEntries(form));
  const actor = await actorDeLaSesion();
  const resultado = await casos.cocineEsto.ejecutar(actor, entrada);
  if (!resultado.ok) return { error: mensajeDe(resultado.error) };
  revalidatePath("/inicio");
  return { ok: true };
}
```

- Toda Server Action es un endpoint público: valida y autoriza como cualquier API, aunque
  sólo la llame un formulario propio.
- Los módulos de `infrastructure/` que sólo usa Next llevan `import "server-only";` para que un
  secreto no termine en el bundle del navegador.
  🪤 `server-only` **tira una excepción fuera del servidor de Next** (worker, scripts, Vitest).
  Para el worker y los tests: en `vitest.config.ts`, `resolve.alias: { "server-only":
  "<ruta>/tests/server-only-vacio.ts" }`, y el worker se compila con su propio entry que no
  importa esos módulos, o con el mismo alias. La regla de dependencia (`ui` no importa
  `infrastructure`) es la segunda barrera.
- Las variables públicas (`NEXT_PUBLIC_*`) las lee un componente de servidor desde la config
  tipada y se pasan por props al componente cliente.
- Componentes de servidor por defecto; `"use client"` sólo en la hoja que necesita estado o
  eventos del navegador.

## Casos de uso

- Una clase o función por caso de uso, con nombre de intención (`SumarseAHogar`,
  `DeshacerMovimiento`). Reciben sus puertos por constructor o parámetro.
- Reciben el `Actor` explícito. Nunca leen la sesión ni cookies por su cuenta.
- La composición (qué adaptador va en cada puerto) vive en un solo lugar:
  `src/infrastructure/composicion.ts`.

## Errores

- **Fallas esperadas** (regla de negocio, permiso, no encontrado): el caso de uso devuelve un
  resultado discriminado; no tira excepciones.

  ```ts
  type Resultado<T, E extends string> = { ok: true; valor: T } | { ok: false; error: E };
  ```

- **Fallas inesperadas** (base caída, bug): excepción. Se registran con contexto y la entrada
  responde un error genérico; nunca el stack ni el mensaje del driver al usuario.
- `catch` vacío o `catch` que sólo hace `console.log`: prohibido.

## Configuración y secretos

- Las variables de entorno se leen y validan con Zod **una sola vez**, en
  `src/infrastructure/config.ts`, al arrancar. El resto del código recibe la config tipada.
  `process.env` fuera de ese archivo lo bloquea el linter.
- Los secretos viven en el archivo de entorno del servidor, fuera del repositorio. Las
  variables con prefijo `NEXT_PUBLIC_` llegan al navegador: nunca un secreto ahí.

## Tiempo, dinero e identificadores

- Fechas en la base como `timestamptz` (UTC); la zona del usuario se aplica al mostrar. La
  hora actual entra por un puerto `Reloj` para poder testear vencimientos y ventanas.
- Montos como enteros en la unidad mínima (centavos) con su moneda. Nunca `number` con
  decimales para plata.
- IDs internos como UUID; nunca un ID autoincremental expuesto en una URL.

## TypeScript

`tsconfig.json`, además de lo que genera Next:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "allowJs": false
  }
}
```

- Sin `any` (`unknown` + validación). Sin `as` para callar al compilador: si hace falta, el
  tipo está mal modelado.
- Los datos que entran de afuera (formularios, APIs, webhooks, JSON de un modelo de IA) se
  validan con Zod en el borde; adentro se confía en el tipo.

## Node

- Versión fija en `package.json` (`"engines": { "node": ">=22.22 <23" }`) y en `.nvmrc`.
- `npm ci` con `package-lock.json` versionado; dependencias con versión exacta
  (`save-exact=true` en `.npmrc`).
- Logs estructurados (por ejemplo `pino`); `console.*` bloqueado por el linter fuera de
  scripts.
- Procesos largos (workers, colas) en un proceso aparte del servidor web, con su propia unidad
  de systemd.

## Herramientas

| Función | Herramienta |
|---|---|
| Formato | Prettier (+ `prettier-plugin-tailwindcss` si hay Tailwind) |
| Análisis | ESLint 9, config plana: `eslint-config-next` + `typescript-eslint` `strictTypeChecked` |
| Tipos | `tsc --noEmit` |
| Capas | `dependency-cruiser` |
| Tests | Vitest (dominio y casos de uso con puertos fake), Playwright (e2e) |
| Vulnerabilidades | `npm audit --audit-level=high` |
| Modernización | `npx @next/codemod` al subir de versión mayor, en un commit aparte |

Desde Next 16 no existe `next lint`: el script es `eslint .`.

## `eslint.config.mjs` base

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Reglas con tipos sólo sobre TypeScript del proyecto: los .mjs de config no están en el tsconfig.
  ...tseslint.configs.strictTypeChecked.map((c) => ({ ...c, files: ["**/*.{ts,tsx}"] })),
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      "no-console": "error",
      // Cubre process.env, process["env"] y const { env } = process.
      "no-restricted-syntax": ["error",
        { selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Leé la config tipada de src/infrastructure/config.ts" },
        { selector: "MemberExpression[object.name='process'][property.value='env']",
          message: "Leé la config tipada de src/infrastructure/config.ts" },
        { selector: "VariableDeclarator[init.name='process'] > ObjectPattern > Property[key.name='env']",
          message: "Leé la config tipada de src/infrastructure/config.ts" }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  { files: ["src/infrastructure/config.ts", "scripts/**", "tests/**", "*.config.*",
            "instrumentation.ts", "middleware.ts", "src/middleware.ts"],
    rules: { "no-restricted-syntax": "off", "no-console": "off" } },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts",
                 "coverage/**", "playwright-report/**", "test-results/**"]),
]);
```

Validar con `npx eslint --print-config src/domain/x.ts` después de cualquier cambio.

## `.dependency-cruiser.cjs` base

```js
module.exports = {
  forbidden: [
    { name: "dominio-puro", severity: "error",
      from: { path: "^src/domain/" },
      to: { pathNot: "^src/domain/" } },
    { name: "aplicacion-sin-infra", severity: "error",
      from: { path: "^src/application" },
      to: { path: "^src/(infrastructure|app|ui)|node_modules/(next|react|drizzle-orm|pg)" } },
    { name: "infra-sin-entrada", severity: "error",
      from: { path: "^src/infrastructure" },
      to: { path: "^src/(app|ui)" } },
    { name: "ui-sin-capas-de-servidor", severity: "error",
      from: { path: "^src/ui/" },
      to: { path: "^src/(application|app|infrastructure)/|node_modules/(drizzle-orm|pg)/" } },
    { name: "ui-sin-runtime-de-dominio", severity: "error",
      from: { path: "^src/ui/" },
      to: { path: "^src/domain/", dependencyTypesNot: ["type-only"] } },
    { name: "sin-ciclos", severity: "error", from: {}, to: { circular: true } },
  ],
  options: { tsConfig: { fileName: "tsconfig.json" }, doNotFollow: { path: "node_modules" } },
};
```

`ui-sin-runtime-de-dominio` deja que `ui` importe **sólo tipos** del dominio (`import type`);
la lógica de dominio la ejecuta el servidor. `dominio-puro` prohíbe también cualquier paquete
de `node_modules`. Si el dominio necesita
una librería (por ejemplo, de fechas), se agrega como excepción explícita y se documenta en
un ADR.

## Tests

- Dominio: tests sin dobles, con datos armados en el test.
- Casos de uso: puertos fake en memoria, no mocks de librería.
- Permisos de la base: contra una base real con los roles reales (`stacks/postgres.md`).
- e2e: los flujos principales en Playwright, con Chromium del sistema
  (`executablePath`) si el runner no puede descargar navegadores.
- Un bug corregido entra con el test que lo reproduce.

## Skills complementarios

`vercel-react-best-practices`, `vercel-composition-patterns`, `frontend-ui-engineering`,
`playwright-best-practices`, `postgres-patterns`. Se combinan con este estándar; ante un
conflicto, manda este archivo.
