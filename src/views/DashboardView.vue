<template>
  <div class="dashboard-view">
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
      <div class="container-fluid px-4">
        <a class="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          pendler-alarm / Dashboard
        </a>

        <div class="d-flex align-items-center gap-3 ms-auto">
          <!-- Last updated -->
          <span v-if="issuesStore.lastFetchedAt" class="text-muted small d-none d-md-block">
            Aktualisiert: {{ formatDate(issuesStore.lastFetchedAt) }}
          </span>

          <!-- Refresh button -->
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
              :class="{ 'spin': issuesStore.loading }"
            >
              <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/>
            </svg>
          </button>

          <!-- User avatar -->
          <div class="dropdown">
            <button
              class="btn btn-sm btn-outline-light d-flex align-items-center gap-2"
              data-bs-toggle="dropdown"
            >
              <img
                v-if="auth.user?.avatar_url"
                :src="auth.user.avatar_url"
                :alt="auth.user.login"
                width="22"
                height="22"
                class="rounded-circle"
              />
              <span class="d-none d-sm-inline">{{ auth.user?.login }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><h6 class="dropdown-header">{{ auth.user?.name || auth.user?.login }}</h6></li>
              <li><hr class="dropdown-divider" /></li>
              <li>
                <button class="dropdown-item text-danger" @click="logout">
                  Abmelden
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="container-fluid px-4 py-4">
      <!-- Stats row -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3">
            <div class="display-6 fw-bold text-success">{{ issuesStore.openCount }}</div>
            <div class="text-muted small">Offen</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3">
            <div class="display-6 fw-bold text-secondary">{{ issuesStore.closedCount }}</div>
            <div class="text-muted small">Geschlossen</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3">
            <div class="display-6 fw-bold text-primary">{{ issuesStore.filteredIssues.length }}</div>
            <div class="text-muted small">Gefiltert</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card border-0 shadow-sm text-center py-3">
            <div class="display-6 fw-bold text-info">{{ issuesStore.repos.length }}</div>
            <div class="text-muted small">Repositories</div>
          </div>
        </div>
      </div>

      <!-- Filter bar -->
      <FilterBar
        :filters="issuesStore.filters"
        :labels="issuesStore.labels"
        :milestones="issuesStore.milestones"
        :members="issuesStore.members"
        :repos="issuesStore.repos"
        @update="issuesStore.setFilter"
        @reset="issuesStore.resetFilters"
      />

      <!-- Error -->
      <div v-if="issuesStore.error" class="alert alert-danger">
        {{ issuesStore.error }}
      </div>

      <!-- Loading skeleton -->
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

      <!-- Issue grid -->
      <template v-else>
        <div v-if="issuesStore.filteredIssues.length === 0" class="text-center py-5 text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 16 16" fill="currentColor" class="mb-3 opacity-50">
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            <path d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>
          </svg>
          <p class="mb-0">Keine Issues gefunden.</p>
        </div>
        <div v-else class="row g-3">
          <div
            v-for="issue in issuesStore.filteredIssues"
            :key="issue.id"
            class="col-12 col-md-6 col-xl-4"
          >
            <IssueCard :issue="issue" />
          </div>
        </div>

        <!-- Results count -->
        <div v-if="issuesStore.filteredIssues.length > 0" class="mt-4 text-center text-muted small">
          {{ issuesStore.filteredIssues.length }} Issue{{ issuesStore.filteredIssues.length !== 1 ? 's' : '' }} angezeigt
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useIssuesStore } from '@/stores/issues'
import FilterBar from '@/components/FilterBar.vue'
import IssueCard from '@/components/IssueCard.vue'

const auth = useAuthStore()
const issuesStore = useIssuesStore()
const router = useRouter()

onMounted(async () => {
  if (auth.token) {
    await issuesStore.fetchAll(auth.token)
    issuesStore.startAutoRefresh(60_000)
  }
})

onUnmounted(() => {
  issuesStore.stopAutoRefresh()
})

async function manualRefresh() {
  if (auth.token) {
    await issuesStore.fetchAll(auth.token)
  }
}

async function logout() {
  issuesStore.stopAutoRefresh()
  auth.logout()
  router.push({ name: 'login' })
}

function formatDate(iso: string): string {
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
.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
