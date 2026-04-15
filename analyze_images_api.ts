import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function analyzeImages() {
  const zai = await ZAI.create();
  
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

  for (const imagePath of images) {
    if (fs.existsSync(imagePath)) {
      console.log(`\n=== Analyzing: ${imagePath} ===\n`);
      
      try {
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
                  text: 'هذه صورة من ملف تخطيط لتطبيق تعلم المفردات. استخرج كل المعلومات حول المراحل المذكورة (رقم المرحلة، العنوان، الميزات). اكتب التفاصيل كاملة بالعربية. إذا لم تكن هناك معلومات عن مرحلة، اكتب "لا توجد معلومات عن مرحلة".'
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

        console.log(response.choices[0]?.message?.content);
      } catch (error) {
        console.error('Error analyzing image:', error);
      }
    }
  }
}

analyzeImages();
