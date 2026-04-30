# Pruebas de ProxBot v0.3.0

## Objetivo

Probar que la monitorizacion automatica de ProxBot funciona sin spam.

## Requisitos previos

- Tener `.env` configurado.
- Tener `config.json` local.
- Tener el bot invitado al servidor.
- Tener un canal de alertas, por ejemplo `homelab-alertas`.
- Tener el ID del canal de alertas.
- Estar usando una rama o build con v0.3.0.

## Configuracion recomendada para probar

En tu `config.json` local, usa una configuracion temporal parecida a esta:

```json
{
  "monitoring": {
    "enabled": true,
    "intervalMinutes": 1,
    "alertChannelId": "ID_DEL_CANAL_DE_ALERTAS",
    "notifyOnlyOnChange": true,
    "runOnStartup": true
  }
}
```

## Servicio falso para probar fallo

Añade temporalmente un servicio que no deberia responder:

```json
{
  "name": "Servicio falso test",
  "description": "Servicio para probar alertas de ProxBot",
  "host": "192.168.0.250",
  "port": 9999,
  "enabled": true,
  "check": true,
  "tags": ["test"]
}
```

Este servicio deberia fallar y generar una alerta `FAILED`.

## Pasos de prueba

1. Edita tu `config.json` local.
2. Ejecuta `npm run check-config`.
3. Ejecuta `npm run deploy` para registrar `/monitor` y `/ultimodiagnostico`.
4. Ejecuta `npm start`.
5. Prueba `/status`.
6. Prueba `/monitor`.
7. Espera el primer ciclo automatico.
8. Comprueba que llega una alerta `FAILED`.
9. Espera otro ciclo y comprueba que no hay spam.
10. Quita el servicio falso o cambia `check` a `false`.
11. Reinicia el bot o espera al ciclo siguiente.
12. Comprueba el comportamiento.
13. Prueba `/ultimodiagnostico`.

## Que resultados se esperan

- `/monitor` muestra monitoring activo.
- `/ultimodiagnostico` muestra el ultimo diagnostico.
- `FAILED` se envia una vez.
- No se repite la alerta en cada ciclo si el estado no cambia.
- `RECOVERED` se envia cuando el servicio vuelve a OK.
- No se suben `data/status-cache.json` ni `data/last-diagnostics.json`.

## Limpieza despues de la prueba

- Elimina el servicio falso.
- Vuelve `intervalMinutes` a `5` o mas.
- Mantener `notifyOnlyOnChange=true`.
- Decide si `runOnStartup` queda en `true` o `false`.
- Revisa `git status`.

## Troubleshooting

### No aparece /monitor o /ultimodiagnostico

Ejecuta `npm run deploy` y espera unos segundos a que Discord refresque los
comandos slash.

### No llegan alertas

Revisa `alertChannelId`, los permisos del bot en el canal y que
`monitoring.enabled` este en `true`.

### Se repiten alertas

Revisa `notifyOnlyOnChange` y el contenido local de `data/status-cache.json`.
Ese archivo guarda el estado anterior para comparar cambios.

### Fallan dominios .lab

Revisa el DNS de la maquina donde corre ProxBot. El bot resuelve DNS desde ese
host, no desde tu ordenador personal si se ejecuta en otro servidor.

### El bot no arranca

Revisa `npm install`, `.env` y los logs de consola.

### La aplicacion no ha respondido

Revisa errores de consola y confirma que el bot esta corriendo.
