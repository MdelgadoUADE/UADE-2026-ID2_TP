# Test de Creación de Reportes con Trust Score

## Estado Actual del Código

✅ **Backend implementado correctamente:**
- Endpoint POST /reports calcula trust score automáticamente
- Manejo de errores: si falla el trust score, el reporte se crea igual
- Trust score se guarda con metadata completa

✅ **Frontend enviando datos correctos:**
- CreateReport.vue envía todos los campos necesarios
- Incluye user, is_anonymous, notes, tags, report_location

## Prueba Manual Rápida

### 1. Verificar que el backend esté corriendo

```bash
# En la terminal, verificar que el backend responda
curl http://localhost:3000/reports
```

### 2. Crear un reporte de prueba desde la terminal

```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "user_id": "1",
      "username": "testUser",
      "surname": "User",
      "email": "testuser@reportit.com"
    },
    "is_anonymous": false,
    "notes": "Este es un reporte de prueba con descripción detallada para verificar el trust score",
    "tags": {
      "tipo_incidente": "test",
      "prioridad": "alta"
    },
    "report_location": {
      "type": "Point",
      "coordinates": [-58.3816, -34.6037]
    }
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "report": {
    "_id": "...",
    "user": { ... },
    "is_anonymous": false,
    "notes": "...",
    "tags": { ... },
    "report_location": { ... },
    "trust_score": 0.73,
    "trust_score_metadata": {
      "calculated_at": "2026-06-08T...",
      "version": "1.0",
      "breakdown": {
        "user_authentication": 0.30,
        "report_completeness": 0.20,
        "user_history": 0.10,
        "related_reports": 0.04,
        "time_consistency": 0.10
      }
    },
    "status": "active",
    "validez": "pendiente",
    "timestamp": "..."
  }
}
```

### 3. Verificar en MongoDB

```javascript
// Conectar a MongoDB
docker exec -it <container-id> mongosh app_db

// Ver el último reporte creado
db.reports.findOne({}, { sort: { timestamp: -1 } })

// Verificar que tenga trust_score
db.reports.findOne(
  { trust_score: { $exists: true } },
  { trust_score: 1, trust_score_metadata: 1, notes: 1 }
)
```

## Posibles Problemas y Soluciones

### Problema 1: Trust score es null

**Causa:** El cálculo falló pero el reporte se creó igual (comportamiento esperado)

**Verificar logs del backend:**
```bash
docker logs <backend-container-id>
```

**Buscar errores como:**
- "Error calculating trust score"
- Errores de conexión a MongoDB
- Errores en las queries de reportes relacionados

**Solución:**
1. Verificar que MongoDB esté corriendo
2. Verificar que los índices estén creados
3. Recalcular manualmente:
```bash
curl -X PATCH http://localhost:3000/reports/<report-id>/trust-score
```

### Problema 2: Error al crear reporte

**Causa:** Falta algún campo requerido o error en geocoding

**Verificar:**
1. Que el servicio de geocoding esté disponible (http://localhost:3000/map/resolve-address)
2. Que las coordenadas sean válidas
3. Que report_location tenga el formato correcto

**Solución temporal:**
Si el geocoding falla, el reporte debería crearse igual sin address. Verificar el código:

```javascript
// En backend/src/routes/reports.js línea 99-107
const geocodeResponse = await fetch(
  `http://localhost:3000/map/resolve-address?lat=${lat}&lng=${lng}`
);

const geocodeData = await geocodeResponse.json();

if (geocodeData.success) {
  req.body.report_location.address = geocodeData.address;
}
// Si falla, continúa sin address
```

### Problema 3: Frontend no muestra el trust score

**Causa:** El componente TrustScoreBadge no está importado o el reporte no tiene trust_score

**Verificar:**
1. Que ReportCard.vue importe TrustScoreBadge
2. Que el reporte tenga trust_score en la respuesta
3. Que el badge esté en el template

**Solución:**
Ver el código en ReportCard.vue líneas 1-2 y 199-220

## Test Completo Paso a Paso

### Escenario 1: Usuario Registrado con Reporte Completo

```bash
# 1. Crear reporte
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "user_id": "1",
      "username": "testUser",
      "surname": "User",
      "email": "testuser@reportit.com"
    },
    "is_anonymous": false,
    "notes": "Descripción muy detallada del incidente con toda la información necesaria para el análisis",
    "tags": {
      "tipo_incidente": "robo",
      "vehiculo": "auto",
      "color": "negro"
    },
    "report_location": {
      "type": "Point",
      "coordinates": [-58.3816, -34.6037]
    }
  }'

# 2. Guardar el _id del reporte de la respuesta

# 3. Verificar el trust score
curl http://localhost:3000/reports/<report-id>

# 4. Verificar que aparezca en la lista
curl http://localhost:3000/reports/admin?status=active

# 5. Verificar en el frontend
# Ir a http://localhost:5173 y ver el reporte en el mapa o dashboard
```

**Trust Score Esperado:** ~0.70-0.80
- User Authentication: 0.30 (registrado)
- Report Completeness: 0.25 (tiene notas largas + tags)
- User History: 0.10 (usuario nuevo)
- Related Reports: 0.04 (sin reportes cercanos)
- Time Consistency: 0.10 (horario normal)

### Escenario 2: Usuario Anónimo con Info Mínima

```bash
curl -X POST http://localhost:3000/reports \
  -H "Content-Type: application/json" \
  -d '{
    "user": null,
    "is_anonymous": true,
    "notes": "Test",
    "tags": {},
    "report_location": {
      "type": "Point",
      "coordinates": [-58.3816, -34.6037]
    }
  }'
```

**Trust Score Esperado:** ~0.25-0.35
- User Authentication: 0.09 (anónimo)
- Report Completeness: 0.05 (notas cortas, sin tags)
- User History: 0.04 (anónimo)
- Related Reports: 0.04 (sin reportes cercanos)
- Time Consistency: 0.10 (horario normal)

## Verificación en el Frontend

### 1. Abrir la aplicación
```
http://localhost:5173
```

### 2. Crear un reporte desde la UI
1. Hacer clic en el mapa
2. Llenar el formulario:
   - Agregar notas detalladas
   - Seleccionar categoría y tags
   - Enviar

### 3. Verificar el badge
- El reporte debería aparecer en el mapa
- Al hacer clic, debería mostrar el TrustScoreBadge
- El color debería corresponder al score:
  - 🟢 Verde (0.8-1.0)
  - 🟡 Amarillo (0.6-0.79)
  - 🟠 Naranja (0.4-0.59)
  - 🔴 Rojo (0.0-0.39)

### 4. Verificar en Admin Dashboard
1. Ir a Admin Dashboard (si tienes permisos)
2. Ver la pestaña "Pendientes"
3. Verificar que el badge aparezca en cada reporte
4. Probar los filtros de Trust Score

## Checklist de Verificación

- [ ] Backend responde en http://localhost:3000/reports
- [ ] Se puede crear un reporte con curl
- [ ] El reporte tiene trust_score en la respuesta
- [ ] El trust_score está entre 0.00 y 1.00
- [ ] El trust_score tiene exactamente 2 decimales
- [ ] El reporte tiene trust_score_metadata
- [ ] El metadata tiene breakdown con los 5 parámetros
- [ ] Se puede ver el reporte en MongoDB
- [ ] Se puede crear reporte desde el frontend
- [ ] El TrustScoreBadge aparece en ReportCard
- [ ] El color del badge es correcto según el score
- [ ] El tooltip muestra información correcta
- [ ] Los filtros de trust score funcionan en admin

## Comandos Útiles

### Ver logs del backend
```bash
docker logs -f <backend-container-id>
```

### Ver logs de MongoDB
```bash
docker logs -f <mongo-container-id>
```

### Reiniciar servicios
```bash
docker-compose restart backend
```

### Ver todos los reportes con trust score
```bash
curl http://localhost:3000/reports/admin?status=
```

### Recalcular trust scores de todos los reportes
```bash
curl -X POST http://localhost:3000/reports/admin/recalculate-trust-scores \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {},
    "limit": 1000
  }'
```

## Resultado Esperado

Si todo funciona correctamente:

1. ✅ Los reportes se crean con trust_score automáticamente
2. ✅ El score está truncado a 2 decimales
3. ✅ El metadata incluye el breakdown completo
4. ✅ El badge se muestra en el frontend con el color correcto
5. ✅ Los filtros de trust score funcionan
6. ✅ Si el cálculo falla, el reporte se crea igual (trust_score: null)

## Próximos Pasos

Si encuentras algún error:

1. Copia el mensaje de error completo
2. Verifica los logs del backend
3. Verifica que MongoDB esté corriendo
4. Verifica que todos los servicios estén levantados
5. Comparte el error para que podamos solucionarlo

---

**Nota:** Este documento asume que tienes Docker y docker-compose corriendo con todos los servicios levantados.