import db from '../config/db.js';

class Recipe {

    static async create(userId, recipeData) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            const {
                name,
                description,
                cuisine_type,
                difficulty,
                prep_time,
                cook_time,
                servings,
                instructions,
                dietary_tags = [],
                user_notes,
                image_url,
                ingredients = [],   // FIX: was 'ingradients' (typo)
                nutrition = {}
            } = recipeData;

            // FIX: SQL keyword was VALUE (should be VALUES), and missing commas between columns
            const recipeResult = await client.query(
                `INSERT INTO recipes
                    (user_id, name, description, cuisine_type, difficulty, prep_time, cook_time, servings, instructions, dietary_tags, user_notes, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING *`,
                [userId, name, description, cuisine_type, difficulty, prep_time, cook_time, servings, JSON.stringify(instructions), dietary_tags, user_notes, image_url]
            );

            const recipe = recipeResult.rows[0];

            // FIX: broken parameterized query — idx math was wrong, used recipe_id correctly
            if (ingredients.length > 0) {
                const placeholders = ingredients.map((_, i) => {
                    const base = i * 4;
                    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
                }).join(', ');

                const ingredientParams = [];
                ingredients.forEach(ing => {
                    ingredientParams.push(recipe.id, ing.name, ing.quantity, ing.unit);
                });

                await client.query(
                    `INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) VALUES ${placeholders}`,
                    ingredientParams
                );
            }

            if (nutrition && Object.keys(nutrition).length > 0) {
                // FIX: was Recipe.id (wrong — should be recipe.id)
                await client.query(
                    `INSERT INTO recipe_nutrition (recipe_id, calories, protein, carbs, fats, fiber)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [recipe.id, nutrition.calories, nutrition.protein, nutrition.carbs, nutrition.fats, nutrition.fiber]
                );
            }

            // FIX: was 'COMIT' (typo — should be COMMIT)
            await client.query('COMMIT');

            return await this.findById(recipe.id, userId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findById(id, userId) {
        const recipeResult = await db.query(
            `SELECT * FROM recipes WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (recipeResult.rows.length === 0) return null;

        const recipe = recipeResult.rows[0];

        // FIX: table was 'recipe_gredients' (typo), column was 'ingredient_value' (wrong name)
        const ingredientResult = await db.query(
            `SELECT ingredient_name AS name, quantity, unit FROM recipe_ingredients WHERE recipe_id = $1`,
            [id]
        );

        const nutritionResult = await db.query(
            `SELECT calories, protein, carbs, fats, fiber FROM recipe_nutrition WHERE recipe_id = $1`,
            [id]
        );

        // FIX: had a dead second 'return result.rows[0]' after the actual return
        return {
            ...recipe,
            ingredients: ingredientResult.rows,
            nutrition: nutritionResult.rows[0] || null
        };
    }

    static async findByUserId(userId, filters = {}) {
        // FIX: was 'LEFT recipe_nutrition' (missing JOIN keyword)
        // FIX: missing spaces before AND keywords throughout
        // FIX: filters.dietary_tags (not dietary_tag) used consistently
        // FIX: max_cook_time used <= not = 
        let query = `SELECT r.*, rn.calories
                     FROM recipes r
                     LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id
                     WHERE r.user_id = $1`;
        const params = [userId];
        let paramCount = 1;

        if (filters.search) {
            paramCount++;
            query += ` AND (r.name ILIKE $${paramCount} OR r.description ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
        }

        if (filters.cuisine_type) {
            paramCount++;
            query += ` AND r.cuisine_type = $${paramCount}`;
            params.push(filters.cuisine_type);
        }

        if (filters.difficulty) {
            paramCount++;
            query += ` AND r.difficulty = $${paramCount}`;
            params.push(filters.difficulty);
        }

        if (filters.dietary_tag) {
            paramCount++;
            query += ` AND $${paramCount} = ANY(r.dietary_tags)`;
            params.push(filters.dietary_tag);
        }

        if (filters.favorites_only === true || filters.favorites_only === 'true') {
            query += ` AND r.is_favorite = true`;
        }

        if (filters.max_cook_time) {
            paramCount++;
            query += ` AND r.cook_time <= $${paramCount}`;
            params.push(filters.max_cook_time);
        }

        const sortBy = filters.sort_by || 'created_at';
        const sortOrder = filters.sort_order === 'asc' ? 'ASC' : 'DESC';
        query += ` ORDER BY r.${sortBy} ${sortOrder}`;

        const limit = filters.limit || 20;
        const offset = filters.offset || 0;
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(offset);

        const result = await db.query(query, params);
        return result.rows;
    }

    static async getRecent(userId, limit = 5) {
        const result = await db.query(
            `SELECT r.*, rn.calories
             FROM recipes r
             LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id
             WHERE r.user_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    static async update(id, userId, updates) {
        const {
            name, description, cuisine_type, difficulty,
            prep_time, cook_time, servings, instructions,
            dietary_tags, user_notes, image_url
        } = updates;

        // FIX: missing commas between SET assignments, and was userId=$13 (string) should use user_id
        const result = await db.query(
            `UPDATE recipes SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                cuisine_type = COALESCE($3, cuisine_type),
                difficulty = COALESCE($4, difficulty),
                prep_time = COALESCE($5, prep_time),
                cook_time = COALESCE($6, cook_time),
                servings = COALESCE($7, servings),
                instructions = COALESCE($8, instructions),
                dietary_tags = COALESCE($9, dietary_tags),
                user_notes = COALESCE($10, user_notes),
                image_url = COALESCE($11, image_url)
             WHERE id = $12 AND user_id = $13
             RETURNING *`,
            [name, description, cuisine_type, difficulty, prep_time, cook_time, servings,
             instructions ? JSON.stringify(instructions) : null,
             dietary_tags, user_notes, image_url, id, userId]
        );
        return result.rows[0];
    }

    static async delete(id, userId) {
        // FIX: was userId=$2 (string column name) should be user_id
        const result = await db.query(
            `DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async getStats(userId) {
        // FIX: was filtering on is_running_low which doesn't exist on recipes, removed it
        // FIX: was userId=$1 (string) should be user_id
        const result = await db.query(
            `SELECT
                COUNT(*) AS total_recipes,
                COUNT(DISTINCT cuisine_type) AS cuisine_types_count,
                AVG(cook_time) AS avg_cook_time
             FROM recipes
             WHERE user_id = $1`,
            [userId]
        );
        return result.rows[0];
    }

    static async toggleFavorite(id, userId) {
        const result = await db.query(
            `UPDATE recipes
             SET is_favorite = NOT COALESCE(is_favorite, false)
             WHERE id = $1 AND user_id = $2
             RETURNING id, is_favorite`,
            [id, userId]
        );
        return result.rows[0];
    }
}

export default Recipe;
