import { petPhotoResources } from '@/config/pet-photo-resources'
import { resolveRemoteResource } from '@/utils/resource-cache'

export interface PhotoPet {
  id: string
  photo: string
}

/** Load only entries with a configured remote fileId; local photos remain the fallback. */
export async function loadPetPhotos<T extends PhotoPet>(pets: readonly T[]): Promise<Record<string, string>> {
  const entries = await Promise.all(pets.map(async pet => {
    const resource = petPhotoResources[pet.id]
    if (!resource) return [pet.id, pet.photo] as const
    const path = await resolveRemoteResource({
      key: `pet-photo:${pet.id}`,
      version: resource.version,
      fileId: resource.fileId,
      fallback: resource.fallback || pet.photo
    })
    return [pet.id, path] as const
  }))
  return Object.fromEntries(entries)
}

export function getPetPhoto(pet: PhotoPet, overrides: Readonly<Record<string, string>>): string {
  return overrides[pet.id] || pet.photo
}
