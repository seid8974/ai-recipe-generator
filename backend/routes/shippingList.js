import express from 'express';
import * as shoppingListController from '../controllers/shoppingListController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', shoppingListController.getShoppingList);
router.post('/generate', shoppingListController.generateFromMealPlan);
router.post('/add-to-pantry', shoppingListController.addCheckedToPantry);
// FIX: /clear/checked and /clear/all must be registered BEFORE /:id
// otherwise Express matches /:id first and these routes are never reached
router.delete('/clear/checked', shoppingListController.clearChecked);
router.delete('/clear/all', shoppingListController.clearAll);
router.post('/', shoppingListController.addItem);
router.put('/:id', shoppingListController.updateItem);
router.put('/:id/toggle', shoppingListController.toggleChecked);
router.delete('/:id', shoppingListController.deleteItem);

export default router;
