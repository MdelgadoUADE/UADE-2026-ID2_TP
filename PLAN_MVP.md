# Plan de Desarrollo - MVP ReportIt
## Ingeniería de Datos 2 - UADE 2026

---

## 📊 Estado Actual del Proyecto

### ✅ Funcionalidades Implementadas

#### Backend
- **Autenticación de usuarios** (PostgreSQL)
  - Registro de usuarios con bcrypt
  - Login con validación de credenciales
  - Sistema de roles (user/admin)
  
- **CRUD de Reportes** (MongoDB)
  - Crear reportes con ubicación geoespacial
  - Leer reportes individuales y listados
  - Búsqueda de reportes cercanos (`/reports/near/:id`)
  - Geocoding automático de direcciones
  
- **Sistema de Tags**
  - CRUD de tags con categorías (vehículo, persona, ambiente, otros)
  - Tags dinámicos con aliases
  - Prevención de duplicados

#### Frontend
- **Autenticación UI**
  - Login y registro de usuarios
  - Gestión de sesión
  
- **Creación de Reportes**
  - Mapa interactivo con Leaflet
  - Geolocalización automática
  - Selección de ubicación en mapa
  - Sistema de tags categorizados
  - Campo de notas
  - Soporte para tags personalizados
  
- **Búsqueda de Reportes**
  - Listado de todos los reportes
  - Vista detallada de reportes
  - Búsqueda de reportes cercanos

#### Infraestructura
- Docker Compose con 4 servicios
- MongoDB con índices geoespaciales
- PostgreSQL para usuarios
- Seed de datos inicial

---

## 🎯 Análisis de Requerimientos del MVP

### Requerimientos Funcionales - Estado

| ID | Requerimiento | Estado | Prioridad |
|---|---|---|---|
| RF_01 | Iniciar sesión de usuario | ✅ Completo | Alta |
| RF_02 | Crear reporte en < 10s | ⚠️ Parcial | Alta |
| RF_03 | Máximo 5 interacciones | ⚠️ Parcial | Alta |
| RF_04 | Selección ubicación/GPS | ✅ Completo | Alta |
| RF_05 | Estructura tag-valor | ✅ Completo | Alta |
| RF_06 | Modo emergencia sin auth | ❌ Faltante | **CRÍTICO** |
| RF_07 | Campo notas | ✅ Completo | Alta |
| RF_09 | Tags dinámicos | ✅ Completo | Alta |
| RF_11 | Seleccionar tag predefinido | ✅ Completo | Alta |
| RF_12 | Ingresar valor manualmente | ✅ Completo | Alta |
| RF_13 | Búsqueda combinada | ❌ Faltante | **CRÍTICO** |
| RF_21 | Score de confianza | ❌ Faltante | **CRÍTICO** |
| RF_22 | Dashboard analistas | ❌ Faltante | **CRÍTICO** |
| RF_23 | Agrupación reportes | ❌ Faltante | **CRÍTICO** |
| RF_24 | Clasificación reportes | ❌ Faltante | **CRÍTICO** |
| RF_25 | Actualización tiempo real | ❌ Faltante | Media |

### Requerimientos No Funcionales - Estado

| ID | Requerimiento | Estado | Prioridad |
|---|---|---|---|
| RNF_01 | Lectura ≤ 0.5s | ⚠️ Sin validar | Alta |
| RNF_02 | Escritura ≤ 1s | ⚠️ Sin validar | Alta |
| RNF_10 | Compatible móvil | ⚠️ Responsive básico | Media |
| RNF_12 | Schema-less | ✅ Completo | Alta |
| RNF_13 | Documentos independientes | ✅ Completo | Alta |
| RNF_15 | Índices optimizados | ⚠️ Básicos | Alta |

---

## 🚀 Plan de Desarrollo por Prioridad

### 🔴 PRIORIDAD CRÍTICA (Semana 1)

#### 1. Modo Emergencia (RF_06)
**Objetivo:** Permitir reportes sin autenticación

**Backend:**
- Modificar [`backend/src/routes/reports.js`](backend/src/routes/reports.js) POST `/reports`
  - Hacer opcional el campo `user`
  - Cuando `is_anonymous: true`, generar user_id temporal
  - Validar que al menos haya `notes` o `tags`

**Frontend:**
- Modificar [`frontend/src/components/CreateReport.vue`](frontend/src/components/CreateReport.vue)
  - Detectar si `currentUser` es null
  - Mostrar banner "Modo Emergencia" cuando no hay sesión
  - Permitir crear reporte sin login

**Estimación:** 4 horas  
**Responsable sugerido:** Backend + Frontend

---

#### 2. Búsqueda Combinada por Ubicación y Tags (RF_13)
**Objetivo:** Buscar reportes por radio geográfico + filtros de tags

**Backend:**
- Crear endpoint GET `/reports/search` en [`backend/src/routes/reports.js`](backend/src/routes/reports.js)
  ```javascript
  Query params:
  - lat, lng (coordenadas centro)
  - radius (en metros, default 1000, min 100, max 10000)
  - tags (array de tags a filtrar)
  - status (active/resolved/archived)
  ```
- Implementar query MongoDB con `$geoWithin` + filtros de tags
- Agregar paginación (limit/skip)

**Frontend:**
- Modificar [`frontend/src/components/search/SearchView.vue`](frontend/src/components/search/SearchView.vue)
  - Agregar selector de radio (100m, 500m, 1km, 5km, 10km)
  - Agregar filtros por tags
  - Agregar filtro por status
  - Integrar con mapa para mostrar área de búsqueda

**Estimación:** 8 horas  
**Responsable sugerido:** Backend (4h) + Frontend (4h)

---

#### 3. Sistema de Score de Confianza (RF_21)
**Objetivo:** Calcular automáticamente un score de confiabilidad

**Backend:**
- Modificar [`backend/src/models/Report.js`](backend/src/models/Report.js)
  - Agregar campo `trust_score` (ya existe, mejorar cálculo)
  - Agregar campo `validation_status` (pending/verified/rejected)
  
- Crear función de cálculo en [`backend/src/utils/trustScore.js`](backend/src/utils/trustScore.js)
  ```javascript
  Factores:
  - Usuario autenticado vs anónimo (+0.3)
  - Tiene attachments (+0.2)
  - Cantidad de tags (+0.1 por tag, max 0.3)
  - Reportes previos del usuario (+0.2)
  - Ubicación verificada (+0.1)
  - Base: 0.5
  ```

- Modificar POST `/reports` para calcular score automáticamente

**Estimación:** 6 horas  
**Responsable sugerido:** Backend

---

#### 4. Dashboard de Analistas (RF_22)
**Objetivo:** Panel exclusivo para usuarios con rol admin

**Backend:**
- Crear middleware de autenticación en [`backend/src/middleware/auth.js`](backend/src/middleware/auth.js)
  - Verificar rol de usuario
  - Proteger rutas de analistas

- Crear endpoints en [`backend/src/routes/analytics.js`](backend/src/routes/analytics.js):
  ```javascript
  GET /analytics/stats - Estadísticas generales
  GET /analytics/reports/pending - Reportes pendientes validación
  PUT /analytics/reports/:id/validate - Validar/rechazar reporte
  GET /analytics/reports/clusters - Reportes agrupados
  ```

**Frontend:**
- Crear componente [`frontend/src/components/AnalyticsDashboard.vue`](frontend/src/components/AnalyticsDashboard.vue)
  - Mostrar solo si `currentUser.role === 'admin'`
  - Estadísticas en tiempo real
  - Lista de reportes pendientes
  - Acciones de validación

**Estimación:** 12 horas  
**Responsable sugerido:** Backend (6h) + Frontend (6h)

---

#### 5. Agrupación Automática de Reportes (RF_23)
**Objetivo:** Identificar reportes relacionados geográfica y temáticamente

**Backend:**
- Crear función en [`backend/src/utils/clustering.js`](backend/src/utils/clustering.js)
  ```javascript
  Criterios de agrupación:
  - Distancia < 500m
  - Tags similares (al menos 1 en común)
  - Ventana temporal (últimas 24-48h)
  - Score de confianza > 0.6
  ```

- Crear endpoint GET `/reports/clusters` en [`backend/src/routes/reports.js`](backend/src/routes/reports.js)
  - Usar agregación de MongoDB
  - Agrupar con `$geoNear` + match de tags

- Modificar modelo [`Report.js`](backend/src/models/Report.js)
  - Agregar campo `cluster_id`
  - Actualizar `related_reports` automáticamente

**Estimación:** 10 horas  
**Responsable sugerido:** Backend

---

### 🟡 PRIORIDAD ALTA (Semana 2)

#### 6. Clasificación de Reportes (RF_24)
**Objetivo:** Permitir a analistas clasificar reportes

**Backend:**
- Modificar [`backend/src/models/Report.js`](backend/src/models/Report.js)
  ```javascript
  Agregar campos:
  - criticality: ['low', 'medium', 'high', 'critical']
  - validity: ['pending', 'valid', 'invalid', 'duplicate']
  - analyst_notes: String
  - validated_by: { user_id, username, timestamp }
  ```

- Crear endpoint PUT `/analytics/reports/:id/classify`
  - Solo accesible por admins
  - Actualizar clasificación
  - Registrar quién clasificó

**Frontend:**
- Agregar UI de clasificación en dashboard de analistas
  - Selector de criticidad (colores)
  - Selector de validez
  - Campo de notas del analista

**Estimación:** 6 horas  
**Responsable sugerido:** Backend (3h) + Frontend (3h)

---

#### 7. Optimización de Índices MongoDB (RNF_01, RNF_15)
**Objetivo:** Garantizar lectura ≤ 0.5s

**Backend:**
- Revisar y optimizar índices en [`backend/src/models/Report.js`](backend/src/models/Report.js)
  ```javascript
  Índices necesarios:
  - report_location (2dsphere) ✅ Ya existe
  - status (1)
  - timestamp (-1)
  - trust_score (-1)
  - tags (compound con location)
  - cluster_id (1)
  ```

- Crear índices compuestos para queries frecuentes:
  ```javascript
  { report_location: '2dsphere', status: 1, timestamp: -1 }
  { 'user.user_id': 1, timestamp: -1 }
  ```

- Agregar script de análisis de performance en [`backend/src/utils/performance.js`](backend/src/utils/performance.js)

**Estimación:** 4 horas  
**Responsable sugerido:** Backend

---

#### 8. Optimización de Escritura (RNF_02)
**Objetivo:** Garantizar escritura ≤ 1s

**Backend:**
- Optimizar POST `/reports`:
  - Hacer geocoding asíncrono (no bloqueante)
  - Calcular trust_score en background
  - Usar `insertOne` en lugar de `save()` cuando sea posible
  
- Implementar queue para operaciones pesadas:
  - Clustering de reportes
  - Actualización de related_reports
  - Notificaciones

**Estimación:** 6 horas  
**Responsable sugerido:** Backend

---

#### 9. Agregaciones Complejas para Análisis
**Objetivo:** Demostrar ventajas de MongoDB para análisis

**Backend:**
- Crear endpoints de analytics en [`backend/src/routes/analytics.js`](backend/src/routes/analytics.js):
  ```javascript
  GET /analytics/heatmap
  - Agregación geoespacial por zonas
  - Densidad de reportes
  
  GET /analytics/trends
  - Reportes por día/hora
  - Tags más frecuentes
  - Evolución temporal
  
  GET /analytics/patterns
  - Correlación entre tags
  - Zonas de mayor actividad
  - Horarios críticos
  ```

- Usar MongoDB Aggregation Pipeline:
  - `$geoNear` para análisis espacial
  - `$group` para estadísticas
  - `$facet` para múltiples agregaciones

**Estimación:** 8 horas  
**Responsable sugerido:** Backend

---

### 🟢 PRIORIDAD MEDIA (Semana 3)

#### 10. Actualización en Tiempo Real (RF_25)
**Objetivo:** Dashboard se actualiza automáticamente

**Backend:**
- Implementar WebSockets o Server-Sent Events
- Crear endpoint `/analytics/stream`
- Emitir eventos cuando:
  - Nuevo reporte creado
  - Reporte validado
  - Cluster actualizado

**Frontend:**
- Integrar WebSocket client
- Actualizar dashboard automáticamente
- Mostrar notificaciones de nuevos reportes

**Estimación:** 8 horas  
**Responsable sugerido:** Backend (4h) + Frontend (4h)

---

#### 11. Comparación MongoDB vs PostgreSQL
**Objetivo:** Demostrar ventajas de NoSQL para la rúbrica

**Backend:**
- Crear endpoints de benchmark en [`backend/src/routes/benchmark.js`](backend/src/routes/benchmark.js):
  ```javascript
  GET /benchmark/geospatial
  - Comparar búsqueda geoespacial en ambas DBs
  
  GET /benchmark/flexible-schema
  - Demostrar ventaja de tags dinámicos
  
  GET /benchmark/aggregations
  - Comparar agregaciones complejas
  ```

- Implementar mismas queries en PostgreSQL (con PostGIS)
- Medir tiempos de respuesta
- Generar reporte comparativo

**Estimación:** 10 horas  
**Responsable sugerido:** Backend

---

#### 12. Ampliar Dataset de Seed
**Objetivo:** Datos realistas para demos y benchmarks

**Backend:**
- Modificar [`mongo-init/init.js`](mongo-init/init.js)
  - Agregar 100+ reportes variados
  - Diferentes zonas geográficas
  - Variedad de tags
  - Diferentes timestamps
  - Mix de usuarios autenticados/anónimos

- Crear script de generación de datos sintéticos
  - Usar coordenadas de Buenos Aires
  - Patrones realistas (más reportes en horarios pico)
  - Clusters naturales

**Estimación:** 4 horas  
**Responsable sugerido:** Backend

---

#### 13. Tests de Performance
**Objetivo:** Validar RNF_01 y RNF_02

**Backend:**
- Crear suite de tests en [`backend/tests/performance.test.js`](backend/tests/performance.test.js)
  - Test de lectura (debe ser < 0.5s)
  - Test de escritura (debe ser < 1s)
  - Test de búsqueda geoespacial
  - Test de agregaciones
  - Test bajo carga (100 requests concurrentes)

- Usar herramientas:
  - Jest para tests
  - Artillery o k6 para load testing

**Estimación:** 6 horas  
**Responsable sugerido:** Backend

---

#### 14. Optimización UI/UX (RF_02, RF_03)
**Objetivo:** Crear reporte en < 10s con max 5 clicks

**Frontend:**
- Analizar flujo actual y optimizar:
  ```
  Flujo actual:
  1. Click en mapa
  2. Click "Crear reporte"
  3. Seleccionar categoría
  4. Seleccionar tag
  5. Ingresar valor (opcional)
  6. Click "Agregar tag"
  7. Escribir notas (opcional)
  8. Click "Enviar"
  
  Total: 5-8 clicks ✅ Cumple RF_03
  ```

- Mejoras sugeridas:
  - Autocompletar tags frecuentes
  - Valores por defecto inteligentes
  - Shortcuts de teclado
  - Validación en tiempo real

**Estimación:** 6 horas  
**Responsable sugerido:** Frontend

---

### 📚 DOCUMENTACIÓN (Paralelo a desarrollo)

#### 15. Documentación Técnica del Código
**Objetivo:** Código bien documentado para la rúbrica

**Tareas:**
- Agregar JSDoc a todas las funciones
- Comentarios explicativos en lógica compleja
- README en cada carpeta principal
- Documentar APIs con ejemplos

**Estimación:** 8 horas (distribuido)  
**Responsable:** Todo el equipo

---

#### 16. Diagramas de Arquitectura
**Objetivo:** Visualizar el sistema para el informe

**Crear diagramas:**
1. **Arquitectura General**
   - Servicios Docker
   - Flujo de datos
   - Tecnologías usadas

2. **Modelo de Datos**
   - Schema MongoDB (Reports, Tags)
   - Schema PostgreSQL (Users)
   - Relaciones

3. **Flujo de Reportes**
   - Desde creación hasta análisis
   - Pipeline E2E

4. **Comparación NoSQL vs SQL**
   - Casos de uso
   - Ventajas/desventajas

**Herramientas sugeridas:**
- Mermaid (integrado en markdown)
- Draw.io
- Lucidchart

**Estimación:** 6 horas  
**Responsable sugerido:** 1 persona del equipo

---

#### 17. Documento de Decisiones Técnicas
**Objetivo:** Justificar elecciones para la defensa

**Crear:** [`docs/DECISIONES_TECNICAS.md`](docs/DECISIONES_TECNICAS.md)

**Contenido:**
1. **¿Por qué MongoDB para reportes?**
   - Schema flexible para tags dinámicos
   - Índices geoespaciales nativos
   - Agregaciones potentes
   - Escalabilidad horizontal

2. **¿Por qué PostgreSQL para usuarios?**
   - Datos estructurados y relacionales
   - ACID completo para autenticación
   - Integridad referencial

3. **¿Por qué esta arquitectura?**
   - Separación de concerns
   - Polyglot persistence
   - Escalabilidad independiente

4. **Optimizaciones implementadas**
   - Índices específicos
   - Queries optimizadas
   - Caching (si se implementa)

**Estimación:** 4 horas  
**Responsable sugerido:** 1-2 personas del equipo

---

#### 18. Documento de Ventajas NoSQL vs SQL
**Objetivo:** Demostrar comprensión para la rúbrica (Unidades I, II, V)

**Crear:** [`docs/NOSQL_VS_SQL.md`](docs/NOSQL_VS_SQL.md)

**Contenido:**
1. **Casos de uso comparados**
   - Búsqueda geoespacial
   - Tags dinámicos
   - Agregaciones complejas
   - Escalabilidad

2. **Benchmarks reales**
   - Tiempos de respuesta
   - Throughput
   - Uso de recursos

3. **Teoría aplicada**
   - Teorema CAP
   - Consistencia eventual
   - Particionamiento

**Estimación:** 6 horas  
**Responsable sugerido:** 1-2 personas del equipo

---

#### 19. README Técnico Completo
**Objetivo:** Documentación profesional y reutilizable

**Actualizar:** [`README.md`](README.md)

**Agregar secciones:**
- Arquitectura del sistema
- Decisiones de diseño
- Guía de desarrollo
- API documentation
- Troubleshooting avanzado
- Performance tuning
- Deployment en producción

**Estimación:** 4 horas  
**Responsable sugerido:** 1 persona del equipo

---

#### 20. Documento de Pipeline E2E
**Objetivo:** Explicar flujo completo de datos

**Crear:** [`docs/PIPELINE_E2E.md`](docs/PIPELINE_E2E.md)

**Contenido:**
1. **Ingesta de datos**
   - Creación de reportes
   - Validación
   - Geocoding

2. **Procesamiento**
   - Cálculo de trust score
   - Clustering
   - Agregaciones

3. **Almacenamiento**
   - MongoDB (reportes)
   - PostgreSQL (usuarios)
   - Índices

4. **Análisis**
   - Dashboard de analistas
   - Métricas en tiempo real
   - Exportación de datos

**Estimación:** 4 horas  
**Responsable sugerido:** 1 persona del equipo

---

## 📅 Cronograma Sugerido

### Semana 1 (Prioridad Crítica)
- **Día 1-2:** Modo emergencia + Búsqueda combinada
- **Día 3:** Score de confianza
- **Día 4-5:** Dashboard de analistas (base)
- **Día 6-7:** Agrupación automática

### Semana 2 (Prioridad Alta)
- **Día 1:** Clasificación de reportes
- **Día 2:** Optimización de índices
- **Día 3:** Optimización de escritura
- **Día 4-5:** Agregaciones complejas
- **Día 6-7:** Buffer / Testing

### Semana 3 (Prioridad Media + Docs)
- **Día 1-2:** Tiempo real + Comparación DBs
- **Día 3:** Dataset ampliado + Tests
- **Día 4:** Optimización UI/UX
- **Día 5-7:** Documentación completa

---

## 🎯 Criterios de Éxito

### Técnicos
- ✅ Todos los RF críticos implementados
- ✅ RNF_01 y RNF_02 validados con tests
- ✅ Índices optimizados y documentados
- ✅ Comparación MongoDB vs PostgreSQL con métricas reales
- ✅ Pipeline E2E funcionando end-to-end

### Documentación
- ✅ Código bien comentado (JSDoc)
- ✅ Diagramas de arquitectura claros
- ✅ Decisiones técnicas justificadas
- ✅ README profesional y completo
- ✅ Documentación de APIs

### Demo
- ✅ Flujo completo funcional
- ✅ Dashboard de analistas operativo
- ✅ Búsquedas geoespaciales rápidas
- ✅ Datos realistas para demostración
- ✅ Métricas de performance visibles

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: No cumplir tiempos de respuesta (RNF_01, RNF_02)
**Mitigación:**
- Implementar índices desde el inicio
- Hacer benchmarks tempranos
- Tener plan B con caching (Redis)

### Riesgo 2: Complejidad del clustering automático
**Mitigación:**
- Empezar con algoritmo simple (distancia + tags)
- Iterar y mejorar si hay tiempo
- Documentar limitaciones

### Riesgo 3: Tiempo real puede ser complejo
**Mitigación:**
- Prioridad media (no crítico para MVP)
- Alternativa: polling cada 5-10s
- WebSockets solo si hay tiempo

### Riesgo 4: Falta de tiempo para documentación
**Mitigación:**
- Documentar mientras se desarrolla
- Asignar responsables específicos
- Usar templates y herramientas (Mermaid)

---

## 👥 Distribución de Trabajo Sugerida

### Perfil Backend (2 personas)
- Persona 1: Features críticos (RF_06, RF_13, RF_21)
- Persona 2: Analytics y optimización (RF_22-25, índices)

### Perfil Frontend (1 persona)
- UI de features críticos
- Dashboard de analistas
- Optimización UX

### Perfil Full-Stack (1 persona)
- Integración backend-frontend
- Tests de performance
- Documentación técnica

---

## 📝 Notas Finales

### Para la Defensa
- Preparar demo en vivo del flujo completo
- Tener métricas de performance a mano
- Explicar decisiones de diseño NoSQL vs SQL
- Mostrar código relevante (índices, agregaciones)
- Destacar innovaciones (clustering, trust score)

### Para el Informe
- Incluir todos los diagramas
- Agregar capturas de pantalla
- Incluir fragmentos de código clave
- Mostrar resultados de benchmarks
- Explicar pipeline E2E con ejemplos

### Para el Video
- Mostrar flujo de usuario completo
- Demo de dashboard de analistas
- Visualización de búsquedas geoespaciales
- Comparación de performance
- Destacar características NoSQL

---

## 🔗 Referencias Útiles

- [MongoDB Geospatial Queries](https://www.mongodb.com/docs/manual/geospatial-queries/)
- [MongoDB Aggregation Pipeline](https://www.mongodb.com/docs/manual/aggregation/)
- [MongoDB Indexes](https://www.mongodb.com/docs/manual/indexes/)
- [PostgreSQL PostGIS](https://postgis.net/)
- [Leaflet Documentation](https://leafletjs.com/)
- [Docker Compose Best Practices](https://docs.docker.com/compose/compose-file/)

---

**Última actualización:** 2026-05-29  
**Versión:** 1.0  
**Estado:** Plan inicial para revisión del equipo