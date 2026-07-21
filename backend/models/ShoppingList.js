import db from '../config/db.js';

class ShoppingList {

    static async generateFromMealPlan(userId, startDate, endDate) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            await client.query(
                `DELETE FROM shopping_list_items WHERE user_id = $1 AND from_meal_plan = true`,
                [userId]
            );

            // FIX: was ri.whit (typo for ri.unit), ri.Quantity→ri.quantity
            const result = await client.query(
                `SELECT ri.ingredient_name, ri.unit, SUM(ri.quantity) AS total_quantity
                 FROM meal_plans mp
                 JOIN recipe_ingredients ri ON mp.recipe_id = ri.recipe_id
                 WHERE mp.user_id = $1
                   AND mp.meal_date >= $2
                   AND mp.meal_date <= $3
                 GROUP BY ri.ingredient_name, ri.unit
                 ORDER BY ri.ingredient_name, ri.unit`,
                [userId, startDate, endDate]
            );

            const ingredients = result.rows;

            // FIX: was WHERE mp.user_id (mp alias doesn't exist here), should be WHERE user_id
            const pantryResult = await client.query(
                `SELECT name, quantity, unit FROM pantry_items WHERE user_id = $1`,
                [userId]
            );

            const pantryMap = new Map();
            pantryResult.rows.forEach(item => {
                const key = `${item.name.toLowerCase()}_${item.unit}`;
                // FIX: was item.Quantity (wrong casing)
                pantryMap.set(key, item.quantity);
            });

            for (const ing of ingredients) {
                const key = `${ing.ingredient_name.toLowerCase()}_${ing.unit}`;
                const pantryQty = pantryMap.get(key) || 0;
                const neededQty = Math.max(0, parseFloat(ing.total_quantity) - parseFloat(pantryQty));

                if (neededQty > 0) {
                    // FIX: was client.Query (wrong casing), lng.redient_name (typo)
                    await client.query(
                        `INSERT INTO shopping_list_items
                            (user_id, ingredient_name, quantity, unit, from_meal_plan, category)
                         VALUES ($1, $2, $3, $4, true, $5)`,
                        [userId, ing.ingredient_name, neededQty, ing.unit, 'Uncategorized']
                    );
                }
            }

            // FIX: was 'COMIT' (typo)
            await client.query('COMMIT');

            return await this.findByUserId(userId);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async create(userId, itemData) {
        const { ingredient_name, quantity, unit, category = 'Uncategorized' } = itemData;

        // FIX: was using 'client' which doesn't exist in this scope — should use db
        const result = await db.query(
            `INSERT INTO shopping_list_items
                (user_id, ingredient_name, quantity, unit, category, from_meal_plan)
             VALUES ($1, $2, $3, $4, $5, false)
             RETURNING *`,
            [userId, ingredient_name, quantity, unit, category]
        );
        return result.rows[0];
    }

    static async findByUserId(userId) {
        const result = await db.query(
            `SELECT * FROM shopping_list_items
             WHERE user_id = $1
             ORDER BY category, ingredient_name`,
            [userId]
        );
        return result.rows;
    }

    static async getGroupedByCategory(userId) {
        // FIX: from_meal_pla (truncated typo), duplicate ORDER BY
        const result = await db.query(
            `SELECT category, json_agg(
                json_build_object(
                    'id', id,
                    'ingredient_name', ingredient_name,
                    'quantity', quantity,
                    'unit', unit,
                    'is_checked', is_checked,
                    'from_meal_plan', from_meal_plan
                )
             ) AS items
             FROM shopping_list_items
             WHERE user_id = $1
             GROUP BY category
             ORDER BY category`,
            [userId]
        );
        return result.rows;
    }

    static async update(id, userId, updates) {
        const { ingredient_name, quantity, unit, category, is_checked } = updates;

        // FIX: missing commas between SET assignments, WHERE used comma instead of AND
        const result = await db.query(
            `UPDATE shopping_list_items SET
                ingredient_name = COALESCE($1, ingredient_name),
                quantity = COALESCE($2, quantity),
                unit = COALESCE($3, unit),
                category = COALESCE($4, category),
                is_checked = COALESCE($5, is_checked)
             WHERE id = $6 AND user_id = $7
             RETURNING *`,
            [ingredient_name, quantity, unit, category, is_checked, id, userId]
        );
        return result.rows[0];
    }

    static async toggleChecked(id, userId) {
        // FIX: was userId=$2 (string) should be user_id
        const result = await db.query(
            `UPDATE shopping_list_items
             SET is_checked = NOT is_checked
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async delete(id, userId) {
        // FIX: was userId=$2 (string) should be user_id
        const result = await db.query(
            `DELETE FROM shopping_list_items WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );
        return result.rows[0];
    }

    static async clearChecked(userId) {
        // FIX: was WHERE id=$1 (wrong column — should filter by user_id)
        const result = await db.query(
            `DELETE FROM shopping_list_items WHERE user_id = $1 AND is_checked = true RETURNING *`,
            [userId]
        );
        return result.rows;
    }

    static async clearAll(userId) {
        const result = await db.query(
            `DELETE FROM shopping_list_items WHERE user_id = $1 RETURNING *`,
            [userId]
        );
        return result.rows;
    }

    static async addCheckedToPantry(userId) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            const checkedItems = await client.query(
                `SELECT * FROM shopping_list_items WHERE user_id = $1 AND is_checked = true`,
                [userId]
            );

            for (const item of checkedItems.rows) {
                // FIX: was client.Query (wrong casing)
                await client.query(
                    `INSERT INTO pantry_items (user_id, name, quantity, unit, category)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [userId, item.ingredient_name, item.quantity, item.unit, item.category]
                );
            }

            await client.query(
                `DELETE FROM shopping_list_items WHERE user_id = $1 AND is_checked = true`,
                [userId]
            );

            await client.query('COMMIT');

            return checkedItems.rows;

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

export default ShoppingList;
