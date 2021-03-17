import { Controller } from 'stimulus'
import { decode, encode, isBlurhashValid } from 'blurhash'

const loadImage = async src =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (...args) => reject(args)
    img.src = src
  })

const getImageData = image => {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  context.drawImage(image, 0, 0)
  return context.getImageData(0, 0, image.width, image.height)
}

const encodeImageToBlurhash = async imageUrl => {
  const image = await loadImage(imageUrl)
  const imageData = getImageData(image)
  return encode(imageData.data, imageData.width, imageData.height, 4, 4)
}


export default class extends Controller {
  static targets = ['canvas', 'image']

  static values = {
    hash: String,
    width: Number,
    height: Number,
    punch: Number,
    src: String
  }

  connect () {
    if (this.canvasTargets && this.hasHashValue) this.draw()

    if (this.imageTargets) this.encode()
  }

  draw () {
    if (isBlurhashValid(this.hash)) {
      this.canvasTargets.forEach((canvas) => {

        const pixels = decode(this.hash, canvas.width, canvas.height, this.punch)

        const context = canvas.getContext('2d')
        const imageData = context.createImageData(canvas.width, canvas.height)

        imageData.data.set(pixels)
        context.putImageData(imageData, 0, 0)
      })
    } else {
      console.warn('Not a valid blurhash value')
    }
  }

  encode () {
    this.imageTargets.forEach(async image => {
      image.dataset.blurhash = await encodeImageToBlurhash(image.src)
    })
  }

  get hash () {
    return this.hashValue || ''
  }

  get width () {
    return this.widthValue || this.canvasTarget.width || 32
  }

  get height () {
    return this.heightValue || this.canvasTarget.height || 32
  }

  get punch () {
    return this.punchValue || 1
  }
}
