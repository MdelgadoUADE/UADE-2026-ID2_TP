# Guía de Uso: Generador de Datos de Demostración

## Descripción General

El script `seed-demo.js` genera datos realistas de reportes para demostrar las capacidades de MongoDB y el dashboard de analytics del sistema Report-IT.

## Características

### Datos Generados

- **Volumen configurable**: De 1,000 a 100,000+ reportes
- **Distribución geográfica**: Buenos Aires (80%) y Córdoba (20%)
- **Período temporal**: Últimos 6 meses con concentración en fechas recientes
- **Clusters correlacionados**: Eventos detectables automáticamente
- **Tags dinámicos**: 11 tipos de incidentes con estructuras diferentes
- **Distribución realista**: Estados, criticidad, validez y trust scores

### Tipos de Incidentes

| Categoría | Tipo | Tags Generados | Peso |
|-----------|------|----------------|------|
| **Seguridad** | Vehículo sospechoso | `color_vehiculo`, `modelo_vehiculo`, `patente_vehiculo`, `marca_vehiculo` | 20% |
| **Seguridad** | Persona sospechosa | `genero_actor`, `pelo_color_actor`, `edad_actor`, `vestimenta` | 15% |
| **Seguridad** | Robo | `tipo_robo`, `objetos_robados` | 10% |
| **Seguridad** | Vandalismo | `tipo_dano`, `severidad` | 8% |
| **Infraestructura** | Bache | `tipo_incidente`, `categoria`, `severidad`, `tamano` | 10% |
| **Infraestructura** | Luminaria | `tipo_incidente`, `categoria`, `estado` | 8% |
| **Infraestructura** | Semáforo | `tipo_incidente`, `categoria`, `estado` | 5% |
| **Ambiente** | Basura | `tipo_incidente`, `categoria`, `volumen` | 10% |
| **Ambiente** | Contaminación | `tipo_incidente`, `categoria`, `tipo_contaminacion` | 4% |
| **Tránsito** | Accidente | `tipo_accidente`, `vehiculos_involucrados` | 6% |
| **Tránsito** | Vehículo abandonado | `tipo_vehiculo`, `estado` | 4% |

## Uso

### Opción 1: Integrado con el servidor (Recomendado)

El script se ejecuta automáticamente al iniciar el servidor si la variable de entorno `SEED_DEMO` está configurada.

#### Docker Compose

Edita `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - SEED_DEMO=true
      - SEED_REPORTS=5000
      - SEED_CLEAR=false
```

Luego ejecuta:

```bash
docker-compose up --build
```

#### Desarrollo Local

```bash
# Linux/Mac
SEED_DEMO=true SEED_REPORTS=5000 npm run dev

# Windows (PowerShell)
$env:SEED_DEMO="true"; $env:SEED_REPORTS="5000"; npm run dev

# Windows (CMD)
set SEED_DEMO=true && set SEED_REPORTS=5000 && npm run dev
```

### Opción 2: Script independiente

Crea un archivo `scripts/generate-demo-data.js`:

```javascript
const mongoose = require('mongoose');
const { runDemoSeed } = require('../backend/src/config/seed-demo');

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/reportit_db');
    console.log('MongoDB conectado');
    
    await runDemoSeed();
    
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
```

Ejecuta:

```bash
node scripts/generate-demo-data.js
```

## Configuración

### Variables de Entorno

| Variable | Descripción | Default | Ejemplo |
|----------|-------------|---------|---------|
| `SEED_DEMO` | Activar generación de datos demo | `false` | `true` |
| `SEED_REPORTS` | Cantidad total de reportes | `5000` | `10000` |
| `SEED_CLEAR` | Limpiar reportes existentes antes de generar | `false` | `true` |

### Configuración Interna (seed-demo.js)

```javascript
const CONFIG = {
  TOTAL_REPORTS: 5000,        // Total de reportes a generar
  CLUSTER_COUNT: 25,          // Cantidad de clusters correlacionados
  CLUSTER_SIZE_MIN: 15,       // Mínimo de reportes por cluster
  CLUSTER_SIZE_MAX: 40,       // Máximo de reportes por cluster
  BATCH_SIZE: 1000,           // Tamaño de lote para inserción
  TIME_RANGE_MONTHS: 6        // Período temporal en meses
};
```

## Resultados Esperados

### Con 5,000 reportes:

**Distribución General:**
- Total reportes: 5,000
- Reportes en clusters: ~500-750
- Reportes normales: ~4,250-4,500

**Estados:**
- Activos: ~1,750 (35%)
- En verificación: ~1,000 (20%)
- Asignados: ~750 (15%)
- Resueltos: ~1,000 (20%)
- Archivados: ~500 (10%)

**Distribución Geográfica:**
- Buenos Aires: ~4,000 reportes (80%)
  - Palermo: ~900
  - Recoleta: ~650
  - Monserrat: ~650
  - Otros: ~1,800
- Córdoba: ~1,000 reportes (20%)
  - Nueva Córdoba: ~500
  - Centro: ~250
  - Otros: ~250

**Clusters Detectables:**
- ~25 eventos correlacionados
- Detectable con parámetros:
  - Tags coincidentes ≥ 2
  - Radio = 500m
  - Ventana temporal = 2h

### Con 100,000 reportes:

Multiplica los valores anteriores por 20. Tiempo estimado de generación: ~10 minutos.

## 🔍 Validación en el Dashboard

### 1. Categoría: Gestión de Incidentes

Accede a la vista de estadísticas y verifica:

-  **Embudo de estados**: Debe mostrar distribución 35/20/15/20/10
-  **Distribución por criticidad**: Gráfico de barras con 4 niveles
-  **Distribución por validez**: Pendiente (40%), Válido (35%), Dudoso (15%), Falso (10%)
-  **Reportes anónimos**: ~30% del total
-  **Trust score promedio**: Entre 0.65 y 0.75

### 2. Categoría: Geo-Análisis

Accede a la vista geoespacial y verifica:

-  **Heatmap**: Debe mostrar concentración en Palermo, Recoleta y Nueva Córdoba
-  **Top 10 zonas**: Palermo debe ser #1 con ~18% de reportes
-  **Filtros por criticidad**: Cambiar filtro debe actualizar heatmap
-  **Filtros por tiempo**: "Últimas 24h" debe mostrar ~10% del total

### 3. Categoría: Correlación y Clusters

Accede a la vista de clusters y prueba:

1. **Buscar reporte ancla**: Busca por "motocicleta negra" o "Toyota Corolla"
2. **Configurar parámetros**:
   - Tags coincidentes: 2
   - Radio: 500m
   - Ventana temporal: 2h
3. **Ejecutar correlación**: Debe encontrar 15-40 reportes relacionados
4. **Verificar**: Los reportes deben tener tags similares y estar cerca en tiempo/espacio

##  Ejemplos de Clusters Generados

### Ejemplo 1: Vehículo Sospechoso

```javascript
{
  tipo: "vehiculo_sospechoso",
  zona: "Palermo",
  reportes: 25,
  tags_comunes: {
    color_vehiculo: "Negro",
    modelo_vehiculo: "Motocicleta"
  },
  radio: 250m,
  ventana_temporal: 75min
}
```

### Ejemplo 2: Robo Reiterado

```javascript
{
  tipo: "robo",
  zona: "Nueva Córdoba",
  reportes: 18,
  tags_comunes: {
    tipo_robo: "Motochorro",
    objetos_robados: "Celular"
  },
  radio: 300m,
  ventana_temporal: 60min
}
```

## Performance Esperada

### Generación de Datos

| Reportes | Tiempo Estimado | Velocidad |
|----------|-----------------|-----------|
| 1,000 | ~10 segundos | ~100 reportes/s |
| 5,000 | ~30 segundos | ~165 reportes/s |
| 10,000 | ~1 minuto | ~165 reportes/s |
| 50,000 | ~5 minutos | ~165 reportes/s |
| 100,000 | ~10 minutos | ~165 reportes/s |

### Consultas en MongoDB

Con índice 2dsphere configurado:

| Operación | Tiempo Esperado |
|-----------|-----------------|
| Consulta geoespacial (radio 10km) | < 100ms |
| Agregación compleja (stats) | < 500ms |
| Búsqueda full-text | < 200ms |
| Heatmap (5000 puntos) | < 300ms |

## Troubleshooting

### Error: "Cannot find module './seed-demo'"

**Solución**: Verifica que el archivo `backend/src/config/seed-demo.js` existe.

### Error: "MongoServerError: E11000 duplicate key error"

**Solución**: Configura `SEED_CLEAR=true` para limpiar datos existentes antes de generar nuevos.

### Los clusters no se detectan en el dashboard

**Verificaciones**:
1. Confirma que los reportes se generaron correctamente
2. Ajusta los parámetros de búsqueda:
   - Reduce el número de tags coincidentes a 1 o 2
   - Aumenta el radio a 1000m
   - Aumenta la ventana temporal a 3-4h
3. Verifica que el índice geoespacial está creado:
   ```javascript
   db.reports.getIndexes()
   ```

### Performance lenta en la generación

**Optimizaciones**:
1. Reduce `BATCH_SIZE` si hay problemas de memoria
2. Aumenta `BATCH_SIZE` para inserción más rápida (máx 5000)
3. Verifica que MongoDB tiene suficiente RAM asignada

### Distribución geográfica incorrecta

**Verificación**: Los pesos en `ZONES` deben sumar 100. Revisa la configuración en `seed-demo.js`.

## Regenerar Datos

Para regenerar datos desde cero:

```bash
# Opción 1: Con variable de entorno
SEED_DEMO=true SEED_CLEAR=true SEED_REPORTS=5000 npm run dev

# Opción 2: Manualmente desde MongoDB
mongo
> use reportit_db
> db.reports.deleteMany({})
> exit
```

Luego ejecuta el seed nuevamente.

## Notas Importantes

1. **No genera campos `related_reports`**: Los clusters deben ser descubiertos por el sistema automáticamente.

2. **Tags dinámicos**: Cada tipo de incidente tiene una estructura de tags diferente, demostrando la flexibilidad del esquema MongoDB.

3. **Distribución temporal realista**: Los reportes se concentran en horarios pico (8-10, 12-14, 18-23) y fechas recientes.

4. **Trust score correlacionado**: El trust score está correlacionado con el campo `validez` para que las métricas tengan sentido.

5. **Usuarios variados**: 70% autenticados, 30% anónimos, con nombres y emails realistas.

## Uso Académico

Este generador está diseñado para demostrar:

1. **Performance de MongoDB**: Consultas rápidas con gran volumen de datos
2. **Índices geoespaciales**: Búsquedas por proximidad eficientes
3. **Esquema flexible**: Tags dinámicos sin migraciones
4. **Agregaciones complejas**: Pipeline de agregación de MongoDB
5. **Análisis de datos**: Visualizaciones y estadísticas en tiempo real

## Referencias

- [MongoDB Geospatial Queries](https://docs.mongodb.com/manual/geospatial-queries/)
- [MongoDB Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
- [Mongoose Schema Types](https://mongoosejs.com/docs/schematypes.html)

---

**Versión**: 1.0.0  
**Última actualización**: Junio 2026  
**Proyecto**: Report-IT - Sistema de Gestión de Reportes Ciudadanos