<template>
  <div class="dashboard-view">
    <AppHeader :user="auth.user" :theme="theme" @logout="logout" @toggle-theme="toggleTheme">
      <template #meta>
        <span v-if="issuesStore.lastFetchedAt" class="text-muted small d-none d-md-block">
          Aktualisiert: {{ formatDate(issuesStore.lastFetchedAt) }}
        </span>

        <button
          class="btn btn-sm btn-outline-light"
          :disabled="issuesStore.loading"
          title="Manuell aktualisieren"
          @click="manualRefresh"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="currentColor"
            :class="{ spin: issuesStore.loading }"
          >
            <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/>
          </svg>
        </button>
      </template>
    </AppHeader>

    <main class="container-fluid px-4 py-4">
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3 status-panel status-panel-open">
            <div class="display-6 fw-bold">{{ issuesStore.openCount }}</div>
            <div class="small">Offen</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3 status-panel status-panel-closed">
            <div class="display-6 fw-bold">{{ issuesStore.closedCount }}</div>
            <div class="small">Geschlossen</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3 status-panel status-panel-filtered">
            <div class="display-6 fw-bold">{{ issuesStore.filteredIssues.length }}</div>
            <div class="small">Gefiltert</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3 status-panel status-panel-repos">
            <div class="display-6 fw-bold">{{ issuesStore.repos.length }}</div>
            <div class="small">Repositories</div>
          </div>
        </div>
      </div>

      <div class="d-flex justify-content-end mb-3">
        <div class="d-flex flex-wrap justify-content-end gap-2">
          <div class="btn-group shadow-sm" role="group" aria-label="Farbdarstellung wechseln">
            <button
              class="btn btn-sm"
              :class="issueColorMode === 'soft' ? 'btn-dark' : 'btn-outline-dark'"
              @click="setIssueColorMode('soft')"
            >
              Standardfarben
            </button>
            <button
              class="btn btn-sm"
              :class="issueColorMode === 'solid' ? 'btn-dark' : 'btn-outline-dark'"
              @click="setIssueColorMode('solid')"
            >
              Volltonfarben
            </button>
          </div>

          <div class="btn-group shadow-sm" role="group" aria-label="Ansicht wechseln">
            <button
              class="btn btn-sm"
              :class="viewMode === 'cards' ? 'btn-dark' : 'btn-outline-dark'"
              @click="viewMode = 'cards'"
            >
              Karten
            </button>
            <button
              class="btn btn-sm"
              :class="viewMode === 'list' ? 'btn-dark' : 'btn-outline-dark'"
              @click="viewMode = 'list'"
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      <FilterBar
        :filters="issuesStore.filters"
        :labels="issuesStore.labels"
        :milestones="issuesStore.milestones"
        :members="filteredMembers"
        :repos="issuesStore.repos"
        @update="issuesStore.setFilter"
        @reset="issuesStore.resetFilters"
      />

      <div v-if="issuesStore.error" class="alert alert-danger">
        {{ issuesStore.error }}
      </div>

      <div v-if="issuesStore.loading && issuesStore.issues.length === 0" class="row g-3">
        <div v-for="n in 6" :key="n" class="col-12 col-md-6 col-xl-4">
          <div class="card border-0 shadow-sm p-3">
            <div class="placeholder-glow">
              <span class="placeholder col-9 mb-2 d-block" />
              <span class="placeholder col-5 mb-3 d-block" />
              <span class="placeholder col-3 mb-1 d-block" />
              <span class="placeholder col-7 d-block" />
            </div>
          </div>
        </div>
      </div>

      <template v-else>
        <div v-if="issuesStore.filteredIssues.length === 0" class="text-center py-5 text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16" fill="currentColor" class="mb-3 opacity-50">
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
          </svg>
          <p class="mb-0">Keine Issues gefunden.</p>
        </div>

        <div v-else-if="viewMode === 'cards'" class="row g-3">
          <div
            v-for="issue in issuesStore.filteredIssues"
            :key="issue.id"
            class="col-12 col-md-6 col-xl-4"
          >
            <IssueCard :issue="issue" :color-mode="issueColorMode" />
          </div>
        </div>

        <IssueList v-else :issues="issuesStore.filteredIssues" :color-mode="issueColorMode" />

        <div v-if="issuesStore.filteredIssues.length > 0" class="mt-4 text-center text-muted small">
          {{ issuesStore.filteredIssues.length }} Issue{{ issuesStore.filteredIssues.length !== 1 ? 's' : '' }} angezeigt
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import FilterBar from '@/components/FilterBar.vue'
import IssueCard from '@/components/IssueCard.vue'
import IssueList from '@/components/IssueList.vue'
import { getAllowedUsers, useAuthStore } from '@/stores/auth'
import { useIssuesStore } from '@/stores/issues'

const auth = useAuthStore()
const issuesStore = useIssuesStore()
const router = useRouter()
const viewMode = ref<'cards' | 'list'>('cards')
const THEME_KEY = 'dashboard_theme'
const ISSUE_COLOR_MODE_KEY = 'dashboard_issue_color_mode'
const theme = ref<'light' | 'dark'>(
  localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light',
)
const issueColorMode = ref<'soft' | 'solid'>(
  localStorage.getItem(ISSUE_COLOR_MODE_KEY) === 'solid' ? 'solid' : 'soft',
)
const allowedUsers = getAllowedUsers()
const filteredMembers = computed(() => {
  if (allowedUsers.length === 0) return issuesStore.members
  return issuesStore.members.filter((member) => allowedUsers.includes(member.login.toLowerCase()))
})

const applyTheme = (): void => {
  document.documentElement.setAttribute('data-theme', theme.value)
}

const toggleTheme = (): void => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, theme.value)
  applyTheme()
}

const setIssueColorMode = (mode: 'soft' | 'solid'): void => {
  issueColorMode.value = mode
  localStorage.setItem(ISSUE_COLOR_MODE_KEY, mode)
}

onMounted(async () => {
  applyTheme()
  if (auth.token) {
    await issuesStore.fetchAll(auth.token)
    issuesStore.startAutoRefresh(60_000)
  }
})

onUnmounted(() => {
  issuesStore.stopAutoRefresh()
})

const manualRefresh = async (): Promise<void> => {
  if (auth.token) {
    await issuesStore.fetchAll(auth.token)
  }
}

const logout = async (): Promise<void> => {
  issuesStore.stopAutoRefresh()
  auth.logout()
  await router.push({ name: 'login' })
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
.spin {
  animation: spin 0.8s linear infinite;
}

.status-panel {
  color: #fff;
}

.status-panel-open {
  background: #b42318;
}

.status-panel-closed {
  background: #15803d;
}

.status-panel-filtered {
  background: #005f73;
}

.status-panel-repos {
  background: #7c2d12;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
