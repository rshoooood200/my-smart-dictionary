import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sampleGames = [
  // Memory Game - Animals
  {
    title: 'Animal Memory',
    titleAr: 'ذاكرة الحيوانات',
    description: 'Match animals with their names',
    descriptionAr: 'طابق الحيوانات مع أسمائها',
    category: 'animals',
    type: 'memory',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 15,
    config: JSON.stringify({
      cards: [
        { word: '🐱 Cat', translation: 'قطة' },
        { word: '🐕 Dog', translation: 'كلب' },
        { word: '🐦 Bird', translation: 'طائر' },
        { word: '🐟 Fish', translation: 'سمكة' },
        { word: '🦁 Lion', translation: 'أسد' },
        { word: '🐘 Elephant', translation: 'فيل' }
      ]
    }),
    order: 1,
    isActive: true
  },
  // Matching Game - Alphabet
  {
    title: 'Alphabet Match',
    titleAr: 'مطابقة الحروف',
    description: 'Match letters with words',
    descriptionAr: 'طابق الحروف مع الكلمات',
    category: 'alphabet',
    type: 'matching',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 10,
    config: JSON.stringify({
      pairs: [
        { left: 'A 🍎', right: 'أ - تفاحة' },
        { left: 'B 🏀', right: 'ب - كرة' },
        { left: 'C 🐱', right: 'ت - قطة' },
        { left: 'D 🐕', right: 'د - كلب' },
        { left: 'E 🐘', right: 'هـ - فيل' }
      ]
    }),
    order: 2,
    isActive: true
  },
  // Matching Game - Colors
  {
    title: 'Color Match',
    titleAr: 'مطابقة الألوان',
    description: 'Match colors with their names',
    descriptionAr: 'طابق الألوان مع أسمائها',
    category: 'colors',
    type: 'matching',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 10,
    config: JSON.stringify({
      pairs: [
        { left: '🔴 Red', right: 'أحمر' },
        { left: '🔵 Blue', right: 'أزرق' },
        { left: '🟢 Green', right: 'أخضر' },
        { left: '🟡 Yellow', right: 'أصفر' },
        { left: '🟣 Purple', right: 'بنفسجي' }
      ]
    }),
    order: 3,
    isActive: true
  },
  // Scramble Game - Simple Words
  {
    title: 'Word Scramble',
    titleAr: 'ترتيب الكلمات',
    description: 'Unscramble the letters to form words',
    descriptionAr: 'رتب الحروف لتكوين كلمات',
    category: 'alphabet',
    type: 'scramble',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 15,
    config: JSON.stringify({
      words: [
        { scrambled: 'C A T', original: 'CAT', hint: '🐱 قطة' },
        { scrambled: 'D O G', original: 'DOG', hint: '🐕 كلب' },
        { scrambled: 'S U N', original: 'SUN', hint: '☀️ شمس' },
        { scrambled: 'C A R', original: 'CAR', hint: '🚗 سيارة' },
        { scrambled: 'B O Y', original: 'BOY', hint: '👦 ولد' }
      ]
    }),
    order: 4,
    isActive: true
  },
  // Memory Game - Numbers
  {
    title: 'Number Memory',
    titleAr: 'ذاكرة الأرقام',
    description: 'Match numbers with their words',
    descriptionAr: 'طابق الأرقام مع كلماتها',
    category: 'numbers',
    type: 'memory',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 15,
    config: JSON.stringify({
      cards: [
        { word: '1️⃣ One', translation: 'واحد' },
        { word: '2️⃣ Two', translation: 'اثنان' },
        { word: '3️⃣ Three', translation: 'ثلاثة' },
        { word: '4️⃣ Four', translation: 'أربعة' },
        { word: '5️⃣ Five', translation: 'خمسة' },
        { word: '6️⃣ Six', translation: 'ستة' }
      ]
    }),
    order: 5,
    isActive: true
  },
  // Matching Game - Food
  {
    title: 'Food Match',
    titleAr: 'مطابقة الطعام',
    description: 'Match food items with their names',
    descriptionAr: 'طابق أصناف الطعام مع أسمائها',
    category: 'food',
    type: 'matching',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 10,
    config: JSON.stringify({
      pairs: [
        { left: '🍎 Apple', right: 'تفاحة' },
        { left: '🍌 Banana', right: 'موزة' },
        { left: '🍊 Orange', right: 'برتقالة' },
        { left: '🍇 Grapes', right: 'عنب' },
        { left: '🍞 Bread', right: 'خبز' }
      ]
    }),
    order: 6,
    isActive: true
  },
  // Adventure Game - Alphabet Adventure
  {
    title: 'Alphabet Adventure',
    titleAr: 'مغامرة الحروف',
    description: 'Learn the English alphabet through an adventure',
    descriptionAr: 'تعلم الحروف الإنجليزية من خلال مغامرة',
    category: 'alphabet',
    type: 'adventure',
    difficulty: 'easy',
    ageGroup: '5-7',
    xpReward: 20,
    config: JSON.stringify({
      name: 'Alphabet Adventure',
      description: 'تعلم الحروف الإنجليزية',
      instructions: 'ساعد الشخصيات في إيجاد الحرف الصحيح!',
      gameplay: [
        {
          stage: 1,
          instruction: 'اختر الحرف الصحيح',
          question: 'أين الحرف A؟',
          choices: [
            { letter: 'A', image: '🍎' },
            { letter: 'B', image: '🏀' },
            { letter: 'C', image: '🐱' }
          ],
          correct_answer: 'A'
        },
        {
          stage: 2,
          instruction: 'اختر الحرف الصحيح',
          question: 'أين الحرف B؟',
          choices: [
            { letter: 'D', image: '🐕' },
            { letter: 'B', image: '🏀' },
            { letter: 'E', image: '🐘' }
          ],
          correct_answer: 'B'
        },
        {
          stage: 3,
          instruction: 'اختر الحرف الصحيح',
          question: 'أين الحرف C؟',
          choices: [
            { letter: 'F', image: '🐟' },
            { letter: 'G', image: '🍇' },
            { letter: 'C', image: '🐱' }
          ],
          correct_answer: 'C'
        }
      ],
      completion_message: 'أحسنت! تعلمت حروفاً جديدة اليوم!',
      feedback: {
        correct: 'ممتاز! إجابة صحيحة!',
        incorrect: 'حاول مرة أخرى!'
      }
    }),
    order: 7,
    isActive: true
  }
]

async function main() {
  console.log('Seeding kids games...')
  
  for (const game of sampleGames) {
    const existing = await prisma.kidsGame.findFirst({
      where: { title: game.title }
    })
    
    if (!existing) {
      await prisma.kidsGame.create({ data: game as any })
      console.log(`Created game: ${game.title}`)
    } else {
      console.log(`Game already exists: ${game.title}`)
    }
  }
  
  console.log('Done seeding kids games!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
