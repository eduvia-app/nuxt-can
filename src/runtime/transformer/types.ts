export interface Patch {
  start: number
  end: number
  text: string
}

export interface DiffPayload {
  before: string
  after: string
  id: string
}
