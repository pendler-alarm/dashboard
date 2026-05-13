import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAuthenticatedUser, startDeviceFlow, pollDeviceToken } from '@/services/github'
import type { GitHubUser, DeviceFlowResponse } from '@/types/github'

// Users allowed to access the dashboard (login names, case-insensitive)
// Configure via VITE_ALLOWED_USERS="user1,user2,user3"
const ALLOWED_USERS: string[] = (import.meta.env.VITE_ALLOWED_USERS || '')
  .split(',')
  .map((u: string) => u.trim().toLowerCase())
  .filter(Boolean)

const TOKEN_KEY = 'gh_token'

export const getAllowedUsers = (): string[] => ALLOWED_USERS

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<GitHubUser | null>(null)
  const isAllowed = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Device flow state
  const deviceFlow = ref<DeviceFlowResponse | null>(null)
  const devicePolling = ref(false)
  let pollTimer: ReturnType<typeof setTimeout> | null = null

  const isAuthenticated = computed(() => !!token.value && isAllowed.value)

  async function initialize() {
    if (!token.value) return
    try {
      loading.value = true
      error.value = null
      user.value = await getAuthenticatedUser(token.value)
      isAllowed.value = checkAllowed(user.value.login)
      if (!isAllowed.value) {
        error.value = `Der Benutzer "${user.value.login}" ist nicht für dieses Dashboard freigegeben.`
        logout()
      }
    } catch {
      error.value = 'Token ungültig oder abgelaufen. Bitte erneut anmelden.'
      logout()
    } finally {
      loading.value = false
    }
  }

  function checkAllowed(login: string): boolean {
    // If no allowed users list is configured, allow any authenticated user
    if (ALLOWED_USERS.length === 0) return true
    return ALLOWED_USERS.includes(login.toLowerCase())
  }

  async function loginWithToken(pat: string) {
    try {
      loading.value = true
      error.value = null
      const githubUser = await getAuthenticatedUser(pat)
      if (!checkAllowed(githubUser.login)) {
        error.value = `Der Benutzer "${githubUser.login}" ist nicht für dieses Dashboard freigegeben.`
        return
      }
      token.value = pat
      user.value = githubUser
      isAllowed.value = true
      localStorage.setItem(TOKEN_KEY, pat)
    } catch {
      error.value = 'Ungültiges Token. Bitte prüfe deinen Personal Access Token.'
    } finally {
      loading.value = false
    }
  }

  async function startOAuthDeviceFlow() {
    try {
      loading.value = true
      error.value = null
      deviceFlow.value = await startDeviceFlow()
      devicePolling.value = true
      scheduleDevicePoll()
    } catch {
      error.value = 'Fehler beim Starten des Login-Flows. Ist die Client-ID konfiguriert?'
    } finally {
      loading.value = false
    }
  }

  function scheduleDevicePoll() {
    if (!deviceFlow.value) return
    const interval = (deviceFlow.value.interval ?? 5) * 1000

    pollTimer = setTimeout(async () => {
      if (!deviceFlow.value || !devicePolling.value) return
      try {
        const result = await pollDeviceToken(deviceFlow.value.device_code)
        if (result.access_token) {
          const githubUser = await getAuthenticatedUser(result.access_token)
          if (!checkAllowed(githubUser.login)) {
            error.value = `Der Benutzer "${githubUser.login}" ist nicht für dieses Dashboard freigegeben.`
            devicePolling.value = false
            deviceFlow.value = null
            return
          }
          token.value = result.access_token
          user.value = githubUser
          isAllowed.value = true
          localStorage.setItem(TOKEN_KEY, result.access_token)
          devicePolling.value = false
          deviceFlow.value = null
        } else if (result.error === 'authorization_pending' || result.error === 'slow_down') {
          scheduleDevicePoll()
        } else {
          error.value = result.error_description || 'Login fehlgeschlagen.'
          devicePolling.value = false
          deviceFlow.value = null
        }
      } catch {
        error.value = 'Fehler beim Überprüfen des Login-Status.'
        devicePolling.value = false
      }
    }, interval)
  }

  function cancelDeviceFlow() {
    if (pollTimer) clearTimeout(pollTimer)
    devicePolling.value = false
    deviceFlow.value = null
  }

  function logout() {
    if (pollTimer) clearTimeout(pollTimer)
    token.value = null
    user.value = null
    isAllowed.value = false
    deviceFlow.value = null
    devicePolling.value = false
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    user,
    isAllowed,
    loading,
    error,
    deviceFlow,
    devicePolling,
    isAuthenticated,
    initialize,
    loginWithToken,
    startOAuthDeviceFlow,
    cancelDeviceFlow,
    logout,
  }
})
