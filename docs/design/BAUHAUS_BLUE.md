# Bauhaus Blue - Color Theme Reference

Complete color palette for the "Bauhaus Blue" theme, generated from Radix Colors.

---

## Theme Overview

- **Theme Name:** Bauhaus Blue
- **Light Background:** `#f9f4f0`
- **Dark Background:** `#2a282b`
- **Accent Scale:** Blue (12-step scale)
- **Gray Scale:** Gray (12-step scale)

---

## Light Mode Scales

### Accent Scale (Blue)

```css
:root, .light, .light-theme {
  --blue-1: #f0f2f3;
  --blue-2: #e9eef0;
  --blue-3: #dce7ed;
  --blue-4: #cedfe8;
  --blue-5: #c0d6e1;
  --blue-6: #b0cbd9;
  --blue-7: #9bbdce;
  --blue-8: #7ba8be;
  --blue-9: #7cadc5;
  --blue-10: #71a2ba;
  --blue-11: #326177;
  --blue-12: #1b333e;

  --blue-a1: #cceaff33;
  --blue-a2: #099af011;
  --blue-a3: #0386d71e;
  --blue-a4: #067ec32d;
  --blue-a5: #0372b03b;
  --blue-a6: #0169a24b;
  --blue-a7: #02649761;
  --blue-a8: #025f8e82;
  --blue-a9: #02679b81;
  --blue-a10: #025f8e8c;
  --blue-a11: #003c59cc;
  --blue-a12: #011c29e4;

  --blue-contrast: #fff;
  --blue-surface: #e5ecf0cc;
  --blue-indicator: #7cadc5;
  --blue-track: #7cadc5;
}

@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    :root, .light, .light-theme {
      --blue-1: oklch(96% 0.0033 229.6);
      --blue-2: oklch(94.6% 0.0063 229.6);
      --blue-3: oklch(92.1% 0.0147 229.6);
      --blue-4: oklch(89.4% 0.0217 229.6);
      --blue-5: oklch(86.3% 0.0283 229.6);
      --blue-6: oklch(82.7% 0.0351 229.6);
      --blue-7: oklch(77.9% 0.0438 229.6);
      --blue-8: oklch(70.7% 0.0587 229.6);
      --blue-9: oklch(72.3% 0.0625 229.6);
      --blue-10: oklch(68.7% 0.0634 229.6);
      --blue-11: oklch(46.9% 0.0625 229.6);
      --blue-12: oklch(30.6% 0.0364 229.6);

      --blue-a1: color(display-p3 0.8157 0.9176 1 / 0.2);
      --blue-a2: color(display-p3 0.0118 0.5451 0.9451 / 0.057);
      --blue-a3: color(display-p3 0.0039 0.4745 0.7922 / 0.105);
      --blue-a4: color(display-p3 0.0078 0.4118 0.7216 / 0.158);
      --blue-a5: color(display-p3 0.0039 0.3804 0.6431 / 0.21);
      --blue-a6: color(display-p3 0.0039 0.3529 0.5804 / 0.271);
      --blue-a7: color(display-p3 0.0039 0.3255 0.5333 / 0.347);
      --blue-a8: color(display-p3 0.0039 0.3137 0.5059 / 0.468);
      --blue-a9: color(display-p3 0.0039 0.3451 0.549 / 0.46);
      --blue-a10: color(display-p3 0 0.3059 0.4941 / 0.5);
      --blue-a11: color(display-p3 0 0.1843 0.298 / 0.75);
      --blue-a12: color(display-p3 0 0.0824 0.1333 / 0.867);

      --blue-contrast: #fff;
      --blue-surface: color(display-p3 0.902 0.9255 0.9412 / 0.8);
      --blue-indicator: oklch(72.3% 0.0625 229.6);
      --blue-track: oklch(72.3% 0.0625 229.6);
    }
  }
}
```

### Gray Scale (Light Mode)

```css
:root, .light, .light-theme {
  --gray-1: #f1f1f2;
  --gray-2: #ededee;
  --gray-3: #e3e3e5;
  --gray-4: #dbdbdd;
  --gray-5: #d3d3d6;
  --gray-6: #cacace;
  --gray-7: #bfbfc3;
  --gray-8: #acacb1;
  --gray-9: #7e7e84;
  --gray-10: #747479;
  --gray-11: #57575b;
  --gray-12: #202023;

  --gray-a1: #bddeff22;
  --gray-a2: #0e6bc90d;
  --gray-a3: #05387717;
  --gray-a4: #0327541f;
  --gray-a5: #011d4727;
  --gray-a6: #051a4031;
  --gray-a7: #0313303c;
  --gray-a8: #010c254f;
  --gray-a9: #0106167e;
  --gray-a10: #02061389;
  --gray-a11: #00030ba6;
  --gray-a12: #010106df;

  --gray-contrast: #FFFFFF;
  --gray-surface: #ffffffcc;
  --gray-indicator: #7e7e84;
  --gray-track: #7e7e84;
}

@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    :root, .light, .light-theme {
      --gray-1: oklch(95.9% 0.0007 286);
      --gray-2: oklch(94.8% 0.0013 286);
      --gray-3: oklch(91.8% 0.0024 286);
      --gray-4: oklch(89.1% 0.0032 286);
      --gray-5: oklch(86.6% 0.0041 286);
      --gray-6: oklch(84.1% 0.0047 286);
      --gray-7: oklch(80.6% 0.0058 286);
      --gray-8: oklch(74.5% 0.0079 286);
      --gray-9: oklch(59.6% 0.0079 286);
      --gray-10: oklch(56% 0.0075 286);
      --gray-11: oklch(45.7% 0.0065 286);
      --gray-12: oklch(24.4% 0.0055 286);

      --gray-a1: color(display-p3 0.7686 0.8706 1 / 0.134);
      --gray-a2: color(display-p3 0.0157 0.349 0.7686 / 0.045);
      --gray-a3: color(display-p3 0.0039 0.1725 0.4353 / 0.085);
      --gray-a4: color(display-p3 0.0039 0.1216 0.3059 / 0.117);
      --gray-a5: color(display-p3 0.0078 0.0941 0.2627 / 0.15);
      --gray-a6: color(display-p3 0.0039 0.0706 0.2275 / 0.186);
      --gray-a7: color(display-p3 0.0039 0.0549 0.1765 / 0.23);
      --gray-a8: color(display-p3 0.0039 0.0392 0.1373 / 0.307);
      --gray-a9: color(display-p3 0.0039 0.0196 0.0745 / 0.492);
      --gray-a10: color(display-p3 0 0.0157 0.0667 / 0.533);
      --gray-a11: color(display-p3 0 0.0118 0.0431 / 0.65);
      --gray-a12: color(display-p3 0 0.0039 0.0196 / 0.871);

      --gray-contrast: #FFFFFF;
      --gray-surface: color(display-p3 1 1 1 / 80%);
      --gray-indicator: oklch(59.6% 0.0079 286);
      --gray-track: oklch(59.6% 0.0079 286);
    }
  }
}
```

### Background Color (Light Mode)

```css
:root, .light, .light-theme, .radix-themes {
  --color-background: #f9f4f0;
}
```

---

## Dark Mode Scales

### Accent Scale (Blue - Dark Mode)

```css
.dark, .dark-theme {
  --blue-1: #232a2e;
  --blue-2: #283034;
  --blue-3: #2b3a42;
  --blue-4: #2e434d;
  --blue-5: #334b56;
  --blue-6: #395562;
  --blue-7: #426272;
  --blue-8: #51788b;
  --blue-9: #a1c3d4;
  --blue-10: #97b8c9;
  --blue-11: #9dbfd0;
  --blue-12: #deeff8;

  --blue-a1: #00a8eb04;
  --blue-a2: #00e2fc0b;
  --blue-a3: #34ccfd1c;
  --blue-a4: #43d0ff29;
  --blue-a5: #57d4fe34;
  --blue-a6: #64d4fd43;
  --blue-a7: #72d4fe56;
  --blue-a8: #80d8ff74;
  --blue-a9: #bfeafecc;
  --blue-a10: #bbe8febf;
  --blue-a11: #bee9ffc7;
  --blue-a12: #e4f6fff7;

  --blue-contrast: #092531;
  --blue-surface: #27383d80;
  --blue-indicator: #a1c3d4;
  --blue-track: #a1c3d4;
}

@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    .dark, .dark-theme {
      --blue-1: oklch(28% 0.0122 229.6);
      --blue-2: oklch(30.2% 0.0137 229.6);
      --blue-3: oklch(34% 0.0241 229.6);
      --blue-4: oklch(36.9% 0.0309 229.6);
      --blue-5: oklch(39.8% 0.035 229.6);
      --blue-6: oklch(43.2% 0.0392 229.6);
      --blue-7: oklch(47.8% 0.0446 229.6);
      --blue-8: oklch(55.2% 0.0528 229.6);
      --blue-9: oklch(79.8% 0.0438 229.6);
      --blue-10: oklch(76.4% 0.0438 229.6);
      --blue-11: oklch(78.7% 0.0438 229.6);
      --blue-12: oklch(94.3% 0.022 229.6);

      --blue-a1: color(display-p3 0 0.6824 0.9569 / 0.015);
      --blue-a2: color(display-p3 0.1686 0.8902 0.9922 / 0.043);
      --blue-a3: color(display-p3 0.3176 0.8392 0.9961 / 0.104);
      --blue-a4: color(display-p3 0.3686 0.8118 1 / 0.156);
      --blue-a5: color(display-p3 0.4431 0.8275 1 / 0.199);
      --blue-a6: color(display-p3 0.4902 0.8353 1 / 0.255);
      --blue-a7: color(display-p3 0.5412 0.8431 1 / 0.326);
      --blue-a8: color(display-p3 0.5804 0.8549 1 / 0.444);
      --blue-a9: color(display-p3 0.7922 0.9255 1 / 0.788);
      --blue-a10: color(display-p3 0.7843 0.9176 1 / 0.736);
      --blue-a11: color(display-p3 0.7843 0.9255 1 / 0.769);
      --blue-a12: color(display-p3 0.9098 0.9647 0.9961 / 0.963);

      --blue-contrast: #092531;
      --blue-surface: color(display-p3 0.1569 0.2118 0.2275 / 0.5);
      --blue-indicator: oklch(79.8% 0.0438 229.6);
      --blue-track: oklch(79.8% 0.0438 229.6);
    }
  }
}
```

### Gray Scale (Dark Mode)

```css
.dark, .dark-theme {
  --gray-1: #29292a;
  --gray-2: #2f2f31;
  --gray-3: #373739;
  --gray-4: #3c3c3f;
  --gray-5: #414145;
  --gray-6: #48484c;
  --gray-7: #535358;
  --gray-8: #6a6a70;
  --gray-9: #75757b;
  --gray-10: #808086;
  --gray-11: #b6b6bc;
  --gray-12: #eeeeef;

  --gray-a1: #00a80002;
  --gray-a2: #b8efd509;
  --gray-a3: #e3fdf212;
  --gray-a4: #e2f4f819;
  --gray-a5: #e2f0fb20;
  --gray-a6: #eaf4fe28;
  --gray-a7: #e9f0fc37;
  --gray-a8: #eff3ff53;
  --gray-a9: #f0f3fd61;
  --gray-a10: #f2f4fe6e;
  --gray-a11: #f6f6ffaf;
  --gray-a12: #fefeffec;

  --gray-contrast: #FFFFFF;
  --gray-surface: rgba(0, 0, 0, 0.05);
  --gray-indicator: #75757b;
  --gray-track: #75757b;
}

@supports (color: color(display-p3 1 1 1)) {
  @media (color-gamut: p3) {
    .dark, .dark-theme {
      --gray-1: oklch(28% 0.0031 286);
      --gray-2: oklch(30.5% 0.003 286);
      --gray-3: oklch(33.6% 0.0042 286);
      --gray-4: oklch(35.7% 0.0055 286);
      --gray-5: oklch(37.6% 0.0062 286);
      --gray-6: oklch(40.2% 0.0074 286);
      --gray-7: oklch(44.4% 0.0082 286);
      --gray-8: oklch(52.7% 0.0082 286);
      --gray-9: oklch(56.5% 0.0082 286);
      --gray-10: oklch(60.2% 0.0082 286);
      --gray-11: oklch(77.7% 0.0082 286);
      --gray-12: oklch(94.9% 0.0021 286);

      --gray-a1: color(display-p3 0 0.9451 0 / 0.005);
      --gray-a2: color(display-p3 0.7608 0.9922 0.8824 / 0.033);
      --gray-a3: color(display-p3 0.8941 1 0.9569 / 0.07);
      --gray-a4: color(display-p3 0.9098 0.9843 0.9961 / 0.095);
      --gray-a5: color(display-p3 0.898 0.9569 1 / 0.123);
      --gray-a6: color(display-p3 0.9216 0.9647 1 / 0.156);
      --gray-a7: color(display-p3 0.9216 0.949 1 / 0.213);
      --gray-a8: color(display-p3 0.9451 0.9647 1 / 0.321);
      --gray-a9: color(display-p3 0.9569 0.9686 1 / 0.373);
      --gray-a10: color(display-p3 0.9608 0.9725 1 / 0.425);
      --gray-a11: color(display-p3 0.9725 0.9765 1 / 0.68);
      --gray-a12: color(display-p3 0.9961 0.9961 1 / 0.925);

      --gray-contrast: #FFFFFF;
      --gray-surface: color(display-p3 0 0 0 / 5%);
      --gray-indicator: oklch(56.5% 0.0082 286);
      --gray-track: oklch(56.5% 0.0082 286);
    }
  }
}
```

### Background Color (Dark Mode)

```css
.dark, .dark-theme, :is(.dark, .dark-theme) :where(.radix-themes:not(.light, .light-theme)) {
  --color-background: #2a282b;
}
```

---

## Quick Reference

### Key Colors

| Token | Light Mode | Dark Mode | Use Case |
|-------|------------|-----------|----------|
| `--color-background` | `#f9f4f0` | `#2a282b` | Main app background |
| `--blue-9` | `#7cadc5` | `#a1c3d4` | Primary/Accent solid color |
| `--blue-10` | `#71a2ba` | `#97b8c9` | Primary/Accent hover |
| `--gray-12` | `#202023` | `#eeeeef` | High-contrast text |
| `--gray-11` | `#57575b` | `#b6b6bc` | Low-contrast text |
| `--gray-7` | `#bfbfc3` | `#535358` | Borders |

---

## How to Apply

1. **Copy all CSS blocks** from this file
2. **Paste into** `client/src/index.css` (replace existing scales)
3. **Update semantic mappings** in `COLOR_MAPPING_TEMPLATE.md`:
   - `--primary` → `--blue-9`
   - `--accent` → `--blue-9`
   - `--background` → `--color-background` or `--gray-1`
   - `--foreground` → `--gray-12`
4. **Test** on scratch page and real pages

---

*Generated from Radix Colors Custom Palette*

