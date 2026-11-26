import { PLAN_FORMAT } from './plan';

/**
 * Instructions to give the user's coaching agent once, so the weekly plans it
 * writes can be imported. Also downloadable from the app.
 */
export const AGENT_INSTRUCTIONS = `# Cómo escribir planes para Rodillo Virtual

Rodillo Virtual es mi app de entrenamiento en rodillo. Entreno por **zonas de pulso** y
sensaciones; aún no tengo FTP medido. Cuando te pida el plan de la semana, además de
explicarlo, dame un bloque JSON con este formato para importarlo en la app
(Sesiones → Plan del entrenador → Importar plan).

## Formato

\`\`\`json
{
  "formato": "${PLAN_FORMAT}",
  "nombre": "Semana 49 · base",
  "dias": [
    {
      "fecha": "2026-11-30",
      "titulo": "Rodaje L2 con cambios",
      "notas": "Cadencia alta en los cambios",
      "bloques": [
        { "tipo": "calentamiento", "min": 10, "zona": "L1" },
        {
          "repetir": 4,
          "bloques": [
            { "tipo": "serie", "min": 4, "zona": "UA" },
            { "tipo": "recuperacion", "min": 3, "zona": "L1" }
          ]
        },
        { "tipo": "vuelta", "min": 10, "zona": "L1", "nota": "Soltar piernas" }
      ]
    },
    { "fecha": "2026-12-01", "descanso": true, "notas": "Descanso total" }
  ]
}
\`\`\`

## Reglas

- \`formato\` siempre \`"${PLAN_FORMAT}"\`.
- \`fecha\`: AAAA-MM-DD, una entrada por día (sin repetir fechas). Los días sin entrada no tienen nada planificado.
- Día de descanso: \`"descanso": true\` (sin bloques).
- Día con sesión: \`titulo\` (corto; es el nombre de la sesión) y \`bloques\`. \`notas\` es opcional.
- Cada bloque: \`tipo\` (\`calentamiento\`, \`serie\`, \`recuperacion\`, \`vuelta\` o \`bloque\`), duración con \`min\` y/o \`seg\` (máximo 6 h), y \`zona\`: \`L1\`, \`L2\`, \`L3\`, \`UA\` (umbral), \`UA+\` o \`VO2\`. \`nota\` es opcional y se lee en voz alta no; se muestra en pantalla.
- Repeticiones: \`{ "repetir": N, "bloques": [...] }\` con N entre 1 y 30. No se pueden anidar.
- Solo si algún día tengo FTP: en vez de \`zona\` puedes usar \`"ftp": 90\` (% de FTP).
- Usa solo estas claves. Si algo no encaja en el formato, explícalo en \`notas\`.

## Lo que te paso yo

Antes de pedirte el plan te pegaré el **informe** que genera la app (Sesiones → Plan del
entrenador → Copiar informe): mis zonas en ppm, mi condición, fatiga y frescura (carga
por pulso, no TSS) y las sesiones de las últimas 4 semanas con los minutos en cada zona.
`;
