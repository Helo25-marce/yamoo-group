import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Connect, type Plugin } from 'vite'

const appDir = path.dirname(fileURLToPath(import.meta.url))
const founderFilmPath = path.resolve(
  appDir,
  '../../assets/video/WhatsApp Video 2026-11-14 at 22.44.58.mp4',
)

/** GitHub project Pages: https://helo25-marce.github.io/yamoo-group/ */
const pagesBase = '/yamoo-group/'
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

function streamFounderFilm(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.statusCode = 405
    response.end()
    return
  }

  if (!fs.existsSync(founderFilmPath)) {
    response.statusCode = 404
    response.end()
    return
  }

  const size = fs.statSync(founderFilmPath).size
  response.setHeader('Content-Type', 'video/mp4')
  response.setHeader('Accept-Ranges', 'bytes')
  response.setHeader('Cache-Control', 'no-store')

  if (request.method === 'HEAD') {
    response.setHeader('Content-Length', size)
    response.end()
    return
  }

  const range = request.headers.range
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range)
    if (!match) {
      response.statusCode = 416
      response.setHeader('Content-Range', `bytes */${size}`)
      response.end()
      return
    }

    const start = match[1] ? Number(match[1]) : 0
    const end = match[2] ? Number(match[2]) : size - 1
    if (start >= size || end >= size || start > end) {
      response.statusCode = 416
      response.setHeader('Content-Range', `bytes */${size}`)
      response.end()
      return
    }

    response.statusCode = 206
    response.setHeader('Content-Range', `bytes ${start}-${end}/${size}`)
    response.setHeader('Content-Length', end - start + 1)
    fs.createReadStream(founderFilmPath, { start, end }).pipe(response)
    return
  }

  response.statusCode = 200
  response.setHeader('Content-Length', size)
  fs.createReadStream(founderFilmPath).pipe(response)
}

function founderFilmPlugin(): Plugin {
  const attach = (middlewares: Connect.Server) => {
    // Dev/preview: keep legacy path and new static path.
    middlewares.use('/media/founder', (request, response) => {
      streamFounderFilm(request, response)
    })
    middlewares.use('/media/founder.mp4', (request, response) => {
      streamFounderFilm(request, response)
    })
  }

  return {
    name: 'yamoo-founder-film',
    configureServer(server) {
      attach(server.middlewares)
    },
    configurePreviewServer(server) {
      attach(server.middlewares)
    },
    closeBundle() {
      if (!fs.existsSync(founderFilmPath)) return
      const outDir = path.resolve(appDir, 'dist/media')
      fs.mkdirSync(outDir, { recursive: true })
      fs.copyFileSync(founderFilmPath, path.join(outDir, 'founder.mp4'))
    },
  }
}

/** GitHub Pages SPA: unknown paths must serve index.html (copied as 404.html). */
function spaFallbackPlugin(): Plugin {
  return {
    name: 'yamoo-spa-fallback',
    closeBundle() {
      const indexHtml = path.resolve(appDir, 'dist/index.html')
      if (!fs.existsSync(indexHtml)) return
      fs.copyFileSync(indexHtml, path.resolve(appDir, 'dist/404.html'))
    },
  }
}

export default defineConfig({
  base: isGitHubPages ? pagesBase : '/',
  plugins: [react(), tailwindcss(), founderFilmPlugin(), spaFallbackPlugin()],
  server: {
    port: 5173,
    fs: {
      allow: [appDir, path.resolve(appDir, '../..')],
    },
  },
})
