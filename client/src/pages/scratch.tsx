import React, { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { RotateCcw, Ruler, Tag, Eye, EyeOff } from "lucide-react";
import ScratchDashboard from "../components/scratch/ScratchDashboard";
import ScratchClients from "../components/scratch/ScratchClients";
import ScratchTrips from "../components/scratch/ScratchTrips";
import ScratchDrivers from "../components/scratch/ScratchDrivers";
import DimensionOverlay from "../components/scratch/DimensionOverlay";
import ReferenceTag from "../components/scratch/ReferenceTag";
import ColorMappingReference from "../components/scratch/ColorMappingReference";
import TypographyReference from "../components/scratch/TypographyReference";

type ScratchPageType = "dashboard" | "clients" | "trips" | "drivers" | null;

interface ElementInfo {
  id: string;
  name: string;
  ref: React.RefObject<HTMLElement>;
  dimensions?: {
    width: number;
    height: number;
    padding?: { top: number; right: number; bottom: number; left: number };
    margin?: { top: number; right: number; bottom: number; left: number };
  };
}

export default function ScratchPage() {
  const [selectedPage, setSelectedPage] = useState<ScratchPageType>(null);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [referenceCounter, setReferenceCounter] = useState(0);
  const [elements, setElements] = useState<ElementInfo[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset everything when page changes
  useEffect(() => {
    if (selectedPage) {
      setReferenceCounter(0);
      setElements([]);
      // Small delay to let DOM render, then measure
      setTimeout(() => {
        measureElements();
      }, 100);
    }
  }, [selectedPage]);

  const measureElements = () => {
    if (!containerRef.current) return;

    const measuredElements: ElementInfo[] = [];
    const allElements = containerRef.current.querySelectorAll('[data-scratch-ref]');

    allElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      const rect = htmlEl.getBoundingClientRect();
      const styles = window.getComputedStyle(htmlEl);
      
      const padding = {
        top: parseFloat(styles.paddingTop) || 0,
        right: parseFloat(styles.paddingRight) || 0,
        bottom: parseFloat(styles.paddingBottom) || 0,
        left: parseFloat(styles.paddingLeft) || 0,
      };

      const margin = {
        top: parseFloat(styles.marginTop) || 0,
        right: parseFloat(styles.marginRight) || 0,
        bottom: parseFloat(styles.marginBottom) || 0,
        left: parseFloat(styles.marginLeft) || 0,
      };

      measuredElements.push({
        id: htmlEl.getAttribute('data-scratch-ref') || `EL-${index}`,
        name: htmlEl.getAttribute('data-scratch-name') || 'Unnamed Element',
        ref: { current: htmlEl },
        dimensions: {
          width: rect.width,
          height: rect.height,
          padding,
          margin,
        },
      });
    });

    setElements(measuredElements);
  };

  const handleWipe = () => {
    setSelectedPage(null);
    setElements([]);
    setReferenceCounter(0);
  };

  const renderSelectedPage = () => {
    if (!selectedPage) return null;

    const pageProps = {
      showDimensions,
      showTags,
      referenceCounter,
      setReferenceCounter,
    };

    switch (selectedPage) {
      case "dashboard":
        return <ScratchDashboard {...pageProps} />;
      case "clients":
        return <ScratchClients {...pageProps} />;
      case "trips":
        return <ScratchTrips {...pageProps} />;
      case "drivers":
        return <ScratchDrivers {...pageProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Control Panel */}
      <Card className="mb-6 sticky top-6 z-50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Scratch Design Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Page</label>
              <Select value={selectedPage || ""} onValueChange={(value) => setSelectedPage(value as ScratchPageType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a page..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="clients">Clients</SelectItem>
                  <SelectItem value="trips">Trips</SelectItem>
                  <SelectItem value="drivers">Drivers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDimensions(!showDimensions)}>
                {showDimensions ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                Dimensions
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowTags(!showTags)}>
                <Tag className="w-4 h-4 mr-2" />
                Tags
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="destructive" size="sm" onClick={handleWipe}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Wipe & Start Over
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={measureElements}>
                <Ruler className="w-4 h-4 mr-2" />
                Re-measure
              </Button>
            </div>
          </div>
          {selectedPage && (
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600">
                <strong>Loaded:</strong> {selectedPage.toUpperCase()} page • 
                <strong> Elements:</strong> {elements.length} measured
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scratch Canvas */}
      <div ref={containerRef} className="relative">
        {selectedPage ? (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-4 border-dashed border-gray-400">
            {renderSelectedPage()}
            {showDimensions && elements.length > 0 && (
              <DimensionOverlay elements={elements} />
            )}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <CardContent>
              <Ruler className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Page Loaded</h3>
              <p className="text-gray-600 mb-6">
                Select a page from the dropdown above to start measuring and redesigning
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline">Dashboard</Badge>
                <Badge variant="outline">Clients</Badge>
                <Badge variant="outline">Trips</Badge>
                <Badge variant="outline">Drivers</Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Element Reference Panel */}
      {selectedPage && elements.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Element Reference Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {elements.map((el) => (
                <div key={el.id} className="border rounded p-3 bg-gray-50">
                  <div className="font-mono text-sm font-bold text-blue-600 mb-1">{el.id}</div>
                  <div className="text-sm font-medium mb-2">{el.name}</div>
                  {el.dimensions && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>W:</strong> {el.dimensions.width.toFixed(0)}px</div>
                      <div><strong>H:</strong> {el.dimensions.height.toFixed(0)}px</div>
                      {el.dimensions.padding && (
                        <div className="mt-1 pt-1 border-t">
                          <strong>Padding:</strong> {el.dimensions.padding.top}/{el.dimensions.padding.right}/{el.dimensions.padding.bottom}/{el.dimensions.padding.left}px
                        </div>
                      )}
                      {el.dimensions.margin && (
                        <div>
                          <strong>Margin:</strong> {el.dimensions.margin.top}/{el.dimensions.margin.right}/{el.dimensions.margin.bottom}/{el.dimensions.margin.left}px
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Mapping Reference */}
      <ColorMappingReference />

      {/* Typography Reference */}
      <TypographyReference />
    </div>
  );
}

