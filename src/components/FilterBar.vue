<template>
  <div class="filter-bar card mb-4 border-0 shadow-sm">
    <div class="card-body">
      <div class="row g-3 align-items-end">
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
          <select class="form-select form-select-sm" :value="filters.repo" @change="onFilter('repo', ($event.target as HTMLSelectElement).value)">
            <option value="">Alle Repos</option>
            <option v-for="repo in repos" :key="repo.id" :value="repo.name">{{ repo.name }}</option>
          </select>
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
        <span v-if="filters.repo" class="badge bg-secondary">Repo: {{ filters.repo }}</span>
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
  (e: 'update', key: keyof IssueFilters, value: string): void
  (e: 'reset'): void
}>()

function onFilter(key: keyof IssueFilters, value: string) {
  emit('update', key, value)
}

const hasActiveFilters = computed(() => {
  return (
    props.filters.state !== 'open' ||
    props.filters.repo !== '' ||
    props.filters.label !== '' ||
    props.filters.milestone !== '' ||
    props.filters.assignee !== '' ||
    props.filters.priority !== ''
  )
})
</script>
