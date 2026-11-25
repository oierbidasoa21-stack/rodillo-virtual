# Fase 8 — Rodillo inteligente (opcional) ⏳

**Solo si el usuario compra un rodillo inteligente.** Está pendiente de que lo decida.

- FTMS (0x1826): lectura de potencia, cadencia y velocidad reales.
- Modo ERG: el workout fija la potencia del rodillo.
- Modo simulación: la pendiente de la ruta ajusta la resistencia.

El diseño ya lo permite: cada sensor implementa la misma interfaz (`connect`, `disconnect`, lecturas con marca de tiempo) y la potencia medida sustituiría a la estimada sin cambiar la UI.

## Fase 9 — Móvil ❌ (descartada)

Descartada el 2026-11-25: la app se usa solo en el ordenador.
