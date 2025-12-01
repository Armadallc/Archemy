import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ============================================================
      // FONT FAMILIES
      // ============================================================
      fontFamily: {
        sans: ['Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        heading: ['var(--font-heading)', 'Nohemi', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'Space Grotesk', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // ============================================================
      // BORDER RADIUS
      // ============================================================
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
        xl: "var(--radius-xl)",
      },
      // ============================================================
      // COLORS - Map CSS variables to Tailwind utilities
      // ============================================================
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          hover: "var(--destructive-hover)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Surface colors
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          muted: "var(--surface-muted)",
        },
        // Foreground variants
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-muted": "var(--foreground-muted)",
        // Border variants
        "border-muted": "var(--border-muted)",
        "border-strong": "var(--border-strong)",
        // Sidebar
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          "foreground-muted": "var(--sidebar-foreground-muted)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Status colors
        status: {
          pending: "var(--status-pending)",
          "pending-bg": "var(--status-pending-bg)",
          success: "var(--status-success)",
          "success-bg": "var(--status-success-bg)",
          warning: "var(--status-warning)",
          "warning-bg": "var(--status-warning-bg)",
          error: "var(--status-error)",
          "error-bg": "var(--status-error-bg)",
          info: "var(--status-info)",
          "info-bg": "var(--status-info-bg)",
        },
        // Priority classification
        priority: {
          high: "var(--priority-high)",
          "high-bg": "var(--priority-high-bg)",
          "high-glow": "var(--priority-high-glow)",
          medium: "var(--priority-medium)",
          "medium-bg": "var(--priority-medium-bg)",
          "medium-glow": "var(--priority-medium-glow)",
          low: "var(--priority-low)",
          "low-bg": "var(--priority-low-bg)",
          "low-glow": "var(--priority-low-glow)",
        },
        // Trip status
        scheduled: "var(--scheduled)",
        "scheduled-bg": "var(--scheduled-bg)",
        "in-progress": "var(--in-progress)",
        "in-progress-bg": "var(--in-progress-bg)",
        completed: "var(--completed)",
        "completed-bg": "var(--completed-bg)",
        cancelled: "var(--cancelled)",
        "cancelled-bg": "var(--cancelled-bg)",
        confirmed: "var(--confirmed)",
        "confirmed-bg": "var(--confirmed-bg)",
        // Driver colors
        driver: {
          1: "var(--driver-color-1)",
          2: "var(--driver-color-2)",
          3: "var(--driver-color-3)",
          4: "var(--driver-color-4)",
          5: "var(--driver-color-5)",
          6: "var(--driver-color-6)",
        },
        // Raw palette (for special cases)
        palette: {
          charcoal: "var(--color-charcoal)",
          ice: "var(--color-ice)",
          lime: "var(--color-lime)",
          coral: "var(--color-coral)",
          silver: "var(--color-silver)",
          cloud: "var(--color-cloud)",
        },
        // Chart colors (keep existing)
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      // ============================================================
      // BOX SHADOWS
      // ============================================================
      boxShadow: {
        "neu-flat": "var(--shadow-neu-flat)",
        "neu-raised": "var(--shadow-neu-raised)",
        "neu-pressed": "var(--shadow-neu-pressed)",
        "neu-subtle": "var(--shadow-neu-subtle)",
      },
      // ============================================================
      // BACKDROP BLUR
      // ============================================================
      backdropBlur: {
        glass: "12px",
      },
      // ============================================================
      // KEYFRAMES & ANIMATIONS
      // ============================================================
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "neu-press": {
          "0%": { boxShadow: "var(--shadow-neu-flat)" },
          "100%": { boxShadow: "var(--shadow-neu-pressed)" },
        },
        "neu-release": {
          "0%": { boxShadow: "var(--shadow-neu-pressed)" },
          "100%": { boxShadow: "var(--shadow-neu-flat)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "neu-press": "neu-press 150ms ease forwards",
        "neu-release": "neu-release 150ms ease forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
