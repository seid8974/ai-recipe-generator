import express from 'express';
import * as recipeController from '../controllers/recipeController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// AI generation
router.post('/generate', recipeController.generateRecipe);
router.get('/suggestions', recipeController.getPantrySuggestions);

// CRUD operations
router.get('/', recipeController.getRecipes);
router.get('/recent', recipeController.getRecentRecipes);
router.get('/stats', recipeController.getRecipeStats);
router.get('/:id', recipeController.getRecipeById);
router.post('/', recipeController.saveRecipe);
router.put('/:id', recipeController.updateRecipe);
router.put('/:id/favorite', recipeController.toggleFavorite);
router.delete('/:id', recipeController.deleteRecipe);

export default router;
