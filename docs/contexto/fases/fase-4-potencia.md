# Fase 4 — Potencia estimada, ramp test y métricas ✅ (con simulados)

**Fechas:** 2026-10-03 · **Rama:** `feat/power` · **Milestone:** Fase 4 (cerrado)

## Objetivo

Vatios estimados en rodillo tonto y métricas de potencia. Hecho cuando se hace un ramp test, se obtiene un FTP estimado y las sesiones muestran vatios objetivo.

## Qué se hizo (3 revisiones + copia de seguridad)

- **Curvas de rodillo**: 7 rodillos de fluido con coeficientes de GoldenCheetah (cada uno con su fuente) + curva personalizada `a·v + b·v³`, y su inversa.
- **Física**: velocidad virtual por bisección (se usa en la Fase 5).
- **Métricas**: NP, IF, TSS, kJ, mejor media de 60 s, zonas Coggan Z1–Z7.
- **Modelo**: los bloques pasan de `zoneId` a `target` (pulso, % FTP o vatios), con **migración Dexie v1 → v2**.
- **Copia de seguridad completa** (pedida por el usuario antes de seguir): exportar/importar sesiones, historial y ajustes.
- **Ajustes → Rodillo y potencia**: modelo o curva, FTP (manual o del ramp test) y zonas de potencia.
- **Potencia estimada en directo** («W est.») en sensores, cabecera y player; el simulador sigue los objetivos de potencia.
- **Ramp test**: 5′ a 100 W, +20 W/min, «No puedo más», FTP = 75 % del mejor minuto, «Guardar como mi FTP».
- **Editor y player por potencia**: bloques en % FTP, «88 % FTP · 211 W (201–222) · Z3 · Tempo», voz con vatios, 2 sesiones de potencia en la biblioteca.
- **Resumen**: potencia media, NP, máxima, kJ, IF, TSS, zonas de potencia; kcal ≈ kJ; columna TSS en el historial. El simulador vuelve a su estado al terminar.

## Comprobación

Migración v1 → v2 en navegador real; ramp test completo con simulados (FTP 217 W, coherente con la curva); sesión por potencia con métricas que cuadran a mano.

## Desviaciones y notas

- Solo rodillos de fluido: los magnéticos dependen del nivel de resistencia.
- El IF y el TSS usan el FTP del momento y los segundos con potencia.

## Pendiente

Prueba con el rodillo real (elegir su modelo o meter su curva) y ramp test de verdad.
