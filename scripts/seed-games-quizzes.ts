import { db } from '../src/lib/db';

// ==================== الأشبال (Kids) ====================
// الفئات العمرية: 5-7, 7-9, 9-11, 11-14

const kidsGames = [
  // ========== الحروف (Alphabet) - 5-7 سنوات ==========
  {
    title: "مطابقة الحروف",
    titleAr: "مطابقة الحروف الأساسية",
    description: "Match letters A-F with their Arabic pronunciation",
    descriptionAr: "طابق الحروف من A إلى F مع نطقها العربي",
    category: "alphabet",
    type: "matching",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 10,
    config: {
      pairs: [
        { left: "A a", right: "أ" },
        { left: "B b", right: "ب" },
        { left: "C c", right: "ت" },
        { left: "D d", right: "د" },
        { left: "E e", right: "إ" },
        { left: "F f", right: "ف" }
      ]
    },
    order: 1
  },
  {
    title: "ذاكرة الحروف",
    titleAr: "لعبة ذاكرة الحروف",
    description: "Find matching letter pairs",
    descriptionAr: "ابحث عن أزواج الحروف المتطابقة",
    category: "alphabet",
    type: "memory",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    config: {
      cards: [
        { word: "A 🍎", translation: "أ - تفاحة" },
        { word: "B 🏀", translation: "ب - كرة" },
        { word: "C 🐱", translation: "ت - قطة" },
        { word: "D 🐕", translation: "د - كلب" },
        { word: "E 🐘", translation: "إ - فيل" },
        { word: "F 🐟", translation: "ف - سمكة" }
      ]
    },
    order: 2
  },
  {
    title: "ترتيب الحروف",
    titleAr: "رتّب الحروف",
    description: "Unscramble the letters",
    descriptionAr: "أعد ترتيب الحروف لتكوين الكلمة الصحيحة",
    category: "alphabet",
    type: "scramble",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 12,
    config: {
      words: [
        { scrambled: "A B C", original: "ABC", hint: "الحروف الثلاثة الأولى" },
        { scrambled: "C A T", original: "CAT", hint: "قطة" },
        { scrambled: "D O G", original: "DOG", hint: "كلب" },
        { scrambled: "F I S H", original: "FISH", hint: "سمكة" }
      ]
    },
    order: 3
  },

  // ========== الحروف (Alphabet) - 7-9 سنوات ==========
  {
    title: "مطابقة الحروف المتقدمة",
    titleAr: "مطابقة الحروف G-M",
    description: "Match letters G-M with words",
    descriptionAr: "طابق الحروف من G إلى M مع الكلمات",
    category: "alphabet",
    type: "matching",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 15,
    config: {
      pairs: [
        { left: "G - Giraffe 🦒", right: "ج - زرافة" },
        { left: "H - House 🏠", right: "هـ - منزل" },
        { left: "I - Ice cream 🍦", right: "ي - آيس كريم" },
        { left: "J - Juice 🧃", right: "ج - عصير" },
        { left: "K - Key 🔑", right: "ك - مفتاح" },
        { left: "L - Lion 🦁", right: "ل - أسد" },
        { left: "M - Moon 🌙", right: "م - قمر" }
      ]
    },
    order: 4
  },
  {
    title: "ذاكرة الحروف المتقدمة",
    titleAr: "لعبة ذاكرة الحروف G-M",
    description: "Memory game with letters G-M",
    descriptionAr: "لعبة ذاكرة مع الحروف من G إلى M",
    category: "alphabet",
    type: "memory",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 20,
    config: {
      cards: [
        { word: "G 🦒", translation: "ج - زرافة" },
        { word: "H 🏠", translation: "هـ - منزل" },
        { word: "I 🍦", translation: "ي - آيس كريم" },
        { word: "J 🧃", translation: "ج - عصير" },
        { word: "K 🔑", translation: "ك - مفتاح" },
        { word: "L 🦁", translation: "ل - أسد" },
        { word: "M 🌙", translation: "م - قمر" }
      ]
    },
    order: 5
  },

  // ========== الأرقام (Numbers) - 5-7 سنوات ==========
  {
    title: "مطابقة الأرقام",
    titleAr: "مطابقة الأرقام 1-10",
    description: "Match numbers with their Arabic names",
    descriptionAr: "طابق الأرقام مع أسمائها العربية",
    category: "numbers",
    type: "matching",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 10,
    config: {
      pairs: [
        { left: "1️⃣ One", right: "واحد" },
        { left: "2️⃣ Two", right: "اثنان" },
        { left: "3️⃣ Three", right: "ثلاثة" },
        { left: "4️⃣ Four", right: "أربعة" },
        { left: "5️⃣ Five", right: "خمسة" },
        { left: "6️⃣ Six", right: "ستة" }
      ]
    },
    order: 6
  },
  {
    title: "ذاكرة الأرقام",
    titleAr: "لعبة ذاكرة الأرقام",
    description: "Match numbers with words",
    descriptionAr: "طابق الأرقام مع الكلمات",
    category: "numbers",
    type: "memory",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    config: {
      cards: [
        { word: "1", translation: "One" },
        { word: "2", translation: "Two" },
        { word: "3", translation: "Three" },
        { word: "4", translation: "Four" },
        { word: "5", translation: "Five" },
        { word: "6", translation: "Six" }
      ]
    },
    order: 7
  },

  // ========== الأرقام (Numbers) - 7-9 سنوات ==========
  {
    title: "مطابقة الأرقام المتقدمة",
    titleAr: "مطابقة الأرقام 10-20",
    description: "Match numbers 10-20",
    descriptionAr: "طابق الأرقام من 10 إلى 20",
    category: "numbers",
    type: "matching",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 15,
    config: {
      pairs: [
        { left: "10 Ten", right: "عشرة" },
        { left: "11 Eleven", right: "أحد عشر" },
        { left: "12 Twelve", right: "اثنا عشر" },
        { left: "13 Thirteen", right: "ثلاثة عشر" },
        { left: "14 Fourteen", right: "أربعة عشر" },
        { left: "15 Fifteen", right: "خمسة عشر" },
        { left: "20 Twenty", right: "عشرون" }
      ]
    },
    order: 8
  },
  {
    title: "ترتيب الأرقام",
    titleAr: "رتّب الأرقام",
    description: "Unscramble number words",
    descriptionAr: "أعد ترتيب الحروف لتكوين رقم صحيح",
    category: "numbers",
    type: "scramble",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 15,
    config: {
      words: [
        { scrambled: "nOe", original: "One", hint: "1" },
        { scrambled: "wTo", original: "Two", hint: "2" },
        { scrambled: "rheTe", original: "Three", hint: "3" },
        { scrambled: "ruFoi", original: "Four", hint: "4" },
        { scrambled: "veFi", original: "Five", hint: "5" },
        { scrambled: "enT", original: "Ten", hint: "10" }
      ]
    },
    order: 9
  },

  // ========== الألوان (Colors) - 5-7 سنوات ==========
  {
    title: "مطابقة الألوان",
    titleAr: "مطابقة الألوان الأساسية",
    description: "Match colors with their Arabic names",
    descriptionAr: "طابق الألوان مع أسمائها العربية",
    category: "colors",
    type: "matching",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 10,
    config: {
      pairs: [
        { left: "🔴 Red", right: "أحمر" },
        { left: "🔵 Blue", right: "أزرق" },
        { left: "🟢 Green", right: "أخضر" },
        { left: "🟡 Yellow", right: "أصفر" },
        { left: "🟠 Orange", right: "برتقالي" },
        { left: "🟣 Purple", right: "بنفسجي" }
      ]
    },
    order: 10
  },
  {
    title: "ذاكرة الألوان",
    titleAr: "لعبة ذاكرة الألوان",
    description: "Match color pairs",
    descriptionAr: "ابحث عن أزواج الألوان المتطابقة",
    category: "colors",
    type: "memory",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    config: {
      cards: [
        { word: "🔴 Red", translation: "أحمر" },
        { word: "🔵 Blue", translation: "أزرق" },
        { word: "🟢 Green", translation: "أخضر" },
        { word: "🟡 Yellow", translation: "أصفر" },
        { word: "🟠 Orange", translation: "برتقالي" },
        { word: "🟣 Purple", translation: "بنفسجي" }
      ]
    },
    order: 11
  },

  // ========== الحيوانات (Animals) - 5-7 سنوات ==========
  {
    title: "مطابقة الحيوانات",
    titleAr: "مطابقة الحيوانات",
    description: "Match animals with their Arabic names",
    descriptionAr: "طابق الحيوانات مع أسمائها العربية",
    category: "animals",
    type: "matching",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 10,
    config: {
      pairs: [
        { left: "🐱 Cat", right: "قطة" },
        { left: "🐕 Dog", right: "كلب" },
        { left: "🐦 Bird", right: "طائر" },
        { left: "🐟 Fish", right: "سمكة" },
        { left: "🐰 Rabbit", right: "أرنب" },
        { left: "🐻 Bear", right: "دب" }
      ]
    },
    order: 12
  },
  {
    title: "ذاكرة الحيوانات",
    titleAr: "لعبة ذاكرة الحيوانات",
    description: "Match animal pairs",
    descriptionAr: "ابحث عن أزواج الحيوانات المتطابقة",
    category: "animals",
    type: "memory",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    config: {
      cards: [
        { word: "🐱 Cat", translation: "قطة" },
        { word: "🐕 Dog", translation: "كلب" },
        { word: "🦁 Lion", translation: "أسد" },
        { word: "🐘 Elephant", translation: "فيل" },
        { word: "🐒 Monkey", translation: "قرد" },
        { word: "🦋 Butterfly", translation: "فراشة" }
      ]
    },
    order: 13
  },

  // ========== الحيوانات (Animals) - 7-9 سنوات ==========
  {
    title: "حيوانات المزرعة",
    titleAr: "حيوانات المزرعة",
    description: "Learn farm animals",
    descriptionAr: "تعلم حيوانات المزرعة",
    category: "animals",
    type: "matching",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 15,
    config: {
      pairs: [
        { left: "🐄 Cow", right: "بقرة" },
        { left: "🐴 Horse", right: "حصان" },
        { left: "🐑 Sheep", right: "خروف" },
        { left: "🐔 Chicken", right: "دجاجة" },
        { left: "🐷 Pig", right: "خنزير" },
        { left: "🦆 Duck", right: "بطة" }
      ]
    },
    order: 14
  },
  {
    title: "حيوانات البحر",
    titleAr: "حيوانات البحر",
    description: "Learn sea animals",
    descriptionAr: "تعلم حيوانات البحر",
    category: "animals",
    type: "matching",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 15,
    config: {
      pairs: [
        { left: "🐬 Dolphin", right: "دولفين" },
        { left: "🦈 Shark", right: "قرش" },
        { left: "🐙 Octopus", right: "أخطبوط" },
        { left: "🐢 Turtle", right: "سلحفاة" },
        { left: "🦀 Crab", right: "سرطان" },
        { left: "🐠 Tropical Fish", right: "سمكة استوائية" }
      ]
    },
    order: 15
  },

  // ========== الطعام (Food) - 5-7 سنوات ==========
  {
    title: "مطابقة الفواكه",
    titleAr: "مطابقة الفواكه",
    description: "Match fruits with their names",
    descriptionAr: "طابق الفواكه مع أسمائها",
    category: "food",
    type: "matching",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 10,
    config: {
      pairs: [
        { left: "🍎 Apple", right: "تفاحة" },
        { left: "🍌 Banana", right: "موزة" },
        { left: "🍊 Orange", right: "برتقالة" },
        { left: "🍇 Grapes", right: "عنب" },
        { left: "🍓 Strawberry", right: "فراولة" },
        { left: "🍉 Watermelon", right: "بطيخ" }
      ]
    },
    order: 16
  },
  {
    title: "ذاكرة الفواكه",
    titleAr: "لعبة ذاكرة الفواكه",
    description: "Match fruit pairs",
    descriptionAr: "ابحث عن أزواج الفواكه المتطابقة",
    category: "food",
    type: "memory",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    config: {
      cards: [
        { word: "🍎 Apple", translation: "تفاحة" },
        { word: "🍌 Banana", translation: "موزة" },
        { word: "🍊 Orange", translation: "برتقالة" },
        { word: "🍇 Grapes", translation: "عنب" },
        { word: "🍓 Strawberry", translation: "فراولة" },
        { word: "🍉 Watermelon", translation: "بطيخ" }
      ]
    },
    order: 17
  },

  // ========== الجسم (Body) - 5-7 سنوات ==========
  {
    title: "أجزاء الجسم",
    titleAr: "أجزاء الجسم الأساسية",
    description: "Learn body parts",
    descriptionAr: "تعلم أجزاء الجسم",
    category: "body",
    type: "matching",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 10,
    config: {
      pairs: [
        { left: "👀 Eyes", right: "عينان" },
        { left: "👂 Ears", right: "أذنان" },
        { left: "👃 Nose", right: "أنف" },
        { left: "👄 Mouth", right: "فم" },
        { left: "✋ Hand", right: "يد" },
        { left: "🦶 Foot", right: "قدم" }
      ]
    },
    order: 18
  },
  {
    title: "ذاكرة الجسم",
    titleAr: "لعبة ذاكرة أجزاء الجسم",
    description: "Match body parts",
    descriptionAr: "طابق أجزاء الجسم",
    category: "body",
    type: "memory",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    config: {
      cards: [
        { word: "👀 Eyes", translation: "عينان" },
        { word: "👂 Ears", translation: "أذنان" },
        { word: "👃 Nose", translation: "أنف" },
        { word: "👄 Mouth", translation: "فم" },
        { word: "✋ Hand", translation: "يد" },
        { word: "🦶 Foot", translation: "قدم" }
      ]
    },
    order: 19
  },

  // ========== الجسم (Body) - 9-11 سنوات ==========
  {
    title: "أجزاء الجسم المتقدمة",
    titleAr: "أجزاء الجسم المتقدمة",
    description: "Learn more body parts",
    descriptionAr: "تعلم المزيد من أجزاء الجسم",
    category: "body",
    type: "matching",
    difficulty: "medium",
    ageGroup: "9-11",
    xpReward: 20,
    config: {
      pairs: [
        { left: "🦴 Skeleton", right: "هيكل عظمي" },
        { left: "💪 Muscle", right: "عضلة" },
        { left: "🫀 Heart", right: "قلب" },
        { left: "🫁 Lungs", right: "رئتان" },
        { left: "🧠 Brain", right: "دماغ" },
        { left: "🦷 Teeth", right: "أسنان" }
      ]
    },
    order: 20
  }
];

const kidsQuizzes = [
  // ========== اختبارات الحروف ==========
  {
    title: "اختبار الحروف الأساسية",
    titleAr: "اختبار الحروف A-F",
    description: "Test your knowledge of letters A-F",
    descriptionAr: "اختبر معرفتك بالحروف من A إلى F",
    category: "alphabet",
    type: "multiple_choice",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    timeLimit: 120,
    questions: [
      {
        question: "ما هو الحرف الأول في اللغة الإنجليزية؟",
        questionAr: "What is the first letter in English?",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0
      },
      {
        question: "ما معنى حرف B؟",
        questionAr: "What does the letter B represent?",
        options: ["ت", "ب", "ث", "ج"],
        correctAnswer: 1
      },
      {
        question: "أي حرف يمثل 🐱 (قطة)؟",
        questionAr: "Which letter represents a cat?",
        options: ["A", "B", "C", "D"],
        correctAnswer: 2
      },
      {
        question: "ما هو الحرف الذي يلي C؟",
        questionAr: "What letter comes after C?",
        options: ["B", "D", "E", "F"],
        correctAnswer: 1
      },
      {
        question: "ما معنى حرف F بالعربية؟",
        questionAr: "What does F mean in Arabic?",
        options: ["ف", "ق", "ك", "ل"],
        correctAnswer: 0
      }
    ],
    order: 1
  },
  {
    title: "اختبار الحروف المتقدم",
    titleAr: "اختبار الحروف G-M",
    description: "Test your knowledge of letters G-M",
    descriptionAr: "اختبر معرفتك بالحروف من G إلى M",
    category: "alphabet",
    type: "multiple_choice",
    difficulty: "medium",
    ageGroup: "7-9",
    xpReward: 20,
    timeLimit: 180,
    questions: [
      {
        question: "ما الحرف الذي يمثل 🦒 (زرافة)؟",
        questionAr: "Which letter represents a giraffe?",
        options: ["F", "G", "H", "I"],
        correctAnswer: 1
      },
      {
        question: "ما معنى حرف H؟",
        questionAr: "What does H mean?",
        options: ["ج", "ح", "هـ", "و"],
        correctAnswer: 2
      },
      {
        question: "أي حرف يمثل 🌙 (قمر)؟",
        questionAr: "Which letter represents the moon?",
        options: ["K", "L", "M", "N"],
        correctAnswer: 2
      },
      {
        question: "كم عدد الحروف بين G و M؟",
        questionAr: "How many letters are between G and M?",
        options: ["5", "6", "7", "4"],
        correctAnswer: 0
      },
      {
        question: "ما الحرف الذي يلي J؟",
        questionAr: "What letter comes after J?",
        options: ["I", "K", "L", "H"],
        correctAnswer: 1
      },
      {
        question: "أي حرف يمثل 🦁 (أسد)؟",
        questionAr: "Which letter represents a lion?",
        options: ["K", "L", "M", "N"],
        correctAnswer: 1
      }
    ],
    order: 2
  },

  // ========== اختبارات الأرقام ==========
  {
    title: "اختبار الأرقام",
    titleAr: "اختبار الأرقام 1-10",
    description: "Test your knowledge of numbers",
    descriptionAr: "اختبر معرفتك بالأرقام",
    category: "numbers",
    type: "multiple_choice",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    timeLimit: 120,
    questions: [
      {
        question: "ما هو الرقم One بالعربية؟",
        questionAr: "What is One in Arabic?",
        options: ["واحد", "اثنان", "ثلاثة", "أربعة"],
        correctAnswer: 0
      },
      {
        question: "ما هو الرقم 3 بالإنجليزية؟",
        questionAr: "What is 3 in English?",
        options: ["One", "Two", "Three", "Four"],
        correctAnswer: 2
      },
      {
        question: "كم هو 2 + 2؟",
        questionAr: "What is 2 + 2?",
        options: ["Three", "Four", "Five", "Six"],
        correctAnswer: 1
      },
      {
        question: "ما الرقم الذي يلي Five؟",
        questionAr: "What number comes after Five?",
        options: ["Four", "Six", "Seven", "Eight"],
        correctAnswer: 1
      },
      {
        question: "ما معنى Ten بالعربية؟",
        questionAr: "What does Ten mean in Arabic?",
        options: ["ثمانية", "تسعة", "عشرة", "أحد عشر"],
        correctAnswer: 2
      }
    ],
    order: 3
  },

  // ========== اختبارات الألوان ==========
  {
    title: "اختبار الألوان",
    titleAr: "اختبار الألوان الأساسية",
    description: "Test your knowledge of colors",
    descriptionAr: "اختبر معرفتك بالألوان",
    category: "colors",
    type: "multiple_choice",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    timeLimit: 120,
    questions: [
      {
        question: "ما لون 🔴؟",
        questionAr: "What color is 🔴?",
        options: ["Blue", "Red", "Green", "Yellow"],
        correctAnswer: 1
      },
      {
        question: "ما معنى Blue بالعربية؟",
        questionAr: "What does Blue mean in Arabic?",
        options: ["أحمر", "أخضر", "أزرق", "أصفر"],
        correctAnswer: 2
      },
      {
        question: "ما لون العشب؟",
        questionAr: "What color is grass?",
        options: ["Red", "Blue", "Green", "Yellow"],
        correctAnswer: 2
      },
      {
        question: "ما لون الشمس؟",
        questionAr: "What color is the sun?",
        options: ["Blue", "Yellow", "Red", "Green"],
        correctAnswer: 1
      },
      {
        question: "ما لون 🟣؟",
        questionAr: "What color is 🟣?",
        options: ["Orange", "Purple", "Pink", "Brown"],
        correctAnswer: 1
      }
    ],
    order: 4
  },

  // ========== اختبارات الحيوانات ==========
  {
    title: "اختبار الحيوانات",
    titleAr: "اختبار الحيوانات",
    description: "Test your knowledge of animals",
    descriptionAr: "اختبر معرفتك بالحيوانات",
    category: "animals",
    type: "multiple_choice",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    timeLimit: 120,
    questions: [
      {
        question: "ما هو 🐱 بالإنجليزية؟",
        questionAr: "What is 🐱 in English?",
        options: ["Dog", "Cat", "Bird", "Fish"],
        correctAnswer: 1
      },
      {
        question: "ما معنى Dog بالعربية؟",
        questionAr: "What does Dog mean in Arabic?",
        options: ["قطة", "كلب", "أرنب", "حصان"],
        correctAnswer: 1
      },
      {
        question: "ما الحيوان الذي يقول Moo؟",
        questionAr: "Which animal says Moo?",
        options: ["Dog", "Cat", "Cow", "Pig"],
        correctAnswer: 2
      },
      {
        question: "ما هو 🦁 بالإنجليزية؟",
        questionAr: "What is 🦁 in English?",
        options: ["Tiger", "Lion", "Bear", "Wolf"],
        correctAnswer: 1
      },
      {
        question: "ما الحيوان الذي يعيش في البحر؟",
        questionAr: "Which animal lives in the sea?",
        options: ["Lion", "Fish", "Bird", "Rabbit"],
        correctAnswer: 1
      }
    ],
    order: 5
  },

  // ========== اختبارات الطعام ==========
  {
    title: "اختبار الفواكه",
    titleAr: "اختبار الفواكه",
    description: "Test your knowledge of fruits",
    descriptionAr: "اختبر معرفتك بالفواكه",
    category: "food",
    type: "multiple_choice",
    difficulty: "easy",
    ageGroup: "5-7",
    xpReward: 15,
    timeLimit: 120,
    questions: [
      {
        question: "ما هي 🍎 بالإنجليزية؟",
        questionAr: "What is 🍎 in English?",
        options: ["Orange", "Banana", "Apple", "Grapes"],
        correctAnswer: 2
      },
      {
        question: "ما معنى Banana بالعربية؟",
        questionAr: "What does Banana mean in Arabic?",
        options: ["تفاحة", "برتقالة", "موزة", "فراولة"],
        correctAnswer: 2
      },
      {
        question: "ما لون البرتقال؟",
        questionAr: "What color is an orange?",
        options: ["Red", "Yellow", "Orange", "Green"],
        correctAnswer: 2
      },
      {
        question: "ما هي 🍉 بالإنجليزية؟",
        questionAr: "What is 🍉 in English?",
        options: ["Melon", "Watermelon", "Pumpkin", "Apple"],
        correctAnswer: 1
      },
      {
        question: "أي فاكهة صغيرة وحمراء؟",
        questionAr: "Which fruit is small and red?",
        options: ["Banana", "Apple", "Strawberry", "Orange"],
        correctAnswer: 2
      }
    ],
    order: 6
  },

  // ========== اختبارات للفئة العمرية 9-11 ==========
  {
    title: "اختبار القواعد الأساسية",
    titleAr: "اختبار القواعد الأساسية",
    description: "Basic grammar quiz",
    descriptionAr: "اختبار القواعد الأساسية",
    category: "grammar",
    type: "multiple_choice",
    difficulty: "medium",
    ageGroup: "9-11",
    xpReward: 25,
    timeLimit: 180,
    questions: [
      {
        question: "أي جملة صحيحة؟",
        questionAr: "Which sentence is correct?",
        options: ["She go to school", "She goes to school", "She going to school", "She goed to school"],
        correctAnswer: 1
      },
      {
        question: "ما هو جمع كلمة Child؟",
        questionAr: "What is the plural of Child?",
        options: ["Childs", "Children", "Childes", "Childrens"],
        correctAnswer: 1
      },
      {
        question: "أي فعل في الماضي البسيط؟",
        questionAr: "Which verb is in simple past?",
        options: ["running", "runs", "ran", "will run"],
        correctAnswer: 2
      },
      {
        question: "ما المقابل لكلمة Big؟",
        questionAr: "What is the opposite of Big?",
        options: ["Large", "Small", "Huge", "Tall"],
        correctAnswer: 1
      },
      {
        question: "أي ضمير صحيح؟ ___ is my friend.",
        questionAr: "Which pronoun is correct? ___ is my friend.",
        options: ["He", "Him", "His", "Himself"],
        correctAnswer: 0
      },
      {
        question: "ما هي صيغة المقارنة لـ good؟",
        questionAr: "What is the comparative form of good?",
        options: ["gooder", "more good", "better", "best"],
        correctAnswer: 2
      }
    ],
    order: 7
  }
];

// ==================== الكبار (Adults) ====================

const adultsGames = [
  // ========== الأعمال (Business) ==========
  {
    title: "مصطلحات الأعمال",
    titleAr: "مطابقة مصطلحات الأعمال",
    description: "Match business vocabulary",
    descriptionAr: "طابق مصطلحات الأعمال",
    category: "business",
    type: "matching",
    difficulty: "medium",
    ageGroup: null, // adults
    xpReward: 25,
    config: {
      pairs: [
        { left: "Meeting", right: "اجتماع" },
        { left: "Deadline", right: "موعد نهائي" },
        { left: "Client", right: "عميل" },
        { left: "Contract", right: "عقد" },
        { left: "Negotiation", right: "تفاوض" },
        { left: "Presentation", right: "عرض تقديمي" }
      ]
    },
    order: 1
  },
  {
    title: "ذاكرة الأعمال",
    titleAr: "لعبة ذاكرة الأعمال",
    description: "Business vocabulary memory game",
    descriptionAr: "لعبة ذاكرة لمصطلحات الأعمال",
    category: "business",
    type: "memory",
    difficulty: "medium",
    ageGroup: null,
    xpReward: 30,
    config: {
      cards: [
        { word: "Revenue", translation: "إيرادات" },
        { word: "Profit", translation: "ربح" },
        { word: "Budget", translation: "ميزانية" },
        { word: "Strategy", translation: "استراتيجية" },
        { word: "Investment", translation: "استثمار" },
        { word: "Marketing", translation: "تسويق" }
      ]
    },
    order: 2
  },
  {
    title: "ترتيب مصطلحات الأعمال",
    titleAr: "رتّب مصطلحات الأعمال",
    description: "Unscramble business words",
    descriptionAr: "أعد ترتيب مصطلحات الأعمال",
    category: "business",
    type: "scramble",
    difficulty: "hard",
    ageGroup: null,
    xpReward: 35,
    config: {
      words: [
        { scrambled: "giteeMna", original: "Meeting", hint: "اجتماع" },
        { scrambled: "Dineadel", original: "Deadline", hint: "موعد نهائي" },
        { scrambled: "sientPreant", original: "Presentation", hint: "عرض تقديمي" },
        { scrambled: "Negitotiano", original: "Negotiation", hint: "تفاوض" },
        { scrambled: "tractCon", original: "Contract", hint: "عقد" },
        { scrambled: "venReue", original: "Revenue", hint: "إيرادات" }
      ]
    },
    order: 3
  },

  // ========== السفر (Travel) ==========
  {
    title: "مصطلحات السفر",
    titleAr: "مطابقة مصطلحات السفر",
    description: "Match travel vocabulary",
    descriptionAr: "طابق مصطلحات السفر",
    category: "travel",
    type: "matching",
    difficulty: "easy",
    ageGroup: null,
    xpReward: 20,
    config: {
      pairs: [
        { left: "Airport", right: "مطار" },
        { left: "Passport", right: "جواز سفر" },
        { left: "Luggage", right: "أمتعة" },
        { left: "Flight", right: "رحلة طيران" },
        { left: "Hotel", right: "فندق" },
        { left: "Reservation", right: "حجز" }
      ]
    },
    order: 4
  },
  {
    title: "ذاكرة السفر",
    titleAr: "لعبة ذاكرة السفر",
    description: "Travel vocabulary memory game",
    descriptionAr: "لعبة ذاكرة لمصطلحات السفر",
    category: "travel",
    type: "memory",
    difficulty: "easy",
    ageGroup: null,
    xpReward: 25,
    config: {
      cards: [
        { word: "Passenger", translation: "راكب" },
        { word: "Destination", translation: "وجهة" },
        { word: "Boarding", translation: "صعود" },
        { word: "Immigration", translation: "هجرة" },
        { word: "Customs", translation: "جمارك" },
        { word: "Visa", translation: "تأشيرة" }
      ]
    },
    order: 5
  },

  // ========== الحياة اليومية (Daily Life) ==========
  {
    title: "الحياة اليومية",
    titleAr: "مطابقة الحياة اليومية",
    description: "Match daily life vocabulary",
    descriptionAr: "طابق مصطلحات الحياة اليومية",
    category: "daily",
    type: "matching",
    difficulty: "easy",
    ageGroup: null,
    xpReward: 15,
    config: {
      pairs: [
        { left: "Grocery", right: "بقالة" },
        { left: "Pharmacy", right: "صيدلية" },
        { left: "Bank", right: "بنك" },
        { left: "Hospital", right: "مستشفى" },
        { left: "School", right: "مدرسة" },
        { left: "Restaurant", right: "مطعم" }
      ]
    },
    order: 6
  }
];

const adultsQuizzes = [
  {
    title: "اختبار مصطلحات الأعمال",
    titleAr: "اختبار مصطلحات الأعمال",
    description: "Test your business vocabulary",
    descriptionAr: "اختبر معرفتك بمصطلحات الأعمال",
    category: "business",
    type: "multiple_choice",
    difficulty: "medium",
    ageGroup: null,
    xpReward: 30,
    timeLimit: 180,
    questions: [
      {
        question: "ما معنى Deadline؟",
        questionAr: "What does Deadline mean?",
        options: ["بداية المشروع", "موعد نهائي", "اجتماع", "تقرير"],
        correctAnswer: 1
      },
      {
        question: "أي كلمة تعني العرض التقديمي؟",
        questionAr: "Which word means Presentation?",
        options: ["Meeting", "Report", "Presentation", "Contract"],
        correctAnswer: 2
      },
      {
        question: "ما الفرق بين Revenue و Profit؟",
        questionAr: "What is the difference between Revenue and Profit?",
        options: ["نفس المعنى", "Revenue الإيرادات، Profit الربح", "Profit أكبر", "لا علاقة"],
        correctAnswer: 1
      },
      {
        question: "ما معنى Negotiation؟",
        questionAr: "What does Negotiation mean?",
        options: ["عقد", "تفاوض", "اتفاق", "نزاع"],
        correctAnswer: 1
      },
      {
        question: "أي كلمة تعني الاستثمار؟",
        questionAr: "Which word means Investment?",
        options: ["Budget", "Revenue", "Investment", "Expense"],
        correctAnswer: 2
      },
      {
        question: "ما معنى Strategy؟",
        questionAr: "What does Strategy mean?",
        options: ["خطة", "استراتيجية", "هدف", "فكرة"],
        correctAnswer: 1
      }
    ],
    order: 1
  },
  {
    title: "اختبار السفر",
    titleAr: "اختبار مصطلحات السفر",
    description: "Test your travel vocabulary",
    descriptionAr: "اختبر معرفتك بمصطلحات السفر",
    category: "travel",
    type: "multiple_choice",
    difficulty: "easy",
    ageGroup: null,
    xpReward: 25,
    timeLimit: 150,
    questions: [
      {
        question: "ما معنى Passport؟",
        questionAr: "What does Passport mean?",
        options: ["تأشيرة", "جواز سفر", "بطاقة", "تذكرة"],
        correctAnswer: 1
      },
      {
        question: "أين يتم فحص الحقائب؟",
        questionAr: "Where is luggage checked?",
        options: ["Immigration", "Customs", "Boarding", "Check-in"],
        correctAnswer: 1
      },
      {
        question: "ما معنى Boarding pass؟",
        questionAr: "What does Boarding pass mean?",
        options: ["جواز سفر", "بطاقة الصعود", "تذكرة", "حجز"],
        correctAnswer: 1
      },
      {
        question: "ما هي Visa؟",
        questionAr: "What is a Visa?",
        options: ["جواز سفر", "تأشيرة", "تذكرة", "بطاقة"],
        correctAnswer: 1
      },
      {
        question: "ما معنى Luggage؟",
        questionAr: "What does Luggage mean?",
        options: ["حقائب", "تذاكر", "جوازات", "أوراق"],
        correctAnswer: 0
      }
    ],
    order: 2
  }
];

async function main() {
  console.log("🌱 Starting seed...");
  
  // Clear existing data
  await db.kidsGameScore.deleteMany({});
  await db.kidsQuizAttempt.deleteMany({});
  await db.kidsGame.deleteMany({});
  await db.kidsQuiz.deleteMany({});
  console.log("✅ Cleared existing data");

  // Insert kids games
  for (const game of kidsGames) {
    await db.kidsGame.create({
      data: {
        title: game.title,
        titleAr: game.titleAr,
        description: game.description,
        descriptionAr: game.descriptionAr,
        category: game.category,
        type: game.type,
        difficulty: game.difficulty,
        ageGroup: game.ageGroup,
        xpReward: game.xpReward,
        config: JSON.stringify(game.config),
        order: game.order,
        isActive: true
      }
    });
  }
  console.log(`✅ Inserted ${kidsGames.length} kids games`);

  // Insert kids quizzes
  for (const quiz of kidsQuizzes) {
    await db.kidsQuiz.create({
      data: {
        title: quiz.title,
        titleAr: quiz.titleAr,
        description: quiz.description,
        descriptionAr: quiz.descriptionAr,
        category: quiz.category,
        type: quiz.type,
        difficulty: quiz.difficulty,
        ageGroup: quiz.ageGroup,
        xpReward: quiz.xpReward,
        timeLimit: quiz.timeLimit,
        questions: JSON.stringify(quiz.questions),
        order: quiz.order,
        isActive: true
      }
    });
  }
  console.log(`✅ Inserted ${kidsQuizzes.length} kids quizzes`);

  // Insert adults games
  for (const game of adultsGames) {
    await db.kidsGame.create({
      data: {
        title: game.title,
        titleAr: game.titleAr,
        description: game.description,
        descriptionAr: game.descriptionAr,
        category: game.category,
        type: game.type,
        difficulty: game.difficulty,
        ageGroup: game.ageGroup,
        xpReward: game.xpReward,
        config: JSON.stringify(game.config),
        order: game.order,
        isActive: true
      }
    });
  }
  console.log(`✅ Inserted ${adultsGames.length} adults games`);

  // Insert adults quizzes
  for (const quiz of adultsQuizzes) {
    await db.kidsQuiz.create({
      data: {
        title: quiz.title,
        titleAr: quiz.titleAr,
        description: quiz.description,
        descriptionAr: quiz.descriptionAr,
        category: quiz.category,
        type: quiz.type,
        difficulty: quiz.difficulty,
        ageGroup: quiz.ageGroup,
        xpReward: quiz.xpReward,
        timeLimit: quiz.timeLimit,
        questions: JSON.stringify(quiz.questions),
        order: quiz.order,
        isActive: true
      }
    });
  }
  console.log(`✅ Inserted ${adultsQuizzes.length} adults quizzes`);

  console.log("\n🎉 Seed completed!");
  console.log(`Total Games: ${kidsGames.length + adultsGames.length}`);
  console.log(`Total Quizzes: ${kidsQuizzes.length + adultsQuizzes.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
