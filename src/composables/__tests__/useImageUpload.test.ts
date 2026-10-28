import { describe, it, expect, vi } from 'vitest'
import { useImageUpload, type ImageUploadOptions } from '../useImageUpload'

/** Photos d'un formulaire : limite, refus, aperçus et clés stables. */

vi.mock('@/config/api', () => ({ API_URL: 'https://api.test' }))

const imageFile = (name: string, type = 'image/jpeg', size = 10) =>
  new File([new Uint8Array(size)], name, { type })

const upload = (options: Partial<ImageUploadOptions> = {}) =>
  useImageUpload({ maxFiles: 3, tooManyMessage: (count) => `Trop de photos (${count})`, ...options })

describe('useImageUpload', () => {
  it('ajoute les images dans l\'ordre choisi et lit leur aperçu', async () => {
    const { images, addFiles } = upload()

    addFiles([imageFile('a.jpg'), imageFile('b.png', 'image/png')])

    expect(images.value.map((image) => (image.source as File).name)).toEqual(['a.jpg', 'b.png'])
    await vi.waitFor(() => expect(images.value.every((image) => image.preview.startsWith('data:'))).toBe(true))
  })

  it('ignore les fichiers qui ne sont pas des images', () => {
    const { images, addFiles } = upload()

    addFiles([imageFile('notes.pdf', 'application/pdf'), imageFile('a.jpg')])

    expect(images.value).toHaveLength(1)
  })

  it('refuse tout le lot quand il dépasse la place restante', () => {
    const { images, error, addFiles } = upload()
    addFiles([imageFile('a.jpg'), imageFile('b.jpg')])

    addFiles([imageFile('c.jpg'), imageFile('d.jpg')])

    expect(images.value).toHaveLength(2)
    expect(error.value).toBe('Trop de photos (2)')
  })

  it('garde ce qui tient quand keepWhatFits est demandé, puis signale la limite atteinte', () => {
    const { images, error, addFiles } = upload({ keepWhatFits: true })

    addFiles([imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg'), imageFile('d.jpg')])
    expect(images.value).toHaveLength(3)
    expect(error.value).toBe('')

    addFiles([imageFile('e.jpg')])
    expect(error.value).toBe('Trop de photos (3)')
  })

  it('annule le lot si un fichier est refusé, avec son motif', () => {
    const { images, error, addFiles } = upload({
      rejectReason: (file) => (file.size > 100 ? `${file.name} est trop volumineux` : null),
    })

    addFiles([imageFile('ok.jpg'), imageFile('lourd.jpg', 'image/jpeg', 500)])

    expect(images.value).toHaveLength(0)
    expect(error.value).toBe('lourd.jpg est trop volumineux')
  })

  it('retire la bonne photo par sa clé, même après d\'autres suppressions', () => {
    const { images, addFiles, removeImage } = upload()
    addFiles([imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')])
    const [first, second, third] = images.value.map((image) => image.id)

    removeImage(first)
    removeImage(third)

    expect(images.value.map((image) => image.id)).toEqual([second])
    expect((images.value[0].source as File).name).toBe('b.jpg')
  })

  it('reprend les photos en ligne et remplace un fichier envoyé par son chemin', () => {
    const { images, addFiles, addExistingImages, markUploaded } = upload()
    addExistingImages(['/uploads/products/old.jpg'])
    const file = imageFile('new.jpg')
    addFiles([file])

    markUploaded(file, '/uploads/products/new.jpg')

    expect(images.value.map((image) => image.source)).toEqual(['/uploads/products/old.jpg', '/uploads/products/new.jpg'])
    expect(images.value[0].preview).toBe('https://api.test/uploads/products/old.jpg')
  })
})
