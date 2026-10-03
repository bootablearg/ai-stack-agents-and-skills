# CHECKLIST — Señales de "esto lo hizo una IA" (AI tells)

Catálogo de detección por dimensión. Cada dimensión aporta al **AI-smell score**
(peso entre paréntesis). Para cada tell: reconocelo → explicá por qué delata IA →
proponé el fix. Buscá evidencia real (screenshot o `archivo:línea`), nunca asumas.

---

## 1. Color y paleta (peso 15)
**Tells:**
- Violeta/índigo/púrpura como color primario "porque sí" (el default emocional de la IA).
- Gradiente `purple→blue` o `indigo→violet` en hero/botones/fondos.
- Paleta directa de Tailwind sin customizar (`blue-500`, `purple-600`, `slate-*`).
- Todo el sitio en grises fríos + un acento saturado, sin temperatura ni intención.
- Dark mode = invertir a `#0f172a` (slate-900) sin pensar contraste ni profundidad.

**Fix:** paleta con intención de marca; acentos derivados, no de stock; temperatura
coherente; neutrales con un tinte (no gris puro); contraste jerárquico real.

## 2. Tipografía (peso 15)
**Tells:**
- `Inter` / `system-ui` por defecto en TODO, sin segunda familia ni personalidad.
- Jerarquía plana: h1/h2/body casi del mismo tamaño y peso.
- Un solo weight (400/500) para todo; falta de contraste tipográfico.
- `line-height` y `letter-spacing` por default; títulos grandes sin tracking negativo.
- Medidas de línea larguísimas (texto a todo el ancho, >80ch).

**Fix:** escala tipográfica con saltos claros; pareja de familias (display + texto);
weights contrastados; tracking ajustado en headings; medida 60-75ch.

## 3. Espaciado y layout (peso 12)
**Tells:**
- TODO centrado (text-align center, columnas centradas) de arriba a abajo.
- Secciones equidistantes, mismo padding vertical en todas: ritmo monótono.
- "Everything in a rounded card": cada bloque metido en una tarjeta igual.
- Grid de 3 cards idénticas repetido en cada sección.
- Márgenes simétricos perfectos, cero tensión ni asimetría intencional.

**Fix:** ritmo vertical variado; alineación a la izquierda donde corresponde; romper
la grilla con asimetría deliberada; jerarquía de contenedores (no todo es card).

## 4. Jerarquía visual (peso 12)
**Tells:**
- No hay un foco claro: todo compite por atención con el mismo peso.
- CTAs que no destacan del resto; múltiples botones "primarios".
- Densidad uniforme, sin puntos de respiro ni de énfasis.

**Fix:** un foco por vista; un CTA primario inequívoco; contraste de tamaño/peso/color
para guiar el ojo; espacio negativo como herramienta.

## 5. Motion e interacción (peso 10)
**Tells (AI-slop motion):**
- `fade-in` genérico en todo, mismo `ease` y misma duración en cada elemento.
- Animaciones de entrada por scroll sin propósito, todas iguales.
- Hover = solo cambio de color, sin feedback de estado real.
- Transiciones lineales o `ease` default; nada de spring/curvas con carácter.
- Micro-interacciones ausentes (focus, loading, éxito/error sin animar).

**Fix:** ver `/skill design-motion-principles` (modo audit). Motion con propósito,
curvas con carácter, duraciones jerarquizadas, feedback de estado.

## 6. Iconografía e imágenes (peso 8)
**Tells:**
- Emojis usados como iconos decorativos (🚀✨💡🎯) en features/hero.
- Set de iconos default (Heroicons/Lucide) sin coherencia de trazo con la marca.
- Imágenes stock genéricas o placeholders `via.placeholder`.
- Ilustraciones "blob" de gente flotando estilo corporate-memphis.

**Fix:** iconos coherentes con la marca; imágenes propias/curadas; sin emojis-icono.

## 7. Copy y voz (peso 8)
**Tells:**
- Aperturas cliché: "In today's fast-paced world…", "Unlock", "Elevate", "Seamlessly",
  "Empower", "Revolutionize", "Take your X to the next level".
- Features en trío perfecto con verbos vacíos; todo "powerful", "intuitive", "robust".
- Voz neutra sin personalidad ni punto de vista; cero especificidad.

**Fix:** voz concreta y con criterio; beneficios específicos, no adjetivos; ver
`/skill writing-guidelines`.

## 8. Consistencia y tokens (peso 6)
**Tells:**
- Valores mágicos dispersos (colores/espaciados hardcodeados que casi coinciden).
- Border-radius distinto por componente sin sistema; sombras ad-hoc.
- Falta de design tokens; imposible cambiar el tema en un lugar.

**Fix:** sistema de tokens (color/espaciado/radius/sombra/tipografía) único y aplicado.

## 9. Accesibilidad (peso 8)
**Tells:**
- Contraste insuficiente (texto gris claro sobre blanco, el look "elegante" ilegible).
- Foco no visible o eliminado (`outline: none` sin reemplazo).
- Targets táctiles chicos; jerarquía de headings rota; sin `alt`.

**Fix:** contraste AA/AAA; foco visible con carácter; targets ≥44px; ver agente
`testing-accessibility-auditor`.

## 10. Detalles de oficio (peso 6)
**Tells:**
- Sombra default de Tailwind (`shadow-md`) en todo, plana y gris.
- Bordes `1px solid #e5e7eb` genéricos por todos lados.
- Border-radius uniforme (`rounded-lg`) en absolutamente todo.
- Cero detalles finos: sin bordes ópticos, sin ajuste de sombras por elevación,
  sin estados vacíos cuidados.

**Fix:** sombras con luz/color coherente por elevación; bordes sutiles o ausentes;
radius jerarquizado; cuidar estados vacíos, loading y error.

---

## Cálculo del AI-smell score

1. Por dimensión, estimá qué fracción de sus tells aparece (0.0–1.0).
2. Multiplicá por el peso y sumá → score 0-100.
3. Veredicto:
   - **0-20** Artesanal — indistinguible de trabajo humano con criterio.
   - **21-45** Sólido con detalles de IA — pocos tells, fáciles de pulir.
   - **46-70** Huele a IA — patrones genéricos evidentes, necesita trabajo.
   - **71-100** Plantilla de IA de manual — rediseño de estética recomendado.

Reportá el score, el desglose por dimensión (los pesos que más sumaron primero) y
los hallazgos rankeados por severidad.
