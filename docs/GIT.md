# Git y GitHub

Guia corta para publicar ProxBot sin subir datos privados.

## No subir archivos privados

Antes de cada commit revisa:

```bash
git status
git diff
```

No deben subirse:

- `.env`
- `config.json`
- `logs/`
- `node_modules/`
- tokens de Discord
- IPs reales si no quieres publicarlas

`.gitignore` ya excluye los archivos principales.

## Primer commit

```bash
git init
git add .
git status
git commit -m "Initial ProxBot v1 release"
```

## Conectar con GitHub

Crea un repositorio vacio en GitHub y despues:

```bash
git branch -M main
git remote add origin https://github.com/TU-USUARIO/proxbot.git
git push -u origin main
```

Si ya tienes `origin` mal configurado:

```bash
git remote -v
git remote set-url origin https://github.com/TU-USUARIO/proxbot.git
```

## Flujo normal

```bash
git status
git add .
git commit -m "Descripcion corta del cambio"
git push
```

## Si subes un secreto por error

1. Revoca el token o credencial.
2. Genera uno nuevo.
3. Limpia historial con una herramienta especifica o crea un repo nuevo limpio.

Borrar el secreto en un commit posterior no lo elimina del historial.
