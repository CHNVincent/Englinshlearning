import https from 'https';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const AUDIO_DIR = path.join(__dirname, '../../audio');

class TTSService {
  private audioDir: string;

  constructor(audioDir: string = AUDIO_DIR) {
    this.audioDir = audioDir;
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  /**
   * Generate TTS audio using Google Translate TTS API
   * @param text - Text to convert to speech
   * @param accent - 'en-GB' for British or 'en-US' for American
   * @returns Path to the generated audio file
   */
  async generateAudio(text: string, accent: 'en-GB' | 'en-US'): Promise<string> {
    const filename = `${uuidv4()}-${accent}.mp3`;
    const filepath = path.join(this.audioDir, filename);

    // Clean the text for URL encoding
    const cleanText = encodeURIComponent(text);
    
    // Google Translate TTS endpoint
    const lang = accent === 'en-GB' ? 'en-GB' : 'en-US';
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${cleanText}&tl=${lang}&total=1&idx=0&textlen=${text.length}&client=tw-ob`;

    return new Promise((resolve, reject) => {
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
          reject(new Error(`TTS generation failed with status: ${response.statusCode}`));
        }
      }).on('error', (err) => {
        file.close();
        fs.unlink(filepath, () => {});
        reject(err);
      });
    });
  }

  /**
   * Generate both British and American audio for a sentence
   * @param text - Text to convert to speech
   * @returns Object with paths to both audio files
   */
  async generateBothAccents(text: string): Promise<{ british: string; american: string }> {
    try {
      const [british, american] = await Promise.all([
        this.generateAudio(text, 'en-GB'),
        this.generateAudio(text, 'en-US')
      ]);
      return { british, american };
    } catch (error) {
      console.error('Error generating audio:', error);
      throw error;
    }
  }

  /**
   * Get the public URL for an audio file
   * @param filepath - Absolute path to the audio file
   * @returns Public URL path
   */
  getAudioUrl(filepath: string): string {
    const filename = path.basename(filepath);
    return `/audio/${filename}`;
  }

  /**
   * Delete an audio file
   * @param filepath - Path to the audio file
   */
  async deleteAudio(filepath: string): Promise<void> {
    if (fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => {
        if (err) console.error('Error deleting audio file:', err);
      });
    }
  }
}

export default TTSService;
