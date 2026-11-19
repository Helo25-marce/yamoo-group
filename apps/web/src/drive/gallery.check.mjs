import assert from "node:assert/strict"
import { createServer } from "vite"

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
})

const gallery = await server.ssrLoadModule("/src/drive/gallery.ts")
await server.close()

const one = gallery.galleryFrames({
  imageSrc: "/visuals/drive/vehicles/berline-executive.jpg",
  images: [{ src: "/visuals/drive/vehicles/berline-executive.jpg", demo: true }],
})
assert.equal(one.length, 1)
assert.equal(one[0].demo, true)

const fromSrc = gallery.galleryFrames({ imageSrc: "/still.jpg", images: [] })
assert.equal(fromSrc.length, 1)
assert.equal(fromSrc[0].demo, true)

const none = gallery.galleryFrames({ imageSrc: "  ", images: [{ src: " ", demo: true }] })
assert.deepEqual(none, [])

assert.equal(gallery.moveGallery(0, 1, 1), 0)
assert.equal(gallery.moveGallery(0, 1, 3), 1)
assert.equal(gallery.moveGallery(2, 1, 3), 0)
assert.equal(gallery.moveGallery(0, -1, 3), 2)

assert.deepEqual(gallery.presentFacts(undefined), [])
assert.deepEqual(gallery.presentFacts({ transmission: "  ", fuel: "" }), [])
assert.deepEqual(gallery.presentFacts({ fuel: "Essence" }), [{ key: "fuel", value: "Essence" }])

console.log("drive gallery checks OK")
