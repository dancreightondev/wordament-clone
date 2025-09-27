/** @type {import('tailwindcss').Config} */

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'sans-serif'],
        mono: ['DM Mono', 'Courier', 'monospace']
      }
    }
  }
}
