<template>
  <div class="login-view d-flex align-items-center justify-content-center min-vh-100 bg-dark">
    <div class="card shadow-lg border-0" style="max-width: 480px; width: 100%">
      <div class="card-body p-5">
        <!-- Logo / Header -->
        <div class="text-center mb-4">
          <div class="mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="currentColor" class="text-primary">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </div>
          <h2 class="fw-bold text-dark mb-1">pendler-alarm</h2>
          <p class="text-muted">Dashboard – bitte anmelden</p>
        </div>

        <!-- Error alert -->
        <div v-if="auth.error" class="alert alert-danger alert-dismissible" role="alert">
          {{ auth.error }}
          <button type="button" class="btn-close" @click="auth.error = null" />
        </div>

        <!-- PAT Login -->
        <div v-if="!showDeviceFlow">
          <form @submit.prevent="loginWithPAT">
            <div class="mb-3">
              <label for="pat" class="form-label fw-semibold">Personal Access Token</label>
              <input
                id="pat"
                v-model="pat"
                type="password"
                class="form-control"
                placeholder="ghp_..."
                autocomplete="current-password"
                required
              />
              <div class="form-text">
                Erstelle einen Token unter
                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener">
                  GitHub Settings → Tokens
                </a>
                (Scopes: <code>repo</code>, <code>read:org</code>)
              </div>
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="auth.loading">
              <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2" role="status" />
              Anmelden
            </button>
          </form>

          <div v-if="hasClientId" class="mt-3 text-center">
            <button class="btn btn-outline-secondary btn-sm" @click="startDeviceFlow">
              Stattdessen mit GitHub-OAuth anmelden
            </button>
          </div>
        </div>

        <!-- Device Flow -->
        <div v-else>
          <div v-if="auth.deviceFlow" class="text-center">
            <p class="mb-2">Öffne diese URL in deinem Browser:</p>
            <a
              :href="auth.deviceFlow.verification_uri"
              target="_blank"
              rel="noopener"
              class="btn btn-outline-dark mb-3"
            >
              {{ auth.deviceFlow.verification_uri }}
            </a>
            <p class="mb-1">Und gib den folgenden Code ein:</p>
            <div class="display-6 fw-bold letter-spacing-wide bg-light rounded p-3 mb-3">
              {{ auth.deviceFlow.user_code }}
            </div>
            <div class="d-flex align-items-center justify-content-center gap-2 text-muted small">
              <span class="spinner-border spinner-border-sm" role="status" />
              Warte auf Bestätigung…
            </div>
            <button class="btn btn-link text-muted mt-3" @click="cancelDeviceFlow">Abbrechen</button>
          </div>
          <div v-else>
            <button class="btn btn-primary w-100" :disabled="auth.loading" @click="startDeviceFlow">
              <span v-if="auth.loading" class="spinner-border spinner-border-sm me-2" role="status" />
              Mit GitHub-OAuth anmelden
            </button>
            <button class="btn btn-link text-muted mt-2 d-block mx-auto" @click="showDeviceFlow = false">
              Zurück zum Token-Login
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const pat = ref('')
const showDeviceFlow = ref(false)
const hasClientId = !!import.meta.env.VITE_GITHUB_CLIENT_ID

async function loginWithPAT() {
  await auth.loginWithToken(pat.value)
  if (auth.isAuthenticated) {
    router.push({ name: 'dashboard' })
  }
}

async function startDeviceFlow() {
  showDeviceFlow.value = true
  await auth.startOAuthDeviceFlow()
}

function cancelDeviceFlow() {
  auth.cancelDeviceFlow()
  showDeviceFlow.value = false
}
</script>

<style scoped>
.letter-spacing-wide {
  letter-spacing: 0.25em;
}
</style>
