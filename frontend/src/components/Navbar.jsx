import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChefHat, Home, UtensilsCrossed, Calendar, ShoppingCart, Settings, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const NAV_LINKS = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/pantry', icon: UtensilsCrossed, label: 'Pantry' },
    { to: '/generate', icon: ChefHat, label: 'Generate' },
    { to: '/recipes', icon: UtensilsCrossed, label: 'Recipes' },
    { to: '/meal-plan', icon: Calendar, label: 'Meal Plan' },
    { to: '/shopping-list', icon: ShoppingCart, label: 'Shopping' },
];

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropDownOpen, setIsDropDownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setIsDropDownOpen(false);
        setIsMobileMenuOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropDownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                        <ChefHat className="w-7 h-7 text-emerald-500" />
                        <span className="hidden sm:inline">AI Recipe Generator</span>
                        <span className="sm:hidden">AI Recipes</span>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                icon={<Icon className="w-4 h-4" />}
                                label={label}
                                active={location.pathname === to}
                            />
                        ))}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Settings icon — desktop only */}
                        <Link
                            to="/settings"
                            className="hidden md:flex p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Settings className="w-5 h-5" />
                        </Link>

                        {/* User dropdown — desktop */}
                        <div className="hidden md:block relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropDownOpen(!isDropDownOpen)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:inline font-medium">{user?.name || 'User'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isDropDownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropDownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                                                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-1">
                                        <Link
                                            to="/settings"
                                            onClick={() => setIsDropDownOpen(false)}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-200 bg-white">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                    </div>

                    {/* Nav links */}
                    <div className="px-3 py-2 space-y-1">
                        {NAV_LINKS.map(({ to, icon: Icon, label }) => (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    location.pathname === to
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {label}
                            </Link>
                        ))}
                        <Link
                            to="/settings"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                location.pathname === '/settings'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <Settings className="w-5 h-5" />
                            Settings
                        </Link>
                    </div>

                    {/* Logout */}
                    <div className="px-3 py-2 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
};

const NavLink = ({ to, icon, label, active }) => (
    <Link
        to={to}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            active
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
        }`}
    >
        {icon}
        <span>{label}</span>
    </Link>
);

export default Navbar;
