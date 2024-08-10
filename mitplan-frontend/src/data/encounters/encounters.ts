import type { Encounter } from '../types'
// Function to import all encounters from a folder
async function importEncounters(folderName: string) {
  const context = import.meta.glob('./**/*.ts', { eager: true })
  const encounters: Record<string, Encounter> = {}

  for (const path in context) {
    if (path.includes(folderName) && path !== './encounters.ts') {
      const module = context[path] as { default: Record<string, Encounter> }
      Object.assign(encounters, module.default)
    }
  }

  return encounters
}

// Usage example
export const aberrusEncounters = await importEncounters('aberrus')

// You can add more encounter imports here if needed
// export const otherEncounters = await importEncounters('other')