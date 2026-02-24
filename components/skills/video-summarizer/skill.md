---
name: video-summarizer
description: Generate AI summaries of existing MP4 files using Google Gemini
author: cc-templates
version: 1.0.0
tags:
  - video
  - summarize
  - ai
requires:
  env:
    - GEMINI_API_KEY
---

# video-summarizer

A Claude Code skill that generates summaries of MP4 files already on disk using Google Gemini.

## Usage

Ask Claude to summarize a video file by providing the local path.

## Requirements

- `GEMINI_API_KEY` environment variable must be set
