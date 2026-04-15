import ZAI from 'z-ai-web-dev-sdk';

async function main() {
  try {
    console.log('Creating ZAI instance...');
    const zai = await ZAI.create();
    console.log('Config:', JSON.stringify(zai.config, null, 2));

    console.log('\nMaking chat request...');
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'user', content: 'Say hello in Arabic' }
      ],
      model: 'glm-4-flash',
      stream: false
    });

    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

main();
