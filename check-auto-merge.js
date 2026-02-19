const semverLevels = {
  "semver-patch": 1,
  "semver-minor": 2,
  "semver-major": 3,
}
const updateTypeLevels = {
  "version-update:semver-patch": 1,
  "version-update:semver-minor": 2,
  "version-update:semver-major": 3,
}

function checkAutoMerge({ config, dependencyNames, packageEcosystem, updateType }) {
  const actualLevel = updateTypeLevels[updateType] || 0
  let shouldMerge = false
  let matchedRule = null

  for (const rule of config) {
    let matches = true
    if (rule["dependency-name"] && !dependencyNames.includes(rule["dependency-name"])) {
      matches = false
    }
    if (rule["package-ecosystem"] && rule["package-ecosystem"] !== packageEcosystem) {
      matches = false
    }

    if (!matches) continue

    const allowedLevel = semverLevels[rule["update-type"]] || 0
    shouldMerge = actualLevel <= allowedLevel
    matchedRule = rule
    console.log(
      `Matches: ${JSON.stringify(rule)}, ${rule["update-type"]} ${shouldMerge ? ">=" : "<"} ${updateType}, merge: ${shouldMerge}`,
    )
  }

  return { shouldMerge, matchedRule }
}

module.exports = { checkAutoMerge }
