#!/usr/bin/env npx tsx
/**
 * GitHub Repository OG Image Generator
 *
 * Generates a custom Open Graph image for the npmx.dev GitHub repository.
 * The design matches app/components/OgImage/Package.vue exactly.
 *
 * Usage:
 *   node scripts/generate-og-image.ts
 *   pnpm generate:og-image
 *
 * Environment:
 *   GITHUB_TOKEN - GitHub token for API access (optional, but recommended)
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { Octokit } from '@octokit/rest'

// ============================================================================
// Configuration
// ============================================================================

const REPO_OWNER = 'danielroe'
const REPO_NAME = 'npmx.dev'
const OUTPUT_PATH = fileURLToPath(new URL('../.github/repo-og-image.png', import.meta.url))

// Colors matching Package.vue
const PRIMARY_COLOR = '#60a5fa'
const BG_COLOR = '#050505'
const TEXT_COLOR = '#fafafa'
const SECONDARY_TEXT_COLOR = '#a3a3a3'

// Image dimensions
const WIDTH = 1280
const HEIGHT = 640

// ============================================================================
// GitHub API
// ============================================================================

interface GitHubStats {
  stars: number
  forks: number
  openIssues: number
  contributors: number
}

async function fetchGitHubStats(): Promise<GitHubStats> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  })

  // Fetch repo data (stars, forks, open issues)
  const { data: repo } = await octokit.repos.get({
    owner: REPO_OWNER,
    repo: REPO_NAME,
  })

  // Fetch contributors count
  // Using per_page=1 and checking the Link header for total count
  const contributorsResponse = await octokit.repos.listContributors({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    per_page: 1,
    anon: 'true',
  })

  // Parse Link header to get total contributors count
  let contributorsCount = contributorsResponse.data.length
  const linkHeader = contributorsResponse.headers.link
  if (linkHeader) {
    // Link header format: <url>; rel="next", <url?page=X>; rel="last"
    const lastMatch = linkHeader.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/)
    if (lastMatch) {
      contributorsCount = parseInt(lastMatch[1], 10)
    }
  }

  return {
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    contributors: contributorsCount,
  }
}

// ============================================================================
// Formatting
// ============================================================================

function formatNumber(num: number): string {
  return Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(num)
}

// ============================================================================
// SVG Icons (matching Package.vue style)
// ============================================================================

// Package icon from Package.vue lines 83-99
function PackageIcon() {
  return {
    type: 'svg',
    props: {
      width: 36,
      height: 36,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'white',
      strokeWidth: 2.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      children: [
        { type: 'path', props: { d: 'm7.5 4.27 9 5.15' } },
        {
          type: 'path',
          props: {
            d: 'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
          },
        },
        { type: 'path', props: { d: 'm3.3 7 8.7 5 8.7-5' } },
        { type: 'path', props: { d: 'M12 22V12' } },
      ],
    },
  }
}

// Star icon from Package.vue lines 166-177
function StarIcon() {
  return {
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 32 32',
      width: 32,
      height: 32,
      style: { opacity: 0.6 },
      children: [
        {
          type: 'path',
          props: {
            fill: PRIMARY_COLOR,
            d: 'm16 6.52l2.76 5.58l.46 1l1 .15l6.16.89l-4.38 4.3l-.75.73l.18 1l1.05 6.13l-5.51-2.89L16 23l-.93.49l-5.51 2.85l1-6.13l.18-1l-.74-.77l-4.42-4.35l6.16-.89l1-.15l.46-1zM16 2l-4.55 9.22l-10.17 1.47l7.36 7.18L6.9 30l9.1-4.78L25.1 30l-1.74-10.13l7.36-7.17l-10.17-1.48Z',
          },
        },
      ],
    },
  }
}

// Contributors/People icon (similar style to Package.vue icons)
function PeopleIcon() {
  return {
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 32 32',
      width: 32,
      height: 32,
      fill: 'none',
      style: { opacity: 0.6 },
      children: [
        {
          type: 'circle',
          props: {
            cx: 10,
            cy: 8,
            r: 4,
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
          },
        },
        {
          type: 'path',
          props: {
            d: 'M2 26v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2',
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
            strokeLinecap: 'round',
          },
        },
        {
          type: 'circle',
          props: {
            cx: 24,
            cy: 10,
            r: 3,
            stroke: PRIMARY_COLOR,
            strokeWidth: 2,
            style: { opacity: 0.7 },
          },
        },
        {
          type: 'path',
          props: {
            d: 'M22 26v-1a5 5 0 0 1 3-4.5',
            stroke: PRIMARY_COLOR,
            strokeWidth: 2,
            strokeLinecap: 'round',
            style: { opacity: 0.7 },
          },
        },
      ],
    },
  }
}

// Issues icon (circle with dot, similar to GitHub issues)
function IssuesIcon() {
  return {
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 32 32',
      width: 32,
      height: 32,
      fill: 'none',
      style: { opacity: 0.6 },
      children: [
        {
          type: 'circle',
          props: {
            cx: 16,
            cy: 16,
            r: 12,
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
          },
        },
        {
          type: 'circle',
          props: {
            cx: 16,
            cy: 16,
            r: 3,
            fill: PRIMARY_COLOR,
          },
        },
      ],
    },
  }
}

// Fork icon (git branch style)
function ForkIcon() {
  return {
    type: 'svg',
    props: {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 32 32',
      width: 32,
      height: 32,
      fill: 'none',
      style: { opacity: 0.6 },
      children: [
        {
          type: 'circle',
          props: {
            cx: 16,
            cy: 6,
            r: 3,
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
          },
        },
        {
          type: 'circle',
          props: {
            cx: 8,
            cy: 26,
            r: 3,
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
          },
        },
        {
          type: 'circle',
          props: {
            cx: 24,
            cy: 26,
            r: 3,
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
          },
        },
        {
          type: 'path',
          props: {
            d: 'M16 9v6c0 4-8 4-8 8',
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
            strokeLinecap: 'round',
          },
        },
        {
          type: 'path',
          props: {
            d: 'M16 15c0 4 8 4 8 8',
            stroke: PRIMARY_COLOR,
            strokeWidth: 2.5,
            strokeLinecap: 'round',
          },
        },
      ],
    },
  }
}

// ============================================================================
// Image Template (matching Package.vue exactly)
// ============================================================================

function createTemplate(stats: GitHubStats) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '80px',
        backgroundColor: BG_COLOR,
        color: TEXT_COLOR,
        fontFamily: 'Inter',
        position: 'relative',
        overflow: 'hidden',
      },
      children: [
        // Background circle (sharp, no blur)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: -128,
              right: -128,
              width: 550,
              height: 550,
              borderRadius: '50%',
              backgroundColor: `${PRIMARY_COLOR}0d`,
            },
          },
        },
        // Content wrapper - moved up with marginTop
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              position: 'relative',
              marginTop: -40,
            },
            children: [
              // Logo box with package icon (above the title)
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #333',
                    marginBottom: 16,
                  },
                  children: [PackageIcon()],
                },
              },
              // Title: ./npmx
              {
                type: 'h1',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'baseline',
                    fontSize: 96,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    lineHeight: 1,
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        style: { color: PRIMARY_COLOR, opacity: 0.8, marginRight: 8 },
                        children: './',
                      },
                    },
                    'npmx',
                  ],
                },
              },
              // Tagline: "A better browser for the [npm registry]"
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 32,
                    fontWeight: 300,
                    color: SECONDARY_TEXT_COLOR,
                  },
                  children: [
                    {
                      type: 'span',
                      props: {
                        children: 'A better browser for the',
                      },
                    },
                    // Badge for "npm registry" with glow effect
                    {
                      type: 'span',
                      props: {
                        style: {
                          padding: '4px 12px',
                          borderRadius: 8,
                          border: `1px solid ${PRIMARY_COLOR}30`,
                          backgroundColor: `${PRIMARY_COLOR}10`,
                          color: PRIMARY_COLOR,
                          fontWeight: 400,
                          boxShadow: `0 0 20px ${PRIMARY_COLOR}25`,
                        },
                        children: 'npm registry',
                      },
                    },
                  ],
                },
              },
              // GitHub Stats row
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    fontSize: 28,
                    fontWeight: 400,
                    color: SECONDARY_TEXT_COLOR,
                    marginTop: 16,
                  },
                  children: [
                    // Stars
                    {
                      type: 'span',
                      props: {
                        style: { display: 'flex', alignItems: 'center', gap: 8 },
                        children: [StarIcon(), formatNumber(stats.stars)],
                      },
                    },
                    // Contributors
                    {
                      type: 'span',
                      props: {
                        style: { display: 'flex', alignItems: 'center', gap: 8 },
                        children: [PeopleIcon(), formatNumber(stats.contributors)],
                      },
                    },
                    // Issues
                    {
                      type: 'span',
                      props: {
                        style: { display: 'flex', alignItems: 'center', gap: 8 },
                        children: [IssuesIcon(), formatNumber(stats.openIssues)],
                      },
                    },
                    // Forks
                    {
                      type: 'span',
                      props: {
                        style: { display: 'flex', alignItems: 'center', gap: 8 },
                        children: [ForkIcon(), formatNumber(stats.forks)],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  }
}

// ============================================================================
// Font Loading
// ============================================================================

interface FontData {
  name: string
  data: ArrayBuffer
  weight: number
  style: 'normal' | 'italic'
}

async function loadFonts(): Promise<FontData[]> {
  // Fetch Inter font from Google Fonts API
  // Using a user-agent that returns TTF format (not WOFF2)
  const API_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap'

  const cssResponse = await fetch(API_URL, {
    headers: {
      // This user-agent gets TTF format from Google Fonts
      'User-Agent':
        'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
    },
  })

  if (!cssResponse.ok) {
    throw new Error(`Failed to fetch font CSS: ${cssResponse.status}`)
  }

  const css = await cssResponse.text()

  // Extract font URLs from CSS
  const fontUrlRegex = /src:\s*url\(([^)]+)\)\s*format\(['"]?truetype['"]?\)/g
  const weightRegex = /font-weight:\s*(\d+)/

  const fonts: FontData[] = []
  const fontBlocks = css.split('@font-face')

  for (const block of fontBlocks) {
    const urlMatch = fontUrlRegex.exec(block)
    fontUrlRegex.lastIndex = 0 // Reset regex state

    if (urlMatch) {
      const fontUrl = urlMatch[1]
      const weightMatch = block.match(weightRegex)
      const weight = weightMatch ? parseInt(weightMatch[1], 10) : 400

      const fontResponse = await fetch(fontUrl)
      if (!fontResponse.ok) {
        throw new Error(`Failed to fetch font (weight ${weight}): ${fontResponse.status}`)
      }

      fonts.push({
        name: 'Inter',
        data: await fontResponse.arrayBuffer(),
        weight,
        style: 'normal',
      })
    }
  }

  if (fonts.length === 0) {
    throw new Error('No fonts found in CSS response')
  }

  return fonts
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('🖼️  Generating OG image for npmx.dev repository...')

  // Fetch GitHub stats
  console.log('📊 Fetching GitHub stats...')
  const stats = await fetchGitHubStats()
  console.log(`   Stars: ${stats.stars}`)
  console.log(`   Contributors: ${stats.contributors}`)
  console.log(`   Open Issues: ${stats.openIssues}`)
  console.log(`   Forks: ${stats.forks}`)

  // Load fonts
  console.log('🔤 Loading fonts...')
  const fonts = await loadFonts()

  // Generate SVG with Satori
  console.log('🎨 Generating image...')
  const svg = await satori(createTemplate(stats), {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  })

  // Convert SVG to PNG with resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: WIDTH,
    },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_PATH)
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Write PNG file
  writeFileSync(OUTPUT_PATH, pngBuffer)
  console.log(`✅ OG image saved to ${OUTPUT_PATH}`)
}

main().catch(error => {
  console.error('❌ Failed to generate OG image:', error)
  process.exit(1)
})
