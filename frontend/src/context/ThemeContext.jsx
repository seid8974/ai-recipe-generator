import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    const [calorieGoal, setCalorieGoal] = useState(() => {
        return parseInt(localStorage.getItem('calorieGoal') || '2000');
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const updateCalorieGoal = (value) => {
        const goal = parseInt(value);
        setCalorieGoal(goal);
        localStorage.setItem('calorieGoal', goal);
    };

    return (
        <ThemeContext.Provider value={{ darkMode, setDarkMode, calorieGoal, updateCalorieGoal }}>
            {children}
        </ThemeContext.Provider>
    );
};
