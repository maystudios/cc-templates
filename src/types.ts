// src/types.ts

/**
 * Options parsed from CLI flags by commander.
 * All fields are optional — the user may combine any subset.
 */
export interface InstallOptions {
  skill?: string;
  agent?: string;
  command?: string;
  hook?: string;
  mcp?: string;
  force?: boolean;
  global?: boolean;
  yes?: boolean;
  verbose?: boolean;
  list?: boolean;
}

/**
 * Component type string values matching CLI flags.
 */
export type ComponentType = 'skill' | 'agent' | 'command' | 'hook' | 'mcp';

/**
 * Entry from components.json catalog.
 */
export interface CatalogEntry {
  name: string | null;
  description: string | null;
  author: string | null;
  version: string | null;
  tags: string[];
}

/**
 * Item from GitHub Contents API v3 response.
 * https://docs.github.com/en/rest/repos/contents
 */
export interface GitHubContentsItem {
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  name: string;
  path: string;
  url: string;
  download_url: string | null;
}
