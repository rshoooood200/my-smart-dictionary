import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImage(imagePath: string) {
  try {
    const zai = await ZAI.create();
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'هذه صورة من ملف تخطيط لتطبيق تعلم المفردات. استخرج كل المعلومات حول المرحلة 21 والمرحلة 22. اكتب التفاصيل كاملة بالعربية.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    });

    return response.choices[0]?.message?.content;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

const images = [
  '/home/z/my-project/upload/IMG_3788.jpeg',
  '/home/z/my-project/upload/IMG_3789.jpeg',
  '/home/z/my-project/upload/IMG_3790.jpeg',
  '/home/z/my-project/upload/IMG_3791.jpeg',
  '/home/z/my-project/upload/IMG_3792.jpeg',
  '/home/z/my-project/upload/IMG_3793.png',
  '/home/z/my-project/upload/IMG_3808.jpeg',
  '/home/z/my-project/upload/IMG_3809.jpeg',
  '/home/z/my-project/upload/IMG_3811.jpeg',
  '/home/z/my-project/upload/IMG_3812.jpeg'
];

async function main() {
  for (const img of images) {
    if (fs.existsSync(img)) {
      console.log(`\n=== Analyzing: ${img} ===\n`);
      const result = await analyzeImage(img);
      if (result) {
        console.log(result);
      }
    }
  }
}

main();
