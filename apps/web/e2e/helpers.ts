import { expect, type Page } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
export const qualityRoot = path.join(root, "..", "docs", "quality")
export const shotRoot = path.join(qualityRoot, "screenshots")

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }
  })
  expect(overflow.scrollWidth, "horizontal overflow (documentElement)").toBeLessThanOrEqual(overflow.clientWidth + 1)
  expect(overflow.bodyScrollWidth, "horizontal overflow (body)").toBeLessThanOrEqual(overflow.clientWidth + 1)
}

export async function assertImagesLoaded(page: Page, scope = "main img, header img, footer img") {
  const report = await page.evaluate((selector) => {
    const images = [...document.querySelectorAll<HTMLImageElement>(selector)]
    return images.map((img) => {
      const rect = img.getBoundingClientRect()
      return {
        src: img.currentSrc || img.src,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        width: rect.width,
        height: rect.height,
        distorted:
          img.naturalWidth > 0 &&
          img.naturalHeight > 0 &&
          rect.width > 0 &&
          rect.height > 0 &&
          Math.abs(rect.width / rect.height - img.naturalWidth / img.naturalHeight) > 0.45,
      }
    })
  }, scope)

  for (const img of report) {
    expect(img.complete, `image not complete: ${img.src}`).toBe(true)
    expect(img.naturalWidth, `broken image: ${img.src}`).toBeGreaterThan(0)
    expect(img.naturalHeight, `broken image height: ${img.src}`).toBeGreaterThan(0)
  }

  return report
}

export async function captureProof(page: Page, folder: "institutional" | "drive", name: string) {
  const dir = path.join(shotRoot, folder)
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

export async function gotoFr(page: Page, pathname: string) {
  const pathName = pathname.startsWith("/") ? pathname : `/${pathname}`
  await page.goto(`/fr${pathName}`)
  await page.waitForLoadState("domcontentloaded")
}
