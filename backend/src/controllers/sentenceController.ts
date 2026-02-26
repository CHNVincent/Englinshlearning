import { Request, Response } from 'express';
import prisma from '../prisma/index.js';
import TTSService from '../services/ttsService.js';
import path from 'path';

const ttsService = new TTSService();

export const sentenceController = {
  // Get all sentences with pagination
  async getAll(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const category = req.query.category as string;

      const where = {
        isDeleted: false,
        ...(category && { category })
      };

      const [sentences, total] = await Promise.all([
        prisma.sentence.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            text: true,
            category: true,
            difficulty: true,
            audioBritish: true,
            audioAmerican: true,
            audioStatus: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.sentence.count({ where })
      ]);

      // Transform audio paths to URLs
      const transformedSentences = sentences.map(s => ({
        ...s,
        audioBritish: s.audioBritish ? `/api/audio/${path.basename(s.audioBritish)}` : null,
        audioAmerican: s.audioAmerican ? `/api/audio/${path.basename(s.audioAmerican)}` : null
      }));

      res.json({
        data: transformedSentences,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching sentences:', error);
      res.status(500).json({ error: 'Failed to fetch sentences' });
    }
  },

  // Get single sentence by ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const sentence = await prisma.sentence.findFirst({
        where: { id: parseInt(id), isDeleted: false }
      });

      if (!sentence) {
        return res.status(404).json({ error: 'Sentence not found' });
      }

      // Transform audio paths to URLs
      const transformed = {
        ...sentence,
        audioBritish: sentence.audioBritish ? `/api/audio/${path.basename(sentence.audioBritish)}` : null,
        audioAmerican: sentence.audioAmerican ? `/api/audio/${path.basename(sentence.audioAmerican)}` : null
      };

      res.json(transformed);
    } catch (error) {
      console.error('Error fetching sentence:', error);
      res.status(500).json({ error: 'Failed to fetch sentence' });
    }
  },

  // Create new sentence
  async create(req: Request, res: Response) {
    try {
      const { text, category, difficulty } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // Create sentence with pending audio status
      const sentence = await prisma.sentence.create({
        data: {
          text: text.trim(),
          category: category || 'general',
          difficulty: difficulty ? parseInt(difficulty) : 1,
          audioStatus: 'pending'
        }
      });

      // Generate audio asynchronously
      generateAudioAsync(sentence.id, text.trim());

      res.status(201).json({
        ...sentence,
        audioBritish: null,
        audioAmerican: null
      });
    } catch (error) {
      console.error('Error creating sentence:', error);
      res.status(500).json({ error: 'Failed to create sentence' });
    }
  },

  // Update sentence
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { text, category, difficulty } = req.body;

      const existing = await prisma.sentence.findFirst({
        where: { id: parseInt(id), isDeleted: false }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Sentence not found' });
      }

      const updateData: any = {};
      if (text) updateData.text = text.trim();
      if (category) updateData.category = category;
      if (difficulty) updateData.difficulty = parseInt(difficulty);

      // If text changed, regenerate audio
      if (text && text !== existing.text) {
        updateData.audioStatus = 'processing';
      }

      const sentence = await prisma.sentence.update({
        where: { id: parseInt(id) },
        data: updateData
      });

      // Regenerate audio if text changed
      if (text && text !== existing.text) {
        generateAudioAsync(sentence.id, text.trim());
      }

      res.json(sentence);
    } catch (error) {
      console.error('Error updating sentence:', error);
      res.status(500).json({ error: 'Failed to update sentence' });
    }
  },

  // Delete sentence (soft delete)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existing = await prisma.sentence.findFirst({
        where: { id: parseInt(id), isDeleted: false }
      });

      if (!existing) {
        return res.status(404).json({ error: 'Sentence not found' });
      }

      await prisma.sentence.update({
        where: { id: parseInt(id) },
        data: { isDeleted: true }
      });

      res.json({ message: 'Sentence deleted successfully' });
    } catch (error) {
      console.error('Error deleting sentence:', error);
      res.status(500).json({ error: 'Failed to delete sentence' });
    }
  },

  // Generate audio for existing sentence
  async generateAudio(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const sentence = await prisma.sentence.findFirst({
        where: { id: parseInt(id), isDeleted: false }
      });

      if (!sentence) {
        return res.status(404).json({ error: 'Sentence not found' });
      }

      // Update status to processing
      await prisma.sentence.update({
        where: { id: parseInt(id) },
        data: { audioStatus: 'processing' }
      });

      // Generate audio
      generateAudioAsync(sentence.id, sentence.text);

      res.json({ message: 'Audio generation started' });
    } catch (error) {
      console.error('Error generating audio:', error);
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  },

  // Get categories
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.sentence.findMany({
        where: { isDeleted: false },
        select: { category: true },
        distinct: ['category']
      });

      res.json(categories.map(c => c.category));
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  // Bulk create sentences
  async bulkCreate(req: Request, res: Response) {
    try {
      const { sentences } = req.body;

      if (!Array.isArray(sentences) || sentences.length === 0) {
        return res.status(400).json({ error: 'Sentences array is required' });
      }

      const createdSentences = [];

      for (const s of sentences) {
        if (!s.text) continue;

        const sentence = await prisma.sentence.create({
          data: {
            text: s.text.trim(),
            category: s.category || 'general',
            difficulty: s.difficulty ? parseInt(s.difficulty) : 1,
            audioStatus: 'pending'
          }
        });

        createdSentences.push(sentence);
        generateAudioAsync(sentence.id, s.text.trim());
      }

      res.status(201).json({
        message: `Created ${createdSentences.length} sentences`,
        data: createdSentences
      });
    } catch (error) {
      console.error('Error bulk creating sentences:', error);
      res.status(500).json({ error: 'Failed to bulk create sentences' });
    }
  }
};

// Helper function to generate audio asynchronously
async function generateAudioAsync(sentenceId: number, text: string) {
  try {
    const { british, american } = await ttsService.generateBothAccents(text);

    await prisma.sentence.update({
      where: { id: sentenceId },
      data: {
        audioBritish: british,
        audioAmerican: american,
        audioStatus: 'completed'
      }
    });

    console.log(`Audio generated for sentence ${sentenceId}`);
  } catch (error) {
    console.error(`Error generating audio for sentence ${sentenceId}:`, error);
    await prisma.sentence.update({
      where: { id: sentenceId },
      data: { audioStatus: 'failed' }
    });
  }
}

export default sentenceController;
