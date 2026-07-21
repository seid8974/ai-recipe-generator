import dotenv from 'dotenv';
dotenv.config();

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

/**
 * Fetch a food image URL from Unsplash based on recipe name.
 * Falls back to null if key is missing or request fails — image_url stays null.
 */
export const fetchRecipeImage = async (recipeName) => {
    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'your_unsplash_access_key_here') {
        return null;
    }

    try {
        const query = encodeURIComponent(`${recipeName} food dish`);
        const url = `https://api.unsplash.com/search/photos?query=${query}&per_page=1&orientation=landscape&content_filter=high`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });

        if (!response.ok) return null;

        const data = await response.json();
        const photo = data.results?.[0];
        if (!photo) return null;

        // Use the regular size (not full — too large)
        return photo.urls?.regular || null;

    } catch (error) {
        console.error('Unsplash fetch error:', error.message);
        return null;
    }
};
