/**
 * Tailwind v4 plugs in via its dedicated PostCSS plugin. No tailwind.config.js
 * is needed — the theme tokens live inside the `@theme` block in globals.css.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
