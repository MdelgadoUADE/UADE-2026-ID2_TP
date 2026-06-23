<script setup>
import { onMounted, computed, watch } from 'vue'
import { RefreshCw, AlertCircle, Users, UserCheck, AlertTriangle, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'

import { useUserStats } from './composables/useUserStats.js'

const {
  data, loading, error, filters,
  sortBy, sortDir, setSort,
  pageSize, currentPage, totalPages, totalCount,
  currentRangeStart, currentRangeEnd,
  canGoPrevious, canGoNext, MAX_PAGE_SIZE,
  fetchUserStats, resetFilters, resetPaginationAndFetch,
  setPageSize, goToPreviousPage, goToNextPage,
  getKpis, getRankingRows, getSinReportes,
} = useUserStats()

onMounted(fetchUserStats)

// Cambiar filtros (no orden, no paginación) vuelve a página 1 y refetchea
watch(filters, resetPaginationAndFetch, { deep: true })

// Cambiar de página refetchea sin resetear nada más
watch(currentPage, fetchUserStats)

function handlePageSizeInput(event) {
  setPageSize(event.target.value)
  resetPaginationAndFetch()
}

const kpis       = computed(() => getKpis())
const rankingRows = computed(() => getRankingRows())
const sinReportes  = computed(() => getSinReportes())

const ROL_OPTS = [
  { value: '',      label: 'Todos' },
  { value: 'user',  label: 'Usuario' },
  { value: 'admin', label: 'Administrador' },
]

const COLUMNS = [
  { key: 'username',             label: 'Usuario',     sortable: false },
  { key: 'role',                 label: 'Rol',         sortable: false },
  { key: 'total_reportes',       label: 'Total',       sortable: true },
  { key: 'validos',              label: 'Válidos',     sortable: true },
  { key: 'falsos',               label: 'Falsos',      sortable: true },
  { key: 'tasa_falsos',          label: '% Falsos',    sortable: true },
  { key: 'trust_score_promedio', label: 'Trust prom.', sortable: true },
]

function tasaFalsosClass(tasa) {
  if (tasa >= 0.3) return 'bg-red-50 text-red-600 border border-red-200'
  if (tasa >= 0.1) return 'bg-orange-50 text-orange-600 border border-orange-200'
  return 'bg-green-50 text-green-600 border border-green-200'
}

function trustClass(score) {
  if (score == null) return 'text-gray-400'
  if (score >= 0.7) return 'text-green-600 font-medium'
  if (score >= 0.4) return 'text-orange-600 font-medium'
  return 'text-red-600 font-medium'
}

function formatPct(tasa) {
  return `${Math.round(tasa * 100)}%`
}
</script>

<template>
  <div class="space-y-5">

    <!-- ── Filtros ─────────────────────────────────── -->
    <!--
      CAMBIO RESPONSIVE — Barra de filtros:
      Se reemplaza "flex flex-wrap items-end gap-4" por un grid de 2 columnas
      en mobile (los dos selects lado a lado) y fila única en sm+.
      Cada <select> tiene "w-full" para ocupar todo el ancho de su columna.
      El spinner de carga se separa del flujo de filtros en una fila propia
      debajo, usando "flex justify-between", eliminando la dependencia de
      "ml-auto" en un contexto flex-wrap que rompía el layout.
    -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">

      <!-- Fila de controles -->
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-3">

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Mínimo de reportes</label>
          <select v-model.number="filters.minReportes"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option :value="1">1 o más</option>
            <option :value="3">3 o más</option>
            <option :value="5">5 o más</option>
            <option :value="10">10 o más</option>
          </select>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-500">Rol</label>
          <select v-model="filters.rol"
            class="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200">
            <option v-for="opt in ROL_OPTS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>

        <!--
          CAMBIO RESPONSIVE — "Mostrando N de X":
          En mobile (col-span-2) ocupa todo el ancho de la segunda fila del grid.
          En sm+ se comporta igual que antes, inline en la barra de filtros.
        -->
        <div class="col-span-2 sm:col-span-1 flex flex-col gap-1">
          <label class="text-xs text-gray-500 block">Mostrando</label>
          <div class="flex items-center gap-1.5 text-xs text-gray-400 h-[34px]">
            <input
              :value="pageSize"
              type="number"
              min="1"
              :max="MAX_PAGE_SIZE"
              step="1"
              @change="handlePageSizeInput"
              class="w-12 border-0 border-b border-gray-200 bg-transparent px-0 py-0.5 text-center text-xs text-gray-500 focus:outline-none focus:ring-0 focus:border-blue-400"
            />
            <span>de {{ totalCount }} usuario{{ totalCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>

      </div>

      <!--
        CAMBIO RESPONSIVE — Fila inferior separada:
        "Limpiar filtros" y el spinner quedan en una fila propia con
        "flex justify-between". Así el spinner nunca compite con "ml-auto"
        en un contexto wrapeado, y en mobile ambos elementos tienen espacio.
      -->
      <div class="mt-3 flex items-center justify-between">
        <button @click="resetFilters"
          class="text-sm text-gray-500 hover:text-blue-600 transition px-2 py-1.5 min-h-[36px]">
          Limpiar filtros
        </button>

        <span v-if="loading"
          class="flex items-center gap-1.5 text-xs text-gray-400">
          <RefreshCw class="w-3.5 h-3.5 animate-spin" /> Actualizando...
        </span>
      </div>

      <!-- ── Paginación ──────────────────────────────── -->
      <!--
        CAMBIO RESPONSIVE — Paginación:
        La barra existente "flex items-center justify-between gap-2" ya era
        correcta en estructura, pero los botones eran demasiado pequeños para
        touch (solo py-1, ~28px de alto).
        Se añade "min-h-[36px]" a los botones para cumplir el mínimo de 36px
        recomendado para targets táctiles en mobile.
        El texto de rango "X-Y / Z" se trunca con "shrink-0" para que los
        botones no lo compriman en pantallas angostas.
      -->
      <div class="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <span class="text-xs text-gray-500 shrink-0">
          {{ currentRangeStart }}-{{ currentRangeEnd }}&nbsp;/&nbsp;{{ totalCount }}
        </span>

        <div class="flex items-center gap-1">
          <button
            :disabled="!canGoPrevious"
            @click="goToPreviousPage"
            class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 min-h-[36px] text-xs text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-300 hover:text-blue-600"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
            <span class="hidden xs:inline">Anterior</span>
          </button>

          <span class="px-2 text-xs text-gray-500 shrink-0">
            {{ currentPage }}&nbsp;/&nbsp;{{ totalPages }}
          </span>

          <button
            :disabled="!canGoNext"
            @click="goToNextPage"
            class="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 min-h-[36px] text-xs text-gray-600 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-blue-300 hover:text-blue-600"
          >
            <span class="hidden xs:inline">Siguiente</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── Error ───────────────────────────────────── -->
    <div v-if="error"
      class="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
      <AlertCircle class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <!-- ── Loading inicial ─────────────────────────── -->
    <div v-else-if="loading && !data" class="flex items-center justify-center py-16 text-gray-400 gap-2">
      <RefreshCw class="w-4 h-4 animate-spin" />
      <span class="text-sm">Cargando estadísticas de usuarios...</span>
    </div>

    <template v-else-if="data">

      <!-- ── KPI cards ───────────────────────────────── -->
      <!--
        CAMBIO RESPONSIVE — KPI cards:
        "grid-cols-1 md:grid-cols-3" ya apilaba correctamente en mobile.
        Se mantiene, pero se añade un layout interno mejorado:
        en mobile cada card muestra ícono + label en una fila y el número grande
        a la derecha, aprovechando el ancho horizontal disponible en móvil y
        haciendo la lectura más eficiente (evita el efecto "lista de items").
        En md+ se mantiene el layout vertical original (flex-col).
      -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">

        <!-- KPI: Usuarios en la plataforma -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <!-- Mobile: fila con texto a la izquierda y número a la derecha -->
          <div class="flex items-center justify-between md:hidden">
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <Users class="w-3.5 h-3.5 shrink-0" /> Usuarios en la plataforma
            </div>
            <p class="text-2xl font-semibold text-gray-800 ml-3">{{ kpis.usuariosPlataforma }}</p>
          </div>
          <!-- Desktop: layout vertical original -->
          <div class="hidden md:flex md:flex-col gap-1">
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <Users class="w-3.5 h-3.5" /> Usuarios en la plataforma
            </div>
            <p class="text-2xl font-semibold text-gray-800">{{ kpis.usuariosPlataforma }}</p>
          </div>
        </div>

        <!-- KPI: Usuarios activos -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between md:hidden">
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <UserCheck class="w-3.5 h-3.5 shrink-0" /> Usuarios activos (con reportes)
            </div>
            <p class="text-2xl font-semibold text-blue-600 ml-3">{{ kpis.usuariosActivos }}</p>
          </div>
          <div class="hidden md:flex md:flex-col gap-1">
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <UserCheck class="w-3.5 h-3.5" /> Usuarios activos (con reportes)
            </div>
            <p class="text-2xl font-semibold text-blue-600">{{ kpis.usuariosActivos }}</p>
          </div>
        </div>

        <!-- KPI: Tasa de reportes falsos -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-center justify-between md:hidden">
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <AlertTriangle class="w-3.5 h-3.5 shrink-0" /> Tasa de reportes falsos (global)
            </div>
            <p class="text-2xl font-semibold text-red-600 ml-3">{{ kpis.tasaFalsosGlobal }}</p>
          </div>
          <div class="hidden md:flex md:flex-col gap-1">
            <div class="flex items-center gap-1.5 text-xs text-gray-400">
              <AlertTriangle class="w-3.5 h-3.5" /> Tasa de reportes falsos (global)
            </div>
            <p class="text-2xl font-semibold text-red-600">{{ kpis.tasaFalsosGlobal }}</p>
          </div>
        </div>

      </div>

      <!-- ── Tabla de ranking de usuarios ────────────── -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Ranking de usuarios reportantes</p>
        <p class="text-xs text-gray-400 mb-3">
          Campos: <code class="bg-gray-100 px-1 rounded">user.user_id</code>,
          <code class="bg-gray-100 px-1 rounded">validez</code>,
          <code class="bg-gray-100 px-1 rounded">trust_score</code> · Rol desde tabla
          <code class="bg-gray-100 px-1 rounded">users</code> (Postgres) · No incluye reportes anónimos.
          <span class="hidden sm:inline">Click en una columna para ordenar.</span>
        </p>

        <div v-if="loading" class="flex items-center justify-center py-10 text-gray-400 gap-2">
          <RefreshCw class="w-4 h-4 animate-spin" />
          <span class="text-sm">Cargando página...</span>
        </div>

        <template v-else-if="rankingRows.length">

          <!--
            ══════════════════════════════════════════════════════════════
            CAMBIO RESPONSIVE — Vista mobile: tarjetas por usuario
            ══════════════════════════════════════════════════════════════
            En mobile (< sm) la tabla de 7 columnas es ilegible incluso con
            scroll horizontal: el contenido es muy denso y el target de cada
            fila es demasiado pequeño para touch.

            Se reemplaza por una lista de tarjetas donde cada fila de la tabla
            se convierte en una card vertical con todos sus datos claramente
            etiquetados. Esta vista:
            - No modifica NADA de la lógica (rankingRows, sorting, etc.)
            - Es puramente visual / CSS
            - Desaparece en "sm" y aparece la tabla original

            El sorting en mobile se expone con botones explícitos en un
            selector de "ordenar por" al inicio de la sección.
          -->
          <div class="block sm:hidden space-y-3">

            <!-- Selector de orden para mobile -->
            <!--
              En desktop el orden se controla clickeando headers de tabla.
              En mobile esos headers no existen, así que exponemos los campos
              ordenables en un select + botón de dirección.
              NO modifica setSort() ni sortBy/sortDir — solo los llama igual.
            -->
            <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span class="text-xs text-gray-400 shrink-0">Ordenar por:</span>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="col in COLUMNS.filter(c => c.sortable)"
                  :key="col.key"
                  @click="setSort(col.key)"
                  :class="[
                    'text-xs px-2 py-1 rounded-lg border transition min-h-[32px]',
                    sortBy === col.key
                      ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-500'
                  ]"
                >
                  {{ col.label }}
                  <ArrowUp   v-if="sortBy === col.key && sortDir === 'asc'"  class="inline w-3 h-3 ml-0.5" />
                  <ArrowDown v-else-if="sortBy === col.key && sortDir === 'desc'" class="inline w-3 h-3 ml-0.5" />
                </button>
              </div>
            </div>

            <!-- Tarjetas de usuario -->
            <div
              v-for="row in rankingRows"
              :key="row.user_id"
              class="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2"
            >
              <!-- Header de la tarjeta: nombre + rol -->
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-medium text-gray-800 text-sm truncate">{{ row.username }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ row.email }}</p>
                </div>
                <span v-if="row.role"
                  class="shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {{ row.role }}
                </span>
                <span v-else class="shrink-0 text-xs text-gray-300">—</span>
              </div>

              <!-- Métricas en grid de 2 columnas -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-1 border-t border-gray-200">

                <div class="flex flex-col">
                  <span class="text-xs text-gray-400">Total</span>
                  <span class="text-sm font-medium text-gray-700">{{ row.total_reportes }}</span>
                </div>

                <div class="flex flex-col">
                  <span class="text-xs text-gray-400">Válidos</span>
                  <span class="text-sm font-medium text-green-600">{{ row.validos }}</span>
                </div>

                <div class="flex flex-col">
                  <span class="text-xs text-gray-400">Falsos</span>
                  <span class="text-sm font-medium text-red-600">{{ row.falsos }}</span>
                </div>

                <div class="flex flex-col">
                  <span class="text-xs text-gray-400">% Falsos</span>
                  <span
                    class="text-xs px-2 py-0.5 rounded-full w-fit"
                    :class="tasaFalsosClass(row.tasa_falsos)"
                  >
                    {{ formatPct(row.tasa_falsos) }}
                  </span>
                </div>

                <div class="flex flex-col col-span-2">
                  <span class="text-xs text-gray-400">Trust promedio</span>
                  <span class="text-sm" :class="trustClass(row.trust_score_promedio)">
                    {{ row.trust_score_promedio != null ? row.trust_score_promedio.toFixed(2) : '—' }}
                  </span>
                </div>

              </div>
            </div>
          </div>

          <!--
            ══════════════════════════════════════════════════════════════
            Vista sm+: tabla original con overflow-x-auto
            ══════════════════════════════════════════════════════════════
            La tabla completa con todas sus columnas se mantiene INTACTA
            para tablet y desktop. El "overflow-x-auto" ya existía y permite
            scroll horizontal si la pantalla es más angosta que la tabla.
            Solo se añade "-mx-4 px-4" para que el scroll llegue hasta los
            bordes de la card sin cortar el padding visual.
          -->
          <div class="hidden sm:block overflow-x-auto -mx-4 px-4">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th
                    v-for="col in COLUMNS" :key="col.key"
                    @click="col.sortable && setSort(col.key)"
                    :class="[
                      'text-left text-xs font-medium text-gray-400 px-3 py-2 select-none whitespace-nowrap',
                      col.sortable ? 'cursor-pointer hover:text-blue-600' : ''
                    ]"
                  >
                    <span class="flex items-center gap-1">
                      {{ col.label }}
                      <template v-if="col.sortable">
                        <ArrowUp   v-if="sortBy === col.key && sortDir === 'asc'"  class="w-3 h-3" />
                        <ArrowDown v-else-if="sortBy === col.key && sortDir === 'desc'" class="w-3 h-3" />
                        <ChevronsUpDown v-else class="w-3 h-3 opacity-30" />
                      </template>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rankingRows" :key="row.user_id"
                  class="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">
                  <td class="px-3 py-2.5">
                    <p class="font-medium text-gray-800 whitespace-nowrap">{{ row.username }}</p>
                    <p class="text-xs text-gray-400 whitespace-nowrap">{{ row.email }}</p>
                  </td>
                  <td class="px-3 py-2.5">
                    <span v-if="row.role"
                      class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize whitespace-nowrap">
                      {{ row.role }}
                    </span>
                    <span v-else class="text-xs text-gray-300">—</span>
                  </td>
                  <td class="px-3 py-2.5 text-gray-700">{{ row.total_reportes }}</td>
                  <td class="px-3 py-2.5 text-green-600">{{ row.validos }}</td>
                  <td class="px-3 py-2.5 text-red-600">{{ row.falsos }}</td>
                  <td class="px-3 py-2.5">
                    <span class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" :class="tasaFalsosClass(row.tasa_falsos)">
                      {{ formatPct(row.tasa_falsos) }}
                    </span>
                  </td>
                  <td class="px-3 py-2.5" :class="trustClass(row.trust_score_promedio)">
                    {{ row.trust_score_promedio != null ? row.trust_score_promedio.toFixed(2) : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </template>

        <div v-else class="flex items-center justify-center h-[120px] text-sm text-gray-400">
          Sin usuarios que cumplan el mínimo de reportes seleccionado.
        </div>
      </div>

      <!-- ── Usuarios sin reportes aún ─────────────────── -->
      <!--
        CAMBIO RESPONSIVE — Chips de usuarios sin reportes:
        "flex flex-wrap gap-2" ya era correcto.
        Se añade "break-all" a los chips para que nombres muy largos
        no causen overflow en pantallas de 320px.
        Se añade "min-h-[32px]" para que sean más fáciles de tocar en mobile.
      -->
      <div v-if="sinReportes.length" class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-1">Usuarios registrados sin reportes aún</p>
        <p class="text-xs text-gray-400 mb-3">
          Cuentas creadas en la plataforma (<code class="bg-gray-100 px-1 rounded">users</code>, Postgres)
          que todavía no generaron ningún reporte.
        </p>
        <div class="flex flex-wrap gap-2">
          <span v-for="u in sinReportes" :key="u.user_id"
            class="text-xs px-2.5 py-1 min-h-[28px] rounded-full bg-gray-100 text-gray-600 flex items-center">
            <span class="break-all">{{ u.username }}</span>
            <span class="text-gray-400 ml-1 shrink-0">· {{ u.role }}</span>
          </span>
        </div>
      </div>

    </template>

  </div>
</template>