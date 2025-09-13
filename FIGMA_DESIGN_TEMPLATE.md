# Figma Design Template - Transport Management System

## 📱 Canvas Sizes & Breakpoints

### **Desktop Breakpoints**
```
Extra Large: 1920x1080px (Primary Desktop)
Large:       1440x900px  (Standard Desktop)
Medium:      1280x720px  (Small Desktop/Laptop)
```

### **Mobile Breakpoints**
```
Mobile Large:  428x926px  (iPhone 14 Pro Max)
Mobile Medium: 390x844px  (iPhone 14 Pro)
Mobile Small:  375x667px  (iPhone SE)
Tablet:        768x1024px (iPad)
```

## 🎨 Color System (Copy to Figma)

### **Foundation Colors**
```
Background: #F0EDE5 (Cow's Milk)
Text:       #312F2C (Holy Crow)
Border:     #312F2C (Holy Crow)
```

### **Interactive States**
```
Hover Light:  #f5f2ea
Hover Dark:   #ebe7de
Status Accent: #A4B7BB (Casper Blue)
```

### **Trip Status Colors**
```
Scheduled:   hsl(45, 100%, 51%) - #FFD700
Confirmed:   hsl(207, 90%, 54%) - #1E90FF
In Progress: hsl(36, 100%, 50%) - #FF8C00
Completed:   hsl(122, 39%, 49%) - #32CD32
Cancelled:   hsl(0, 84%, 60%) - #DC143C
```

### **Driver Assignment Colors**
```
Driver 1: #8B5CF6 (Violet)
Driver 2: #EC4899 (Pink)
Driver 3: #06B6D4 (Cyan)
Driver 4: #84CC16 (Lime)
Driver 5: #F97316 (Orange)
Driver 6: #6366F1 (Indigo)
```

## 📐 Spacing System

### **Base Unit: 8px**
```
xs:  4px   (0.5 units)
sm:  8px   (1 unit)
md:  16px  (2 units)
lg:  24px  (3 units)
xl:  32px  (4 units)
2xl: 48px  (6 units)
3xl: 64px  (8 units)
```

### **Component Spacing**
```
Card Padding:    24px
Button Padding:  12px 24px
Input Padding:   16px
Section Margin:  32px
Page Margin:     48px
```

## 🔤 Typography Scale

### **Font Families**
```
Primary:   Inter (Body text, UI elements)
Heading:   DegularDisplay (Page titles, headers)
Secondary: Nohemi (Alternative body text)
```

### **Font Sizes**
```
xs:   12px / line-height: 16px
sm:   14px / line-height: 20px
base: 16px / line-height: 24px
lg:   18px / line-height: 28px
xl:   20px / line-height: 28px
2xl:  24px / line-height: 32px
3xl:  30px / line-height: 36px
4xl:  36px / line-height: 40px
5xl:  48px / line-height: 1
6xl:  64px / line-height: 1
```

### **Font Weights**
```
Light:     300
Regular:   400
Medium:    500
Semibold:  600
Bold:      700
Black:     900
```

## 📦 Component Dimensions

### **Header**
```
Desktop Height: 146px
Mobile Height:  64px
Logo Height:    96px (desktop), 48px (mobile)
```

### **Sidebar**
```
Desktop Width:  280px
Mobile:         Overlay (full width - 64px margin)
Logo Section:   146px height
```

### **Cards**
```
Min Height:     120px
Padding:        24px
Border Radius:  8px
Border Width:   1px
```

### **Buttons**
```
Primary:   44px height, 16px 24px padding
Secondary: 40px height, 12px 20px padding
Small:     36px height, 8px 16px padding
Icon:      40x40px minimum touch target
```

### **Form Elements**
```
Input Height:    44px
Input Padding:   16px
Select Height:   44px
Checkbox:        20x20px
Radio:           20x20px
```

### **Calendar Grid**
```
Cell Size:       48x48px (desktop), 40x40px (mobile)
Grid Gaps:       2px
Header Height:   44px
```

### **Trip Cards**
```
List Item:       80px height minimum
Calendar Item:   Variable height (min 24px)
Card Padding:    16px
Status Badge:    24px height, 8px 12px padding
```

## 📱 Mobile Optimization

### **Touch Targets**
```
Minimum Size:    44x44px
Recommended:     48x48px
Icon Buttons:    44x44px
Text Links:      44px height minimum
```

### **Mobile Spacing**
```
Screen Margin:   16px
Card Margin:     8px
Button Spacing:  12px
Input Spacing:   16px
```

### **Safe Areas**
```
Top Safe Area:    env(safe-area-inset-top)
Bottom Safe Area: env(safe-area-inset-bottom)
Side Safe Areas:  env(safe-area-inset-left/right)
```

## 🎯 Component Templates

### **Dashboard Layout**
```
Header:          Full width, 146px height
Sidebar:         280px width, full height
Main Content:    Remaining space with 32px padding
Card Grid:       3 columns (desktop), 1 column (mobile)
```

### **Trip Management**
```
Split Layout:    50/50 horizontal split (desktop)
Stack Layout:    Vertical stack (mobile)
Table Rows:      56px height minimum
Calendar Cells:  48x48px with hover states
```

### **Forms**
```
Max Width:       600px
Field Spacing:   24px vertical
Label Spacing:   8px below label
Error Spacing:   4px below field
```

### **Navigation**
```
Menu Items:      48px height
Icon Size:       20x20px
Text Size:       16px medium weight
Active State:    Background + border accent
```

## 🔧 Figma Setup Instructions

### **1. Create Artboards**
- Desktop: 1440x900px
- Mobile: 390x844px
- Tablet: 768x1024px

### **2. Set Up Styles**
- Create color styles for foundation colors
- Create text styles for typography scale
- Create effect styles for shadows and borders

### **3. Create Components**
- Header with logo and navigation
- Sidebar with menu items
- Card layouts for trip information
- Form elements (inputs, buttons, selects)
- Calendar grid with date cells
- Status badges with color variants

### **4. Auto Layout**
- Use auto layout for responsive components
- Set proper constraints for resizing
- Create responsive grids for content

### **5. Design Tokens**
- Export design tokens using Figma Tokens plugin
- Organize tokens by categories (colors, spacing, typography)
- Maintain consistency with CSS variables

This template provides the exact specifications used in your current transport management system, ensuring perfect alignment between Figma designs and the implemented code.