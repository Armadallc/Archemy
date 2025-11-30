# HALCYON Design System

A comprehensive design system for the HALCYON transportation management platform, built with consistency, accessibility, and scalability in mind.

## 🎯 **Overview**

The HALCYON Design System provides a unified visual language and component library for building consistent, accessible, and beautiful user interfaces across the transportation management platform.

## 🏗️ **Architecture**

### **Design Tokens**
The foundation of our design system, providing consistent values for colors, typography, spacing, and shadows.

- **Colors** (`/tokens/colors.ts`) - Semantic color palette with primary, secondary, and status colors
- **Typography** (`/tokens/typography.ts`) - Font families, sizes, weights, and text styles
- **Spacing** (`/tokens/spacing.ts`) - Consistent spacing scale and border radius values
- **Shadows** (`/tokens/shadows.ts`) - Elevation system for depth and visual hierarchy

### **Pages**
- **Design Sandbox** (`/pages/design-sandbox.tsx`) - Safe experimentation space for testing new UI components
- **Design Reference** (`/pages/design-reference.tsx`) - Visual catalog and reference library

## 🚀 **Getting Started**

### **1. Access the Design System**

Navigate to these URLs in your browser:
- **Design Sandbox**: `http://localhost:3000/design-sandbox`
- **Design Reference**: `http://localhost:3000/design-reference`

### **2. Using Design Tokens**

Import design tokens in your components:

```typescript
import { colors, typography, spacing, shadows } from '../design-system/tokens';

// Use colors
const primaryColor = colors.primary[500];
const successColor = colors.success[500];

// Use typography
const headingStyle = typography.textStyles['heading-lg'];

// Use spacing
const padding = spacing.scale[4]; // 1rem
const borderRadius = spacing.borderRadius.lg; // 0.5rem

// Use shadows
const cardShadow = shadows.elevation[2];
```

### **3. Tailwind Integration**

Our design tokens are integrated with Tailwind CSS. Use the custom classes:

```html
<!-- Colors -->
<div class="bg-primary-500 text-white">Primary background</div>
<div class="text-success-600">Success text</div>

<!-- Typography -->
<h1 class="text-display-lg">Large display heading</h1>
<p class="text-body-md">Body text</p>

<!-- Spacing -->
<div class="p-4 m-6">Consistent spacing</div>

<!-- Shadows -->
<div class="elevation-2">Card with elevation</div>
```

## 🎨 **Design Principles**

### **Consistency**
- All design elements follow the same visual language
- Standardized spacing and typography scales
- Unified interaction patterns and animations

### **Accessibility**
- WCAG 2.1 AA compliance for color contrast
- Keyboard navigation support
- Screen reader compatibility

### **Scalability**
- Modular design token system
- Reusable component patterns
- Easy to extend and maintain

## 📚 **Design Tokens Reference**

### **Colors**
- **Primary**: Brand colors for main actions and elements
- **Secondary**: Complementary colors for secondary actions
- **Success**: Green colors for positive states
- **Warning**: Yellow/orange colors for warnings
- **Error**: Red colors for errors and destructive actions
- **Info**: Blue colors for informational messages
- **Neutral**: Gray scale for text and backgrounds

### **Typography**
- **Display**: Large headings for page titles
- **Heading**: Section and subsection headings
- **Body**: Main content text
- **Label**: Form labels and small text
- **Caption**: Captions and metadata

### **Spacing**
- **Scale**: Consistent spacing values from 0 to 96rem
- **Semantic**: Predefined spacing for components, layouts, and sections
- **Border Radius**: Consistent corner rounding values

### **Shadows**
- **Elevation**: Material design-like depth system
- **Focus**: Accessibility-focused shadow states
- **Colored**: Brand-colored shadow effects

## 🧪 **Experimentation**

### **Design Sandbox**
Use the Design Sandbox (`/design-sandbox`) to:
- Test new color combinations
- Experiment with typography styles
- Try different spacing and layout patterns
- Build and test new components
- Validate design decisions before implementation

### **Design Reference**
Use the Design Reference (`/design-reference`) to:
- View all available design tokens
- See component examples and usage
- Understand design patterns and guidelines
- Reference color codes and values
- Learn about accessibility considerations

## 🔧 **Development Workflow**

### **1. Design New Components**
1. Start in the Design Sandbox
2. Experiment with different approaches
3. Test accessibility and usability
4. Document your findings

### **2. Add to Design Reference**
1. Move successful experiments to Design Reference
2. Document usage guidelines
3. Provide code examples
4. Update design token documentation

### **3. Implement in Production**
1. Use design tokens consistently
2. Follow established patterns
3. Test across different screen sizes
4. Validate accessibility compliance

## 📱 **Responsive Design**

Our design system includes responsive breakpoints:
- **xs**: 475px
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🎭 **Customization**

### **Extending Design Tokens**
Add new tokens to the appropriate files in `/tokens/`:

```typescript
// Add new color
export const colors = {
  // ... existing colors
  custom: {
    500: '#your-color',
  },
};
```

### **Adding New Components**
Create new components in the Design Sandbox first, then move successful ones to the Design Reference.

## 📖 **Resources**

- **Design Tokens**: `/client/src/design-system/tokens/`
- **Sandbox Page**: `/client/src/pages/design-sandbox.tsx`
- **Reference Page**: `/client/src/pages/design-reference.tsx`
- **Tailwind Config**: `/client/src/design-system/tailwind.config.ts`

## 🤝 **Contributing**

1. **Experiment** in the Design Sandbox
2. **Document** successful patterns in Design Reference
3. **Follow** established design principles
4. **Test** accessibility and usability
5. **Share** knowledge with the team

---

**Happy designing!** 🎨✨


