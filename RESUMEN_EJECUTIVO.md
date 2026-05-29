# Resumen Ejecutivo - Plan MVP ReportIt

## 🎯 Objetivo
Completar el MVP del TP de Ingeniería de Datos 2 cumpliendo con todos los requerimientos críticos y demostrando las ventajas de NoSQL vs SQL.

---

## 📊 Estado Actual: 60% Completo

### ✅ Lo que YA tenemos
- Autenticación completa (login/registro)
- CRUD de reportes con MongoDB
- Búsquedas geoespaciales básicas
- Sistema de tags dinámicos
- Mapa interactivo con geolocalización
- Infraestructura Docker completa

### ❌ Lo que FALTA (Crítico para aprobar)
1. **Modo emergencia** - reportes sin login
2. **Búsqueda avanzada** - por radio + tags combinados
3. **Score de confianza** - cálculo automático
4. **Dashboard de analistas** - panel exclusivo para admins
5. **Clustering automático** - agrupar reportes relacionados
6. **Clasificación** - criticidad y validez
7. **Optimización** - cumplir tiempos de respuesta
8. **Documentación técnica** - diagramas y justificaciones

---

## 🚀 Plan de 3 Semanas

### Semana 1: Features Críticos (5 tareas)
| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| Modo emergencia | 4h | 🔴 CRÍTICO |
| Búsqueda combinada | 8h | 🔴 CRÍTICO |
| Score de confianza | 6h | 🔴 CRÍTICO |
| Dashboard analistas | 12h | 🔴 CRÍTICO |
| Clustering automático | 10h | 🔴 CRÍTICO |
| **TOTAL** | **40h** | |

### Semana 2: Optimización (5 tareas)
| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| Clasificación reportes | 6h | 🟡 ALTA |
| Optimizar índices | 4h | 🟡 ALTA |
| Optimizar escritura | 6h | 🟡 ALTA |
| Agregaciones complejas | 8h | 🟡 ALTA |
| Tests de performance | 6h | 🟡 ALTA |
| **TOTAL** | **30h** | |

### Semana 3: Documentación (5 tareas)
| Tarea | Horas | Prioridad |
|-------|-------|-----------|
| Tiempo real (opcional) | 8h | 🟢 MEDIA |
| Comparación DBs | 10h | 🟢 MEDIA |
| Dataset ampliado | 4h | 🟢 MEDIA |
| Diagramas arquitectura | 6h | 🟢 MEDIA |
| Docs técnicas completas | 12h | 🟢 MEDIA |
| **TOTAL** | **40h** | |

**Total estimado: 110 horas** (distribuido en equipo de 4 personas = ~28h por persona)

---

## 👥 Distribución Sugerida

### Backend Dev 1 (30h)
- Modo emergencia (4h)
- Búsqueda combinada - backend (4h)
- Score de confianza (6h)
- Dashboard analistas - backend (6h)
- Optimizar índices (4h)
- Comparación DBs (6h)

### Backend Dev 2 (30h)
- Clustering automático (10h)
- Clasificación - backend (3h)
- Optimizar escritura (6h)
- Agregaciones complejas (8h)
- Dataset ampliado (3h)

### Frontend Dev (25h)
- Búsqueda combinada - frontend (4h)
- Dashboard analistas - frontend (6h)
- Clasificación - frontend (3h)
- Tiempo real - frontend (4h)
- Optimización UI/UX (6h)
- Tests frontend (2h)

### Full-Stack/Docs (25h)
- Tiempo real - backend (4h)
- Tests de performance (6h)
- Diagramas arquitectura (6h)
- Documentación técnica (9h)

---

## 🎯 Entregables Clave

### Para el Prototipo (05/06)
1. ✅ Todas las funcionalidades críticas (RF_06, RF_13, RF_21-24)
2. ✅ Performance validado (RNF_01, RNF_02)
3. ✅ Dashboard de analistas funcional
4. ✅ Búsquedas geoespaciales optimizadas
5. ✅ Datos de demo realistas

### Para el Informe (después)
1. 📄 Diagramas de arquitectura
2. 📄 Comparación MongoDB vs PostgreSQL con métricas
3. 📄 Documentación de decisiones técnicas
4. 📄 Pipeline E2E explicado
5. 📄 Justificación NoSQL vs SQL

### Para el Video (después)
1. 🎥 Demo flujo completo de usuario
2. 🎥 Dashboard de analistas en acción
3. 🎥 Búsquedas geoespaciales visualizadas
4. 🎥 Métricas de performance
5. 🎥 Características NoSQL destacadas

---

## 🚨 Riesgos Principales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| No cumplir tiempos de respuesta | Media | Alto | Implementar índices desde día 1 |
| Clustering muy complejo | Alta | Medio | Empezar simple, iterar después |
| Falta tiempo para docs | Media | Alto | Documentar mientras se desarrolla |
| Tiempo real difícil | Baja | Bajo | Es opcional, usar polling si falta tiempo |

---

## 📋 Checklist de Aprobación

### Funcionalidades Mínimas
- [ ] Login/registro funcionando
- [ ] Crear reportes (autenticado y anónimo)
- [ ] Búsqueda por ubicación + tags
- [ ] Dashboard de analistas
- [ ] Score de confianza automático
- [ ] Clustering de reportes
- [ ] Clasificación por criticidad

### Performance
- [ ] Lectura < 0.5s (validado con tests)
- [ ] Escritura < 1s (validado con tests)
- [ ] Índices optimizados
- [ ] Queries eficientes

### Documentación
- [ ] Código comentado (JSDoc)
- [ ] Diagramas de arquitectura
- [ ] README técnico completo
- [ ] Decisiones justificadas
- [ ] Comparación NoSQL vs SQL

### Demo
- [ ] Datos realistas cargados
- [ ] Flujo end-to-end funcional
- [ ] Dashboard operativo
- [ ] Métricas visibles

---

## 💡 Puntos Clave para la Defensa

### Ventajas de MongoDB (NoSQL)
1. **Schema flexible** → Tags dinámicos sin migrar DB
2. **Geoespacial nativo** → Búsquedas por proximidad eficientes
3. **Agregaciones potentes** → Analytics complejos en una query
4. **Escalabilidad horizontal** → Sharding para millones de reportes
5. **Documentos independientes** → Cada reporte es autónomo

### Ventajas de PostgreSQL (SQL)
1. **ACID completo** → Autenticación segura
2. **Integridad referencial** → Relaciones entre usuarios
3. **Transacciones** → Operaciones atómicas críticas
4. **Madurez** → Herramientas y ecosistema robusto

### Por qué Polyglot Persistence
- **Cada DB para lo que hace mejor**
- MongoDB: Datos no estructurados, geoespacial, analytics
- PostgreSQL: Datos estructurados, autenticación, transacciones
- **Resultado:** Sistema más eficiente y escalable

---

## 📞 Próximos Pasos

1. **Revisar este plan en equipo** (30 min)
2. **Asignar responsables** a cada tarea (30 min)
3. **Crear board de Trello/Jira** con todas las tareas (1h)
4. **Kickoff de Semana 1** - empezar con features críticos
5. **Daily standups** de 15 min para sincronizar

---

## 📚 Documentos Relacionados

- [`PLAN_MVP.md`](PLAN_MVP.md) - Plan detallado completo
- [`README.md`](README.md) - Documentación actual del proyecto
- Carpeta `docs/` - Se creará para documentación técnica

---

**Fecha límite MVP:** 05/06/2026  
**Tiempo restante:** ~1 semana  
**Estado:** Plan listo para ejecución  
**Próxima acción:** Reunión de equipo para asignar tareas