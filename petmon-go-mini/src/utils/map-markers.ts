export interface MarkerPet {
  id: string
  en: string
  kind: 'cat' | 'dog'
  xy: [number, number] | null
  collected: boolean
}

const MAP_ORIGIN: [number, number] = [44, 47]

function visiblePets<T extends MarkerPet>(pets: readonly T[]): T[] {
  return pets.filter((pet): pet is T => Boolean(pet.xy && pet.collected))
}

export function buildMapMarkers<T extends MarkerPet>(
  pets: readonly T[],
  currentLat: number,
  currentLng: number
) {
  return visiblePets(pets).map((pet, index) => ({
    id: index + 1,
    latitude: currentLat + (pet.xy![1] - MAP_ORIGIN[1]) * 0.0001,
    longitude: currentLng + (pet.xy![0] - MAP_ORIGIN[0]) * 0.0001,
    callout: {
      content: pet.en,
      display: 'ALWAYS' as const,
      borderRadius: 10,
      bgColor: '#fff',
      color: '#141414',
      fontSize: 14,
      padding: 5
    },
    iconPath: `/static/icons/${pet.kind}.png`,
    width: 40,
    height: 40
  }))
}

export function findPetByMarkerId<T extends MarkerPet>(
  pets: readonly T[],
  markerId: number
): T | undefined {
  if (!Number.isInteger(markerId) || markerId < 1) return undefined
  return visiblePets(pets)[markerId - 1]
}
