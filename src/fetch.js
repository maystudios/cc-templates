// src/fetch.js
const DEFAULT_REPO = 'anthropics-community/cc-templates'; // actual GitHub org/repo
const BRANCH = 'main';

function getRepo() {
  return process.env.CC_TEMPLATES_REPO ?? DEFAULT_REPO;
}

/**
 * Build raw.githubusercontent.com URL for a single file component (agents, commands, hooks).
 * @param {string} type  - Component type folder name: 'agents', 'commands', 'hooks'
 * @param {string} filename - e.g. 'my-agent.md' or 'my-hook.json'
 */
export function buildRawUrl(type, filename) {
  const repo = getRepo();
  return `https://raw.githubusercontent.com/${repo}/${BRANCH}/components/${type}/${filename}`;
}

/**
 * Build GitHub Contents API URL for a skill directory.
 * @param {string} type - 'skills'
 * @param {string} name - skill directory name, e.g. 'video-download'
 */
export function buildContentsApiUrl(type, name) {
  const repo = getRepo();
  return `https://api.github.com/repos/${repo}/contents/components/${type}/${name}`;
}
