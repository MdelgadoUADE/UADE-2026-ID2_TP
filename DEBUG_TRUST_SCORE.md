# Guía de Debugging - Trust Score

## 🔍 Problema Reportado

- ✅ El reporte se crea correctamente
- ❌ El trust_score es null
- ❌ No aparece el badge de color en el frontend

## 📝 Pasos para Diagnosticar

### Paso 1: Ejecutar el Script de Prueba en PowerShell

```powershell
.\test-report-powershell.ps1
```

Este script:
1. Crea un reporte de prueba
2. Muestra la respuesta completa
3. Indica si el trust_score fue calculado o no

### Paso 2: Ver los Logs del Backend

**Opción A: Si usas Docker**
```powershell
docker logs -f <nombre-contenedor-backend>
```

**Opción B: Si corres el backend directamente**
Los logs aparecerán en la terminal donde ejecutaste `npm run dev`

**Buscar en los logs:**
```
[TRUST SCORE] Iniciando cálculo para reporte: <id>
[TRUST SCORE] Calculado exitosamente: 0.XX
[TRUST SCORE] Guardado en DB
```

**Si hay error, verás:**
```
[TRUST SCORE] ❌ Error calculating trust score: <mensaje>
[TRUST SCORE] Stack trace: <detalles>
```

### Paso 3: Verificar en MongoDB

**Conectar a MongoDB:**
```powershell
# Si usas Docker
docker exec -it <nombre-contenedor-mongo> mongosh app_db

# Si MongoDB está local
mongosh app_db
```

**Verificar el último reporte:**
```javascript
db.reports.findOne(
  {},
  { sort: { timestamp: -1 } }
)
```

**Verificar si tiene trust_score:**
```javascript
db.reports.findOne(
  { trust_score: { $ne: null } },
  { trust_score: 1, trust_score_metadata: 1, notes: 1 }
)
```

## 🐛 Posibles Causas y Soluciones

### Causa 1: El archivo trustScore.js no existe o tiene errores

**Verificar:**
```powershell
# Verificar que el archivo existe
Test-Path backend\src\utils\trustScore.js
```

**Solución:**
Si el archivo no existe o tiene errores de sintaxis, el import fallará silenciosamente.

### Causa 2: MongoDB no está conectado

**Síntomas:**
- Error en logs: "MongoError" o "connection refused"
- Las queries de reportes relacionados fallan

**Solución:**
```powershell
# Verificar que MongoDB está corriendo
docker ps | Select-String mongo
# O si es local:
Get-Service MongoDB
```

### Causa 3: El índice geoespacial no está creado

**Síntomas:**
- Error en logs relacionado con "$near" o "2dsphere"

**Solución:**
```javascript
// En MongoDB
db.reports.createIndex({ report_location: "2dsphere" })
```

### Causa 4: Falta el campo timestamp en el reporte

**Síntomas:**
- Error al buscar reportes recientes del usuario

**Solución:**
El modelo ya tiene `timestamps: true`, pero verifica que el reporte tenga el campo.

### Causa 5: El backend no se reinició después de agregar el código

**Síntomas:**
- No aparecen los logs de [TRUST SCORE]
- El código nuevo no se ejecuta

**Solución:**
```powershell
# Si usas Docker
docker-compose restart backend

# Si corres directamente
# Detener el proceso (Ctrl+C) y volver a ejecutar:
cd backend
npm run dev
```

## 🔧 Solución Rápida: Recalcular Trust Scores

Si los reportes ya existen sin trust_score, puedes recalcularlos:

### Opción 1: Recalcular un reporte específico

```powershell
$reportId = "PONER_ID_AQUI"
Invoke-RestMethod -Uri "http://localhost:3000/reports/$reportId/trust-score" -Method Patch
```

### Opción 2: Recalcular todos los reportes sin trust_score

```powershell
$body = @{
    filter = @{
        trust_score = $null
    }
    limit = 1000
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/reports/admin/recalculate-trust-scores" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

## 📊 Verificación Final

### 1. Crear un reporte desde el frontend

1. Abrir http://localhost:5173
2. Hacer login (o crear anónimo)
3. Hacer clic en el mapa
4. Llenar el formulario:
   - **Notas:** Escribir al menos 20 caracteres
   - **Tags:** Agregar al menos un tag
5. Enviar

### 2. Verificar en el Dashboard

1. Ir a la vista de reportes
2. Buscar el reporte recién creado
3. **Verificar:**
   - ✅ Aparece un badge de color (🟢🟡🟠🔴)
   - ✅ Al hacer hover muestra el porcentaje
   - ✅ El color corresponde al score

### 3. Verificar en Admin Dashboard (si tienes acceso)

1. Ir a Admin Dashboard
2. Pestaña "Pendientes"
3. **Verificar:**
   - ✅ Cada reporte tiene su badge
   - ✅ Los filtros de Trust Score funcionan

## 🎯 Checklist de Verificación

- [ ] El archivo `backend/src/utils/trustScore.js` existe
- [ ] El backend está corriendo (puerto 3000)
- [ ] MongoDB está corriendo y conectado
- [ ] Los logs del backend muestran `[TRUST SCORE]`
- [ ] El script de PowerShell se ejecuta sin errores
- [ ] El reporte en MongoDB tiene `trust_score` no null
- [ ] El badge aparece en el frontend
- [ ] El color del badge es correcto

## 📞 Información para Reportar Problemas

Si después de seguir estos pasos el problema persiste, recopila:

1. **Logs del backend** (últimas 50 líneas)
2. **Resultado del script de PowerShell**
3. **Documento del reporte en MongoDB** (con trust_score)
4. **Versión de Node.js:** `node --version`
5. **Versión de MongoDB:** `mongosh --version`

## 🚀 Comando Rápido de Prueba

```powershell
# Prueba completa en un solo comando
.\test-report-powershell.ps1; `
Write-Host "`nVerificando en MongoDB..." -ForegroundColor Yellow; `
docker exec -it <mongo-container> mongosh app_db --eval "db.reports.findOne({}, {sort: {timestamp: -1}}).trust_score"
```

Reemplaza `<mongo-container>` con el nombre de tu contenedor de MongoDB.

---

**Nota:** Si estás usando Docker, asegúrate de que todos los contenedores estén corriendo:
```powershell
docker-compose ps
```

Todos los servicios deben estar en estado "Up".