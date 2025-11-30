import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp, Type, Copy, Check } from "lucide-react";

export default function TypographyReference() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const fontFamilies = [
    {
      name: "Nohemi",
      useCase: "Body text, UI elements, forms",
      weights: "400 (Regular), 500 (Medium), 600 (SemiBold)",
      token: "font-sans",
    },
    {
      name: "DegularDisplay",
      useCase: "Headings, display text",
      weights: "700 (Bold), 900 (Black)",
      token: "font-heading",
    },
  ];

  const textStyles = [
    {
      name: "Mega Header",
      class: "text-mega",
      fontSize: "64px",
      fontWeight: "600",
      fontFamily: "Nohemi",
      colorToken: "--foreground",
      useCase: "Page titles",
    },
    {
      name: "XL Display",
      class: "text-xl-display",
      fontSize: "48px",
      fontWeight: "500",
      fontFamily: "Nohemi",
      colorToken: "--foreground",
      useCase: "Large display text",
    },
    {
      name: "H1 Heading",
      class: "text-brutalist-h1",
      fontSize: "36px",
      fontWeight: "700",
      fontFamily: "DegularDisplay",
      colorToken: "--foreground",
      useCase: "Section headers",
    },
    {
      name: "H2 Heading",
      class: "text-brutalist-h2",
      fontSize: "28px",
      fontWeight: "600",
      fontFamily: "DegularDisplay",
      colorToken: "--foreground",
      useCase: "Subsection headers",
    },
    {
      name: "Body Text",
      class: "text-brutalist-body",
      fontSize: "18px",
      fontWeight: "500",
      fontFamily: "Nohemi",
      colorToken: "--foreground",
      useCase: "Primary body text",
    },
    {
      name: "Small Text",
      class: "text-brutalist-small",
      fontSize: "14px",
      fontWeight: "500",
      fontFamily: "Nohemi",
      colorToken: "--foreground",
      useCase: "Small UI text",
    },
    {
      name: "Caption",
      class: "text-brutalist-caption",
      fontSize: "12px",
      fontWeight: "600",
      fontFamily: "Nohemi",
      colorToken: "--muted-foreground",
      useCase: "Captions, labels",
    },
  ];

  const typographyScale = [
    { token: "xs", size: "0.75rem", px: "12px", useCase: "Labels, captions" },
    { token: "sm", size: "0.875rem", px: "14px", useCase: "Small body text" },
    { token: "base", size: "1rem", px: "16px", useCase: "Default body text" },
    { token: "lg", size: "1.125rem", px: "18px", useCase: "Large body text" },
    { token: "xl", size: "1.25rem", px: "20px", useCase: "Subheadings" },
    { token: "2xl", size: "1.5rem", px: "24px", useCase: "Section headings" },
    { token: "3xl", size: "1.875rem", px: "30px", useCase: "Large headings" },
    { token: "4xl", size: "2.25rem", px: "36px", useCase: "Page titles" },
    { token: "5xl", size: "3rem", px: "48px", useCase: "Display text" },
    { token: "6xl", size: "3.75rem", px: "60px", useCase: "Hero text" },
  ];

  const quickReference = [
    { element: "Page title", class: "text-mega", color: "text-foreground" },
    { element: "Section header", class: "text-brutalist-h1", color: "text-foreground" },
    { element: "Body text", class: "text-brutalist-body", color: "text-foreground" },
    { element: "Secondary text", class: "text-base", color: "text-muted-foreground" },
    { element: "Caption", class: "text-brutalist-caption", color: "text-muted-foreground" },
    { element: "Button text", class: "text-base font-semibold", color: "text-primary-foreground" },
  ];

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Type className="w-4 h-4" />
            Typography Reference
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Font Families */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Font Families</h3>
            <div className="space-y-2">
              {fontFamilies.map((font) => (
                <div
                  key={font.name}
                  className="flex items-start justify-between p-3 bg-muted rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{font.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {font.token}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{font.useCase}</p>
                    <p className="text-xs text-muted-foreground">Weights: {font.weights}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 ml-2"
                    onClick={() => copyToClipboard(font.token)}
                  >
                    {copiedToken === font.token ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Text Styles with Examples */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Text Styles</h3>
            <div className="space-y-4">
              {textStyles.map((style) => (
                <div
                  key={style.name}
                  className="p-4 bg-muted rounded-lg border space-y-2"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{style.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {style.class}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{style.fontSize}</span>
                        <span>Weight: {style.fontWeight}</span>
                        <span>{style.fontFamily}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{style.useCase}</p>
                      <p className="text-xs text-muted-foreground">
                        Color: <code className="text-xs">{style.colorToken}</code>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 ml-2"
                      onClick={() => copyToClipboard(style.class)}
                    >
                      {copiedToken === style.class ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {/* Live Example */}
                  <div className="p-3 bg-background border rounded">
                    <span
                      className={`${style.class} ${style.colorToken === "--foreground" ? "text-foreground" : "text-muted-foreground"} ${style.fontFamily === "DegularDisplay" ? "font-heading" : "font-sans"}`}
                    >
                      {style.name} Example
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Scale */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Typography Scale</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {typographyScale.map((scale) => (
                <div
                  key={scale.token}
                  className="p-2 bg-muted rounded border text-center"
                >
                  <div className="font-semibold text-foreground text-xs mb-1">
                    {scale.token}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {scale.size} / {scale.px}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Reference */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickReference.map((ref, index) => (
                <div
                  key={index}
                  className="p-2 bg-muted rounded border flex items-center justify-between"
                >
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground">{ref.element}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground">{ref.class}</code>
                      <code className="text-xs text-muted-foreground">{ref.color}</code>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={() => copyToClipboard(`${ref.class} ${ref.color}`)}
                  >
                    {copiedToken === `${ref.class} ${ref.color}` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Typography + Color Integration Note */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> Typography works with colors through semantic tokens:
              <code className="block mt-1 text-xs">--foreground</code> for high-contrast text,
              <code className="block text-xs">--muted-foreground</code> for low-contrast text.
              When you change color themes, typography sizes stay the same—only text colors change.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

