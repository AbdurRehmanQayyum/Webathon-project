const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
const digits = '23456789'

// Cryptographically random, without look-alike characters
export function generatePassword(length = 14) {
  const pick = (source: string, random: number) => source.charAt(random % source.length)
  const values = crypto.getRandomValues(new Uint32Array(length))
  const characters = Array.from(values, (value, index) =>
    index % 4 === 3 ? pick(digits, value) : pick(letters, value),
  )
  return characters.join('')
}
