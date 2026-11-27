# Usar Rodillo Virtual con tu agente entrenador

Si tienes un agente (de IA) que te plantea los entrenamientos, la app se entiende con él en los dos sentidos. No hay servidor: tú copias y pegas.

1. **Una vez:** en **Sesiones → Plan del entrenador → Instrucciones para el agente** se descarga `instrucciones-rodillo-virtual.md`. Dáselas al agente (por ejemplo, como archivo o instrucciones del proyecto). Explican el formato `rodillo-virtual/plan@1`.
2. **Cada semana:** **Copiar informe** copia un resumen en Markdown con un bloque JSON: tus zonas en ppm, condición, fatiga y frescura, y las sesiones de las últimas 4 semanas con los minutos en cada zona. Pégaselo al agente y pídele el plan.
3. **Importar plan:** pega su respuesta tal cual (la app busca el bloque JSON) o elige el archivo. Si algo no encaja, la app dice qué y no importa nada.
4. El plan aparece en Sesiones con cada día: **Empezar** abre la sesión y, al guardarla, el día queda como **Hecha**.

**Desde la Fase 9 las zonas se llaman Z1…Z6** (antes L1, L2, L3, UA, UA+, VO2). Si ya le habías dado las instrucciones a tu agente, descárgalas otra vez y dáselas, o dile que use Z1…Z6. La app sigue aceptando los nombres viejos por si acaso.

El texto de las instrucciones vive en `src/domain/plan/instructions.ts`; un test comprueba que su ejemplo se importa sin cambios.

El informe lleva tus zonas y sesiones: es un dato personal que solo sale de la app cuando tú lo copias o descargas.
