# Arquitectura del Sistema - ReportIt

## 🏗️ Visión General

ReportIt es una aplicación de reportes ciudadanos que utiliza una arquitectura de microservicios con persistencia políglota (MongoDB + PostgreSQL).

---

## 📐 Diagrama de Arquitectura General

```mermaid
graph TB
    subgraph "Frontend - Vue 3"
        UI[Interface de Usuario]
        Map[Mapa Leaflet]
        Dashboard[Dashboard Analistas]
    end

    subgraph "Backend - Node.js + Express"
        API[API REST]
        Auth[Auth Service]
        Reports[Reports Service]
        Analytics[Analytics Service]
        Geo[Geocoding Service]
    end

    subgraph "Bases de Datos"
        Mongo[(MongoDB<br/>Reportes + Tags)]
        Postgres[(PostgreSQL<br/>Usuarios)]
    end

    subgraph "Servicios Externos"
        Nominatim[Nominatim API<br/>Geocoding]
    end

    UI --> API
    Map --> API
    Dashboard --> API
    
    API --> Auth
    API --> Reports
    API --> Analytics
    API --> Geo
    
    Auth --> Postgres
    Reports --> Mongo
    Analytics --> Mongo
    Geo --> Nominatim
```

---

## 🗄️ Modelo de Datos

### MongoDB - Colección Reports

```mermaid
erDiagram
    REPORTS {
        ObjectId _id
        Object user
        Date timestamp
        String notes
        Array attachments
        Object tags
        Object report_location
        String status
        Boolean is_anonymous
        Array related_reports
        Number trust_score
        String cluster_id
        String criticality
        String validity
        Object validated_by
    }
    
    TAGS {
        ObjectId _id
        String canonical_name
        Array aliases
        String type
        String description
        Object created_by
        Boolean is_system
        Number usage_count
    }
    
    REPORTS ||--o{ TAGS : uses
```

### PostgreSQL - Tabla Users

```mermaid
erDiagram
    USERS {
        Serial user_id PK
        String username UK
        String surname
        String email UK
        String passwd_hash
        String role
    }
```

---

## 🔄 Flujo de Datos - Crear Reporte

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant G as Geocoding
    participant M as MongoDB
    participant P as PostgreSQL

    U->>F: Click en mapa
    F->>B: GET /map/reverse-geocode
    B->>G: Consulta Nominatim
    G-->>B: Dirección
    B-->>F: Dirección formateada
    
    U->>F: Completa formulario
    U->>F: Envía reporte
    
    alt Usuario autenticado
        F->>P: Verificar sesión
        P-->>F: Datos usuario
    end
    
    F->>B: POST /reports
    B->>B: Calcular trust_score
    B->>M: Guardar reporte
    M-->>B: Reporte guardado
    
    B->>B: Clustering asíncrono
    B->>M: Actualizar related_reports
    
    B-->>F: Reporte creado
    F-->>U: Confirmación
```

---

## 🔍 Flujo de Búsqueda Geoespacial

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend
    participant M as MongoDB

    U->>F: Ingresa criterios búsqueda
    Note over U,F: Ubicación + Radio + Tags
    
    F->>B: GET /reports/search?lat=X&lng=Y&radius=1000&tags=...
    
    B->>M: Query geoespacial
    Note over B,M: $geoWithin + filtros tags
    
    M->>M: Usa índice 2dsphere
    M-->>B: Reportes encontrados
    
    B->>B: Ordenar por relevancia
    B-->>F: Lista de reportes
    
    F->>F: Renderizar en mapa
    F-->>U: Resultados visualizados
```

---

## 📊 Flujo de Analytics - Dashboard

```mermaid
sequenceDiagram
    participant A as Analista
    participant F as Frontend
    participant B as Backend
    participant M as MongoDB
    participant P as PostgreSQL

    A->>F: Accede a dashboard
    F->>B: GET /analytics/stats
    
    B->>P: Verificar rol admin
    P-->>B: Usuario autorizado
    
    B->>M: Agregaciones complejas
    Note over B,M: Pipeline de agregación<br/>Estadísticas + Clusters
    
    M-->>B: Datos procesados
    B-->>F: Estadísticas + Reportes
    
    F->>F: Renderizar dashboard
    F-->>A: Vista de analista
    
    loop Tiempo Real
        F->>B: WebSocket connection
        B->>M: Escuchar cambios
        M-->>B: Nuevo reporte
        B-->>F: Push update
        F-->>A: Actualización automática
    end
```

---

## 🎯 Índices MongoDB Optimizados

```mermaid
graph LR
    subgraph "Índices Principales"
        I1[report_location<br/>2dsphere]
        I2[status + timestamp<br/>compound]
        I3[trust_score<br/>descending]
        I4[cluster_id<br/>ascending]
    end
    
    subgraph "Índices Secundarios"
        I5[user.user_id<br/>ascending]
        I6[tags<br/>multikey]
        I7[timestamp<br/>descending]
    end
    
    Q1[Búsqueda Geo] --> I1
    Q2[Listar Activos] --> I2
    Q3[Top Confiables] --> I3
    Q4[Reportes Cluster] --> I4
    Q5[Reportes Usuario] --> I5
    Q6[Búsqueda Tags] --> I6
```

---

## 🔐 Seguridad y Autenticación

```mermaid
graph TB
    subgraph "Flujo de Autenticación"
        L[Login Request]
        V[Validar Credenciales]
        H[Hash Password]
        C[Comparar Hash]
        T[Generar Token/Session]
        R[Response con User Data]
    end
    
    L --> V
    V --> H
    H --> C
    C -->|Match| T
    C -->|No Match| E[Error 401]
    T --> R
    
    subgraph "Protección de Rutas"
        M[Middleware Auth]
        RO[Verificar Rol]
        A[Acceso Permitido]
    end
    
    R --> M
    M --> RO
    RO -->|Admin| A
    RO -->|User| A2[Acceso Limitado]
```

---

## 🚀 Pipeline de Procesamiento

```mermaid
graph LR
    subgraph "Ingesta"
        I1[Reporte Nuevo]
        I2[Validación]
        I3[Geocoding]
    end
    
    subgraph "Procesamiento"
        P1[Calcular Trust Score]
        P2[Detectar Cluster]
        P3[Actualizar Related]
    end
    
    subgraph "Almacenamiento"
        S1[MongoDB Write]
        S2[Índices Update]
    end
    
    subgraph "Analytics"
        A1[Agregaciones]
        A2[Dashboard Update]
        A3[Notificaciones]
    end
    
    I1 --> I2
    I2 --> I3
    I3 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> S1
    S1 --> S2
    S2 --> A1
    A1 --> A2
    A2 --> A3
```

---

## 📈 Escalabilidad

```mermaid
graph TB
    subgraph "Escalamiento Horizontal"
        LB[Load Balancer]
        
        subgraph "Backend Instances"
            B1[Backend 1]
            B2[Backend 2]
            B3[Backend N]
        end
        
        subgraph "MongoDB Cluster"
            M1[Primary]
            M2[Secondary 1]
            M3[Secondary 2]
        end
        
        subgraph "PostgreSQL"
            P1[Master]
            P2[Replica]
        end
    end
    
    LB --> B1
    LB --> B2
    LB --> B3
    
    B1 --> M1
    B2 --> M1
    B3 --> M1
    
    M1 --> M2
    M1 --> M3
    
    B1 --> P1
    B2 --> P1
    B3 --> P1
    
    P1 --> P2
```

---

## 🔄 Comparación: NoSQL vs SQL

### Caso de Uso 1: Búsqueda Geoespacial

**MongoDB (Optimizado)**
```javascript
// Query nativa con índice 2dsphere
db.reports.find({
  report_location: {
    $near: {
      $geometry: { type: "Point", coordinates: [lng, lat] },
      $maxDistance: 1000
    }
  },
  status: "active"
})
```
⚡ **Tiempo:** ~50ms con índice 2dsphere

**PostgreSQL (Requiere PostGIS)**
```sql
-- Requiere extensión PostGIS
SELECT * FROM reports 
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(lng, lat)::geography,
  1000
)
AND status = 'active';
```
⚡ **Tiempo:** ~200ms con índice GiST

### Caso de Uso 2: Tags Dinámicos

**MongoDB (Schema Flexible)**
```javascript
// Tags como objeto dinámico
{
  tags: {
    "color_vehiculo": "negro",
    "patente": "ABC123",
    "nuevo_campo": "valor"  // ✅ Sin migración
  }
}
```
✅ **Ventaja:** Agregar campos sin migrar DB

**PostgreSQL (Schema Rígido)**
```sql
-- Requiere tabla separada o JSONB
CREATE TABLE report_tags (
  report_id INT,
  tag_key VARCHAR,
  tag_value VARCHAR
);
```
❌ **Desventaja:** Requiere joins o JSONB (menos eficiente)

### Caso de Uso 3: Agregaciones Complejas

**MongoDB (Aggregation Pipeline)**
```javascript
// Pipeline de agregación nativo
db.reports.aggregate([
  { $geoNear: { /* búsqueda geo */ } },
  { $match: { status: "active" } },
  { $group: { _id: "$cluster_id", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```
⚡ **Tiempo:** ~100ms para 10K documentos

**PostgreSQL (Múltiples Queries)**
```sql
-- Requiere múltiples queries o CTEs complejos
WITH geo_filtered AS (
  SELECT * FROM reports WHERE ...
),
grouped AS (
  SELECT cluster_id, COUNT(*) FROM geo_filtered GROUP BY cluster_id
)
SELECT * FROM grouped ORDER BY count DESC;
```
⚡ **Tiempo:** ~300ms para 10K registros

---

## 🎯 Decisiones de Diseño

### ¿Por qué MongoDB para Reportes?

1. **Geoespacial Nativo**
   - Índices 2dsphere optimizados
   - Queries de proximidad eficientes
   - Sin necesidad de extensiones

2. **Schema Flexible**
   - Tags dinámicos sin migración
   - Evolución del modelo sin downtime
   - Documentos autónomos

3. **Agregaciones Potentes**
   - Pipeline de agregación expresivo
   - Analytics en una sola query
   - Performance superior para análisis

4. **Escalabilidad Horizontal**
   - Sharding nativo
   - Replicación automática
   - Distribución geográfica

### ¿Por qué PostgreSQL para Usuarios?

1. **ACID Completo**
   - Transacciones garantizadas
   - Consistencia fuerte
   - Crítico para autenticación

2. **Integridad Referencial**
   - Foreign keys
   - Constraints
   - Validaciones a nivel DB

3. **Madurez y Herramientas**
   - Ecosistema robusto
   - Herramientas de administración
   - Amplia documentación

---

## 📊 Métricas de Performance Esperadas

| Operación | Objetivo | MongoDB | PostgreSQL |
|-----------|----------|---------|------------|
| Lectura simple | < 0.5s | ~50ms ✅ | ~30ms ✅ |
| Escritura | < 1s | ~100ms ✅ | ~80ms ✅ |
| Búsqueda geo | < 0.5s | ~50ms ✅ | ~200ms ⚠️ |
| Agregación compleja | < 1s | ~100ms ✅ | ~300ms ⚠️ |
| Tags dinámicos | N/A | Nativo ✅ | JSONB ⚠️ |

---

## 🔮 Futuras Mejoras

1. **Caching con Redis**
   - Cache de búsquedas frecuentes
   - Sessions distribuidas
   - Rate limiting

2. **Message Queue**
   - RabbitMQ o Kafka
   - Procesamiento asíncrono
   - Notificaciones en tiempo real

3. **CDN para Assets**
   - Imágenes de reportes
   - Assets estáticos
   - Mejor performance global

4. **Monitoring**
   - Prometheus + Grafana
   - Métricas en tiempo real
   - Alertas automáticas

---

**Última actualización:** 2026-05-29  
**Versión:** 1.0  
**Autor:** Equipo ReportIt