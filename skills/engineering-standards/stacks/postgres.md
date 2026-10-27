# PostgreSQL · SQL · migraciones · permisos por fila

Rige para el esquema, las migraciones y el acceso a datos de cualquier app que use
PostgreSQL, sin importar el lenguaje de la app. Se combina con el archivo del stack de la
aplicación (`nextjs.md`, `django.md`, `go.md`).

## Creación de la base

```sql
CREATE DATABASE <base>
  TEMPLATE template0 ENCODING 'UTF8'
  LOCALE_PROVIDER icu ICU_LOCALE 'es-AR'
  LC_COLLATE 'C.UTF-8' LC_CTYPE 'C.UTF-8';
REVOKE ALL ON DATABASE <base> FROM PUBLIC;          -- saca también CONNECT y TEMP
GRANT CONNECT ON DATABASE <base> TO <app>_app;      -- uno por cada rol con login
-- conectado a <base>:
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
```

🪤 Si la plantilla del servidor está en `SQL_ASCII`, un `CREATE DATABASE` sin opciones crea
una base que no maneja acentos. Siempre `template0` + `UTF8`.

## Roles

| Rol | Para qué | Restricciones |
|---|---|---|
| `<app>_ddl` | Dueño de las tablas; sólo lo usa el runner de migraciones | `NOSUPERUSER NOBYPASSRLS`; credencial sólo del pipeline |
| `<app>_seguridad` | Dueño de las funciones `SECURITY DEFINER` | `NOLOGIN NOBYPASSRLS`; lee sólo lo que le habilitan políticas `TO <app>_seguridad` |
| `<app>_app` | La aplicación | No es dueño de nada; `NOBYPASSRLS`; sólo `SELECT/INSERT/UPDATE/DELETE` donde haga falta |
| `<app>_admin` | Panel de administración de la plataforma | Políticas propias y auditadas |
| `<app>_lector` | Consultas de soporte, reportes | Sólo `SELECT`, opcional |

La app nunca se conecta como dueño de las tablas: el dueño saltea RLS salvo que la tabla
tenga `FORCE ROW LEVEL SECURITY`.

## Nombres y tipos

- `snake_case`, tablas en singular, en el idioma del dominio del producto. Una convención por
  base, sin mezclar idiomas.
- PK `id uuid DEFAULT uuidv7()` (PostgreSQL 18+). En versiones anteriores, el UUID v7 lo
  genera la app.
- Fechas `timestamptz`; nunca `timestamp` sin zona. Montos `bigint` en la unidad mínima +
  columna de moneda. Texto `text` con `CHECK (length(...) <= n)` cuando hay un límite real.
- Estados cerrados con `CHECK (estado IN (...))` o una tabla de referencia; no `enum` de
  PostgreSQL si los valores van a cambiar (no se pueden borrar valores de un `enum`).
- Toda FK con su índice. Toda columna que se filtra en una política de RLS, indexada, en el
  orden en que la consulta la usa (un índice `(grupo_id, persona_id)` no sirve para buscar por
  `persona_id`).
- Cantidades con un dominio que excluya `NaN` (`numeric` lo acepta y `'NaN' >= 0` es verdadero):
  `CREATE DOMAIN cantidad AS numeric(12,3) CHECK (VALUE >= 0 AND VALUE <> 'NaN')`.
- Únicos sobre columnas que pueden ser nulas: `UNIQUE NULLS NOT DISTINCT`.
- `COMMENT ON` en **cada** tabla y columna: qué guarda y por qué existe.

## Migraciones

- Archivos SQL numerados y **sólo hacia adelante** (`0001_inicial.sql`, `0002_...`). Una
  migración aplicada no se edita ni se reformatea: el runner guarda su sha256 y falla si
  cambió. Para corregir, otra migración.
- Cada migración corre en una transacción. Lo que no puede ir en transacción
  (`CREATE INDEX CONCURRENTLY`) va solo en su archivo, con `-- sin-transaccion` en la primera
  línea; el runner lee ese marcador y no abre la transacción.
- Las aplica el pipeline con `<app>_ddl`, antes de desplegar el código que las necesita. El
  código nuevo tolera el esquema viejo durante el despliegue (expandir → migrar → contraer).
- `sqlfluff lint --dialect postgres` sólo sobre migraciones nuevas.

## Permisos por fila (RLS)

Cuando los datos pertenecen a un grupo (hogar, organización, paciente), el aislamiento se
aplica en la base, no sólo en el código.

```sql
ALTER TABLE lote ENABLE ROW LEVEL SECURITY;
ALTER TABLE lote FORCE ROW LEVEL SECURITY;

CREATE POLICY lote_del_hogar ON lote
  USING (hogar_id = ANY (app.hogares_del_actor()))
  WITH CHECK (hogar_id = ANY (app.hogares_del_actor()));
```

- **Identidad por transacción, a partir de un secreto.** La app abre una transacción por pedido
  y pasa el **token de sesión** con `SELECT set_config('app.sesion', $1, true)` (el `true` la
  limita a la transacción; con un pool, un `SET` sin `LOCAL` filtra la identidad al pedido
  siguiente). Una función de la base resuelve el token contra la tabla de sesiones (guardado
  como hash). Nunca un `app.actor_id` con un UUID: cualquier código o inyección que llegue a
  la conexión lo puede cambiar por el de otra persona.
- **Funciones de membresía** `STABLE`, `SECURITY DEFINER`, con `SET search_path = pg_catalog,
  pg_temp` (`pg_temp` al final: si no se nombra, el esquema temporal se busca **primero** y una
  tabla temporal tapa a la real) y todas las relaciones calificadas con su esquema. Sin SQL
  dinámico.
- 🪤 **`FORCE ROW LEVEL SECURITY` alcanza también al dueño de la tabla.** Una función
  `SECURITY DEFINER` cuyo dueño es el de las tablas, sin una política para ese rol, ve cero
  filas: la app arranca con todo vacío y los tests negativos pasan sin probar nada. Las
  funciones van con un dueño propio (`<app>_seguridad`) y políticas explícitas para él.
- **Políticas por comando** (`SELECT`, `INSERT`, `UPDATE`, `DELETE` por separado) y permisos
  por columna. Una sola política `FOR ALL` con la misma condición en `USING` y `WITH CHECK`
  deja pasar un `UPDATE` que mueve la fila a otro grupo del mismo actor.
- **La columna del grupo es inmutable** (trigger `BEFORE UPDATE` que rechaza el cambio de
  `hogar_id`, `organizacion_id`, etc.).
- **Referencias dentro del mismo grupo:** `UNIQUE (grupo_id, id)` en el padre y FK compuesta
  `(grupo_id, padre_id)` en el hijo. Las FK se validan sin RLS: con una FK simple, un hijo del
  grupo A puede apuntar a un padre del grupo B.
- **Funciones que modifican filas:** leen la fila objetivo con `FOR UPDATE`, derivan su grupo,
  verifican el permiso del actor **en ese grupo** y aplican el cambio con
  `UPDATE ... WHERE <estado esperado> RETURNING` para no perder carreras.
- Sin identidad fijada, las políticas devuelven cero filas (nunca "todo").
- `WITH CHECK` en toda política de escritura: sin eso, se puede insertar una fila en un grupo
  ajeno.
- **Test obligatorio:** una suite que se conecta con `<app>_app`, fija la identidad de una
  persona de un grupo y comprueba **que ve lo suyo** (test positivo: sin él, una base que niega
  todo pasa los negativos) y que no puede leer, modificar ni borrar filas de otro grupo. Más un
  test de catálogo: toda tabla con `relrowsecurity`, `relforcerowsecurity` y al menos una
  política; toda función `SECURITY DEFINER` con `search_path` en `proconfig`. Corre en el
  pipeline contra una base efímera.
- **Medir:** `EXPLAIN (ANALYZE, BUFFERS)` de las consultas principales con datos sintéticos
  del volumen esperado, antes de dar el diseño por cerrado.

## Datos sensibles

- Datos de salud, documentos de identidad y similares: cifrados en la aplicación (AES-256-GCM),
  con la clave fuera de la base y una columna `cifrado_version` para rotarla. Si hay que buscar
  por ese dato, se guarda además un HMAC-SHA-256 con clave del servidor: un SHA-256 sin clave de
  un DNI se revierte por fuerza bruta (son ~10⁸ valores).
- PIN y secretos cortos: `crypt(pin, gen_salt('bf'))` de pgcrypto o Argon2id en la app, siempre
  con contador de intentos y bloqueo.
- Auditoría en una tabla de sólo inserción (`REVOKE UPDATE, DELETE` para `<app>_app`).

## Respaldo

Toda base de producción entra al backup diario del servidor de base el mismo día que se crea,
junto con los roles (`pg_dumpall --roles-only`). Un restore de prueba antes del primer pase a
producción.
