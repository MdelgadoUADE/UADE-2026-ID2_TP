# Credenciales de Testing y Verificación de Roles

## Usuarios de Prueba

### Usuario Regular (Sin acceso a Analytics)
- **Email:** testuser@reportit.com
- **Password:** test1234
- **Role:** user
- **Acceso:**
  - ✅ Reportar
  - ✅ Buscar
  - ❌ Analytics (botón no visible)

### Usuario Analista (Con acceso a Analytics)
- **Email:** testanalyst@reportit.com
- **Password:** analyst1234
- **Role:** analyst
- **Acceso:**
  - ✅ Reportar
  - ✅ Buscar
  - ✅ Analytics (botón visible)

### Usuario Administrador (Con acceso completo)
- **Email:** testadmin@reportit.com
- **Password:** admin1234
- **Role:** admin
- **Acceso:**
  - ✅ Reportar
  - ✅ Buscar
  - ✅ Analytics (botón visible)

## Verificación de Visibilidad por Roles

### 1. Analytics Dashboard Button
El botón "Analytics" en el header solo es visible para:
- Usuarios con rol `admin`
- Usuarios con rol `analyst`

**Implementación:**
- `AppHeader.vue`: Función `hasAnalyticsAccess()` verifica el rol
- Condición: `v-if="!isEmergency && hasAnalyticsAccess()"`

### 2. Analytics View Component
El componente AnalyticsView solo se renderiza si:
- No está en modo emergencia
- El usuario está autenticado (currentUser existe)
- El tab activo es 'analytics'

**Implementación:**
- `Dashboard.vue`: Condición `v-if="activeTab === 'analytics' && !isEmergency && currentUser"`
- Validación adicional en `changeTab()` para prevenir acceso no autorizado

### 3. Backend Protection
Las rutas de analytics están protegidas por middleware:
- `/analytics/stats` - Requiere rol `admin` o `analyst`
- `/analytics/pending` - Requiere rol `admin` o `analyst`
- `/analytics/validate/:id` - Requiere rol `admin` o `analyst`
- `/analytics/cluster/*` - Requiere rol `admin` o `analyst`

**Implementación:**
- `backend/src/routes/analytics.js`: Usa `requireRole(['admin', 'analyst'])`

## Pasos para Testing

### 1. Iniciar el Sistema
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Probar Usuario Regular (user)
1. Login con `testuser@reportit.com` / `test1234`
2. Verificar que el botón "Analytics" NO aparece en el header
3. Intentar acceder manualmente (no debería funcionar)
4. Verificar acceso a "Reportar" y "Buscar"

### 3. Probar Usuario Analista (analyst)
1. Logout y login con `testanalyst@reportit.com` / `analyst1234`
2. Verificar que el botón "Analytics" SÍ aparece en el header
3. Click en "Analytics" - debe mostrar el dashboard
4. Verificar las 3 secciones:
   - Estadísticas
   - Pendientes
   - Clusters
5. Probar validación de reportes
6. Probar ejecución de clustering

### 4. Probar Usuario Administrador (admin)
1. Logout y login con `testadmin@reportit.com` / `admin1234`
2. Verificar que el botón "Analytics" SÍ aparece en el header
3. Verificar acceso completo al dashboard
4. Todas las funcionalidades deben estar disponibles

### 5. Probar Modo Emergencia
1. Logout
2. Click en "Reportar sin cuenta"
3. Verificar que NO aparece el botón "Analytics"
4. Verificar que solo está disponible "Reportar"

## Estructura de Roles

```
user (Usuario Regular)
├── Crear reportes
├── Buscar reportes
└── Ver detalles de reportes

analyst (Analista)
├── Todo lo de 'user'
├── Ver dashboard de analytics
├── Ver estadísticas del sistema
├── Validar reportes pendientes
└── Ver y gestionar clusters

admin (Administrador)
├── Todo lo de 'analyst'
└── Acceso completo al sistema
```

## Notas Importantes

1. **Modo Emergencia:** Los usuarios anónimos solo pueden crear reportes, sin acceso a búsqueda ni analytics.

2. **Validación en Frontend y Backend:** La visibilidad del botón es solo UI. El backend siempre valida los permisos.

3. **Inyección de Usuario:** El componente Dashboard usa `inject('currentUser')` para acceder al usuario actual desde App.vue.

4. **Headers de Autenticación:** El frontend envía headers `x-user-id`, `x-user-role`, y `x-user-name` en cada request a analytics.

## Troubleshooting

### El botón Analytics no aparece
- Verificar que el usuario tiene rol 'admin' o 'analyst'
- Verificar que no está en modo emergencia
- Revisar console del navegador por errores

### Error 403 al acceder a Analytics
- Verificar que los headers se están enviando correctamente
- Verificar que el rol del usuario es correcto en la base de datos
- Revisar logs del backend

### AnalyticsView no se renderiza
- Verificar que currentUser está definido
- Verificar que el import de AnalyticsView es correcto
- Revisar console por errores de componentes