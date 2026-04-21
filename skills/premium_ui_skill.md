# Skill: Sharptoolz Premium "Sharp" UI

When building UI for the Sharptoolz project, you MUST adhere to these "Sharp" design standards to ensure the platform feels premium, cohesive, and state-of-the-art.

## 1. Core Visual DNA

- **Global Roundedness**: Use `rounded-full` for all buttons, input fields, badges, and small containers. For large cards, use at least `rounded-3xl` or `rounded-4xl`.
- **Palette**: 
    - **Primary "Sharp Green"**: `#cee88c`. Use this for main CTAs and active states.
    - **Background**: `#0f1620` (Dark Navy). Never use pure black `#000`.
    - **Contrast**: Text should be either pure white or high-contrast black on Sharp Green backgrounds.
- **Glassmorphism**: Use `backdrop-blur-xl` combined with semi-transparent backgrounds (e.g., `bg-white/5` or `bg-black/40`) and soft borders (`border-white/10`).

## 2. Component Standards

### Buttons (`PremiumButton`)
- Use the `PremiumButton` component whenever possible.
- **Rules**:
    - Must be `rounded-full`.
    - Incorporate a slide-reveal background animation on hover.
    - Icons should rotate when hovered (usually `-45deg`).
    - Use `shadow-[0_0_20px_-5px_rgba(206,232,140,0.3)]` for primary buttons to give them a "glow."

### Inputs & Forms
- ALL text inputs and selects must be `rounded-full`.
- Use a subtle border `border-white/10` that softens to `border-primary` on focus.
- Add a slight background tint `bg-white/5` for depth.

### Cards & Panels
- Use `glass-panel` or `glass-card` classes.
- Padding should be generous (usually `p-6` or `p-8`).
- Borders must be extremely subtle (`border-white/5`).

## 3. Motion & Interaction

- **Library**: Always use `framer-motion`.
- **Entrance**: Components should slide in from the bottom with a spring transition:
  ```tsx
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  ```
- **Hover States**: Every interactive element must have a clear hover state (glow, color shift, or slight scale up `1.02`).

## 4. Typography

- **Headings**: Use `"Bricolage Grotesque"` (font-fancy). Keep them bold and tight (`tracking-tight`).
- **Body**: Use `"Nunito Sans"`. Keep line heights comfortable (`leading-relaxed`).

## 5. Golden Code Snippet

```tsx
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const SharpCard = ({ children, className }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={cn(
      "glass-panel rounded-[2rem] p-8 border border-white/10 transition-all duration-300",
      "hover:border-primary/30 hover:shadow-primary/5 shadow-2xl",
      className
    )}
  >
    {children}
  </motion.div>
);
```
