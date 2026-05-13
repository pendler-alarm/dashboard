export interface GitHubUser {
  login: string
  avatar_url: string
  name: string | null
  html_url: string
}

export interface GitHubLabel {
  id: number
  name: string
  color: string
  description: string | null
}

export interface GitHubMilestone {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  html_url: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  html_url: string
  private: boolean
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  repository_url: string
  repository?: GitHubRepository
  labels: GitHubLabel[]
  milestone: GitHubMilestone | null
  assignees: GitHubUser[]
  user: GitHubUser
  created_at: string
  updated_at: string
  pull_request?: { url: string }
  comments: number
}

export interface IssueFilters {
  state: 'open' | 'closed' | 'all'
  label: string
  milestone: string
  assignee: string
  priority: string
  repo: string
}

export interface DeviceFlowResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

export interface TokenResponse {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}
