import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ChefHat, Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import api from '../services/api';

const PAGE_SIZE = 9;

const cuisines = ['All', 'Italian', 'Mexican', 'Indian', 'Chinese', 'Japanese', 'Thai', 'French', 'Mediterranean', 'American', 'Asian', 'Middle Eastern'];
const difficulties = ['All', 'easy', 'medium', 'hard'];

const MyRecipes = () => {
    const [recipes, setRecipes] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('All');
    const [selectedDifficulty, setSelectedDifficulty] = useState('All');
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const fetchRecipes = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', PAGE_SIZE);
            params.set('offset', (page - 1) * PAGE_SIZE);
            if (searchQuery)                  params.set('search', searchQuery);
            if (selectedCuisine !== 'All')    params.set('cuisine_type', selectedCuisine);
            if (selectedDifficulty !== 'All') params.set('difficulty', selectedDifficulty);
            if (favoritesOnly)                params.set('favorites_only', 'true');

            const response = await api.get(`/recipes?${params.toString()}`);
            setRecipes(response.data.data.recipes);
            setTotalCount(response.data.data.total ?? response.data.data.recipes.length);
        } catch (error) {
            toast.error('Failed to load recipes');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, selectedCuisine, selectedDifficulty, favoritesOnly, page]);

    useEffect(() => { setPage(1); }, [searchQuery, selectedCuisine, selectedDifficulty, favoritesOnly]);

    useEffect(() => {
        const timeout = setTimeout(() => fetchRecipes(), searchQuery ? 400 : 0);
        return () => clearTimeout(timeout);
    }, [fetchRecipes]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this recipe?')) return;
        try {
            await api.delete(`/recipes/${id}`);
            toast.success('Recipe deleted');
            fetchRecipes();
        } catch (error) {
            toast.error('Failed to delete recipe');
        }
    };

    const handleToggleFavorite = async (id, currentState) => {
        // Optimistic update
        setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_favorite: !currentState } : r));
        try {
            await api.put(`/recipes/${id}/favorite`);
            toast.success(currentState ? 'Removed from favorites' : 'Added to favorites');
        } catch (error) {
            // Revert
            setRecipes(prev => prev.map(r => r.id === id ? { ...r, is_favorite: currentState } : r));
            toast.error('Failed to update favorite');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
                    <p className="text-gray-600 mt-1">Your collection of saved recipes</p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search recipes..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            />
                        </div>
                        <select
                            value={selectedCuisine}
                            onChange={(e) => setSelectedCuisine(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                            {cuisines.map(c => <option key={c} value={c}>{c === 'All' ? 'All Cuisines' : c}</option>)}
                        </select>
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                            {difficulties.map(d => <option key={d} value={d}>{d === 'All' ? 'All Difficulties' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                        {/* Favorites toggle */}
                        <button
                            onClick={() => setFavoritesOnly(!favoritesOnly)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors ${
                                favoritesOnly
                                    ? 'bg-yellow-400 border-yellow-400 text-white'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                            <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-white' : ''}`} />
                            Favorites
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        {loading ? 'Loading...' : `${totalCount} recipe${totalCount !== 1 ? 's' : ''} found`}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : recipes.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    onDelete={handleDelete}
                                    onToggleFavorite={handleToggleFavorite}
                                />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${p === page ? 'bg-emerald-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                        {p}
                                    </button>
                                ))}
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">
                            {favoritesOnly ? 'No favorite recipes yet — star some recipes to see them here'
                                : searchQuery || selectedCuisine !== 'All' || selectedDifficulty !== 'All'
                                ? 'No recipes match your filters' : 'No recipes yet'}
                        </p>
                        {!searchQuery && selectedCuisine === 'All' && selectedDifficulty === 'All' && !favoritesOnly && (
                            <Link to="/generate" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                                Generate Your First Recipe
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const RecipeCard = ({ recipe, onDelete, onToggleFavorite }) => {
    const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
            <div className="h-48 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center overflow-hidden relative">
                {recipe.image_url ? (
                    <img src={recipe.image_url} alt={recipe.name} className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${recipe.image_url ? 'hidden' : ''}`}>
                    <ChefHat className="w-16 h-16 text-emerald-600" />
                </div>
                {/* Favorite button overlay */}
                <button
                    onClick={(e) => { e.preventDefault(); onToggleFavorite(recipe.id, recipe.is_favorite); }}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow transition-colors"
                    title={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <Star className={`w-5 h-5 transition-colors ${recipe.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`} />
                </button>
            </div>
            <div className="p-5">
                <Link to={`/recipes/${recipe.id}`} className="block mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">{recipe.name}</h3>
                    {recipe.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{recipe.description}</p>}
                </Link>
                <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.cuisine_type && <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">{recipe.cuisine_type}</span>}
                    {recipe.difficulty && (
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${recipe.difficulty === 'easy' ? 'bg-green-100 text-green-700' : recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {recipe.difficulty}
                        </span>
                    )}
                    {recipe.dietary_tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{tag}</span>
                    ))}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{totalTime} mins</span></div>
                    {recipe.calories && <span>{recipe.calories} cal</span>}
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <Link to={`/recipes/${recipe.id}`} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-center py-2 rounded-lg font-medium transition-colors text-sm">
                        View Recipe
                    </Link>
                    <button onClick={() => onDelete(recipe.id)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyRecipes;
