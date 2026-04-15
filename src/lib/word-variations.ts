/**
 * Word Variations Generator - Simplified
 * توليد الصيغ المختلفة للكلمات الإنجليزية (نسخة مبسطة)
 */

/**
 * Common irregular plurals (singular -> plural)
 */
const irregularPlurals: Record<string, string> = {
  'child': 'children',
  'man': 'men',
  'woman': 'women',
  'tooth': 'teeth',
  'foot': 'feet',
  'goose': 'geese',
  'mouse': 'mice',
  'person': 'people',
  'leaf': 'leaves',
  'life': 'lives',
  'knife': 'knives',
  'wife': 'wives',
  'half': 'halves',
  'wolf': 'wolves',
  'thief': 'thieves',
  'shelf': 'shelves',
  'cactus': 'cacti',
  'focus': 'foci',
  'fungus': 'fungi',
  'nucleus': 'nuclei',
  'syllabus': 'syllabi',
  'analysis': 'analyses',
  'basis': 'bases',
  'crisis': 'crises',
  'diagnosis': 'diagnoses',
  'hypothesis': 'hypotheses',
  'oasis': 'oases',
  'thesis': 'theses',
  'phenomenon': 'phenomena',
  'criterion': 'criteria',
  'datum': 'data',
  'medium': 'media',
  'bacterium': 'bacteria',
  'curriculum': 'curricula',
  'index': 'indices',
  'appendix': 'appendices',
  'matrix': 'matrices',
}

// Reverse map (plural -> singular)
const irregularSingulars: Record<string, string> = {}
Object.entries(irregularPlurals).forEach(([singular, plural]) => {
  irregularSingulars[plural] = singular
})

/**
 * Common irregular verbs (base -> past -> past participle)
 */
const irregularVerbs: Record<string, { past: string; pastParticiple: string; continuous: string }> = {
  'be': { past: 'was', pastParticiple: 'been', continuous: 'being' },
  'have': { past: 'had', pastParticiple: 'had', continuous: 'having' },
  'do': { past: 'did', pastParticiple: 'done', continuous: 'doing' },
  'say': { past: 'said', pastParticiple: 'said', continuous: 'saying' },
  'go': { past: 'went', pastParticiple: 'gone', continuous: 'going' },
  'get': { past: 'got', pastParticiple: 'got', continuous: 'getting' },
  'make': { past: 'made', pastParticiple: 'made', continuous: 'making' },
  'know': { past: 'knew', pastParticiple: 'known', continuous: 'knowing' },
  'think': { past: 'thought', pastParticiple: 'thought', continuous: 'thinking' },
  'take': { past: 'took', pastParticiple: 'taken', continuous: 'taking' },
  'see': { past: 'saw', pastParticiple: 'seen', continuous: 'seeing' },
  'come': { past: 'came', pastParticiple: 'come', continuous: 'coming' },
  'give': { past: 'gave', pastParticiple: 'given', continuous: 'giving' },
  'find': { past: 'found', pastParticiple: 'found', continuous: 'finding' },
  'tell': { past: 'told', pastParticiple: 'told', continuous: 'telling' },
  'feel': { past: 'felt', pastParticiple: 'felt', continuous: 'feeling' },
  'become': { past: 'became', pastParticiple: 'become', continuous: 'becoming' },
  'leave': { past: 'left', pastParticiple: 'left', continuous: 'leaving' },
  'put': { past: 'put', pastParticiple: 'put', continuous: 'putting' },
  'mean': { past: 'meant', pastParticiple: 'meant', continuous: 'meaning' },
  'keep': { past: 'kept', pastParticiple: 'kept', continuous: 'keeping' },
  'let': { past: 'let', pastParticiple: 'let', continuous: 'letting' },
  'begin': { past: 'began', pastParticiple: 'begun', continuous: 'beginning' },
  'hear': { past: 'heard', pastParticiple: 'heard', continuous: 'hearing' },
  'run': { past: 'ran', pastParticiple: 'run', continuous: 'running' },
  'write': { past: 'wrote', pastParticiple: 'written', continuous: 'writing' },
  'sit': { past: 'sat', pastParticiple: 'sat', continuous: 'sitting' },
  'stand': { past: 'stood', pastParticiple: 'stood', continuous: 'standing' },
  'lose': { past: 'lost', pastParticiple: 'lost', continuous: 'losing' },
  'pay': { past: 'paid', pastParticiple: 'paid', continuous: 'paying' },
  'meet': { past: 'met', pastParticiple: 'met', continuous: 'meeting' },
  'learn': { past: 'learnt', pastParticiple: 'learnt', continuous: 'learning' },
  'understand': { past: 'understood', pastParticiple: 'understood', continuous: 'understanding' },
  'read': { past: 'read', pastParticiple: 'read', continuous: 'reading' },
  'speak': { past: 'spoke', pastParticiple: 'spoken', continuous: 'speaking' },
  'grow': { past: 'grew', pastParticiple: 'grown', continuous: 'growing' },
  'draw': { past: 'drew', pastParticiple: 'drawn', continuous: 'drawing' },
  'eat': { past: 'ate', pastParticiple: 'eaten', continuous: 'eating' },
  'break': { past: 'broke', pastParticiple: 'broken', continuous: 'breaking' },
  'choose': { past: 'chose', pastParticiple: 'chosen', continuous: 'choosing' },
  'fall': { past: 'fell', pastParticiple: 'fallen', continuous: 'falling' },
  'buy': { past: 'bought', pastParticiple: 'bought', continuous: 'buying' },
  'catch': { past: 'caught', pastParticiple: 'caught', continuous: 'catching' },
  'teach': { past: 'taught', pastParticiple: 'taught', continuous: 'teaching' },
  'fight': { past: 'fought', pastParticiple: 'fought', continuous: 'fighting' },
  'throw': { past: 'threw', pastParticiple: 'thrown', continuous: 'throwing' },
  'bring': { past: 'brought', pastParticiple: 'brought', continuous: 'bringing' },
  'fly': { past: 'flew', pastParticiple: 'flown', continuous: 'flying' },
  'swim': { past: 'swam', pastParticiple: 'swum', continuous: 'swimming' },
  'drink': { past: 'drank', pastParticiple: 'drunk', continuous: 'drinking' },
  'ring': { past: 'rang', pastParticiple: 'rung', continuous: 'ringing' },
  'sing': { past: 'sang', pastParticiple: 'sung', continuous: 'singing' },
  'sink': { past: 'sank', pastParticiple: 'sunk', continuous: 'sinking' },
  'spring': { past: 'sprang', pastParticiple: 'sprung', continuous: 'springing' },
  'drive': { past: 'drove', pastParticiple: 'driven', continuous: 'driving' },
  'ride': { past: 'rode', pastParticiple: 'ridden', continuous: 'riding' },
  'rise': { past: 'rose', pastParticiple: 'risen', continuous: 'rising' },
  'shake': { past: 'shook', pastParticiple: 'shaken', continuous: 'shaking' },
  'wake': { past: 'woke', pastParticiple: 'woken', continuous: 'waking' },
  'wear': { past: 'wore', pastParticiple: 'worn', continuous: 'wearing' },
  'tear': { past: 'tore', pastParticiple: 'torn', continuous: 'tearing' },
  'swear': { past: 'swore', pastParticiple: 'sworn', continuous: 'swearing' },
  'bear': { past: 'bore', pastParticiple: 'born', continuous: 'bearing' },
  'freeze': { past: 'froze', pastParticiple: 'frozen', continuous: 'freezing' },
  'steal': { past: 'stole', pastParticiple: 'stolen', continuous: 'stealing' },
  'hide': { past: 'hid', pastParticiple: 'hidden', continuous: 'hiding' },
  'forbid': { past: 'forbade', pastParticiple: 'forbidden', continuous: 'forbidding' },
  'forgive': { past: 'forgave', pastParticiple: 'forgiven', continuous: 'forgiving' },
  'mistake': { past: 'mistook', pastParticiple: 'mistaken', continuous: 'mistaking' },
  'blow': { past: 'blew', pastParticiple: 'blown', continuous: 'blowing' },
  'grow': { past: 'grew', pastParticiple: 'grown', continuous: 'growing' },
  'know': { past: 'knew', pastParticiple: 'known', continuous: 'knowing' },
  'show': { past: 'showed', pastParticiple: 'shown', continuous: 'showing' },
  'sew': { past: 'sewed', pastParticiple: 'sewn', continuous: 'sewing' },
  'mow': { past: 'mowed', pastParticiple: 'mown', continuous: 'mowing' },
  'saw': { past: 'sawed', pastParticiple: 'sawn', continuous: 'sawing' },
  'sell': { past: 'sold', pastParticiple: 'sold', continuous: 'selling' },
  'tell': { past: 'told', pastParticiple: 'told', continuous: 'telling' },
  'send': { past: 'sent', pastParticiple: 'sent', continuous: 'sending' },
  'spend': { past: 'spent', pastParticiple: 'spent', continuous: 'spending' },
  'build': { past: 'built', pastParticiple: 'built', continuous: 'building' },
  'lend': { past: 'lent', pastParticiple: 'lent', continuous: 'lending' },
  'bend': { past: 'bent', pastParticiple: 'bent', continuous: 'bending' },
  'bind': { past: 'bound', pastParticiple: 'bound', continuous: 'binding' },
  'find': { past: 'found', pastParticiple: 'found', continuous: 'finding' },
  'grind': { past: 'ground', pastParticiple: 'ground', continuous: 'grinding' },
  'wind': { past: 'wound', pastParticiple: 'wound', continuous: 'winding' },
  'hold': { past: 'held', pastParticiple: 'held', continuous: 'holding' },
  'deal': { past: 'dealt', pastParticiple: 'dealt', continuous: 'dealing' },
  'dream': { past: 'dreamt', pastParticiple: 'dreamt', continuous: 'dreaming' },
  'creep': { past: 'crept', pastParticiple: 'crept', continuous: 'creeping' },
  'sleep': { past: 'slept', pastParticiple: 'slept', continuous: 'sleeping' },
  'sweep': { past: 'swept', pastParticiple: 'swept', continuous: 'sweeping' },
  'keep': { past: 'kept', pastParticiple: 'kept', continuous: 'keeping' },
  'weep': { past: 'wept', pastParticiple: 'wept', continuous: 'weeping' },
  'kneel': { past: 'knelt', pastParticiple: 'knelt', continuous: 'kneeling' },
  'smell': { past: 'smelt', pastParticiple: 'smelt', continuous: 'smelling' },
  'spell': { past: 'spelt', pastParticiple: 'spelt', continuous: 'spelling' },
  'spill': { past: 'spilt', pastParticiple: 'spilt', continuous: 'spilling' },
  'spoil': { past: 'spoilt', pastParticiple: 'spoilt', continuous: 'spoiling' },
  'burn': { past: 'burnt', pastParticiple: 'burnt', continuous: 'burning' },
  'learn': { past: 'learnt', pastParticiple: 'learnt', continuous: 'learning' },
  'dwell': { past: 'dwelt', pastParticiple: 'dwelt', continuous: 'dwelling' },
  'bleed': { past: 'bled', pastParticiple: 'bled', continuous: 'bleeding' },
  'breed': { past: 'bred', pastParticiple: 'bred', continuous: 'breeding' },
  'feed': { past: 'fed', pastParticiple: 'fed', continuous: 'feeding' },
  'lead': { past: 'led', pastParticiple: 'led', continuous: 'leading' },
  'read': { past: 'read', pastParticiple: 'read', continuous: 'reading' },
  'speed': { past: 'sped', pastParticiple: 'sped', continuous: 'speeding' },
  'light': { past: 'lit', pastParticiple: 'lit', continuous: 'lighting' },
  'quit': { past: 'quit', pastParticiple: 'quit', continuous: 'quitting' },
  'split': { past: 'split', pastParticiple: 'split', continuous: 'splitting' },
  'hurt': { past: 'hurt', pastParticiple: 'hurt', continuous: 'hurting' },
  'burst': { past: 'burst', pastParticiple: 'burst', continuous: 'bursting' },
  'cast': { past: 'cast', pastParticiple: 'cast', continuous: 'casting' },
  'cost': { past: 'cost', pastParticiple: 'cost', continuous: 'costing' },
  'cut': { past: 'cut', pastParticiple: 'cut', continuous: 'cutting' },
  'hit': { past: 'hit', pastParticiple: 'hit', continuous: 'hitting' },
  'hurt': { past: 'hurt', pastParticiple: 'hurt', continuous: 'hurting' },
  'let': { past: 'let', pastParticiple: 'let', continuous: 'letting' },
  'put': { past: 'put', pastParticiple: 'put', continuous: 'putting' },
  'shut': { past: 'shut', pastParticiple: 'shut', continuous: 'shutting' },
  'spread': { past: 'spread', pastParticiple: 'spread', continuous: 'spreading' },
  'upset': { past: 'upset', pastParticiple: 'upset', continuous: 'upsetting' },
  'bet': { past: 'bet', pastParticiple: 'bet', continuous: 'betting' },
  'bid': { past: 'bid', pastParticiple: 'bid', continuous: 'bidding' },
  'broadcast': { past: 'broadcast', pastParticiple: 'broadcast', continuous: 'broadcasting' },
  'burst': { past: 'burst', pastParticiple: 'burst', continuous: 'bursting' },
  'forecast': { past: 'forecast', pastParticiple: 'forecast', continuous: 'forecasting' },
  'hurt': { past: 'hurt', pastParticiple: 'hurt', continuous: 'hurting' },
  'knit': { past: 'knit', pastParticiple: 'knit', continuous: 'knitting' },
  'quit': { past: 'quit', pastParticiple: 'quit', continuous: 'quitting' },
  'rid': { past: 'rid', pastParticiple: 'rid', continuous: 'ridding' },
  'set': { past: 'set', pastParticiple: 'set', continuous: 'setting' },
  'shed': { past: 'shed', pastParticiple: 'shed', continuous: 'shedding' },
  'shut': { past: 'shut', pastParticiple: 'shut', continuous: 'shutting' },
  'slit': { past: 'slit', pastParticiple: 'slit', continuous: 'slitting' },
  'spit': { past: 'spat', pastParticiple: 'spat', continuous: 'spitting' },
  'split': { past: 'split', pastParticiple: 'split', continuous: 'splitting' },
  'spread': { past: 'spread', pastParticiple: 'spread', continuous: 'spreading' },
  'thrust': { past: 'thrust', pastParticiple: 'thrust', continuous: 'thrusting' },
  'wet': { past: 'wet', pastParticiple: 'wet', continuous: 'wetting' },
}

// Reverse map for irregular verbs
const irregularVerbBase: Record<string, string> = {}
Object.entries(irregularVerbs).forEach(([base, forms]) => {
  irregularVerbBase[forms.past] = base
  irregularVerbBase[forms.pastParticiple] = base
  irregularVerbBase[forms.continuous] = base
})

/**
 * Check if a character is a vowel
 */
function isVowel(char: string): boolean {
  return ['a', 'e', 'i', 'o', 'u'].includes(char.toLowerCase())
}

/**
 * Generate simple plural form
 */
function generatePlural(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Too short
  if (lowerWord.length < 2) return null
  
  // Words that should not have plurals (common verbs, etc.)
  const noPluralWords = new Set([
    'go', 'do', 'be', 'have', 'will', 'shall', 'can', 'may', 'must',
    'am', 'is', 'are', 'was', 'were', 'been', 'being',
    'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'this', 'that', 'these', 'those',
    'here', 'there', 'where', 'when', 'why', 'how',
    'and', 'but', 'or', 'nor', 'for', 'yet', 'so',
    'not', 'no', 'yes', 'please', 'thanks', 'thank',
  ])
  if (noPluralWords.has(lowerWord)) return null
  
  // Irregular plurals
  if (irregularPlurals[lowerWord]) {
    return irregularPlurals[lowerWord]
  }
  
  // Words ending in 'y' with consonant before
  if (lowerWord.endsWith('y') && !isVowel(lowerWord[lowerWord.length - 2])) {
    return lowerWord.slice(0, -1) + 'ies'
  }
  
  // Words ending in s, x, z, ch, sh, o
  if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z') || 
      lowerWord.endsWith('ch') || lowerWord.endsWith('sh')) {
    return lowerWord + 'es'
  }
  
  // Words ending in 'o' - some take 'es', some take 's'
  // Common words that take 'es': potato, tomato, hero, echo, veto
  // Most others just take 's'
  const oEsWords = new Set(['potato', 'tomato', 'hero', 'echo', 'veto', 'torpedo', 'mosquito', 'buffalo'])
  if (lowerWord.endsWith('o')) {
    if (oEsWords.has(lowerWord)) {
      return lowerWord + 'es'
    }
    return lowerWord + 's'
  }
  
  // Words ending in 'f' or 'fe' (some common ones)
  if (lowerWord.endsWith('f') && !lowerWord.endsWith('ff')) {
    return lowerWord.slice(0, -1) + 'ves'
  }
  if (lowerWord.endsWith('fe')) {
    return lowerWord.slice(0, -2) + 'ves'
  }
  
  // Regular plural
  return lowerWord + 's'
}

/**
 * Generate singular form from plural
 */
function generateSingular(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Irregular singulars
  if (irregularSingulars[lowerWord]) {
    return irregularSingulars[lowerWord]
  }
  
  // Words ending in 'ies'
  if (lowerWord.endsWith('ies') && lowerWord.length > 4) {
    return lowerWord.slice(0, -3) + 'y'
  }
  
  // Words ending in 'ves'
  if (lowerWord.endsWith('ves')) {
    return lowerWord.slice(0, -3) + 'f'
  }
  
  // Words ending in 'es' after s, x, z, ch, sh
  if (lowerWord.endsWith('es')) {
    if (lowerWord.endsWith('ses') || lowerWord.endsWith('xes') || 
        lowerWord.endsWith('zes') || lowerWord.endsWith('ches') || 
        lowerWord.endsWith('shes')) {
      return lowerWord.slice(0, -2)
    }
  }
  
  // Words ending in 's' (not 'ss')
  if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 3) {
    return lowerWord.slice(0, -1)
  }
  
  return null
}

/**
 * Generate simple past tense
 */
function generatePastTense(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Too short
  if (lowerWord.length < 2) return null
  
  // Irregular verbs
  if (irregularVerbs[lowerWord]) {
    return irregularVerbs[lowerWord].past
  }
  
  // Words ending in 'e'
  if (lowerWord.endsWith('e')) {
    return lowerWord + 'd'
  }
  
  // Words ending in 'y' with consonant before
  if (lowerWord.endsWith('y') && !isVowel(lowerWord[lowerWord.length - 2])) {
    return lowerWord.slice(0, -1) + 'ied'
  }
  
  // Regular past tense
  return lowerWord + 'ed'
}

/**
 * Generate continuous form (-ing)
 */
function generateContinuous(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Too short
  if (lowerWord.length < 2) return null
  
  // Irregular verbs
  if (irregularVerbs[lowerWord]) {
    return irregularVerbs[lowerWord].continuous
  }
  
  // Words ending in 'e' (not 'ee')
  if (lowerWord.endsWith('e') && !lowerWord.endsWith('ee')) {
    return lowerWord.slice(0, -1) + 'ing'
  }
  
  // Words ending in 'y' - just add 'ing'
  if (lowerWord.endsWith('y')) {
    return lowerWord + 'ing'
  }
  
  // CVC pattern - double final consonant (but not for 'y')
  const lastChar = lowerWord[lowerWord.length - 1]
  if (lowerWord.length >= 3 && 
      !isVowel(lastChar) && 
      lastChar !== 'y' &&
      isVowel(lowerWord[lowerWord.length - 2]) &&
      !isVowel(lowerWord[lowerWord.length - 3])) {
    return lowerWord + lastChar + 'ing'
  }
  
  // Regular continuous
  return lowerWord + 'ing'
}

/**
 * Generate third person singular (-s/-es)
 */
function generateThirdPerson(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Too short
  if (lowerWord.length < 2) return null
  
  // Words ending in 'y' with consonant before
  if (lowerWord.endsWith('y') && !isVowel(lowerWord[lowerWord.length - 2])) {
    return lowerWord.slice(0, -1) + 'ies'
  }
  
  // Words ending in s, x, z, ch, sh, o
  if (lowerWord.endsWith('s') || lowerWord.endsWith('x') || lowerWord.endsWith('z') || 
      lowerWord.endsWith('ch') || lowerWord.endsWith('sh') || lowerWord.endsWith('o')) {
    return lowerWord + 'es'
  }
  
  // Regular third person
  return lowerWord + 's'
}

/**
 * Find base verb from conjugated form
 */
function findBaseVerb(word: string): string | null {
  const lowerWord = word.toLowerCase()
  
  // Check irregular verbs reverse map
  if (irregularVerbBase[lowerWord]) {
    return irregularVerbBase[lowerWord]
  }
  
  // Check for -ing ending
  if (lowerWord.endsWith('ing') && lowerWord.length > 5) {
    // Could be base + ing or base - e + ing
    const possibleBase1 = lowerWord.slice(0, -3)
    const possibleBase2 = lowerWord.slice(0, -3) + 'e'
    // Check for doubled consonant
    const possibleBase3 = lowerWord.length > 6 && 
                          lowerWord[lowerWord.length - 4] === lowerWord[lowerWord.length - 5] ?
                          lowerWord.slice(0, -4) : null
    
    return possibleBase1 || possibleBase2 || possibleBase3
  }
  
  // Check for -ed ending
  if (lowerWord.endsWith('ed') && lowerWord.length > 4) {
    const possibleBase1 = lowerWord.slice(0, -2)
    const possibleBase2 = lowerWord.slice(0, -1)
    const possibleBase3 = lowerWord.slice(0, -3) + 'y'
    
    return possibleBase1 || possibleBase2 || possibleBase3
  }
  
  // Check for -ies ending (third person)
  if (lowerWord.endsWith('ies') && lowerWord.length > 4) {
    return lowerWord.slice(0, -3) + 'y'
  }
  
  // Check for -es ending
  if (lowerWord.endsWith('es') && lowerWord.length > 4) {
    return lowerWord.slice(0, -2)
  }
  
  // Check for -s ending (not -ss)
  if (lowerWord.endsWith('s') && !lowerWord.endsWith('ss') && lowerWord.length > 3) {
    return lowerWord.slice(0, -1)
  }
  
  return null
}

/**
 * Generate all common variations for a word
 */
export function generateVariations(word: string): Map<string, string> {
  const variations = new Map<string, string>()
  const lowerWord = word.toLowerCase()
  
  // Skip very short words
  if (lowerWord.length < 2) return variations
  
  // Add original word
  variations.set(lowerWord, 'original')
  
  // Plural forms (added first, takes priority)
  const plural = generatePlural(lowerWord)
  if (plural && !variations.has(plural)) {
    variations.set(plural, 'plural')
  }
  
  // Singular form (if word might be plural)
  const singular = generateSingular(lowerWord)
  if (singular && !variations.has(singular)) {
    variations.set(singular, 'singular')
  }
  
  // Verb forms
  const past = generatePastTense(lowerWord)
  if (past && !variations.has(past)) {
    variations.set(past, 'past')
  }
  
  const continuous = generateContinuous(lowerWord)
  if (continuous && !variations.has(continuous)) {
    variations.set(continuous, 'continuous')
  }
  
  const third = generateThirdPerson(lowerWord)
  // Only add third person if it's different from plural (avoid duplicate)
  if (third && !variations.has(third)) {
    variations.set(third, 'present')
  }
  
  // Find base verb if this is a conjugated form
  const baseVerb = findBaseVerb(lowerWord)
  if (baseVerb && baseVerb !== lowerWord && !variations.has(baseVerb)) {
    variations.set(baseVerb, 'base')
  }
  
  return variations
}

/**
 * Create a map of word variations to their original word info
 */
export function createVariationMap(savedWords: Array<{ id: string; word: string; translation: string }>): Map<string, { id: string; word: string; translation: string; variationType: string }> {
  const map = new Map<string, { id: string; word: string; translation: string; variationType: string }>()
  
  // الخطوة 1: جمع الكلمات المركبة أولاً لتحديد مكوناتها
  const multiWordComponents = new Set<string>()
  
  savedWords.forEach(w => {
    const lowerWord = w.word.toLowerCase().trim()
    if (lowerWord.includes(' ')) {
      // أضف كل كلمة مفردة داخل العبارة المركبة للمجموعة
      lowerWord.split(/\s+/).forEach(component => {
        if (component.length >= 2) {
          multiWordComponents.add(component)
        }
      })
    }
  })
  
  // الخطوة 2: معالجة الكلمات
  savedWords.forEach(w => {
    const lowerWord = w.word.toLowerCase().trim()
    
    // Skip empty or very short words
    if (!lowerWord || lowerWord.length < 2) return
    
    // تخطي الكلمات المفردة التي هي جزء من عبارة مركبة بالكامل
    // لأنها ستُبرز كجزء من العبارة المركبة
    if (multiWordComponents.has(lowerWord)) {
      // لا تضيف الكلمة المفردة للخريطة - ستُبرز كجزء من العبارة المركبة
      return
    }
    
    // Add the original word
    map.set(lowerWord, { id: w.id, word: lowerWord, translation: w.translation, variationType: 'original' })
    
    // Skip variations for multi-word phrases (they don't have standard plural/past forms)
    if (lowerWord.includes(' ')) {
      return
    }
    
    // Generate and add variations (only for single words)
    const variations = generateVariations(lowerWord)
    variations.forEach((variationType, form) => {
      if (!map.has(form)) {
        map.set(form, { id: w.id, word: lowerWord, translation: w.translation, variationType })
      }
    })
  })
  
  return map
}

/**
 * Get the variation type label in Arabic
 */
export function getVariationTypeLabel(variationType: string): string {
  const labels: Record<string, string> = {
    'original': '',
    'plural': 'جمع',
    'singular': 'مفرد',
    'past': 'ماضي',
    'continuous': 'مستمر',
    'present': 'مضارع',
    'base': 'الأصل',
  }
  return labels[variationType] || variationType
}
