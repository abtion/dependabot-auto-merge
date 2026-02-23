# Dependabot Auto-Merge

A GitHub Action that automatically approves and merges Dependabot PRs based on configurable rules.

## Usage

```yaml
name: Dependabot Auto-Merge

on:
  pull_request_target:

permissions:
  pull-requests: write
  contents: write

jobs:
  dependabot:
    if: github.event.pull_request.user.login == 'dependabot[bot]'
    runs-on: ubuntu-22.04
    steps:
      - uses: abtion/dependabot-auto-merge@v1.1.0
        with:
          config: >-
            [
              { "update-type": "semver-minor" },
            ]
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `config` | Yes | | JSON* array of merge rules |
| `github-token` | Yes | | GitHub token with pull-request write permissions |
| `merge-method` | No | `squash` | Merge method: `squash`, `merge`, or `rebase` |

### * With basic support for trailing commas

The action has a simple regex in place to remove trailing commas from the configuration.

It's recommended to use trailing commas for rule lines as it prevents potential syntax errors.

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
[
  { "update-type": "semver-minor" },
]
```

Allow minor updates for everything, but only patches for a specific dependency:

```json
[
  { "update-type": "semver-minor" },
  { "dependency-name": "rails", "update-type": "semver-patch" },
]
```

Only auto-merge npm dependencies:

```json
[
  { "package-ecosystem": "npm", "update-type": "semver-minor" },
]
```

## How it works

1. Fetches Dependabot metadata (dependency name, ecosystem, update type)
2. Evaluates your config rules to decide if the PR should be merged
3. If approved, reviews the PR and enables auto-merge

The PR will only actually merge once all branch protection requirements (CI checks, reviews, etc.) are satisfied.
