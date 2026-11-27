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

## Authentication

The token you pass as `github-token` approves the PR and merges it. It needs write access to contents and pull requests.

### `GITHUB_TOKEN`

The example above uses `GITHUB_TOKEN`, which needs no setup. GitHub does not start new workflow runs for events caused by `GITHUB_TOKEN`, so a merge made with it does not trigger the `push` workflows on your default branch. If CI or a deploy runs when something lands on `main`, it will not run for these merges.

### GitHub App token (recommended)

A token from a GitHub App does trigger workflows, and it belongs to the organization instead of a person. That makes it a better fit than a personal access token, which stops working when its owner leaves or the token expires.

```yaml
name: Dependabot Auto-Merge

on:
  pull_request_target:

permissions: {}

jobs:
  dependabot:
    if: github.event.pull_request.user.login == 'dependabot[bot]'
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/create-github-app-token@v3
        id: app-token
        with:
          client-id: ${{ vars.DEPS_BOT_APP_CLIENT_ID }}
          private-key: ${{ secrets.DEPS_BOT_APP_PRIVATE_KEY }}
          permission-contents: write
          permission-pull-requests: write
      - uses: abtion/dependabot-auto-merge@v1.1.0
        with:
          config: >-
            [
              { "update-type": "semver-minor" },
            ]
          github-token: ${{ steps.app-token.outputs.token }}
```

The job no longer uses `GITHUB_TOKEN`, so the workflow grants it no permissions.

To set it up:

1. Create a GitHub App owned by your organization with the repository permissions **Contents: Read and write** and **Pull requests: Read and write**. It needs no webhook.
2. Install the App on the repositories that use this action.
3. Store the App's client ID as an Actions variable and its private key as an Actions secret. The client ID is not a secret.
4. Keep the App off the bypass list of every ruleset and branch protection. It only needs to merge PRs that meet your requirements.

Notes:

- **Use Actions secrets, not Dependabot secrets.** A `pull_request_target` run reads Actions secrets and variables even when Dependabot opened the PR.
- **Organization-level secrets:** limit the private key to selected repositories and keep that list the same as the App's installation list. Anyone with write access to a repository that can read the key can create a token for every repository the App is installed on.
- **Abtion projects:** the App, the organization variable and the organization secret already exist under the names used above. Ask an organization admin to install the App on your repository and give the repository access to the secret.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `config` | Yes | | JSON* array of merge rules |
| `github-token` | Yes | | Token used to approve the PR and enable auto-merge. See [Authentication](#authentication) |
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
