---
name: video-fetch-and-summarize
description: Download videos and generate AI summaries using Google Gemini
author: cc-templates
version: 1.0.0
tags:
  - video
  - download
  - summarize
  - ai
requires:
  tools:
    - yt-dlp
  env:
    - GEMINI_API_KEY
---

# video-fetch-and-summarize

A Claude Code skill that downloads videos and generates summaries using Google Gemini.

## Usage

Ask Claude to fetch and summarize a video by providing the URL.

## Requirements

- `yt-dlp` must be installed and available in PATH
- `GEMINI_API_KEY` environment variable must be set
