<template>
  <div class="card border-0 shadow-sm overflow-hidden issue-list-card">
    <div class="list-group list-group-flush issue-list-group">
      <div
        v-for="issue in issues"
        :key="issue.id"
        class="list-group-item py-3"
        :class="itemClass(issue.state)"
      >
        <div class="d-flex flex-column flex-lg-row gap-3 justify-content-between">
          <div class="flex-grow-1 min-width-0">
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span class="badge" :class="badgeClass(issue.state)">
                {{ issue.state === 'open' ? 'Offen' : 'Geschlossen' }}
              </span>
              <span class="badge issue-list-repo-badge">{{ issue.repository?.name ?? repoName(issue.repository_url) }}</span>
              <span class="text-muted small">#{{ issue.number }}</span>
              <span class="text-muted small">Aktualisiert: {{ formatDate(issue.updated_at) }}</span>
            </div>

            <a
              :href="issue.html_url"
              target="_blank"
              rel="noopener"
              class="fw-semibold text-decoration-none d-inline-block mb-2 issue-list-title"
            >
              {{ issue.title }}
            </a>

            <p v-if="issue.body" class="text-muted small mb-2 issue-list-body">
              {{ excerpt(issue.body) }}
            </p>

            <div v-if="issue.labels.length" class="d-flex flex-wrap gap-1">
              <span
                v-for="label in issue.labels"
                :key="label.id"
                class="badge rounded-pill small"
                :style="{ backgroundColor: `#${label.color}`, color: textColor(label.color) }"
              >
                {{ label.name }}
              </span>
            </div>
          </div>

          <div class="d-flex align-items-start align-items-lg-center gap-2 flex-shrink-0">
            <a
              :href="issue.html_url"
              target="_blank"
              rel="noopener"
              class="btn btn-sm btn-outline-primary"
            >
              Anzeigen
            </a>
            <a
              :href="`${issue.html_url}#partial-timeline`"
              target="_blank"
              rel="noopener"
              class="btn btn-sm btn-outline-secondary"
            >
              Bearbeiten
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GitHubIssue } from '@/types/github'

const props = defineProps<{
  issues: GitHubIssue[]
  colorMode: 'soft' | 'solid'
}>()

const repoName = (repositoryUrl: string): string => {
  const match = repositoryUrl.match(/\/([^/]+)$/)
  return match?.[1] ?? '—'
}

const excerpt = (value: string): string => value.replace(/\s+/g, ' ').trim().slice(0, 220)

const textColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(0, 2), 16)
  const g = parseInt(hexColor.slice(2, 4), 16)
  const b = parseInt(hexColor.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000' : '#fff'
}

const badgeClass = (state: GitHubIssue['state']): string => {
  if (props.colorMode === 'solid') return 'issue-list-status-badge-solid'
  return state === 'open' ? 'bg-danger-subtle text-danger-emphasis' : 'bg-success-subtle text-success-emphasis'
}

const itemClass = (state: GitHubIssue['state']): string => {
  if (props.colorMode !== 'solid') return state === 'open' ? 'issue-list-item-open' : 'issue-list-item-closed'
  return state === 'open' ? 'issue-list-item-open-solid' : 'issue-list-item-closed-solid'
}

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
</script>

<style scoped>
.issue-list-title,
.issue-list-body {
  word-break: break-word;
}

.issue-list-card,
.issue-list-group,
.issue-list-group .list-group-item {
  background: var(--panel-surface);
  color: var(--text-primary);
}

.issue-list-item-open {
  border-inline-start: 4px solid #b42318;
}

.issue-list-item-closed {
  border-inline-start: 4px solid #15803d;
}

.issue-list-repo-badge {
  background: var(--panel-muted);
  color: var(--text-primary);
  border: 1px solid var(--panel-border);
}

.issue-list-status-badge-solid {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.issue-list-item-open-solid {
  background: #b42318 !important;
  color: #fff !important;
}

.issue-list-item-closed-solid {
  background: #15803d !important;
  color: #fff !important;
}

.issue-list-item-open-solid .issue-list-title,
.issue-list-item-closed-solid .issue-list-title,
.issue-list-item-open-solid .btn,
.issue-list-item-closed-solid .btn {
  color: #fff;
}

.issue-list-item-open-solid .issue-list-repo-badge,
.issue-list-item-closed-solid .issue-list-repo-badge {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.issue-list-item-open-solid .text-muted,
.issue-list-item-closed-solid .text-muted,
.issue-list-item-open-solid .issue-list-body,
.issue-list-item-closed-solid .issue-list-body {
  color: rgba(255, 255, 255, 0.82) !important;
}

.issue-list-item-open-solid .btn-outline-primary,
.issue-list-item-open-solid .btn-outline-secondary,
.issue-list-item-closed-solid .btn-outline-primary,
.issue-list-item-closed-solid .btn-outline-secondary {
  border-color: rgba(255, 255, 255, 0.65);
}

.issue-list-item-open-solid .btn-outline-primary:hover,
.issue-list-item-open-solid .btn-outline-secondary:hover,
.issue-list-item-closed-solid .btn-outline-primary:hover,
.issue-list-item-closed-solid .btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: #fff;
  color: #fff;
}

.issue-list-body {
  max-width: 70ch;
}

.min-width-0 {
  min-width: 0;
}
</style>
