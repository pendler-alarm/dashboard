import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getOrgIssues,
  getOrgLabels,
  getOrgMilestones,
  getOrgMembers,
  getOrgRepos,
} from '@/services/github'
import type {
  GitHubIssue,
  GitHubLabel,
  GitHubMilestone,
  GitHubUser,
  GitHubRepository,
  IssueFilters,
} from '@/types/github'
import { useAuthStore } from '@/stores/auth'

const PRIORITY_LABELS = ['priority: critical', 'priority: high', 'priority: medium', 'priority: low']

export const useIssuesStore = defineStore('issues', () => {
  const issues = ref<GitHubIssue[]>([])
  const labels = ref<GitHubLabel[]>([])
  const milestones = ref<GitHubMilestone[]>([])
  const members = ref<GitHubUser[]>([])
  const repos = ref<GitHubRepository[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetchedAt = ref<string | null>(null)
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const filters = ref<IssueFilters>({
    state: 'open',
    label: '',
    milestone: '',
    assignee: '',
    priority: '',
    repo: '',
  })

  // ──────────────────────────────────────────────────────────
  // Computed – filtered issues
  // ──────────────────────────────────────────────────────────

  const filteredIssues = computed(() => {
    return issues.value.filter((issue) => {
      // Exclude pull requests
      if (issue.pull_request) return false

      // State
      if (filters.value.state !== 'all' && issue.state !== filters.value.state) return false

      // Repository
      if (filters.value.repo && issue.repository?.name !== filters.value.repo) return false

      // Label
      if (filters.value.label) {
        const hasLabel = issue.labels.some((l) => l.name === filters.value.label)
        if (!hasLabel) return false
      }

      // Milestone
      if (filters.value.milestone && issue.milestone?.title !== filters.value.milestone) return false

      // Assignee
      if (filters.value.assignee) {
        const hasAssignee = issue.assignees.some((a) => a.login === filters.value.assignee)
        if (!hasAssignee) return false
      }

      // Priority (matches label name containing priority keyword)
      if (filters.value.priority) {
        const hasPriority = issue.labels.some(
          (l) => l.name.toLowerCase().includes(filters.value.priority.toLowerCase()),
        )
        if (!hasPriority) return false
      }

      return true
    })
  })

  const priorityLabels = computed(() =>
    labels.value.filter((l) =>
      PRIORITY_LABELS.some((p) => l.name.toLowerCase().includes(p.split(':')[1].trim())),
    ),
  )

  const openCount = computed(() => issues.value.filter((i) => !i.pull_request && i.state === 'open').length)
  const closedCount = computed(() => issues.value.filter((i) => !i.pull_request && i.state === 'closed').length)

  // ──────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────

  async function fetchAll(token: string) {
    loading.value = true
    error.value = null
    try {
      const [fetchedIssues, fetchedLabels, fetchedMilestones, fetchedMembers, fetchedRepos] =
        await Promise.all([
          getOrgIssues(token, 'all'),
          getOrgLabels(token),
          getOrgMilestones(token),
          getOrgMembers(token),
          getOrgRepos(token),
        ])
      issues.value = fetchedIssues
      labels.value = fetchedLabels
      milestones.value = fetchedMilestones
      members.value = fetchedMembers
      repos.value = fetchedRepos
      lastFetchedAt.value = new Date().toISOString()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Fehler beim Laden der Issues.'
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    const auth = useAuthStore()
    if (!auth.token) return
    try {
      // Only fetch issues that changed since last fetch for efficiency
      const since = lastFetchedAt.value ?? undefined
      const updatedIssues = await getOrgIssues(auth.token, 'all', since)
      if (updatedIssues.length > 0) {
        // Merge: replace or add updated issues
        const updatedMap = new Map(updatedIssues.map((i) => [i.id, i]))
        const merged = issues.value.map((i) => updatedMap.get(i.id) ?? i)
        // Add new issues not yet in list
        updatedIssues.forEach((i) => {
          if (!merged.find((existing) => existing.id === i.id)) {
            merged.push(i)
          }
        })
        issues.value = merged
        lastFetchedAt.value = new Date().toISOString()
      }
    } catch {
      // Silent refresh failure
    }
  }

  function startAutoRefresh(intervalMs = 60_000) {
    stopAutoRefresh()
    refreshTimer = setInterval(refresh, intervalMs)
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  function setFilter<K extends keyof IssueFilters>(key: K, value: IssueFilters[K]) {
    filters.value[key] = value
  }

  function resetFilters() {
    filters.value = {
      state: 'open',
      label: '',
      milestone: '',
      assignee: '',
      priority: '',
      repo: '',
    }
  }

  return {
    issues,
    labels,
    milestones,
    members,
    repos,
    loading,
    error,
    lastFetchedAt,
    filters,
    filteredIssues,
    priorityLabels,
    openCount,
    closedCount,
    fetchAll,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    setFilter,
    resetFilters,
  }
})
