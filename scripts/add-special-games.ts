import { db } from '../src/lib/db';

async function addSpecialGames() {
  // استكشف الحروف الكبيرة
  await db.kidsGame.create({
    data: {
      title: "استكشف الحروف",
      titleAr: "استكشف الحروف الكبيرة",
      description: "Explore capital letters A-Z",
      descriptionAr: "استكشف الحروف الإنجليزية الكبيرة من A إلى Z",
      category: "alphabet",
      type: "exploration",
      difficulty: "easy",
      ageGroup: "5-7",
      xpReward: 0,
      config: JSON.stringify({
        letters: ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
      }),
      isActive: true,
      order: 100
    }
  });
  console.log("✅ Added استكشف الحروف الكبيرة");

  // استكشف الحروف الصغيرة
  await db.kidsGame.create({
    data: {
      title: "استكشف الحروف الصغيرة",
      titleAr: "استكشف الحروف الصغيرة",
      description: "Explore lowercase letters a-z",
      descriptionAr: "استكشف الحروف الإنجليزية الصغيرة من a إلى z",
      category: "alphabet",
      type: "exploration",
      difficulty: "easy",
      ageGroup: "5-7",
      xpReward: 0,
      config: JSON.stringify({
        letters: ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z"]
      }),
      isActive: true,
      order: 101
    }
  });
  console.log("✅ Added استكشف الحروف الصغيرة");

  // استمع واختر
  await db.kidsGame.create({
    data: {
      title: "استمع واختر",
      titleAr: "استمع واختر الحرف",
      description: "Listen and choose the correct letter",
      descriptionAr: "استمع للحرف واختر الإجابة الصحيحة",
      category: "alphabet",
      type: "listening",
      difficulty: "easy",
      ageGroup: "5-7",
      xpReward: 0,
      config: JSON.stringify({
        letters: [
          { letter: "A", word: "Apple", emoji: "🍎" },
          { letter: "B", word: "Ball", emoji: "⚽" },
          { letter: "C", word: "Cat", emoji: "🐱" },
          { letter: "D", word: "Dog", emoji: "🐕" },
          { letter: "E", word: "Egg", emoji: "🥚" },
          { letter: "F", word: "Fish", emoji: "🐟" },
          { letter: "G", word: "Girl", emoji: "👧" },
          { letter: "H", word: "Hat", emoji: "🎩" },
          { letter: "I", word: "Ice", emoji: "🧊" },
          { letter: "J", word: "Juice", emoji: "🧃" },
          { letter: "K", word: "Key", emoji: "🔑" },
          { letter: "L", word: "Lion", emoji: "🦁" },
          { letter: "M", word: "Moon", emoji: "🌙" },
          { letter: "N", word: "Nest", emoji: "🪺" },
          { letter: "O", word: "Orange", emoji: "🍊" },
          { letter: "P", word: "Pen", emoji: "🖊️" },
          { letter: "Q", word: "Queen", emoji: "👸" },
          { letter: "R", word: "Red", emoji: "🔴" },
          { letter: "S", word: "Sun", emoji: "☀️" },
          { letter: "T", word: "Tree", emoji: "🌳" },
          { letter: "U", word: "Up", emoji: "⬆️" },
          { letter: "V", word: "Van", emoji: "🚐" },
          { letter: "W", word: "Water", emoji: "💧" },
          { letter: "X", word: "Box", emoji: "📦" },
          { letter: "Y", word: "Yes", emoji: "✅" },
          { letter: "Z", word: "Zoo", emoji: "🦁" }
        ]
      }),
      isActive: true,
      order: 102
    }
  });
  console.log("✅ Added استمع واختر");

  console.log("\n🎉 All special games added!");
  await db.$disconnect();
}

addSpecialGames();
