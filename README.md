# Dependabot Auto-Merge

A GitHub Action that automatically approves and merges Dependabot PRs based on configurable rules.

## Usage

```yaml
name: Dependabot Auto-Merge

on: pull_request_target

jobs:
  auto-merge:
    if: github.actor == 'dependabot[bot]'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: write
    steps:
      - uses: your-org/dependabot-auto-merge@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          config: |
            [
              { "update-type": "semver-minor" },
              { "dependency-name": "aws-sdk", "update-type": "semver-patch" }
            ]
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `config` | Yes | | JSON array of merge rules |
| `github-token` | Yes | | GitHub token with pull-request write permissions |
| `merge-method` | No | `squash` | Merge method: `squash`, `merge`, or `rebase` |

## Config rules

Rules are evaluated in order. Later rules override earlier ones for the same dependency. Each rule can have these fields:

| Field | Description |
|-------|-------------|
| `update-type` | Maximum update level to allow: `semver-patch`, `semver-minor`, or `semver-major` |
| `dependency-name` | Match a specific dependency. Omit to match all. |
| `package-ecosystem` | Match a specific ecosystem (e.g. `npm_and_yarn`, `bundler`). Omit to match all. |

### Examples

Allow all patch and minor updates:

```json
[{ "update-type": "semver-minor" }]
```

Allow minor updates for everything, but only patches for a specific dependency:

```json
[
  { "update-type": "semver-minor" },
  { "dependency-name": "rails", "update-type": "semver-patch" }
]
```

Only auto-merge npm dependencies:

```json
[{ "package-ecosystem": "npm", "update-type": "semver-minor" }]
```

## How it works

1. Fetches Dependabot metadata (dependency name, ecosystem, update type)
2. Evaluates your config rules to decide if the PR should be merged
3. If approved, reviews the PR and enables auto-merge

The PR will only actually merge once all branch protection requirements (CI checks, reviews, etc.) are satisfied.
