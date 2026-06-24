# UADE 2026 - ID2 TP

Aplicación web desarrollada utilizando Vue, Node.js, MongoDB y PostgreSQL.
El proyecto utiliza Docker para garantizar un entorno reproducible y evitar problemas de dependencias.

---

# IMPORTANT

- para que el servicio de archivos funcione es necesario crear el bucket donde se alojaran los archivos.
- antes de ingresar al frontend ir a http://localhost:9001 (usuario/contraseña: minioadmin)
- en buckets crear la bucket y nombrarla media-uploads

# ⌨️​ Test Credentials

- email: testuser@reportit.com
- password: test1234
- email: testadmin@reportit.com
- password: admin1234

# 🚀 Technologies

- Frontend: Vue 3 + Vite
- Backend: Node.js + Express
- Database (SQL): PostgreSQL
- Database (NoSQL): MongoDB
- Containerization: Docker & Docker Compose

---

# 📦 Requirements

Antes de ejecutar el proyecto, asegurarse de tener instalado:

| Software       | Version |
| -------------- | ------- |
| Docker Desktop | 4.x+    |
| Node.js        | 20.x    |
| Git            | Latest  |

## Notes

- > ⚠️ Docker Desktop debe estar ejecutándose antes de levantar el entorno.
- Node.js se utiliza únicamente para tareas de desarrollo local y tooling.
- Todas las dependencias de runtime son manejadas dentro de Docker.

---

# ⚙️ Environment Setup

Clonar el repositorio:

```bash
git clone https://github.com/MdelgadoUADE/UADE-2026-ID2_TP.git
cd UADE-2026-ID2_TP
```

## 1. Usage

Levantar todos los servicios:

```bash
docker compose up --build
```

Esto iniciará:

- Frontend Vue
- Backend Node.js
- MongoDB
- PostgreSQL

### 🌱 Generador de Datos Demo (Opcional)

Para demostrar las capacidades de MongoDB y el dashboard de analytics, puedes generar datos de demostración automáticamente:

**Opción 1: Editar docker-compose.yml**

Descomenta las líneas en la sección `backend > environment`:

```yaml
backend:
  environment:
    - SEED_DEMO=true
    - SEED_REPORTS=5000
```

**Opción 2: Variables de entorno en línea de comandos**

```bash
# Linux/Mac
SEED_DEMO=true SEED_REPORTS=5000 docker compose up --build

# Windows PowerShell
$env:SEED_DEMO="true"; $env:SEED_REPORTS="5000"; docker compose up --build
```

**Qué se genera:**

- ✅ 5,000 reportes distribuidos en Buenos Aires y Córdoba
- ✅ 25 clusters correlacionados detectables automáticamente
- ✅ 11 tipos de incidentes con tags dinámicos
- ✅ Distribución temporal realista (últimos 6 meses)
- ✅ Estados, criticidad, validez y trust scores

**Documentación completa:**

- [Guía rápida](backend/SEED_README.md)
- [Documentación detallada](SEED_DEMO_GUIDE.md)

## 2. Available Services

| Service    | URL / Port            |
| ---------- | --------------------- |
| Frontend   | http://localhost:5173 |
| Backend    | http://localhost:3000 |
| MongoDB    | localhost:27017       |
| PostgreSQL | localhost:5432        |

---

# 🛑 Stop Services

Detener containers:

```bash
docker compose down
```

Detener y eliminar volúmenes:

```bash
docker compose down -v
```

---

# 🗂️ Project Structure

```bash
.
├── backend/
├── frontend/
├── mongo-init/
├── docker-compose.yml
└── README.md
```

---

# 🐳 Docker Notes

- Cada servicio corre en su propio contenedor.
- Docker Compose maneja la red interna automáticamente.
- Los servicios se comunican usando el nombre definido en `docker-compose.yml`.

Ejemplo:

```bash
mongodb://mongo:27017
```

---

# 🔧 Troubleshooting

## Error de puertos ocupados

Verificar que los siguientes puertos no estén siendo utilizados:

- 3000
- 5173
- 27017
- 5432

## Comandos útiles

```bash
docker compose ps
docker compose logs
docker compose logs -f # real time
docker compose logs <service> # backend, frontend, mongo
docker compose restart
docker compose restart <service> # backend, frontend, mongo
docker compose up --build
docker compose down -v # ⚠️ Esto elimina los volumenes persistentes, incluyendo datos de MongoDB y PostgreSQL
docker compose exec mongo mongosh # Ejeutar comandos dentro (ej: show dbs)

```

---

# 🍃 MongoDB Compass

Para visualizar e interactuar con la base de datos MongoDB se recomienda instalar:

- MongoDB Compass

Una vez iniciado el entorno Docker, conectarse utilizando:

```bash
mongodb://localhost:27017
```

## Notes

- MongoDB corre dentro de un contenedor Docker.
- El puerto `27017` se encuentra expuesto al host mediante Docker Compose.
- Compass debe instalarse localmente en el host.
