# Fase 1 — Port de la v1 (workout player por pulso) ✅

**Fechas:** 2026-10-02 · **Rama:** `feat/phase-1-port` · **Milestone:** Fase 1 (cerrado)

## Objetivo

Todo lo que hace `docs/reference/rodillo-pulso-v1.html`, con arquitectura modular. Hecho cuando se puede hacer una sesión completa en el ordenador igual que con la v1.

## Qué se hizo (3 revisiones)

- **Dominio:** zonas /10″ (clasificar, estado frente al objetivo, validar, ajustar vecina), modelo de sesión con repeticiones, editor puro, biblioteca con las 8 sesiones de la v1, **player como máquina de estados** (aviso a 10 s, 3-2-1, +1′, saltar, terminar), carga por zonas y kcal por MET.
- **Datos:** Dexie (sesiones, historial, ajustes) con stores de Zustand; ajustes por defecto con el atleta de ejemplo.
- **UI:** pestañas, franja de zonas, temas claro/oscuro, fuentes Barlow autoalojadas, biblioteca, editor, ajustes (peso, zonas, importar/exportar `athlete.json`, voz, pitidos, tema), player a pantalla completa, voz y pitidos, Wake Lock, contador de 10″, resumen, historial con totales de 7 días.

## Comprobación

Tests unitarios con casos a mano; recorrido completo en navegador headless (crear/editar/borrar, persistencia, sesión con contador, resumen e historial).

## Desviaciones y notas

- El tiempo que se pierde con la pestaña en segundo plano pasa al bloque siguiente (en la v1 se sumaba al actual).
- El contador de 10″ siempre pita; compara con la zona que había al abrirlo.
- El pulsómetro Bluetooth de la v1 se dejó para la Fase 3.
