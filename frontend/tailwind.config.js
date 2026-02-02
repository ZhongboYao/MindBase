/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'north-blue': '#03A3F9',
                'north-dark': '#0f111a',
            }
        },
    },
    plugins: [],
}
