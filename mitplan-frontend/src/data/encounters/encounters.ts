import type { Encounter } from '../../types'

// Function to import all encounters from a folder
function importEncounters(folderName: string): Record<string, Encounter> {
  const context = import.meta.glob('./**/*.ts', { eager: true })
  const encounters: Record<string, Encounter> = {}

  for (const path in context) {
    if (path.includes(folderName) && path !== './encounters.ts') {
      const module = context[path] as { [key: string]: Encounter }
      Object.assign(encounters, module)
    }
  }

  return encounters
}

// Usage example
export const aberrusEncounters = importEncounters('aberrus')
export const defaultEncounters = importEncounters('default')
// Combine all encounter lists into a single object
export const allEncounters: Record<string, Encounter> = {
  ...aberrusEncounters,
  ...defaultEncounters,
  // Add other encounter lists here as they become available
  // ...otherEncounters,
}

// You can add more encounter imports here if needed
// export const otherEncounters = importEncounters('other')