import express from 'express';
import * as mealPlanController from '../controllers/mealPlanController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// FIX: updated to match renamed exports (getWeaklyMealPlan→getWeeklyMealPlan, getUpComingMeals→getUpcomingMeals, getPantryStats→getMealPlanStats, deleteMealPantry→deleteMealPlan)
router.get('/weekly', mealPlanController.getWeeklyMealPlan);
router.get('/upcoming', mealPlanController.getUpcomingMeals);
router.get('/stats', mealPlanController.getMealPlanStats);
router.post('/', mealPlanController.addToMealPlan);
router.delete('/:id', mealPlanController.deleteMealPlan);

export default router;
