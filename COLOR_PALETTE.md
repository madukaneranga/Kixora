# Color Palette Configuration

This project uses a dynamic color palette system that loads colors from environment variables, making it easy to change the entire color scheme.

## Current Color Palette

| Color | Hex Code | Usage |
|-------|----------|-------|
| Primary | `#005147` | Main brand color (dark teal/green) |
| Secondary | `#ea553b` | Accent color (orange-red) |
| Accent | `#ba2b2b` | Secondary accent (dark red) |
| Dark | `#000000` | Text and dark elements |
| Light | `#ffffff` | Backgrounds and light elements |

## Environment Variables

Add these to your `.env` file:

```env
# Color Palette
VITE_COLOR_PRIMARY=#005147
VITE_COLOR_SECONDARY=#ea553b
VITE_COLOR_ACCENT=#ba2b2b
VITE_COLOR_DARK=#000000
VITE_COLOR_LIGHT=#ffffff
```

## Usage in Components

### Tailwind CSS Classes

```jsx
// Brand colors
<div className="bg-brand-primary text-brand-light">
<div className="bg-brand-secondary">
<div className="text-brand-accent">
<div className="border-brand-dark">

// Semantic aliases
<div className="bg-primary text-secondary">
<div className="text-accent">
```

### Available Classes

- `brand-primary` / `primary`
- `brand-secondary` / `secondary`
- `brand-accent` / `accent`
- `brand-dark`
- `brand-light`

### CSS Custom Properties

```css
.custom-element {
  background-color: var(--color-primary);
  color: var(--color-light);
  border-color: var(--color-accent);
}
```

## Changing Colors

1. **Update `.env` file** with new hex colors
2. **Restart development server** to load new values
3. **Colors update automatically** throughout the app

## Files Structure

- `.env` - Environment variables with color values
- `src/styles/colors.css` - CSS custom properties
- `src/utils/colorPalette.ts` - Color loading utility
- `tailwind.config.js` - Tailwind configuration
- `src/main.tsx` - Color initialization

## Example: Changing to Blue Theme

```env
VITE_COLOR_PRIMARY=#1e40af
VITE_COLOR_SECONDARY=#3b82f6
VITE_COLOR_ACCENT=#1d4ed8
VITE_COLOR_DARK=#000000
VITE_COLOR_LIGHT=#ffffff
```

The entire app will automatically use the new blue color scheme!