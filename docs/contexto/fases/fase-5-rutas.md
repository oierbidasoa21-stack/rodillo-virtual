# Fase 5 — Rutas en 2D ✅ (con simulados)

**Fechas:** 2026-10-03 · **Rama:** `feat/routes` · **Milestone:** Fase 5 (cerrado)

## Objetivo

Rodar sobre una ruta con pendiente. Hecho cuando se completa una ruta entera viendo cómo se avanza y cómo cambia la pendiente.

## Qué se hizo (3 revisiones)

- **Dominio**: lector de GPX propio (funciona en Node), remuestreo cada 10 m, altitud suavizada con **media triangular de ±50 m**, pendiente limitada a ±25 %, desnivel; posición con vueltas; avance **por potencia** (física con inercia de 4 s) o **por velocidad de rueda** (pedido por el usuario para cuando no hay curva).
- **3 rutas inventadas**: Vuelta al Embalse (20 km llano), Puerto de la Sierra Imaginaria (8 km al 6 %), Rompepiernas del Valle (15 km, 3–8 %).
- **Datos**: tabla `routes` (Dexie v3); copia de seguridad formato 2 con rutas.
- **Pestaña Rutas**: importar/borrar GPX, tarjetas con perfil.
- **Vista de carrera**: HUD (pendiente, velocidad, potencia, pulso, cadencia, distancia, quedan, desnivel, tiempo), perfil coloreado por pendiente con posición y próximos 500 m, minimapa SVG, **modo activo siempre visible**.
- **Sesión sobre ruta**: el player con una franja de ruta; la ruta da vueltas hasta que acaba la sesión.
- Resumen e historial con distancia, velocidad media, desnivel, modo y vueltas; «—» en carga y kcal cuando no se pueden saber.

## Comprobación

Puerto entero en modo potencia (velocidades que cuadran a mano; 20,0 km y +488 m al final), modo rueda, GPX bueno y roto, sesión de 8′ con 2 vueltas, player con ruta que cabe en 1280×900; todo repetido contra la web publicada.

## Desviaciones y notas

- La media simple de 50 m prevista convertía picos de GPS en paredes del 60 %; se cambió por la triangular de ±50 m.
- Ajustes visuales tras las capturas: pendiente en una línea, HUD en dos filas, colores sin parpadeo en el 5 %.

## Pendiente

Prueba con sensores reales.
