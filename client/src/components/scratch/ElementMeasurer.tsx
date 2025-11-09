import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Ruler } from "lucide-react";
import { useLocation } from "wouter";

interface GridInfo {
  display: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumns?: number;
  gridRows?: number;
  gap?: string;
  columnGap?: string;
  rowGap?: string;
  childCount: number;
  directChildren: Array<{
    tagName: string;
    className: string;
    gridColumn?: string;
    gridRow?: string;
    colSpan?: number;
    rowSpan?: number;
  }>;
}

interface Measurement {
  selector: string;
  name?: string;
  width: number;
  height: number;
  top: number;
  left: number;
  gridInfo?: GridInfo;
}

interface ElementSelector {
  name: string;
  selector: string;
}

interface ElementMeasurerProps {
  selectors?: ElementSelector[];
  pageName?: string;
}

export default function ElementMeasurer({ selectors, pageName }: ElementMeasurerProps = {} as ElementMeasurerProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [location] = useLocation();

  useEffect(() => {
    console.log("📏 ElementMeasurer component mounted and visible");
  }, []);

  // Determine which selectors to use based on page or props
  const getSelectors = (): ElementSelector[] => {
    // If custom selectors provided, use those
    if (selectors && selectors.length > 0) {
      return selectors;
    }

    // Detect page from URL
    const currentPath = location;

    // Dashboard selectors
    if (currentPath === '/' || currentPath.includes('dashboard')) {
      return [
        {
          name: "Row 2 - Fleet Status",
          selector: "#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(2)"
        },
        {
          name: "Row 3 - Revenue Widget",
          selector: "#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(3)"
        },
        {
          name: "Row 1 - Live Operations",
          selector: "#root > div > div > div > main > div.flex-1.overflow-auto.mobile-optimized.pb-20.md\\:pb-0 > div > div.flex-1.overflow-auto.p-6.bg-gray-900 > div > div:nth-child(2) > div:nth-child(1)"
        }
      ];
    }

    // Trips page selectors
    if (currentPath.includes('/trips') && !currentPath.includes('/trips/edit') && !currentPath.includes('/trips/new')) {
      return [
        {
          name: "Header Section",
          selector: "div.p-6.space-y-6 > div.flex.items-center.justify-between:first-child"
        },
        {
          name: "Filters Card",
          selector: "div.p-6.space-y-6 > div[class*='card']:nth-child(2)"
        },
        {
          name: "Trip Card (first)",
          selector: "div.p-6.space-y-6 > div.space-y-4 > div[class*='hover\\:shadow-md']:first-child"
        }
      ];
    }

    // Drivers page selectors
    if (currentPath.includes('/drivers')) {
      return [
        {
          name: "Header Section",
          selector: "div.p-6.space-y-6 > div.flex.items-center.justify-between:first-child"
        },
        {
          name: "Search Section",
          selector: "div.p-6.space-y-6 > div.flex.items-center.space-x-2:nth-child(2)"
        },
        {
          name: "Driver Card (first)",
          selector: "div.p-6.space-y-6 > div.grid.gap-6 > div[class*='hover\\:shadow-md']:first-child"
        }
      ];
    }

    // Default: empty array
    return [];
  };

  const analyzeGridLayout = (element: HTMLElement): GridInfo | null => {
    const styles = window.getComputedStyle(element);
    const display = styles.display;

    // Check if it's a grid or flex container
    if (display !== 'grid' && display !== 'flex') {
      return null;
    }

    const children = Array.from(element.children) as HTMLElement[];
    const childCount = children.length;

    // Analyze children
    const directChildren = children.map((child) => {
      const childStyles = window.getComputedStyle(child);
      const gridColumn = childStyles.gridColumn;
      const gridRow = childStyles.gridRow;

      // Calculate column/row spans
      let colSpan = 1;
      let rowSpan = 1;
      
      if (gridColumn && gridColumn.includes('span')) {
        const spanMatch = gridColumn.match(/span\s+(\d+)/);
        if (spanMatch) colSpan = parseInt(spanMatch[1], 10);
        else if (gridColumn.includes('/')) {
          const [start, end] = gridColumn.split('/').map(s => parseInt(s.trim()));
          if (!isNaN(start) && !isNaN(end)) colSpan = end - start + 1;
        }
      }
      
      if (gridRow && gridRow.includes('span')) {
        const spanMatch = gridRow.match(/span\s+(\d+)/);
        if (spanMatch) rowSpan = parseInt(spanMatch[1], 10);
        else if (gridRow.includes('/')) {
          const [start, end] = gridRow.split('/').map(s => parseInt(s.trim()));
          if (!isNaN(start) && !isNaN(end)) rowSpan = end - start + 1;
        }
      }

      return {
        tagName: child.tagName.toLowerCase(),
        className: child.className || '',
        gridColumn,
        gridRow,
        colSpan,
        rowSpan,
      };
    });

    // For grid layouts, analyze template
    if (display === 'grid') {
      const gridTemplateColumns = styles.gridTemplateColumns;
      const gridTemplateRows = styles.gridTemplateRows;
      const gap = styles.gap;
      const columnGap = styles.columnGap;
      const rowGap = styles.rowGap;

      // Count columns and rows from template
      let gridColumns = 0;
      let gridRows = 0;

      if (gridTemplateColumns) {
        // Count columns (split by spaces, filter out 'auto', 'minmax', etc.)
        const cols = gridTemplateColumns.split(' ').filter(c => c && c !== 'auto');
        gridColumns = cols.length;
      }

      if (gridTemplateRows) {
        const rows = gridTemplateRows.split(' ').filter(r => r && r !== 'auto');
        gridRows = rows.length;
      }

      // If template not explicit, try to infer from children
      if (gridColumns === 0 && childCount > 0) {
        // Try to detect from class names or actual layout
        const firstChild = children[0];
        if (firstChild) {
          // Check for Tailwind grid classes
          const classList = Array.from(element.classList);
          const gridColsMatch = classList.find(c => c.startsWith('grid-cols-'));
          if (gridColsMatch) {
            const colsMatch = gridColsMatch.match(/grid-cols-(\d+)/);
            if (colsMatch) gridColumns = parseInt(colsMatch[1], 10);
          }
        }
      }

      return {
        display: 'grid',
        gridTemplateColumns,
        gridTemplateRows,
        gridColumns: gridColumns || undefined,
        gridRows: gridRows || undefined,
        gap,
        columnGap,
        rowGap,
        childCount,
        directChildren,
      };
    }

    // For flex layouts
    if (display === 'flex') {
      const flexDirection = styles.flexDirection;
      const flexWrap = styles.flexWrap;
      const gap = styles.gap;

      return {
        display: `flex-${flexDirection}`,
        gap,
        childCount,
        directChildren,
      };
    }

    return null;
  };

  const measureElement = (selector: string, name?: string) => {
    try {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        const gridInfo = analyzeGridLayout(element);

        const measurement: Measurement = {
          selector,
          name,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          gridInfo: gridInfo || undefined,
        };

        setMeasurements((prev) => {
          const filtered = prev.filter((m) => m.selector !== selector);
          return [...filtered, measurement];
        });
        return measurement;
      }
    } catch (error) {
      console.error(`Failed to measure ${selector}:`, error);
    }
    return null;
  };

  const measureAll = () => {
    const elementSelectors = getSelectors();

    if (elementSelectors.length === 0) {
      alert("No selectors configured for this page. Please check the ElementMeasurer configuration.");
      return;
    }

    const results: Measurement[] = [];
    elementSelectors.forEach(({ name, selector }) => {
      const measurement = measureElement(selector, name);
      if (measurement) {
        results.push({ ...measurement, name });
      }
    });

    const pageLabel = pageName || (location.includes('/trips') ? 'Trips' : location === '/' ? 'Dashboard' : 'Page');
    
    if (results.length > 0) {
      console.log(`📏 ${pageLabel} Element Measurements:`, results);
      // Show in a more readable format
      results.forEach((m) => {
        console.log(`\n${m.name || m.selector}:`);
        console.log(`  Dimensions: ${m.width.toFixed(0)}px × ${m.height.toFixed(0)}px`);
        
        if (m.gridInfo) {
          console.log(`  Layout: ${m.gridInfo.display}`);
          console.log(`  Children: ${m.gridInfo.childCount}`);
          
          if (m.gridInfo.display === 'grid') {
            if (m.gridInfo.gridColumns) {
              console.log(`  Grid Columns: ${m.gridInfo.gridColumns}`);
            }
            if (m.gridInfo.gridRows) {
              console.log(`  Grid Rows: ${m.gridInfo.gridRows}`);
            }
            if (m.gridInfo.gridTemplateColumns) {
              console.log(`  Column Template: ${m.gridInfo.gridTemplateColumns}`);
            }
            if (m.gridInfo.gap) {
              console.log(`  Gap: ${m.gridInfo.gap}`);
            }
            
            // Show child details
            if (m.gridInfo.directChildren.length > 0) {
              console.log(`  Child Elements:`);
              m.gridInfo.directChildren.forEach((child, idx) => {
                const spanInfo = [];
                if (child.colSpan && child.colSpan > 1) spanInfo.push(`col-span-${child.colSpan}`);
                if (child.rowSpan && child.rowSpan > 1) spanInfo.push(`row-span-${child.rowSpan}`);
                const spanText = spanInfo.length > 0 ? ` (${spanInfo.join(', ')})` : '';
                console.log(`    ${idx + 1}. ${child.tagName}${child.className ? ` (${child.className.split(' ')[0]})` : ''}${spanText}`);
              });
            }
          } else if (m.gridInfo.display.startsWith('flex-')) {
            if (m.gridInfo.gap) {
              console.log(`  Gap: ${m.gridInfo.gap}`);
            }
            console.log(`  Flex Children: ${m.gridInfo.childCount}`);
          }
        }
      });
    } else {
      alert(`Could not find elements on the ${pageLabel.toLowerCase()} page. The selectors may need adjustment.`);
    }
  };

  const currentPageName = pageName || (location.includes('/trips') ? 'Trips' : location === '/' ? 'Dashboard' : 'Page');
  const buttonText = `Measure ${currentPageName} Elements`;

  return (
    <Card className="fixed bottom-20 right-4 z-[9999] w-80 shadow-2xl bg-yellow-100 border-4 border-red-500" style={{ position: 'fixed' }}>
      <CardHeader className="pb-3 bg-yellow-200">
        <CardTitle className="text-sm flex items-center gap-2 text-red-700 font-bold">
          <Ruler className="w-5 h-5 text-red-600" />
          📏 Element Measurer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={measureAll} size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
          {buttonText}
        </Button>
        
        {measurements.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {measurements.map((m, i) => (
              <div key={i} className="p-2 bg-gray-50 rounded text-xs border">
                <div className="font-semibold mb-1 text-sm">{m.name || `Element ${i + 1}`}</div>
                <div className="font-mono space-y-0.5">
                  <div><strong>Dimensions:</strong> {m.width.toFixed(0)}px × {m.height.toFixed(0)}px</div>
                  
                  {m.gridInfo && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <div className="text-blue-700 font-semibold mb-1">Layout Info:</div>
                      <div><strong>Type:</strong> {m.gridInfo.display}</div>
                      <div><strong>Children:</strong> {m.gridInfo.childCount}</div>
                      
                      {m.gridInfo.display === 'grid' && (
                        <>
                          {m.gridInfo.gridColumns && (
                            <div><strong>Columns:</strong> {m.gridInfo.gridColumns}</div>
                          )}
                          {m.gridInfo.gridRows && (
                            <div><strong>Rows:</strong> {m.gridInfo.gridRows}</div>
                          )}
                          {m.gridInfo.gap && (
                            <div><strong>Gap:</strong> {m.gridInfo.gap}</div>
                          )}
                          {m.gridInfo.directChildren.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-gray-200">
                              <div className="text-xs text-gray-600 font-semibold mb-0.5">Child Elements:</div>
                              {m.gridInfo.directChildren.slice(0, 5).map((child, idx) => {
                                const spans = [];
                                if (child.colSpan && child.colSpan > 1) spans.push(`col-${child.colSpan}`);
                                if (child.rowSpan && child.rowSpan > 1) spans.push(`row-${child.rowSpan}`);
                                return (
                                  <div key={idx} className="text-xs text-gray-600 pl-2">
                                    {idx + 1}. {child.tagName}{spans.length > 0 ? ` (${spans.join(', ')})` : ''}
                                  </div>
                                );
                              })}
                              {m.gridInfo.directChildren.length > 5 && (
                                <div className="text-xs text-gray-400 pl-2">... +{m.gridInfo.directChildren.length - 5} more</div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      
                      {m.gridInfo.display.startsWith('flex-') && m.gridInfo.gap && (
                        <div><strong>Gap:</strong> {m.gridInfo.gap}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

