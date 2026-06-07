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

  // =========================
  // FETCH ALL REPORTS
  // =========================

  async function fetchReports() {

    loading.value = true

    error.value = null

    try {

      const response = await fetch(`http://localhost:3000/reports/search`)
      if (!response.ok) throw new Error('Error obteniendo reportes')
      const data = await response.json()
      if (!data.success) throw new Error(data.message)
      reports.value = data.reports

    } catch (err) {

      console.error(err)

      error.value = err.message

    } finally {

      loading.value = false
    }
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
// FILTER HELPERS
// =========================

function reportMatchesSearch(report, query) {

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
}

  // =========================
  // ACTIVE LIST
  // =========================

  const activeReports = computed(() => {

    if (!searchQuery.value) {

      return reports.value
    }

    const query = normalizeText(
      searchQuery.value
    )

    return reports.value.filter(report =>
      reportMatchesSearch(
        report,
        query
      )
    )
  })

  const activeLoading = computed(() => {

    return loading.value
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

    fetchReports,

    selectReport,

    clearSelectedReport,

    // ACTIVE
    activeReports,

    activeLoading
  }
}