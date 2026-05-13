<template>
  <div class="docs-view">
    <AppHeader :user="auth.user" :theme="theme" @logout="logout" @toggle-theme="toggleTheme">
      <template #meta>
        <span class="badge text-bg-light d-none d-md-inline-flex">Repo: DOKU</span>
        <button
          class="btn btn-sm btn-outline-light"
          :disabled="loadingList || loadingDocument"
          @click="refreshDocs"
        >
          Aktualisieren
        </button>
      </template>
    </AppHeader>

    <main class="container-fluid px-4 py-4">
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div class="row g-4">
        <div class="col-12 col-xl-3">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 class="h5 mb-1">Doku-Dateien</h2>
                  <p class="text-muted small mb-0">{{ files.length }} Markdown-Dateien</p>
                </div>
              </div>

              <div v-if="loadingList" class="placeholder-glow">
                <span class="placeholder col-11 mb-2 d-block" />
                <span class="placeholder col-9 mb-2 d-block" />
                <span class="placeholder col-10 mb-2 d-block" />
              </div>

              <div v-else-if="files.length === 0" class="text-muted small">
                Keine Markdown-Dateien gefunden.
              </div>

              <div v-else class="docs-tree d-grid gap-2">
                <button
                  v-for="file in files"
                  :key="file.path"
                  type="button"
                  class="btn text-start docs-tree-item"
                  :class="file.path === currentPath ? 'btn-dark' : 'btn-outline-secondary'"
                  :style="{ '--depth': pathDepth(file.path) }"
                  @click="selectPath(file.path)"
                >
                  <span class="d-block small docs-tree-folder">{{ folderLabel(file.path) }}</span>
                  <span class="d-block fw-semibold">{{ file.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-xl-9">
          <div class="card border-0 shadow-sm">
            <div class="card-body p-4">
              <div v-if="loadingDocument" class="placeholder-glow">
                <span class="placeholder col-7 mb-3 d-block" />
                <span class="placeholder col-12 mb-2 d-block" />
                <span class="placeholder col-10 mb-2 d-block" />
                <span class="placeholder col-11 mb-2 d-block" />
                <span class="placeholder col-8 mb-2 d-block" />
              </div>

              <div v-else-if="currentDocument" class="docs-content">
                <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-4">
                  <div>
                    <p class="text-muted small mb-1">{{ currentDocument.path }}</p>
                    <h1 class="h3 mb-0">{{ currentDocument.name }}</h1>
                  </div>

                  <div class="d-flex gap-2 flex-wrap">
                    <a
                      :href="currentDocument.html_url"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-sm btn-outline-primary"
                    >
                      Auf GitHub öffnen
                    </a>
                    <a
                      :href="currentDocument.edit_url"
                      target="_blank"
                      rel="noopener"
                      class="btn btn-sm btn-primary"
                    >
                      Bearbeiten
                    </a>
                  </div>
                </div>

                <article class="markdown-body" v-html="renderedHtml" />
              </div>

              <div v-else class="text-muted">
                Wähle links eine Markdown-Datei aus.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/stores/auth'
import type { GitHubMarkdownDocument, GitHubMarkdownFile } from '@/types/github'
import { getDocsMarkdownDocument, getDocsMarkdownFiles } from '@/services/github'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const files = ref<GitHubMarkdownFile[]>([])
const currentDocument = ref<GitHubMarkdownDocument | null>(null)
const error = ref<string | null>(null)
const loadingList = ref(false)
const loadingDocument = ref(false)
const THEME_KEY = 'dashboard_theme'
const theme = ref<'light' | 'dark'>(
  localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light',
)

const currentPath = computed(() => {
  const path = route.query.path
  return typeof path === 'string' ? path : ''
})

const applyTheme = (): void => {
  document.documentElement.setAttribute('data-theme', theme.value)
}

const toggleTheme = (): void => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem(THEME_KEY, theme.value)
  applyTheme()
}

const resolveInternalDocPath = (href: string): string | null => {
  if (!currentDocument.value || !href || href.startsWith('#')) return null

  if (href.startsWith('http://') || href.startsWith('https://')) {
    const docsBlobMatch = href.match(/github\.com\/pendler-alarm\/pendler-alarm\.docs\/blob\/[^/]+\/(.+?\.md)(#.*)?$/)
    return docsBlobMatch?.[1] ?? null
  }

  const baseParts = currentDocument.value.path.split('/')
  baseParts.pop()

  const sanitizedHref = href.split('#')[0]
  const nextParts = sanitizedHref.split('/').filter((part) => part !== '.')

  nextParts.forEach((part) => {
    if (part === '..') {
      baseParts.pop()
      return
    }

    baseParts.push(part)
  })

  const nextPath = baseParts.join('/')
  return nextPath.toLowerCase().endsWith('.md') ? nextPath : null
}

const renderedHtml = computed(() => {
  if (!currentDocument.value) return ''

  const parser = new DOMParser()
  const parsed = parser.parseFromString(currentDocument.value.html, 'text/html')

  parsed.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href') ?? ''
    const internalPath = resolveInternalDocPath(href)
    const anchor = href.includes('#') ? `#${href.split('#')[1]}` : ''

    if (internalPath) {
      link.setAttribute('href', `/docs?path=${encodeURIComponent(internalPath)}${anchor}`)
      link.removeAttribute('target')
      link.removeAttribute('rel')
      return
    }

    if (href.startsWith('#')) return

    link.setAttribute('target', '_blank')
    link.setAttribute('rel', 'noopener noreferrer')
  })

  return parsed.body.innerHTML
})

const loadFiles = async (): Promise<void> => {
  if (!auth.token) return

  loadingList.value = true
  error.value = null

  try {
    files.value = await getDocsMarkdownFiles(auth.token)

    if (!currentPath.value && files.value.length > 0) {
      await router.replace({ name: 'docs', query: { path: files.value[0].path } })
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Doku-Dateien konnten nicht geladen werden.'
  } finally {
    loadingList.value = false
  }
}

const loadDocument = async (path: string): Promise<void> => {
  if (!auth.token || !path) {
    currentDocument.value = null
    return
  }

  loadingDocument.value = true
  error.value = null

  try {
    currentDocument.value = await getDocsMarkdownDocument(auth.token, path)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Dokument konnte nicht geladen werden.'
    currentDocument.value = null
  } finally {
    loadingDocument.value = false
  }
}

const selectPath = async (path: string): Promise<void> => {
  await router.push({ name: 'docs', query: { path } })
}

const refreshDocs = async (): Promise<void> => {
  await loadFiles()

  if (currentPath.value) {
    await loadDocument(currentPath.value)
  }
}

const logout = async (): Promise<void> => {
  auth.logout()
  await router.push({ name: 'login' })
}

const pathDepth = (path: string): number => Math.max(path.split('/').length - 1, 0)

const folderLabel = (path: string): string => {
  const parts = path.split('/')
  parts.pop()
  return parts.length > 0 ? parts.join(' / ') : 'Root'
}

onMounted(() => {
  applyTheme()
  void loadFiles()
})

watch(currentPath, (path) => {
  void loadDocument(path)
}, { immediate: true })
</script>

<style scoped>
.docs-tree-item {
  padding-left: calc(0.75rem + (var(--depth) * 0.8rem));
}

.docs-tree-folder {
  opacity: 0.75;
}

.markdown-body {
  line-height: 1.7;
  color: var(--text-primary);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(pre),
.markdown-body :deep(blockquote),
.markdown-body :deep(table) {
  margin-bottom: 1rem;
}

.markdown-body :deep(pre) {
  background: #111827;
  color: #f8fafc;
  padding: 1rem;
  border-radius: 0.75rem;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  background: #eef2f7;
  padding: 0.1rem 0.35rem;
  border-radius: 0.35rem;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #adb5bd;
  padding-left: 1rem;
  color: #495057;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
}

.markdown-body :deep(table) {
  width: 100%;
  display: block;
  overflow-x: auto;
}
</style>
