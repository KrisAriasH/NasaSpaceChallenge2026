# Asclepio — Guía para el equipo

Base creada el sábado 14 durante el evento. Ya funciona de punta a punta con datos simulados.
Prioridad: que sea **válida científicamente**, que la **privacidad** se vea clara en la demo y
contar bien la historia. No agreguen funciones grandes antes de cerrar esto.

## Arranque (todos, 15 min)

1. Subir esta carpeta al repo: `git remote add origin https://github.com/KrisAriasH/NasaSpaceChallenge2026.git` y `git push -u origin main`
2. Cada uno: clonar, `npm install`, `npm run dev`.
3. Desplegar en Vercel o Netlify (build `npm run build`, carpeta `dist`) y poner la URL en el README.
4. Correr `npm test` antes de cada push. Las pruebas de privacidad no deben romperse.

## Ciencia / doctora consultora

- [ ] Revisar los umbrales `T` en `src/engine/rules.ts` (los marcados PLACEHOLDER), sobre todo el panel de sangre.
- [ ] Confirmar rangos sanos del simulador en `src/data/simulate.ts`.
- [ ] Llenar los `source: 'TODO'` de `src/engine/guidance.ts`.
- [ ] Definir con la doctora qué cuenta como verde, amarillo y rojo en salud mental.
- [ ] Decidir si el cortisol debe tratarse como dato mental (privado) o físico (lo ve el CMO). Hoy lo ve el CMO.
- [ ] Verificar que existe un análisis de sangre por pinchazo viable a bordo y citarlo; si no, explicarlo como supuesto.

## Lógica y datos

- [ ] Exámenes mensuales de orina y heces: hoy solo aparece la fecha. Agregar sus valores si la doctora define cuáles.
- [ ] Usar datos reales de NASA (OSDR, Inspiration4) para calibrar al menos un rango y citarlo.
- [ ] Resumen para tierra que respete los permisos (`canGroundSee` ya existe).
- [ ] Opcional: reemplazar la predicción lineal de `forecast.ts` por un modelo entrenado (la parte de IA), sin cambiar las pantallas.

Para agregar una regla: en `rules.ts` calcular el valor, llamar `add({...})` con un `id` nuevo y
su `reveals` (qué categoría de dato revela), y agregar el mismo `id` en `GUIDANCE`. Si falta, `npm test` falla.

## Frontend

- [ ] Revisar textos en inglés con alguien del equipo.
- [ ] Gráfico de varias líneas en el detalle (por ejemplo, leucocitos y linfocitos juntos).
- [ ] Mostrar en "Mi estado" el aviso de la alerta temprana.
- [ ] Probar la app en la resolución de una laptop pequeña (1280 px).

## Pitch

- [ ] Guion de 30 s siguiendo la tabla "Demo story" del README: CMO ve a Chen en rojo sin ver respuestas → vista de Chen → comparte → CMO asigna acción.
- [ ] Página del proyecto en inglés, con el enlace al repo y a la app desplegada.
- [ ] Decir claramente "simulated data" y "not a medical device".

Congelar funciones el sábado en la noche.
