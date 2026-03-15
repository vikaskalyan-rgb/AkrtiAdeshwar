/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
      },
      colors: {
        ink:     { DEFAULT: '#1a1a2e', 2: '#4a4a6a', 3: '#8888aa', 4: '#b8b8cc' },
        surface: { DEFAULT: '#ffffff', 2: '#f7f7fb', 3: '#f0f0f7' },
        border:  { DEFAULT: '#e8e8f0', 2: '#d8d8e8' },
        indigo:  { DEFAULT: '#5b52f0', lt: '#eeeeff', md: '#c7c4fc' },
        emerald: { DEFAULT: '#059669', lt: '#ecfdf5' },
        rose:    { DEFAULT: '#e11d48', lt: '#fff1f2' },
        amber:   { DEFAULT: '#d97706', lt: '#fffbeb' },
        sky:     { DEFAULT: '#0284c7', lt: '#f0f9ff' },
      },
      boxShadow: {
        card: '0 1px 3px rgba(26,26,46,0.04), 0 1px 2px rgba(26,26,46,0.03)',
        'card-md': '0 4px 12px rgba(26,26,46,0.08), 0 1px 3px rgba(26,26,46,0.04)',
        'card-lg': '0 8px 24px rgba(26,26,46,0.10), 0 2px 6px rgba(26,26,46,0.05)',
      },
    },
  },
  plugins: [],
}
