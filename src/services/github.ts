import type {
  GitHubUser,
  GitHubIssue,
  GitHubLabel,
  GitHubMilestone,
  GitHubRepository,
  GitHubMarkdownFile,
  GitHubMarkdownDocument,
  DeviceFlowResponse,
  TokenResponse,
} from '@/types/github'

const GITHUB_API = 'https://api.github.com'
const ORG = 'pendler-alarm'
const DOCS_REPO = 'DOKU'

// GitHub OAuth App Client ID (set via env variable VITE_GITHUB_CLIENT_ID)
const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || ''

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

const parseRepoBlacklist = (value: string | undefined): Set<string> => {
  if (!value) return new Set()

  return new Set(
    value
      .split(',')
      .map((repo) => repo.trim())
      .filter(Boolean),
  )
}

const REPO_BLACKLIST = parseRepoBlacklist(import.meta.env.VITE_REPO_BLACKLIST)

const isRepoBlacklisted = (repoName: string): boolean => REPO_BLACKLIST.has(repoName)

const filterRepos = (repos: GitHubRepository[]): GitHubRepository[] =>
  repos.filter((repo) => !isRepoBlacklisted(repo.name))

const getRepoNameFromUrl = (repositoryUrl: string): string | null => {
  const match = repositoryUrl.match(/repos\/.+\/([^/]+)$/)
  return match?.[1] ?? null
}

const enrichIssueRepository = (issue: GitHubIssue): GitHubIssue => {
  if (issue.repository) return issue

  const match = issue.repository_url.match(/repos\/(.+)\/(.+)$/)
  if (!match) return issue

  issue.repository = {
    id: 0,
    name: match[2],
    full_name: `${match[1]}/${match[2]}`,
    html_url: `https://github.com/${match[1]}/${match[2]}`,
    private: false,
  }

  return issue
}

const filterIssues = (issues: GitHubIssue[]): GitHubIssue[] =>
  issues
    .map(enrichIssueRepository)
    .filter((issue) => {
      const repoName = issue.repository?.name ?? getRepoNameFromUrl(issue.repository_url)
      return repoName ? !isRepoBlacklisted(repoName) : true
    })

const decodeBase64Utf8 = (value: string): string => {
  const binary = atob(value.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

type GitHubRepoMetadata = {
  default_branch: string
  html_url: string
}

type GitHubTreeResponse = {
  tree: Array<{
    path: string
    type: 'blob' | 'tree'
  }>
}

type GitHubContentResponse = {
  name: string
  path: string
  content: string
  html_url: string
  download_url: string
}

const fetchGitHubJson = async <T>(url: string, token: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    throw new Error(`GitHub request failed: ${res.status}`)
  }

  return res.json()
}

const getRepoMetadata = async (token: string, repoName: string): Promise<GitHubRepoMetadata> =>
  fetchGitHubJson<GitHubRepoMetadata>(`${GITHUB_API}/repos/${ORG}/${repoName}`, token)

// ──────────────────────────────────────────────────────────
// Device Flow
// ──────────────────────────────────────────────────────────

export async function startDeviceFlow(): Promise<DeviceFlowResponse> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    scope: 'read:org repo',
  })
  const res = await fetch(`https://github.com/login/device/code?${params}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to start device flow')
  return res.json()
}

// The interval parameter is part of the OAuth device flow specification
// (RFC 8628) but the actual delay is managed by the caller via setTimeout.
export async function pollDeviceToken(deviceCode: string): Promise<TokenResponse> {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  })
  const res = await fetch(`https://github.com/login/oauth/access_token?${params}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  return res.json()
}

// ──────────────────────────────────────────────────────────
// User
// ──────────────────────────────────────────────────────────

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const res = await fetch(`${GITHUB_API}/user`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

// ──────────────────────────────────────────────────────────
// Organisation repositories
// ──────────────────────────────────────────────────────────

export async function getOrgRepos(token: string): Promise<GitHubRepository[]> {
  const allRepos: GitHubRepository[] = []
  let page = 1
  while (true) {
    const res = await fetch(
      `${GITHUB_API}/orgs/${ORG}/repos?type=all&per_page=100&page=${page}`,
      { headers: authHeaders(token) },
    )
    if (!res.ok) break
    const data: GitHubRepository[] = await res.json()
    allRepos.push(...data)
    if (data.length < 100) break
    page++
  }
  return filterRepos(allRepos)
}

// ──────────────────────────────────────────────────────────
// Issues
// ──────────────────────────────────────────────────────────

export async function getOrgIssues(
  token: string,
  state: 'open' | 'closed' | 'all' = 'open',
  since?: string,
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = []
  let page = 1
  while (true) {
    const params: Record<string, string> = {
      state,
      per_page: '100',
      page: String(page),
      filter: 'all',
    }
    if (since) params.since = since

    const res = await fetch(
      `${GITHUB_API}/orgs/${ORG}/issues?${new URLSearchParams(params)}`,
      { headers: authHeaders(token) },
    )
    if (!res.ok) break
    const data: GitHubIssue[] = await res.json()

    issues.push(...filterIssues(data))
    if (data.length < 100) break
    page++
  }
  return issues
}

// ──────────────────────────────────────────────────────────
// Labels, milestones, members (for filter dropdowns)
// ──────────────────────────────────────────────────────────

export async function getOrgLabels(token: string): Promise<GitHubLabel[]> {
  const repos = await getOrgRepos(token)
  const labelsMap = new Map<string, GitHubLabel>()

  await Promise.all(
    repos.map(async (repo) => {
      let page = 1
      while (true) {
        const res = await fetch(
          `${GITHUB_API}/repos/${ORG}/${repo.name}/labels?per_page=100&page=${page}`,
          { headers: authHeaders(token) },
        )
        if (!res.ok) break
        const data: GitHubLabel[] = await res.json()
        data.forEach((l) => labelsMap.set(l.name, l))
        if (data.length < 100) break
        page++
      }
    }),
  )
  return Array.from(labelsMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getOrgMilestones(token: string): Promise<GitHubMilestone[]> {
  const repos = await getOrgRepos(token)
  const milestonesMap = new Map<string, GitHubMilestone>()

  await Promise.all(
    repos.map(async (repo) => {
      let page = 1
      while (true) {
        const res = await fetch(
          `${GITHUB_API}/repos/${ORG}/${repo.name}/milestones?state=all&per_page=100&page=${page}`,
          { headers: authHeaders(token) },
        )
        if (!res.ok) break
        const data: GitHubMilestone[] = await res.json()
        data.forEach((m) => milestonesMap.set(m.title, m))
        if (data.length < 100) break
        page++
      }
    }),
  )
  return Array.from(milestonesMap.values()).sort((a, b) => a.title.localeCompare(b.title))
}

export async function getOrgMembers(token: string): Promise<GitHubUser[]> {
  const members: GitHubUser[] = []
  let page = 1
  while (true) {
    const res = await fetch(
      `${GITHUB_API}/orgs/${ORG}/members?per_page=100&page=${page}`,
      { headers: authHeaders(token) },
    )
    if (!res.ok) break
    const data: GitHubUser[] = await res.json()
    members.push(...data)
    if (data.length < 100) break
    page++
  }
  return members
}

export async function getDocsMarkdownFiles(token: string): Promise<GitHubMarkdownFile[]> {
  const repo = await getRepoMetadata(token, DOCS_REPO)
  const tree = await fetchGitHubJson<GitHubTreeResponse>(
    `${GITHUB_API}/repos/${ORG}/${DOCS_REPO}/git/trees/${repo.default_branch}?recursive=1`,
    token,
  )

  return tree.tree
    .filter((entry) => entry.type === 'blob' && entry.path.toLowerCase().endsWith('.md'))
    .map((entry) => ({
      name: entry.path.split('/').at(-1) ?? entry.path,
      path: entry.path,
      html_url: `${repo.html_url}/blob/${repo.default_branch}/${entry.path}`,
      download_url: `https://raw.githubusercontent.com/${ORG}/${DOCS_REPO}/${repo.default_branch}/${entry.path}`,
    }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

export async function getDocsMarkdownDocument(
  token: string,
  path: string,
): Promise<GitHubMarkdownDocument> {
  const repo = await getRepoMetadata(token, DOCS_REPO)
  const encodedPath = path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')

  const content = await fetchGitHubJson<GitHubContentResponse>(
    `${GITHUB_API}/repos/${ORG}/${DOCS_REPO}/contents/${encodedPath}?ref=${repo.default_branch}`,
    token,
  )

  const markdown = decodeBase64Utf8(content.content)
  let html = ''

  try {
    const res = await fetch(`${GITHUB_API}/markdown`, {
      method: 'POST',
      headers: {
        ...authHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: markdown,
        mode: 'gfm',
        context: `${ORG}/${DOCS_REPO}`,
      }),
    })

    if (!res.ok) {
      throw new Error(`Markdown render failed: ${res.status}`)
    }

    html = await res.text()
  } catch {
    html = `<pre>${escapeHtml(markdown)}</pre>`
  }

  return {
    path: content.path,
    name: content.name,
    markdown,
    html,
    html_url: content.html_url,
    edit_url: `${repo.html_url}/edit/${repo.default_branch}/${content.path}`,
  }
}
