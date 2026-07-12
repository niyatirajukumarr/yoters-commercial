// Utility functions for cafeteria slug generation and mapping

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]/g, '') // Remove special characters
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
}

export function createSlugIdMap(cafeterias: any[]): Record<string, string> {
  const map: Record<string, string> = {}
  cafeterias.forEach(cafe => {
    map[generateSlug(cafe.name)] = cafe.id
  })
  return map
}
