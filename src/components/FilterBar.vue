<template>
  <div class="filter-bar card mb-4 border-0 shadow-sm">
    <div class="card-body">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-lg-4">
          <label class="form-label fw-semibold small text-muted mb-1">Suche</label>
          <input
            class="form-control form-control-sm"
            type="search"
            :value="filters.search"
            placeholder="Titel, Beschreibung, Labels, Benutzer ..."
            @input="onFilter('search', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <!-- State -->
        <div class="col-12 col-sm-6 col-md-4 col-lg-2">
          <label class="form-label fw-semibold small text-muted mb-1">Status</label>
          <select class="form-select form-select-sm" :value="filters.state" @change="onFilter('state', ($event.target as HTMLSelectElement).value as IssueFilters['state'])">
            <option value="open">Offen</option>
            <option value="closed">Geschlossen</option>
            <option value="all">Alle</option>
          </select>
        </div>

        <!-- Repository -->
        <div class="col-12 col-sm-6 col-md-4 col-lg-2">
          <label class="form-label fw-semibold small text-muted mb-1">Repository</label>
          <div class="dropdown">
            <button
              class="btn btn-sm filter-dropdown-toggle w-100 text-start d-flex align-items-center justify-content-between"
              type="button"
              data-bs-toggle="dropdown"
              data-bs-auto-close="outside"
            >
              <span class="text-truncate">{{ repoSelectionLabel }}</span>
              <span class="badge text-bg-secondary ms-2">{{ filters.repo.length }}</span>
            </button>
            <div class="dropdown-menu repo-dropdown-menu p-2 shadow-sm w-100">
              <button class="btn btn-link btn-sm p-0 mb-2 text-decoration-none" type="button" @click="clearRepos">
                Auswahl löschen
              </button>
              <div class="d-grid gap-1">
                <label
                  v-for="repo in repos"
                  :key="repo.id"
                  class="dropdown-item-text d-flex align-items-center gap-2 rounded px-2 py-1 repo-option"
                >
                  <input
                    class="form-check-input mt-0"
                    type="checkbox"
                    :checked="filters.repo.includes(repo.name)"
                    @change="toggleRepo(repo.name)"
                  />
                  <span class="small">{{ repo.name }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority -->
        <div class="col-12 col-sm-6 col-md-4 col-lg-2">
          <label class="form-label fw-semibold small text-muted mb-1">Priorität</label>
          <select class="form-select form-select-sm" :value="filters.priority" @change="onFilter('priority', ($event.target as HTMLSelectElement).value)">
            <option value="">Alle</option>
            <option value="critical">🔴 Kritisch</option>
            <option value="high">🟠 Hoch</option>
            <option value="medium">🟡 Mittel</option>
            <option value="low">🟢 Niedrig</option>
          </select>
        </div>

        <!-- Label -->
        <div class="col-12 col-sm-6 col-md-4 col-lg-2">
          <label class="form-label fw-semibold small text-muted mb-1">Label</label>
          <select class="form-select form-select-sm" :value="filters.label" @change="onFilter('label', ($event.target as HTMLSelectElement).value)">
            <option value="">Alle Labels</option>
            <option v-for="label in labels" :key="label.id" :value="label.name">
              {{ label.name }}
            </option>
          </select>
        </div>

        <!-- Milestone -->
        <div class="col-12 col-sm-6 col-md-4 col-lg-2">
          <label class="form-label fw-semibold small text-muted mb-1">Milestone</label>
          <select class="form-select form-select-sm" :value="filters.milestone" @change="onFilter('milestone', ($event.target as HTMLSelectElement).value)">
            <option value="">Alle Milestones</option>
            <option v-for="ms in milestones" :key="ms.id" :value="ms.title">{{ ms.title }}</option>
          </select>
        </div>

        <!-- Assignee -->
        <div class="col-12 col-sm-6 col-md-4 col-lg-2">
          <label class="form-label fw-semibold small text-muted mb-1">Benutzer</label>
          <select class="form-select form-select-sm" :value="filters.assignee" @change="onFilter('assignee', ($event.target as HTMLSelectElement).value)">
            <option value="">Alle</option>
            <option v-for="member in members" :key="member.login" :value="member.login">
              {{ member.login }}
            </option>
          </select>
        </div>
      </div>

      <!-- Active filters / reset -->
      <div v-if="hasActiveFilters" class="mt-3 d-flex align-items-center gap-2 flex-wrap">
        <span class="small text-muted">Aktive Filter:</span>
        <span v-if="filters.state !== 'open'" class="badge bg-secondary">Status: {{ filters.state }}</span>
        <span v-if="filters.search" class="badge bg-secondary">Suche: {{ filters.search }}</span>
        <span v-for="repo in filters.repo" :key="repo" class="badge bg-secondary">Repo: {{ repo }}</span>
        <span v-if="filters.priority" class="badge bg-secondary">Priorität: {{ filters.priority }}</span>
        <span v-if="filters.label" class="badge bg-secondary">Label: {{ filters.label }}</span>
        <span v-if="filters.milestone" class="badge bg-secondary">Milestone: {{ filters.milestone }}</span>
        <span v-if="filters.assignee" class="badge bg-secondary">User: {{ filters.assignee }}</span>
        <button class="btn btn-link btn-sm p-0 text-danger ms-1" @click="emit('reset')">
          Filter zurücksetzen
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IssueFilters, GitHubLabel, GitHubMilestone, GitHubUser, GitHubRepository } from '@/types/github'

const props = defineProps<{
  filters: IssueFilters
  labels: GitHubLabel[]
  milestones: GitHubMilestone[]
  members: GitHubUser[]
  repos: GitHubRepository[]
}>()

const emit = defineEmits<{
  (e: 'update', key: Exclude<keyof IssueFilters, 'repo'>, value: string): void
  (e: 'update', key: 'repo', value: string[]): void
  (e: 'reset'): void
}>()

const onFilter = (key: Exclude<keyof IssueFilters, 'repo'>, value: string): void => {
  emit('update', key, value)
}

const toggleRepo = (repoName: string): void => {
  const nextRepos = props.filters.repo.includes(repoName)
    ? props.filters.repo.filter((repo) => repo !== repoName)
    : [...props.filters.repo, repoName]

  emit('update', 'repo', nextRepos)
}

const clearRepos = (): void => {
  emit('update', 'repo', [])
}

const repoSelectionLabel = computed(() => {
  if (props.filters.repo.length === 0) return 'Alle Repos'
  if (props.filters.repo.length === 1) return props.filters.repo[0]
  return `${props.filters.repo.length} Repositories ausgewählt`
})

const hasActiveFilters = computed(() => {
  return (
    props.filters.state !== 'open' ||
    props.filters.search !== '' ||
    props.filters.repo.length > 0 ||
    props.filters.label !== '' ||
    props.filters.milestone !== '' ||
    props.filters.assignee !== '' ||
    props.filters.priority !== ''
  )
})
</script>

<style scoped>
.filter-dropdown-toggle {
  border: 1px solid var(--panel-border);
  background: var(--panel-surface);
  color: var(--text-primary);
}

.filter-dropdown-toggle:hover,
.filter-dropdown-toggle:focus {
  border-color: var(--accent-color);
  background: var(--panel-surface);
  color: var(--text-primary);
}

.repo-dropdown-menu {
  max-height: 18rem;
  overflow-y: auto;
  background: var(--panel-surface);
  border-color: var(--panel-border);
}

.repo-option {
  color: var(--text-primary);
}

.repo-option:hover {
  background: var(--panel-muted);
}
</style>
