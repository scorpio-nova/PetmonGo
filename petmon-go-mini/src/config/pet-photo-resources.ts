/**
 * Remote photo manifest.
 *
 * `fileId` is intentionally empty until the corresponding file is uploaded to
 * the test/production cloud-storage environment. The local path remains the
 * deterministic fallback, so a missing manifest entry never blocks rendering.
 */
export interface PetPhotoResource {
  version: string
  fileId?: string
  fallback: string
}

export const petPhotoResources: Record<string, PetPhotoResource> = {
  cat1: { version: 'v1', fallback: '/static/pets/catt-1.jpg' },
  cat2: { version: 'v1', fallback: '/static/pets/memw-2.jpg' },
  dog1: { version: 'v1', fallback: '/static/pets/dada-1.jpg' },
  cat3: { version: 'v1', fallback: '/static/pets/onion-1.jpg' },
  cat4: { version: 'v1', fallback: '/static/pets/scar-1.jpg' },
  cat5: { version: 'v1', fallback: '/static/pets/mochi-1.jpg' }
}
