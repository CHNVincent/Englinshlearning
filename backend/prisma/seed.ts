import { PrismaClient } from '@prisma/client';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const AUDIO_DIR = path.join(__dirname, '../../audio');

const seedSentences = [
  { text: "Hello, how are you today?", category: "greeting", difficulty: 1 },
  { text: "The weather is beautiful.", category: "casual", difficulty: 1 },
  { text: "I would like a cup of coffee, please.", category: "ordering", difficulty: 2 },
  { text: "Could you help me find the nearest station?", category: "asking", difficulty: 2 },
  { text: "What time does the meeting start?", category: "business", difficulty: 2 },
  { text: "The project deadline is next Friday.", category: "business", difficulty: 3 },
  { text: "I completely understand your perspective on this matter.", category: "formal", difficulty: 4 },
  { text: "The economic situation has significantly improved over the past year.", category: "formal", difficulty: 5 },
  { text: "She sells seashells by the seashore.", category: "tongue-twister", difficulty: 3 },
  { text: "The quick brown fox jumps over the lazy dog.", category: "pangram", difficulty: 2 }
];

function generateAudio(text: string, accent: 'en-GB' | 'en-US'): Promise<string> {
  return new Promise((resolve, reject) => {
    const filename = `${uuidv4()}-${accent}.mp3`;
    const filepath = path.join(AUDIO_DIR, filename);
    const cleanText = encodeURIComponent(text);
    const lang = accent === 'en-GB' ? 'en-GB' : 'en-US';
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=${lang}&total=1&idx=0&textlen=${text.length}&client=tw-ob`;

    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filepath);
        });
      } else {
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error(`TTS failed: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function seed() {
  console.log('Starting database seed...');

  // Create audio directory if not exists
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // Check if already seeded
  const existingCount = await prisma.sentence.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} sentences. Skipping seed.`);
    return;
  }

  for (const sentence of seedSentences) {
    try {
      console.log(`Generating audio for: "${sentence.text}"`);
      
      const [british, american] = await Promise.all([
        generateAudio(sentence.text, 'en-GB'),
        generateAudio(sentence.text, 'en-US')
      ]);

      await prisma.sentence.create({
        data: {
          text: sentence.text,
          category: sentence.category,
          difficulty: sentence.difficulty,
          audioBritish: british,
          audioAmerican: american,
          audioStatus: 'completed'
        }
      });

      console.log(`✓ Created: ${sentence.text}`);
    } catch (error) {
      console.error(`✗ Failed: ${sentence.text}`, error);
      // Create without audio
      await prisma.sentence.create({
        data: {
          text: sentence.text,
          category: sentence.category,
          difficulty: sentence.difficulty,
          audioStatus: 'failed'
        }
      });
    }
  }

  console.log('Seed complete!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
