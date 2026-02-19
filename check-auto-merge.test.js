const { describe, it } = require("node:test")
const assert = require("node:assert/strict")
const { checkAutoMerge } = require("./check-auto-merge")

describe("checkAutoMerge", () => {
  it("matches a catch-all rule", () => {
    const config = [{ "update-type": "semver-minor" }]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["nokogiri"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-patch",
    })
    assert.equal(result.shouldMerge, true)
  })

  it("rejects updates above the allowed level", () => {
    const config = [{ "update-type": "semver-minor" }]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["nokogiri"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-major",
    })
    assert.equal(result.shouldMerge, false)
  })

  it("later rules override earlier rules", () => {
    const config = [
      { "update-type": "semver-minor" },
      { "dependency-name": "rails", "update-type": "semver-patch" },
    ]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["rails"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-minor",
    })
    assert.equal(result.shouldMerge, false)
    assert.deepEqual(result.matchedRule, {
      "dependency-name": "rails",
      "update-type": "semver-patch",
    })
  })

  it("specific rules do not affect other dependencies", () => {
    const config = [
      { "update-type": "semver-minor" },
      { "dependency-name": "rails", "update-type": "semver-patch" },
    ]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["nokogiri"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-minor",
    })
    assert.equal(result.shouldMerge, true)
  })

  it("filters by package-ecosystem", () => {
    const config = [{ "package-ecosystem": "npm", "update-type": "semver-minor" }]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["lodash"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-patch",
    })
    assert.equal(result.shouldMerge, false)
  })

  it("matches when package-ecosystem matches", () => {
    const config = [{ "package-ecosystem": "npm", "update-type": "semver-minor" }]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["lodash"],
      packageEcosystem: "npm",
      updateType: "version-update:semver-patch",
    })
    assert.equal(result.shouldMerge, true)
  })

  it("returns shouldMerge false when no rules match", () => {
    const config = [{ "dependency-name": "rails", "update-type": "semver-minor" }]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["nokogiri"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-patch",
    })
    assert.equal(result.shouldMerge, false)
    assert.equal(result.matchedRule, null)
  })

  it("handles multiple dependency names", () => {
    const config = [{ "dependency-name": "rails", "update-type": "semver-patch" }]
    const result = checkAutoMerge({
      config,
      dependencyNames: ["activesupport", "rails", "railties"],
      packageEcosystem: "bundler",
      updateType: "version-update:semver-patch",
    })
    assert.equal(result.shouldMerge, true)
  })
})
