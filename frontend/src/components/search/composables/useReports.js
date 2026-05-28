import {
  ref,
  computed
} from 'vue'

export function useReports() {

  // MAIN STATE
  const reports = ref([])

  const loading = ref(false)

  const error = ref(null)

  const selectedReport = ref(null)

  const searchQuery = ref('')

  // NEARBY STATE
  const nearbyReports = ref([])

  const nearbyLoading = ref(false)

  const showingNearby = ref(false)

  // =========================
  // FETCH ALL REPORTS
  // =========================

  async function fetchReports() {

    loading.value = true

    error.value = null

    try {

      const response = await fetch(
        'http://localhost:3000/reports'
      )

      if (!response.ok) {

        throw new Error(
          'Error obteniendo reportes'
        )
      }

      const data = await response.json()

      reports.value = data

    } catch (err) {

      console.error(err)

      error.value = err.message

    } finally {

      loading.value = false
    }
  }

  // =========================
  // FETCH NEARBY REPORTS
  // =========================

  async function fetchNearbyReports(reportId) {

    if (!reportId) return

    nearbyLoading.value = true

    error.value = null

    try {

      const response = await fetch(
        `http://localhost:3000/reports/near/${reportId}`
      )

      if (!response.ok) {

        throw new Error(
          'Error obteniendo reportes cercanos'
        )
      }

      const data = await response.json()

      console.log(
        'Nearby reports:',
        data
      )

      // EXCLUDE CURRENT REPORT
      nearbyReports.value = data.filter(
        report =>
          String(report._id) !== String(reportId)
      )

      showingNearby.value = true

      // OPTIONAL:
      // clear selected report
      // if no nearby reports found

      if (
        nearbyReports.value.length === 0
      ) {

        console.warn(
          'No se encontraron reportes cercanos'
        )
      }

    } catch (err) {

      console.error(err)

      error.value = err.message

    } finally {

      nearbyLoading.value = false
    }
  }

  // =========================
  // CLEAR NEARBY
  // =========================

  function clearNearbyReports() {

    showingNearby.value = false

    nearbyReports.value = []
  }

  // =========================
  // SELECT REPORT
  // =========================

  function selectReport(report) {

    selectedReport.value = report
  }

  function clearSelectedReport() {

    selectedReport.value = null
  }

  // =========================
  // HELPERS
  // =========================

  function normalizeText(text) {

    return String(text || '')
      .toLowerCase()
      .trim()
  }

  function tagsToText(tags) {

    if (!tags) return ''

    return JSON.stringify(tags)
      .toLowerCase()
  }

  // =========================
  // FILTERED REPORTS
  // =========================

  const filteredReports = computed(() => {

    if (!searchQuery.value) {

      return reports.value
    }

    const query = normalizeText(
      searchQuery.value
    )

    return reports.value.filter(report => {

      const username = normalizeText(
        report.user?.username
      )

      const surname = normalizeText(
        report.user?.surname
      )

      const status = normalizeText(
        report.status
      )

      const notes = normalizeText(
        report.notes
      )

      const tags = tagsToText(
        report.tags
      )

      return (

        username.includes(query) ||

        surname.includes(query) ||

        status.includes(query) ||

        notes.includes(query) ||

        tags.includes(query)
      )
    })
  })

  // =========================
  // ACTIVE LIST
  // =========================

  const activeReports = computed(() => {

    return showingNearby.value
      ? nearbyReports.value
      : filteredReports.value
  })

  const activeLoading = computed(() => {

    return showingNearby.value
      ? nearbyLoading.value
      : loading.value
  })

  // =========================
  // RETURN
  // =========================

  return {

    // MAIN
    reports,

    loading,

    error,

    selectedReport,

    searchQuery,

    filteredReports,

    fetchReports,

    selectReport,

    clearSelectedReport,

    // NEARBY
    nearbyReports,

    nearbyLoading,

    showingNearby,

    fetchNearbyReports,

    clearNearbyReports,

    // ACTIVE
    activeReports,

    activeLoading
  }
}