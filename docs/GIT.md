# Guia Git para ProxBot v.1

Esta guia asume que quieres publicar el proyecto sin subir datos privados del homelab.

## 1. Revisar que no hay secretos

Antes del primer commit:

```bash
git status
git diff
```

No deben aparecer:

- `.env`
- `config.json`
- `logs/`
- `node_modules/`
- IPs reales de tu homelab
- tokens de Discord

`.gitignore` ya excluye los archivos privados principales.

## 2. Crear el repositorio local

Desde la carpeta del proyecto:

```bash
git init
git add .
git status
git commit -m "Initial ProxBot v1 release"
```

## 3. Crear el repositorio en GitHub

Puedes crearlo desde la web de GitHub con un nombre como:

```text
proxbot
```

Recomendacion:

- Publico si quieres ensenarlo como portfolio.
- Privado si aun estas limpiando o probando.
- Sin README inicial en GitHub, porque el proyecto ya tiene uno local.

## 4. Conectar local con GitHub

GitHub te dara una URL parecida a:

```bash
git remote add origin https://github.com/tu-usuario/proxbot.git
git branch -M main
git push -u origin main
```

## 5. Flujo normal de trabajo

Para cada mejora:

```bash
git status
git add .
git commit -m "Descripcion corta del cambio"
git push
```

Ejemplos de commits:

```bash
git commit -m "Add configurable diagnostics"
git commit -m "Document homelab service configuration"
git commit -m "Remove hardcoded personal services"
```

## 6. Como reflejar bien el proyecto

Tu README deberia contar:

- Que problema resuelve: panel y diagnostico para homelabs desde Discord.
- Que lo hace portable: `config.json`, `.env`, comandos dinamicos.
- Que sabe hacer: servicios, dominios, SSH, diagnostico DNS/TCP/HTTP.
- Como instalarlo: `npm install`, `npm run init-config`, `.env`, `npm run deploy`, `npm start`.
- Que no incluye: tokens, IPs reales, configuracion privada.

## 7. Si algun secreto se sube por error

No basta con borrarlo en un commit nuevo. Hay que:

1. Revocar el token afectado.
2. Regenerar credenciales.
3. Limpiar el historial con una herramienta como `git filter-repo` o crear un repo nuevo limpio.

Lo mejor es prevenir: revisar siempre `git status` y `git diff` antes de `git commit`.
