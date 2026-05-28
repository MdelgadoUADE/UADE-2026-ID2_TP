import { ref, computed } from 'vue'

export function useReports() {

  const reports = ref([])

  const loading = ref(false)

  const error = ref(null)

  const selectedReport = ref(null)

  const searchQuery = ref('')

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

  function selectReport(report) {

    selectedReport.value = report
  }

  function clearSelectedReport() {

    selectedReport.value = null
  }

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
        status.includes(query) ||
        notes.includes(query) ||
        tags.includes(query)
      )
    })
  })

  return {

    reports,

    filteredReports,

    loading,

    error,

    selectedReport,

    searchQuery,

    fetchReports,

    selectReport,

    clearSelectedReport
  }
}