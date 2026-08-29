import type { AddEncounterParams } from '../src/api/encounter'
import type { AddEventParams } from '../src/api/event'
import type { AddPetParams, GetPetsParams } from '../src/api/pet'
import type { GetNoticesParams } from '../src/api/notice'

const petPayload = {
  name: 'Mochi',
  kind: 'cat',
  breed: 'British Shorthair',
  tag: '友好',
  area: 'Maple St',
  location: { type: 'Point', coordinates: [121.47, 31.23] }
} satisfies AddPetParams

const encounterPayload = {
  petId: 'pet-001',
  note: '在公园遇见'
} satisfies AddEncounterParams

const eventPayload = {
  type: '丢失',
  title: '宠物丢失',
  place: 'Maple St'
} satisfies AddEventParams

const petsQuery = {
  area: 'Maple St',
  page: 1,
  pageSize: 20
} satisfies GetPetsParams

const noticesQuery = {
  page: 1,
  pageSize: 20
} satisfies GetNoticesParams

// These assertions intentionally fail compilation if the public API types are weakened.
// @ts-expect-error kind is restricted to cat or dog
const invalidKind: AddPetParams = { ...petPayload, kind: 'bird' }
// @ts-expect-error event type is a closed union
const invalidEvent: AddEventParams = { ...eventPayload, type: 'other' }
// @ts-expect-error page must be a number
const invalidPage: GetPetsParams = { page: '1' }

void [petPayload, encounterPayload, eventPayload, petsQuery, noticesQuery, invalidKind, invalidEvent, invalidPage]
