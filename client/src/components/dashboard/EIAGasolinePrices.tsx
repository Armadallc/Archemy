import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Fuel, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

// EIA API Configuration
const EIA_API_KEY = "wKLIXuy9MEDpCEFNk7041YHKm2GZWWfgjHn3VqMf";
const EIA_BASE_URL = "https://api.eia.gov/v2/petroleum/pri/gnd/data/";

interface GasolinePrice {
  period: string;
  product: string;
  productName: string;
  area: string;
  areaName: string;
  value: string;
  units: string;
}

interface EIAResponse {
  response: {
    total: string;
    data: GasolinePrice[];
  };
}

interface PriceData {
  regular: {
    current: number | null;
    previous: number | null;
    date: string | null;
  };
  premium: {
    current: number | null;
    previous: number | null;
    date: string | null;
  };
}

export default function EIAGasolinePrices() {
  const [priceData, setPriceData] = useState<PriceData>({
    regular: { current: null, previous: null, date: null },
    premium: { current: null, previous: null, date: null },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchGasolinePrices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build API URL for Denver, Colorado gasoline prices
      // Using the exact format from EIA documentation
      // EPMR = Regular, EPMP = Premium, EPMM = Midgrade
      // Denver area code: YDEN (in series ID)
      
      // Fetch all Denver gasoline prices in one call
      const url = `${EIA_BASE_URL}?api_key=${EIA_API_KEY}&frequency=weekly&data[0]=value&facets[duoarea][]=YDEN&sort[0][column]=period&sort[0][direction]=desc&length=10`;
      
      console.log("🛢️ Fetching EIA data:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("EIA API Error:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: EIAResponse = await response.json();
      console.log("🛢️ EIA Response:", data);

      // Process the data - filter for Regular (EPMR) and Premium (EPMP)
      const allPrices = data.response?.data || [];
      
      // Get Regular prices (product code EPMR)
      const regularPrices = allPrices.filter(p => p.product === "EPMR");
      const premiumPrices = allPrices.filter(p => p.product === "EPMP");

      setPriceData({
        regular: {
          current: regularPrices[0] ? parseFloat(regularPrices[0].value) : null,
          previous: regularPrices[1] ? parseFloat(regularPrices[1].value) : null,
          date: regularPrices[0]?.period || null,
        },
        premium: {
          current: premiumPrices[0] ? parseFloat(premiumPrices[0].value) : null,
          previous: premiumPrices[1] ? parseFloat(premiumPrices[1].value) : null,
          date: premiumPrices[0]?.period || null,
        },
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching EIA data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch gasoline prices");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGasolinePrices();
  }, []);

  const getPriceChange = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return null;
    return current - previous;
  };

  const getTrendIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-status-error" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-status-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number | null) => {
    if (change === null) return "text-muted-foreground";
    if (change > 0) return "text-status-error";
    if (change < 0) return "text-status-success";
    return "text-muted-foreground";
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number | null) => {
    if (change === null) return "";
    const sign = change > 0 ? "+" : "";
    return `${sign}$${change.toFixed(2)}`;
  };

  return (
    <Card 
      style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)', 
        borderWidth: '1px', 
        borderStyle: 'solid' 
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center space-x-2">
          <Fuel className="h-5 w-5" style={{ color: 'var(--primary)' }} />
          <span style={{ color: 'var(--foreground)' }}>Colorado Fuel Prices</span>
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchGasolinePrices}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="flex items-center space-x-2 text-status-error py-4">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <>
            {/* Price Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Regular Gasoline */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Regular
                  </span>
                  {getTrendIcon(getPriceChange(priceData.regular.current, priceData.regular.previous))}
                </div>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--foreground)' }}
                >
                  {isLoading ? (
                    <div className="h-8 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                  ) : (
                    formatPrice(priceData.regular.current)
                  )}
                </div>
                {!isLoading && priceData.regular.previous && (
                  <div className={`text-xs mt-1 ${getTrendColor(getPriceChange(priceData.regular.current, priceData.regular.previous))}`}>
                    {formatChange(getPriceChange(priceData.regular.current, priceData.regular.previous))} from last week
                  </div>
                )}
              </div>

              {/* Premium Gasoline */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--muted)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span 
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    Premium
                  </span>
                  {getTrendIcon(getPriceChange(priceData.premium.current, priceData.premium.previous))}
                </div>
                <div 
                  className="text-2xl font-bold"
                  style={{ color: 'var(--foreground)' }}
                >
                  {isLoading ? (
                    <div className="h-8 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                  ) : (
                    formatPrice(priceData.premium.current)
                  )}
                </div>
                {!isLoading && priceData.premium.previous && (
                  <div className={`text-xs mt-1 ${getTrendColor(getPriceChange(priceData.premium.current, priceData.premium.previous))}`}>
                    {formatChange(getPriceChange(priceData.premium.current, priceData.premium.previous))} from last week
                  </div>
                )}
              </div>
            </div>

            {/* Location & Date Info */}
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
              <span>Denver, CO Area • Per Gallon</span>
              {priceData.regular.date && (
                <span>Week of {priceData.regular.date}</span>
              )}
            </div>

            {/* Future: Price History List will go here */}
            {/* <div className="mt-4 max-h-40 overflow-y-auto">
              ... scrollable price history ...
            </div> */}
          </>
        )}
      </CardContent>
      
      {/* EIA Attribution - Fixed at bottom */}
      <div 
        className="px-6 py-3 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center space-x-2">
          {/* EIA Logo SVG */}
          <svg 
            viewBox="0 0 100 60" 
            className="h-5 w-auto"
            aria-label="U.S. Energy Information Administration"
          >
            {/* Blue arc/swoosh */}
            <path 
              d="M15 35 Q50 -5, 90 25" 
              fill="none" 
              stroke="#00A3E0" 
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* "e" */}
            <text 
              x="8" 
              y="55" 
              fontFamily="Arial, sans-serif" 
              fontSize="32" 
              fontWeight="bold"
              fill="#4A4A4A"
            >
              e
            </text>
            {/* "i" with dot */}
            <circle cx="42" cy="28" r="4" fill="#4A4A4A" />
            <rect x="38" y="35" width="8" height="20" rx="1" fill="#4A4A4A" />
            {/* "a" */}
            <text 
              x="52" 
              y="55" 
              fontFamily="Arial, sans-serif" 
              fontSize="32" 
              fontWeight="bold"
              fill="#4A4A4A"
            >
              a
            </text>
          </svg>
          <span 
            className="text-xs hidden sm:inline"
            style={{ color: 'var(--muted-foreground)' }}
          >
            U.S. Energy Information Administration
          </span>
        </div>
        {lastUpdated && (
          <span 
            className="text-xs"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>
    </Card>
  );
}

