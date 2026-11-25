# Fase 3 — Sensores Bluetooth ✅ (con simulados)

**Fechas:** 2026-10-02/03 · **Rama:** `feat/sensors` · **Milestone:** Fase 3 (cerrado)

## Objetivo

Leer sensores reales y simularlos para desarrollar sin hardware. Hecho cuando, con la banda y el sensor de velocidad conectados al ordenador, se ven pulso, velocidad y cadencia en directo.

## Qué se hizo (2 revisiones)

- Interfaz común de sensor y store; gestor que elige real o simulado.
- Decodificadores puros de Heart Rate (0x2A37) y CSC (0x2A5B); calculador de velocidad y cadencia con vueltas a 0, parada a los 3 s y reinicios. **Sin datos de biela no hay cadencia.**
- Bluetooth real con reconexión (1, 2, 4, 8, 16, 30 s) y mensajes en español.
- **Sensores simulados** que generan paquetes en bytes y pasan por los decodificadores reales; panel con deslizadores, «seguir la zona del bloque» y «simular caída». Activables en la web publicada (Ajustes → Desarrollo), siempre marcados SIMULADO.
- **Circunferencia de rueda** configurable (2155 mm por defecto, 700×32), traída desde la Fase 4.
- Pestaña Sensores, indicadores en la cabecera, pulso/velocidad/cadencia en el player con «En zona / Por encima / Por debajo», aviso si se cae un sensor.
- Resumen con **tiempo en zona medido por el pulsómetro** (reglas de la v1), pulso medio y máximo; marca «SIM.» en el historial.

## Comprobación

Tests con paquetes de ejemplo y dispositivos Bluetooth falsos; en headless con simulados (caída y reconexión, «seguir zona», resumen medido).

## Desviaciones y notas

- Error encontrado en la prueba en navegador: las lecturas no se veían porque la frescura rechazaba lecturas «del futuro» respecto al reloj de la UI. Corregido.

## Pendiente

Prueba con banda de pulso y sensor de velocidad reales.
