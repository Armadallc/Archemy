import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronDown, ChevronUp, Palette, Copy, Check } from "lucide-react";

export default function ColorMappingReference() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const semanticTokens = [
    {
      token: "--background",
      radixStep: "Step 1",
      useCase: "App background",
      lightValue: "--gray-1 or --color-background",
      darkValue: "--gray-1 or --color-background",
    },
    {
      token: "--card",
      radixStep: "Step 2",
      useCase: "Card/surface backgrounds",
      lightValue: "--gray-2",
      darkValue: "--gray-2",
    },
    {
      token: "--primary",
      radixStep: "Step 9",
      useCase: "Primary buttons, solid backgrounds",
      lightValue: "--red-9",
      darkValue: "--lime-9",
    },
    {
      token: "--accent",
      radixStep: "Step 9",
      useCase: "Accent colors, highlights",
      lightValue: "--red-9",
      darkValue: "--lime-9",
    },
    {
      token: "--border",
      radixStep: "Step 7",
      useCase: "Borders, dividers",
      lightValue: "--gray-7",
      darkValue: "--gray-7",
    },
    {
      token: "--ring",
      radixStep: "Step 7",
      useCase: "Focus rings",
      lightValue: "--red-7",
      darkValue: "--lime-7",
    },
    {
      token: "--foreground",
      radixStep: "Step 12",
      useCase: "High-contrast text",
      lightValue: "--gray-12",
      darkValue: "--gray-12",
    },
    {
      token: "--muted-foreground",
      radixStep: "Step 11",
      useCase: "Low-contrast text",
      lightValue: "--gray-11",
      darkValue: "--gray-11",
    },
  ];

  const quickReference = [
    { element: "Button (primary)", token: "--primary" },
    { element: "Button hover", token: "--primary (hover)" },
    { element: "Card background", token: "--card" },
    { element: "Text (main)", token: "--foreground" },
    { element: "Text (secondary)", token: "--muted-foreground" },
    { element: "Border", token: "--border" },
    { element: "Focus ring", token: "--ring" },
  ];

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Palette className="w-4 h-4" />
            Color Mapping Reference
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
        <CardContent className="space-y-4">
          {/* Quick Reference */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Quick Reference</h4>
            <div className="grid grid-cols-2 gap-2">
              {quickReference.map((ref) => (
                <div
                  key={ref.element}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
                >
                  <span className="text-gray-600">{ref.element}:</span>
                  <div className="flex items-center gap-1">
                    <code className="font-mono text-blue-600">{ref.token}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => copyToClipboard(ref.token)}
                    >
                      {copiedToken === ref.token ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Mapping Table */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Semantic Tokens</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {semanticTokens.map((item) => (
                <div
                  key={item.token}
                  className="border rounded p-2 bg-gray-50 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-blue-600">{item.token}</code>
                      <Badge variant="outline" className="text-xs">
                        {item.radixStep}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => copyToClipboard(item.token)}
                    >
                      {copiedToken === item.token ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  <div className="text-gray-600 mb-1">{item.useCase}</div>
                  <div className="flex gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Light:</span>{" "}
                      <code className="font-mono text-purple-600">{item.lightValue}</code>
                    </div>
                    <div>
                      <span className="text-gray-500">Dark:</span>{" "}
                      <code className="font-mono text-purple-600">{item.darkValue}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Example */}
          <div className="pt-2 border-t">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">How to Use</h4>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
              <p className="text-gray-700 mb-2">
                <strong>To change an element's color:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Identify the element by its REF-ID (e.g., <code className="font-mono">DASH-005</code>)</li>
                <li>Find the semantic token you want to change</li>
                <li>Copy the token name (click the copy icon)</li>
                <li>Use in your command: <code className="font-mono bg-white px-1 rounded">DASH-005: Change background to var(--primary)</code></li>
              </ol>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

