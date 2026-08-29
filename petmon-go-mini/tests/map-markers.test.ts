import { buildMapMarkers, findPetByMarkerId, type MarkerPet } from '../src/utils/map-markers'

const pets: MarkerPet[] = [
  { id: 'cat1', en: 'Catt', kind: 'cat', xy: [44, 47] as [number, number], collected: true },
  { id: 'dog1', en: 'Dada', kind: 'dog', xy: [45, 48] as [number, number], collected: true },
  { id: 'hidden', en: 'Hidden', kind: 'cat', xy: [46, 49] as [number, number], collected: false }
]

const markers = buildMapMarkers(pets, 39.9842, 116.3074)

if (markers.length !== 2) {
  throw new Error(`expected 2 visible markers, got ${markers.length}`)
}

if (markers[0].id !== 1 || markers[1].id !== 2) {
  throw new Error(`marker ids must be consecutive numbers, got ${markers.map(marker => marker.id).join(',')}`)
}

if (markers[0].iconPath !== '/static/icons/cat.png' || markers[1].iconPath !== '/static/icons/dog.png') {
  throw new Error('marker icon paths must point to the packaged cat and dog PNG files')
}

if (findPetByMarkerId(pets, 2)?.id !== 'dog1') {
  throw new Error('marker id 2 must resolve to the second visible pet')
}

if (findPetByMarkerId(pets, 99) !== undefined) {
  throw new Error('an unknown marker id must not resolve to a pet')
}

console.log('map marker regression checks passed')
