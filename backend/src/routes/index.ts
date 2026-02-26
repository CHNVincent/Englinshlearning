import { Router } from 'express';
import sentenceController from '../controllers/sentenceController.js';
import adminController from '../controllers/adminController.js';

const router = Router();

// Admin routes
router.post('/auth/login', adminController.login);
router.post('/auth/logout', adminController.logout);
router.get('/auth/verify', adminController.verify);
router.get('/stats', adminController.getStats);

// Sentence routes
router.get('/sentences', sentenceController.getAll);
router.get('/sentences/categories', sentenceController.getCategories);
router.get('/sentences/:id', sentenceController.getById);
router.post('/sentences', sentenceController.create);
router.put('/sentences/:id', sentenceController.update);
router.delete('/sentences/:id', sentenceController.delete);
router.post('/sentences/:id/generate-audio', sentenceController.generateAudio);
router.post('/sentences/bulk', sentenceController.bulkCreate);

export default router;
