# 🌱 Generador de Datos Demo - Quick Start

## Uso Rápido

### Con Docker (Recomendado)

Edita `docker-compose.yml` y agrega las variables de entorno:

```yaml
backend:
  environment:
    - SEED_DEMO=true
    - SEED_REPORTS=5000
```

Luego ejecuta:

```bash
docker-compose up --build
```

### Sin Docker

```bash
# Linux/Mac
SEED_DEMO=true SEED_REPORTS=5000 npm run dev

# Windows PowerShell
$env:SEED_DEMO="true"; $env:SEED_REPORTS="5000"; npm run dev
```

## Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `SEED_DEMO` | Activar generación | `false` |
| `SEED_REPORTS` | Cantidad de reportes | `5000` |
| `SEED_CLEAR` | Limpiar datos existentes | `false` |

## Ejemplos

### Generar 1,000 reportes (prueba rápida)
```bash
SEED_DEMO=true SEED_REPORTS=1000 npm run dev
```

### Generar 10,000 reportes (demo completa)
```bash
SEED_DEMO=true SEED_REPORTS=10000 npm run dev
```

### Generar 100,000 reportes (performance test)
```bash
SEED_DEMO=true SEED_REPORTS=100000 npm run dev
```

### Limpiar y regenerar
```bash
SEED_DEMO=true SEED_CLEAR=true SEED_REPORTS=5000 npm run dev
```

## Qué se genera

- ✅ Reportes distribuidos en Buenos Aires (80%) y Córdoba (20%)
- ✅ 11 tipos de incidentes con tags dinámicos
- ✅ Clusters correlacionados detectables automáticamente
- ✅ Distribución temporal realista (últimos 6 meses)
- ✅ Estados, criticidad, validez y trust scores
- ✅ Usuarios autenticados (70%) y anónimos (30%)

## Validación

Después de generar los datos:

1. Accede al dashboard de analytics
2. Verifica las estadísticas generales
3. Explora el heatmap geoespacial
4. Prueba la detección de clusters con:
   - Tags coincidentes: 2
   - Radio: 500m
   - Tiempo: 2h

## Documentación Completa

Ver [SEED_DEMO_GUIDE.md](../SEED_DEMO_GUIDE.md) para información detallada.