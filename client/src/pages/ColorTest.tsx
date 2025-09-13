import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, MapPin, Phone, Mail, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function ColorTest() {
  const [selectedStatus, setSelectedStatus] = useState('available');
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Simulate form validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormEmail(value);
    if (value && !value.includes('@')) {
      setFormError('Please enter a valid email address');
    } else {
      setFormError('');
    }
  };

  return (
    <div className="color-test-page min-h-screen bg-cows-milk p-8">
      {/* Brutalist Header */}
      <div className="mb-12 bg-holy-crow text-cows-milk p-8 border-brutalist border-casper-brutalist">
        <h1 className="text-mega mb-4">BRUTALIST DESIGN SYSTEM</h1>
        <p className="text-brutalist-body text-casper-brutalist uppercase tracking-wide">
          Minimal • Functional • Uncompromising
        </p>
        <button className="mt-6 bg-ultra-moss hover:bg-[var(--ultra-moss-dark)] text-holy-crow px-8 py-4 brutalist-button transition-all duration-200">
          + System Command
        </button>
      </div>

      {/* Brutalist Color System Demo */}
      <div className="mb-12 bg-stargazing p-8 border-brutalist-thick border-holy-crow">
        <h2 className="text-brutalist-h1 mb-6 text-cows-milk">COLOR COMMAND CENTER</h2>
        <p className="text-brutalist-body text-casper-brutalist mb-8 uppercase tracking-wide">
          Five-color brutalist palette for operational clarity
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Holy Crow - Primary Dark */}
          <div className="group bg-holy-crow border-brutalist border-casper-brutalist p-6 interactive-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-brutalist-caption text-cows-milk">HOLY CROW</h3>
              <div className="w-8 h-8 bg-cows-milk"></div>
            </div>
            <p className="text-mega text-cows-milk mb-4">#312F2C</p>
            <p className="text-brutalist-caption text-casper-brutalist">PRIMARY STRUCTURE</p>
            <button className="mt-4 bg-ultra-moss text-holy-crow px-4 py-2 brutalist-button">
              COMMAND
            </button>
          </div>

          {/* Stargazing - Medium Gray */}
          <div className="group bg-cows-milk border-brutalist border-stargazing p-6 interactive-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-brutalist-caption text-stargazing">STARGAZING</h3>
              <div className="w-8 h-8 bg-stargazing"></div>
            </div>
            <p className="text-mega text-stargazing mb-4">#424348</p>
            <p className="text-brutalist-caption text-stargazing">SECONDARY FRAME</p>
            <button className="mt-4 bg-casper-brutalist text-cows-milk px-4 py-2 brutalist-button">
              EXECUTE
            </button>
          </div>

          {/* Ultra Moss - Accent */}
          <div className="group bg-ultra-moss border-brutalist border-holy-crow p-6 interactive-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-brutalist-caption text-holy-crow">ULTRA MOSS</h3>
              <div className="w-8 h-8 bg-holy-crow"></div>
            </div>
            <p className="text-mega text-holy-crow mb-4">#D2F75A</p>
            <p className="text-brutalist-caption text-holy-crow">SYSTEM ALERT</p>
            <button className="mt-4 bg-holy-crow text-ultra-moss px-4 py-2 brutalist-button">
              ACTIVATE
            </button>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="mt-8 bg-cows-milk border-brutalist border-casper-brutalist p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-brutalist-h2 text-holy-crow">FLEET COMMAND INTERFACE</h4>
            <button className="bg-ultra-moss hover:bg-[var(--ultra-moss-dark)] text-holy-crow px-6 py-3 brutalist-button">
              + DISPATCH VEHICLE
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-stargazing border-brutalist border-casper-brutalist p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-brutalist-caption text-cows-milk">VEHICLE STATUS</h5>
                <div className="w-4 h-4 bg-ultra-moss"></div>
              </div>
              <p className="text-mega text-cows-milk mb-2">12</p>
              <p className="text-brutalist-caption text-casper-brutalist">ACTIVE UNITS</p>
            </div>

            <div className="bg-holy-crow border-brutalist border-ultra-moss p-6">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-brutalist-caption text-ultra-moss">PRIORITY QUEUE</h5>
                <div className="w-4 h-4 bg-casper-brutalist"></div>
              </div>
              <p className="text-mega text-ultra-moss mb-2">03</p>
              <p className="text-brutalist-caption text-casper-brutalist">URGENT TRIPS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode Preview Section */}
      <div className="mb-8 bg-[#0A0A0A] p-6 border-brutalist border-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-[#F0F0F0]">Dark Mode Preview</h2>
        <p className="text-[#A4B7BB] mb-6">
          Deep black background (#0A0A0A) with light text variants
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dark Mode Card Example */}
          <div className="bg-[#101010] border border-[#1F1F1F] p-4 rounded-lg">
            <h3 className="text-[#F0F0F0] font-semibold mb-2">Trip Card</h3>
            <p className="text-[#A4B7BB] text-sm mb-3">Pickup at 2:30 PM</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-[#E74C3C] text-white text-xs rounded">In Progress</span>
              <span className="px-2 py-1 bg-[#A4B7BB] text-[#0A0A0A] text-xs rounded">Priority</span>
            </div>
          </div>

          {/* Dark Mode Form Example */}
          <div className="bg-[#101010] border border-[#1F1F1F] p-4 rounded-lg">
            <h3 className="text-[#F0F0F0] font-semibold mb-2">Form Elements</h3>
            <input 
              type="text" 
              placeholder="Enter client name" 
              className="w-full bg-[#0A0A0A] border border-[#1F1F1F] text-[#F0F0F0] p-2 rounded text-sm mb-2"
            />
            <button className="w-full bg-[#E74C3C] text-white p-2 rounded text-sm hover:bg-[#C0392B]">
              Save Changes
            </button>
          </div>

          {/* Dark Mode Status Panel */}
          <div className="bg-[#101010] border border-[#1F1F1F] p-4 rounded-lg">
            <h3 className="text-[#F0F0F0] font-semibold mb-2">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#A4B7BB] text-sm">Active Drivers</span>
                <span className="text-[#F0F0F0] text-sm font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A4B7BB] text-sm">Pending Trips</span>
                <span className="text-[#F0F0F0] text-sm font-medium">5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Variations Section */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Variation 1: Warmer Grays */}
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-4 rounded-lg">
            <h4 className="text-[#F5F5F5] font-medium mb-2">Variation 1: Warmer Grays</h4>
            <p className="text-[#CCCCCC] text-sm mb-3">Background: #1A1A1A, Text: #F5F5F5</p>
            <button className="bg-[#E74C3C] text-white px-3 py-1 rounded text-sm">Test Button</button>
          </div>

          {/* Variation 2: Blue-tinted Grays */}
          <div className="bg-[#0D1117] border border-[#21262d] p-4 rounded-lg">
            <h4 className="text-[#F0F6FC] font-medium mb-2">Variation 2: Blue-tinted</h4>
            <p className="text-[#8B949E] text-sm mb-3">Background: #0D1117, Text: #F0F6FC</p>
            <button className="bg-[#E74C3C] text-white px-3 py-1 rounded text-sm">Test Button</button>
          </div>
        </div>
      </div>

      {/* Brutalist Typography Hierarchy */}
      <div className="mb-12 bg-cows-milk border-brutalist-thick border-stargazing p-8">
        <h2 className="text-brutalist-h1 mb-8 text-holy-crow">TYPOGRAPHY COMMAND STRUCTURE</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Typography Scale */}
          <div className="space-y-6">
            <div className="bg-holy-crow border-brutalist border-ultra-moss p-6">
              <h3 className="text-brutalist-caption text-ultra-moss mb-4">MEGA HEADER</h3>
              <div className="text-mega text-ultra-moss">SYSTEM</div>
              <p className="text-brutalist-small text-casper-brutalist mt-2">64px • Weight 900 • Uppercase</p>
            </div>
            
            <div className="bg-stargazing border-brutalist border-cows-milk p-6">
              <h3 className="text-brutalist-caption text-cows-milk mb-4">H1 SECTION</h3>
              <div className="text-brutalist-h1 text-cows-milk">COMMAND CENTER</div>
              <p className="text-brutalist-small text-casper-brutalist mt-2">36px • Weight 700 • Uppercase</p>
            </div>
            
            <div className="bg-casper-brutalist border-brutalist border-holy-crow p-6">
              <h3 className="text-brutalist-caption text-holy-crow mb-4">H2 SUBSECTION</h3>
              <div className="text-brutalist-h2 text-holy-crow">VEHICLE STATUS</div>
              <p className="text-brutalist-small text-holy-crow mt-2">28px • Weight 600 • Uppercase</p>
            </div>
          </div>

          {/* Usage Examples */}
          <div className="space-y-6">
            <div className="bg-ultra-moss border-brutalist border-holy-crow p-6">
              <h3 className="text-brutalist-caption text-holy-crow mb-4">OPERATIONAL TEXT</h3>
              <div className="text-brutalist-body text-holy-crow mb-4">
                Primary operational information uses 18px medium weight for maximum readability under stress conditions.
              </div>
              <div className="text-brutalist-small text-holy-crow mb-4">
                Secondary details at 14px medium maintain hierarchy without compromising clarity.
              </div>
              <div className="text-brutalist-caption text-holy-crow">
                STATUS INDICATORS • 12px • UPPERCASE
              </div>
            </div>

            <div className="bg-holy-crow border-brutalist border-casper-brutalist p-6">
              <h3 className="text-brutalist-caption text-ultra-moss mb-4">INTERFACE ELEMENTS</h3>
              <button className="bg-ultra-moss text-holy-crow px-6 py-3 brutalist-button mb-3 mr-3">
                PRIMARY ACTION
              </button>
              <button className="bg-casper-brutalist text-cows-milk px-6 py-3 brutalist-button mb-3">
                SECONDARY
              </button>
              <div className="text-brutalist-caption text-casper-brutalist mt-4">
                ALL INTERACTIVE ELEMENTS USE UPPERCASE FORMATTING
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monarch Palette Section */}
      <div className="mb-8 bg-[#3A3A3A] p-6 border-brutalist border-gray-600">
        <h2 className="text-2xl font-bold mb-4 text-[#F0F0F0]">Monarch Palette</h2>
        <p className="text-[#A4B7BB] mb-6">
          Based on your uploaded color reference - coral accent, soft blue-gray, charcoal base
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Coral Accent Card */}
          <div className="bg-[#FF6B47] p-4 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Coral Accent</h3>
            <p className="text-white/90 text-sm mb-3">#FF6B47 - Primary action color</p>
            <button className="bg-white text-[#FF6B47] px-3 py-1 rounded text-sm font-medium">
              Call to Action
            </button>
          </div>

          {/* Blue-Gray Card */}
          <div className="bg-[#9BB5B8] p-4 rounded-lg">
            <h3 className="text-[#3A3A3A] font-semibold mb-2">Blue-Gray</h3>
            <p className="text-[#3A3A3A]/80 text-sm mb-3">#9BB5B8 - Secondary surfaces</p>
            <button className="bg-[#3A3A3A] text-white px-3 py-1 rounded text-sm">
              Secondary Action
            </button>
          </div>

          {/* Charcoal Card */}
          <div className="bg-[#F5F5F5] border border-[#E0E0E0] p-4 rounded-lg">
            <h3 className="text-[#3A3A3A] font-semibold mb-2">Light Surface</h3>
            <p className="text-[#666666] text-sm mb-3">#F5F5F5 - Main content areas</p>
            <button className="bg-[#FF6B47] text-white px-3 py-1 rounded text-sm">
              Primary Action
            </button>
          </div>
        </div>

        {/* Dashboard Preview with Monarch Palette */}
        <div className="bg-[#F5F5F5] p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[#3A3A3A] font-bold text-lg">Trip Dashboard</h4>
            <button className="bg-[#FF6B47] text-white px-4 py-2 rounded font-medium hover:bg-[#E5553C] transition-colors">
              Add Trip
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E0E0E0] p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-[#3A3A3A] font-semibold">Trip #001</h5>
                <span className="px-2 py-1 bg-[#FF6B47] text-white text-xs rounded">Active</span>
              </div>
              <p className="text-[#666666] text-sm mb-2">Downtown Medical Center</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#9BB5B8] rounded-full"></div>
                <span className="text-[#666666] text-xs">Driver: Sarah Johnson</span>
              </div>
            </div>

            <div className="bg-[#9BB5B8] p-4 rounded-lg">
              <h5 className="text-white font-semibold mb-2">System Status</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/80 text-sm">Active Trips</span>
                  <span className="text-white font-medium">8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/80 text-sm">Available Drivers</span>
                  <span className="text-white font-medium">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive States Demo */}
      <div className="mb-12 bg-stargazing border-brutalist-thick border-ultra-moss p-8">
        <h2 className="text-brutalist-h1 mb-8 text-ultra-moss">INTERACTIVE COMMAND STATES</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Indicators */}
          <div className="bg-holy-crow border-brutalist border-casper-brutalist p-6">
            <h3 className="text-brutalist-caption text-ultra-moss mb-6">SYSTEM STATUS</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-ultra-moss"></div>
                <span className="text-brutalist-caption text-cows-milk">ACTIVE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-casper-brutalist"></div>
                <span className="text-brutalist-caption text-cows-milk">AVAILABLE</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-stargazing"></div>
                <span className="text-brutalist-caption text-cows-milk">OFFLINE</span>
              </div>
            </div>
          </div>

          {/* Form Elements */}
          <div className="bg-cows-milk border-brutalist border-holy-crow p-6">
            <h3 className="text-brutalist-caption text-holy-crow mb-6">INPUT CONTROLS</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="ENTER COMMAND" 
                className="w-full bg-stargazing border-brutalist border-casper-brutalist text-cows-milk p-3 text-brutalist-body placeholder-casper-brutalist uppercase"
              />
              <select className="w-full bg-holy-crow border-brutalist border-ultra-moss text-ultra-moss p-3 text-brutalist-body uppercase">
                <option>SELECT VEHICLE</option>
                <option>UNIT 001</option>
                <option>UNIT 002</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-ultra-moss border-brutalist border-holy-crow p-6">
            <h3 className="text-brutalist-caption text-holy-crow mb-6">COMMAND ACTIONS</h3>
            <div className="space-y-3">
              <button className="w-full bg-holy-crow text-ultra-moss py-3 brutalist-button hover:bg-[var(--holy-crow-light)]">
                DISPATCH
              </button>
              <button className="w-full bg-casper-brutalist text-cows-milk py-3 brutalist-button hover:bg-[var(--casper-brutalist-dark)]">
                MONITOR
              </button>
              <button className="w-full bg-stargazing text-cows-milk py-3 brutalist-button hover:bg-[var(--stargazing-light)]">
                RECALL
              </button>
            </div>
          </div>
        </div>

        {/* Live Command Interface Demo */}
        <div className="mt-8 bg-cows-milk border-brutalist border-holy-crow p-8">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-brutalist-h2 text-holy-crow">LIVE COMMAND TERMINAL</h4>
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-ultra-moss animate-pulse"></div>
              <span className="text-brutalist-caption text-casper-brutalist">SYSTEM ONLINE</span>
            </div>
          </div>
          
          <div className="bg-holy-crow border-brutalist border-ultra-moss p-6">
            <div className="text-brutalist-caption text-ultra-moss mb-4">ACTIVE COMMANDS:</div>
            <div className="space-y-2 text-brutalist-small text-casper-brutalist">
              <div>{'>'} DISPATCH UNIT 001 TO SECTOR 7</div>
              <div>{'>'} MONITOR TRAFFIC CONDITIONS</div>
              <div>{'>'} UPDATE DRIVER STATUS - AVAILABLE</div>
              <div className="text-ultra-moss animate-pulse">{'>'} AWAITING NEXT COMMAND_</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Indicators Section */}
        <Card className="bg-[var(--white-smoke)] border-[var(--casper-light)]">
          <CardHeader className="bg-[var(--smoke-dark)] border-b border-[var(--casper-light)]">
            <CardTitle className="text-[var(--payne-deeper)]">Status Indicators</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-[var(--payne-grey)] mb-3">Driver Status</h3>
                <Badge className="bg-[var(--casper-blue)] text-[var(--payne-deeper)] border-0 hover:bg-[var(--casper-dark)]">
                  Available
                </Badge>
                <Badge className="bg-[var(--casper-light)] text-[var(--payne-grey)] border-0 animate-pulse">
                  On Trip
                </Badge>
                <Badge className="bg-[var(--coral-accent)] text-white border-0 hover:bg-[var(--coral-dark)]">
                  Urgent
                </Badge>
                <Badge className="bg-[var(--payne-lighter)] text-[var(--smoke-light)] border-0">
                  Offline
                </Badge>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-[var(--payne-grey)] mb-3">Trip Status</h3>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--casper-blue)]" />
                  <span className="text-[var(--payne-grey)]">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[var(--casper-light)]" />
                  <span className="text-[var(--payne-grey)]">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[var(--coral-accent)]" />
                  <span className="text-[var(--payne-grey)]">Attention Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-[var(--payne-lighter)]" />
                  <span className="text-[var(--payne-grey)]">Cancelled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Elements */}
        <Card className="bg-[var(--white-smoke)] border-[var(--casper-light)]">
          <CardHeader className="bg-[var(--smoke-dark)] border-b border-[var(--casper-light)]">
            <CardTitle className="text-[var(--payne-deeper)]">Interactive Elements</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-[var(--payne-grey)] mb-3">Button States</h3>
                <div className="flex flex-wrap gap-3">
                  <Button className="bg-[var(--payne-grey)] hover:bg-[var(--payne-dark)] active:bg-[var(--payne-deeper)] text-[var(--white-smoke)]">
                    Primary Action
                  </Button>
                  <Button className="bg-[var(--coral-accent)] hover:bg-[var(--coral-dark)] text-white">
                    Critical Action
                  </Button>
                  <Button variant="outline" className="border-[var(--casper-blue)] text-[var(--casper-blue)] hover:bg-[var(--casper-light)] hover:text-[var(--payne-deeper)]">
                    Secondary
                  </Button>
                  <Button variant="ghost" className="text-[var(--payne-lighter)] hover:bg-[var(--smoke-dark)] hover:text-[var(--payne-grey)]">
                    Tertiary
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-[var(--payne-grey)] mb-3">Status Selection</h3>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="border-[var(--casper-light)] focus:border-[var(--coral-light)] focus:ring-[var(--coral-light)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--white-smoke)] border-[var(--casper-light)]">
                    <SelectItem value="available" className="focus:bg-[var(--casper-light)] focus:text-[var(--payne-deeper)]">Available</SelectItem>
                    <SelectItem value="busy" className="focus:bg-[var(--casper-light)] focus:text-[var(--payne-deeper)]">On Trip</SelectItem>
                    <SelectItem value="urgent" className="focus:bg-[var(--coral-light)] focus:text-[var(--payne-deeper)]">Urgent</SelectItem>
                    <SelectItem value="offline" className="focus:bg-[var(--smoke-dark)] focus:text-[var(--payne-grey)]">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Cards */}
        <Card className="bg-[var(--white-smoke)] border-[var(--casper-light)] lg:col-span-2">
          <CardHeader className="bg-[var(--smoke-dark)] border-b border-[var(--casper-light)]">
            <CardTitle className="text-[var(--payne-deeper)]">Trip Management Cards</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Trip */}
              <div className="bg-[var(--smoke-light)] border border-[var(--casper-light)] p-4 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[var(--casper-light)] text-[var(--payne-grey)] animate-pulse">
                    In Progress
                  </Badge>
                  <span className="text-sm text-[var(--payne-lighter)]">Trip #1234</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--payne-grey)]">
                    <User className="w-4 h-4" />
                    <span>Sarah Johnson</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--payne-grey)]">
                    <MapPin className="w-4 h-4" />
                    <span>Newton → Downtown</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--payne-grey)]">
                    <Clock className="w-4 h-4" />
                    <span>Started 15 mins ago</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--casper-lighter)]">
                  <div className="flex justify-between text-xs text-[var(--payne-lighter)]">
                    <span>Driver: Mike R.</span>
                    <span>ETA: 8 mins</span>
                  </div>
                </div>
              </div>

              {/* Urgent Trip */}
              <div className="bg-[var(--coral-lighter)] border border-[var(--coral-light)] p-4 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[var(--coral-accent)] text-white">
                    Urgent
                  </Badge>
                  <span className="text-sm text-[var(--coral-deeper)]">Trip #1235</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--payne-deeper)]">
                    <User className="w-4 h-4" />
                    <span>Emergency Transport</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--payne-deeper)]">
                    <MapPin className="w-4 h-4" />
                    <span>Urgent Pickup Required</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--payne-deeper)]">
                    <AlertCircle className="w-4 h-4" />
                    <span>Immediate attention needed</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--coral-light)]">
                  <Button size="sm" className="w-full bg-[var(--coral-accent)] hover:bg-[var(--coral-dark)] text-white">
                    Assign Driver
                  </Button>
                </div>
              </div>

              {/* Completed Trip */}
              <div className="bg-[var(--casper-lighter)] border border-[var(--casper-light)] p-4 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[var(--casper-blue)] text-[var(--payne-deeper)]">
                    Completed
                  </Badge>
                  <span className="text-sm text-[var(--casper-deeper)]">Trip #1233</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[var(--payne-grey)]">
                    <User className="w-4 h-4" />
                    <span>John Smith</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--payne-grey)]">
                    <MapPin className="w-4 h-4" />
                    <span>Lowell → Medical Center</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--payne-grey)]">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed 2:30 PM</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--casper-light)]">
                  <div className="flex justify-between text-xs text-[var(--casper-deeper)]">
                    <span>Driver: Lisa K.</span>
                    <span>Duration: 25 mins</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card className="bg-[var(--white-smoke)] border-[var(--casper-light)]">
          <CardHeader className="bg-[var(--smoke-dark)] border-b border-[var(--casper-light)]">
            <CardTitle className="text-[var(--payne-deeper)]">Form Elements</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="test-email" className="text-[var(--payne-grey)]">Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={formEmail}
                  onChange={handleEmailChange}
                  placeholder="Enter email address"
                  className={`mt-1 border-[var(--casper-light)] focus:border-[var(--coral-light)] focus:ring-[var(--coral-light)] ${
                    formError ? 'border-[var(--coral-accent)] focus:border-[var(--coral-accent)]' : ''
                  }`}
                />
                {formError && (
                  <p className="text-[var(--coral-accent)] text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {formError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="test-phone" className="text-[var(--payne-grey)]">Phone Number</Label>
                <Input
                  id="test-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  className="mt-1 border-[var(--casper-light)] focus:border-[var(--coral-light)] focus:ring-[var(--coral-light)]"
                />
              </div>

              <div>
                <Label htmlFor="test-notes" className="text-[var(--payne-grey)]">Trip Notes</Label>
                <textarea
                  id="test-notes"
                  rows={3}
                  placeholder="Enter any special instructions..."
                  className="mt-1 w-full px-3 py-2 border border-[var(--casper-light)] rounded-md focus:border-[var(--coral-light)] focus:ring-[var(--coral-light)] focus:ring-1 bg-[var(--white-smoke)] text-[var(--payne-grey)] placeholder-[var(--payne-lighter)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="bg-[var(--white-smoke)] border-[var(--casper-light)]">
          <CardHeader className="bg-[var(--smoke-dark)] border-b border-[var(--casper-light)]">
            <CardTitle className="text-[var(--payne-deeper)]">Driver Status Table</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--smoke-dark)]">
                  <tr>
                    <th className="text-left p-4 text-[var(--payne-grey)] font-semibold">Driver</th>
                    <th className="text-left p-4 text-[var(--payne-grey)] font-semibold">Status</th>
                    <th className="text-left p-4 text-[var(--payne-grey)] font-semibold">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--casper-lighter)] hover:bg-[var(--smoke-light)] transition-colors">
                    <td className="p-4 text-[var(--payne-grey)]">Mike Rodriguez</td>
                    <td className="p-4">
                      <Badge className="bg-[var(--casper-light)] text-[var(--payne-grey)]">On Trip</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[var(--payne-lighter)]">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">(555) 123-0001</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-[var(--casper-lighter)] hover:bg-[var(--smoke-light)] transition-colors">
                    <td className="p-4 text-[var(--payne-grey)]">Lisa Kim</td>
                    <td className="p-4">
                      <Badge className="bg-[var(--casper-blue)] text-[var(--payne-deeper)]">Available</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[var(--payne-lighter)]">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">(555) 123-0002</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--smoke-light)] transition-colors">
                    <td className="p-4 text-[var(--payne-grey)]">David Chen</td>
                    <td className="p-4">
                      <Badge className="bg-[var(--payne-lighter)] text-[var(--smoke-light)]">Offline</Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[var(--payne-lighter)]">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">david.c@email.com</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Test */}
      <Card className="mt-8 bg-[var(--white-smoke)] border-[var(--casper-light)]">
        <CardHeader className="bg-[var(--smoke-dark)] border-b border-[var(--casper-light)]">
          <CardTitle className="text-[var(--payne-deeper)]">Navigation Elements</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" className="text-[var(--payne-grey)] hover:bg-[var(--casper-light)] hover:text-[var(--payne-deeper)]">
              Dashboard
            </Button>
            <Button variant="ghost" className="text-[var(--payne-grey)] hover:bg-[var(--casper-light)] hover:text-[var(--payne-deeper)] bg-[var(--casper-light)]">
              Trips (Active)
            </Button>
            <Button variant="ghost" className="text-[var(--payne-grey)] hover:bg-[var(--casper-light)] hover:text-[var(--payne-deeper)]">
              Drivers
            </Button>
            <Button variant="ghost" className="text-[var(--payne-grey)] hover:bg-[var(--casper-light)] hover:text-[var(--payne-deeper)]">
              Clients
            </Button>
            <Button variant="ghost" className="text-[var(--payne-grey)] hover:bg-[var(--casper-light)] hover:text-[var(--payne-deeper)]">
              Reports
            </Button>
            <Button variant="ghost" className="text-[var(--coral-accent)] hover:bg-[var(--coral-light)] hover:text-[var(--payne-deeper)]">
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}