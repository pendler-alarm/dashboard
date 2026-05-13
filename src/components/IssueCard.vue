<template>
  <div class="issue-card card border-0 shadow-sm h-100 transition-shadow" :class="cardClass">
    <!-- Card Header: title + state badge -->
    <div class="card-header bg-transparent border-bottom-0 pb-0 pt-3 px-3">
      <div class="d-flex align-items-start gap-2">
        <!-- State icon -->
        <span class="mt-1 flex-shrink-0">
          <svg v-if="issue.state === 'open'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" :class="iconClass">
            <circle cx="8" cy="8" r="7.5" stroke="currentColor"/>
            <circle cx="8" cy="8" r="3" fill="currentColor"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" :class="iconClass">
            <circle cx="8" cy="8" r="7.5" stroke="currentColor"/>
            <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </span>
        <div class="flex-grow-1 min-width-0">
          <a
            :href="issue.html_url"
            target="_blank"
            rel="noopener"
            class="fw-semibold text-decoration-none issue-title"
          >
            {{ issue.title }}
          </a>
        </div>
      </div>
    </div>

    <div class="card-body pt-2 px-3 pb-2">
      <!-- Repo + issue number -->
      <div class="d-flex align-items-center gap-2 mb-2">
        <span class="badge small repo-badge" :class="{ 'repo-badge-solid': props.colorMode === 'solid' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" class="me-1">
            <path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8z"/>
          </svg>
          {{ issue.repository?.name ?? repoName }}
        </span>
        <span class="text-muted small">#{{ issue.number }}</span>
      </div>

      <!-- Labels -->
      <div v-if="issue.labels.length" class="d-flex flex-wrap gap-1 mb-2">
        <span
          v-for="label in issue.labels"
          :key="label.id"
          class="badge rounded-pill small"
          :style="{ backgroundColor: `#${label.color}`, color: textColor(label.color) }"
        >
          {{ label.name }}
        </span>
      </div>

      <!-- Milestone -->
      <div v-if="issue.milestone" class="d-flex align-items-center gap-1 text-muted small mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.75 0a.75.75 0 01.75.75V3h3.634c.414 0 .814.147 1.13.414l2.07 1.75a1.75 1.75 0 010 2.672l-2.07 1.75a1.75 1.75 0 01-1.13.414H8.5v5.25a.75.75 0 11-1.5 0V10H2.75A1.75 1.75 0 011 8.25v-4.5C1 2.784 1.784 2 2.75 2H7V.75A.75.75 0 017.75 0z"/>
        </svg>
        {{ issue.milestone.title }}
      </div>

      <!-- Assignees -->
      <div v-if="issue.assignees.length" class="d-flex align-items-center gap-1 mb-2">
        <img
          v-for="assignee in issue.assignees"
          :key="assignee.login"
          :src="assignee.avatar_url"
          :alt="assignee.login"
          :title="assignee.login"
          width="20"
          height="20"
          class="rounded-circle border"
        />
      </div>

      <!-- Meta: date + comments -->
      <div class="d-flex align-items-center justify-content-between text-muted small mt-2">
        <span>{{ formatDate(issue.updated_at) }}</span>
        <span v-if="issue.comments">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" class="me-1">
            <path d="M2.75 2.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 01.75.75v2.19l2.72-2.72a.75.75 0 01.53-.22h4.5a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H2.75z"/>
          </svg>
          {{ issue.comments }}
        </span>
      </div>
    </div>

    <!-- Card Footer: action buttons -->
    <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
      <div class="d-flex gap-2">
        <a
          :href="issue.html_url"
          target="_blank"
          rel="noopener"
          class="btn btn-sm btn-outline-primary flex-grow-1"
        >
          Anzeigen
        </a>
        <a
          :href="`${issue.html_url}#partial-timeline`"
          target="_blank"
          rel="noopener"
          class="btn btn-sm btn-outline-secondary"
          title="Status ändern"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064L11.189 6.25z"/>
          </svg>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GitHubIssue } from '@/types/github'

const props = defineProps<{
  issue: GitHubIssue
  colorMode: 'soft' | 'solid'
}>()

const cardClass = computed(() => {
  if (props.colorMode === 'solid') {
    return props.issue.state === 'open' ? 'issue-card-open-solid' : 'issue-card-closed-solid'
  }

  return props.issue.state === 'open' ? 'border-start border-danger border-3' : 'border-start border-success border-3'
})

const iconClass = computed(() => {
  if (props.colorMode === 'solid') return 'text-white'
  return props.issue.state === 'open' ? 'text-danger' : 'text-success'
})

const repoName = computed(() => {
  const match = props.issue.repository_url.match(/\/([^/]+)$/)
  return match ? match[1] : '—'
})

const textColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(0, 2), 16)
  const g = parseInt(hexColor.slice(2, 4), 16)
  const b = parseInt(hexColor.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000' : '#fff'
}

const formatDate = (iso: string): string => {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
</script>

<style scoped>
.issue-card {
  transition: box-shadow 0.15s ease;
  background: var(--panel-surface);
  color: var(--text-primary);
}

.issue-card-open-solid {
  background: #b42318;
  color: #fff;
}

.issue-card-closed-solid {
  background: #15803d;
  color: #fff;
}

.issue-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
}

.issue-title {
  word-break: break-word;
  line-height: 1.4;
  color: var(--text-primary);
}

.issue-card-open-solid .issue-title,
.issue-card-closed-solid .issue-title {
  color: #fff;
}

.repo-badge {
  background: var(--panel-muted);
  color: var(--text-primary);
  border: 1px solid var(--panel-border);
}

.repo-badge-solid {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.issue-card-open-solid .text-muted,
.issue-card-closed-solid .text-muted {
  color: rgba(255, 255, 255, 0.82) !important;
}

.issue-card-open-solid .btn-outline-primary,
.issue-card-open-solid .btn-outline-secondary,
.issue-card-closed-solid .btn-outline-primary,
.issue-card-closed-solid .btn-outline-secondary {
  border-color: rgba(255, 255, 255, 0.65);
  color: #fff;
}

.issue-card-open-solid .btn-outline-primary:hover,
.issue-card-open-solid .btn-outline-secondary:hover,
.issue-card-closed-solid .btn-outline-primary:hover,
.issue-card-closed-solid .btn-outline-secondary:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: #fff;
  color: #fff;
}

.min-width-0 {
  min-width: 0;
}
</style>
