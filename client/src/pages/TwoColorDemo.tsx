import { useState } from 'react';
import { Clock, Filter, Zap, Car, Users, AlertCircle } from 'lucide-react';

export default function TwoColorDemo() {
  const [activeDemo, setActiveDemo] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--foundation-bg)' }}>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-72 border-r-2 p-6" style={{
        backgroundColor: 'var(--foundation-bg)',
        borderColor: 'var(--foundation-border)'
      }}>
        <div className="mb-8">
          <h1 className="text-brutalist-h2 font-black uppercase tracking-tight" style={{ color: 'var(--foundation-text)' }}>
            Fleet Command
          </h1>
          <p className="text-brutalist-caption mt-2 opacity-70" style={{ color: 'var(--foundation-text)' }}>
            Transportation Control
          </p>
        </div>
        
        {/* Navigation with hover tonal shifts */}
        <nav>
          <ul className="space-y-2">
            <li>
              <a 
                href="#" 
                className="block p-4 font-bold uppercase tracking-wide rounded-lg transition-all duration-200 hover-lighter hover-shadow"
                style={{ color: 'var(--foundation-text)' }}
              >
                Dashboard
              </a>
            </li>
            <li>
              {/* Active state - slightly darker background */}
              <a 
                href="#" 
                className="block p-4 font-black uppercase tracking-wide rounded-lg shadow-md"
                style={{ 
                  backgroundColor: 'var(--hover-bg-dark)',
                  color: 'var(--foundation-text)',
                  boxShadow: '0 4px 8px rgba(49, 47, 44, 0.15)'
                }}
              >
                Trips
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="block p-4 font-bold uppercase tracking-wide rounded-lg transition-all duration-200 hover-darker hover-shadow"
                style={{ color: 'var(--foundation-text)' }}
              >
                Vehicles
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className="block p-4 font-bold uppercase tracking-wide rounded-lg transition-all duration-200 hover-darker hover-shadow"
                style={{ color: 'var(--foundation-text)' }}
              >
                Drivers
              </a>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="ml-72">
        {/* Header with bottom border */}
        <header className="border-b-2 p-8 flex justify-between items-center" style={{
          backgroundColor: 'var(--foundation-bg)',
          borderColor: 'var(--foundation-border)'
        }}>
          <div>
            <h1 className="text-mega font-black uppercase tracking-tight" style={{ color: 'var(--foundation-text)' }}>
              Two-Color Foundation
            </h1>
            <p className="text-brutalist-body opacity-70 uppercase tracking-wide" style={{ color: 'var(--foundation-text)' }}>
              Cow's Milk (#F0EDE5) • Holy Crow (#312F2C)
            </p>
          </div>
          
          {/* Button with subtle hover transformation */}
          <button 
            onClick={() => setActiveDemo(!activeDemo)}
            className="border-2 px-8 py-4 font-bold uppercase tracking-wide rounded-lg transition-all duration-200 hover-darker hover-shadow hover-lift"
            style={{
              backgroundColor: 'var(--foundation-bg)',
              borderColor: 'var(--foundation-border)',
              color: 'var(--foundation-text)'
            }}
          >
            <Zap className="w-5 h-5 mr-3 inline" />
            Toggle Demo
          </button>
        </header>
        
        {/* Main Content Area */}
        <main className="p-8" style={{ backgroundColor: 'var(--foundation-bg)' }}>
          
          {/* Stats Section with internal borders */}
          <section className="mb-12 pb-8 border-b" style={{ borderColor: 'var(--foundation-border)' }}>
            <h2 className="text-brutalist-h1 font-black uppercase mb-6" style={{ color: 'var(--foundation-text)' }}>
              Fleet Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Default Card */}
              <div className="interactive-card p-6 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <Car className="w-8 h-8" style={{ color: 'var(--foundation-text)' }} />
                  <div className="text-mega font-black" style={{ color: 'var(--foundation-text)' }}>12</div>
                </div>
                <h3 className="text-brutalist-caption font-black mb-2" style={{ color: 'var(--foundation-text)' }}>
                  Active Vehicles
                </h3>
                <p className="text-brutalist-caption opacity-70" style={{ color: 'var(--foundation-text)' }}>
                  Currently Dispatched
                </p>
              </div>
              
              {/* Alert Card - uses Casper for status */}
              <div className="p-6 rounded-lg border-2 shadow-status" style={{
                backgroundColor: 'var(--status-accent)',
                borderColor: 'var(--status-accent)'
              }}>
                <div className="flex items-center justify-between mb-4">
                  <AlertCircle className="w-8 h-8" style={{ color: 'var(--foundation-text)' }} />
                  <div className="text-mega font-black" style={{ color: 'var(--foundation-text)' }}>3</div>
                </div>
                <h3 className="text-brutalist-caption font-black mb-2" style={{ color: 'var(--foundation-text)' }}>
                  Urgent Alerts
                </h3>
                <p className="text-brutalist-caption opacity-80" style={{ color: 'var(--foundation-text)' }}>
                  Require Attention
                </p>
              </div>
              
              {/* More default cards */}
              <div className="interactive-card p-6 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8" style={{ color: 'var(--foundation-text)' }} />
                  <div className="text-mega font-black" style={{ color: 'var(--foundation-text)' }}>8</div>
                </div>
                <h3 className="text-brutalist-caption font-black mb-2" style={{ color: 'var(--foundation-text)' }}>
                  Available Drivers
                </h3>
                <p className="text-brutalist-caption opacity-70" style={{ color: 'var(--foundation-text)' }}>
                  Ready for Dispatch
                </p>
              </div>

              <div className="interactive-card p-6 cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8" style={{ color: 'var(--foundation-text)' }} />
                  <div className="text-mega font-black" style={{ color: 'var(--foundation-text)' }}>47</div>
                </div>
                <h3 className="text-brutalist-caption font-black mb-2" style={{ color: 'var(--foundation-text)' }}>
                  Scheduled Trips
                </h3>
                <p className="text-brutalist-caption opacity-70" style={{ color: 'var(--foundation-text)' }}>
                  Today's Schedule
                </p>
              </div>
            </div>
          </section>
          
          {/* Calendar Section */}
          <section className="mb-12 pb-8 border-b" style={{ borderColor: 'var(--foundation-border)' }}>
            <div className="border rounded-xl p-8" style={{
              backgroundColor: 'var(--foundation-bg)',
              borderColor: 'var(--foundation-border)'
            }}>
              <header className="flex justify-between items-center mb-8 pb-6 border-b" style={{
                borderColor: 'var(--foundation-border)'
              }}>
                <h2 className="text-brutalist-h1 font-black uppercase tracking-tight" style={{ color: 'var(--foundation-text)' }}>
                  Trip Calendar
                </h2>
                <div className="flex gap-4">
                  <button className="border px-6 py-3 font-bold uppercase rounded-lg transition-all duration-200 hover-darker hover-shadow" style={{
                    backgroundColor: 'var(--foundation-bg)',
                    borderColor: 'var(--foundation-border)',
                    color: 'var(--foundation-text)'
                  }}>
                    Refresh
                  </button>
                  <select className="border px-4 py-3 font-bold uppercase rounded-lg" style={{
                    backgroundColor: 'var(--foundation-bg)',
                    borderColor: 'var(--foundation-border)',
                    color: 'var(--foundation-text)'
                  }}>
                    <option>By Status</option>
                    <option>By Driver</option>
                    <option>By Vehicle</option>
                  </select>
                </div>
              </header>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div 
                    key={day}
                    className="p-4 text-center font-black uppercase rounded-lg" 
                    style={{ 
                      backgroundColor: 'var(--hover-bg-dark)',
                      color: 'var(--foundation-text)' 
                    }}
                  >
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {Array.from({ length: 35 }, (_, i) => (
                  <div 
                    key={i}
                    className="border rounded-lg p-4 min-h-32 hover-lighter hover-shadow transition-all duration-200 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--foundation-bg)',
                      borderColor: 'var(--foundation-border)'
                    }}
                  >
                    <span className="text-brutalist-body font-bold" style={{ color: 'var(--foundation-text)' }}>
                      {i + 1}
                    </span>
                    
                    {/* Trip indicators */}
                    {i === 14 && (
                      <div className="mt-2 space-y-1">
                        <div className="px-2 py-1 text-xs font-bold uppercase rounded-sm" style={{
                          backgroundColor: 'var(--status-accent)',
                          color: 'var(--foundation-text)'
                        }}>
                          12:45 PM
                        </div>
                        <div className="px-2 py-1 text-xs font-bold uppercase rounded-sm" style={{
                          backgroundColor: 'var(--hover-bg-dark)',
                          color: 'var(--foundation-text)'
                        }}>
                          3:30 PM
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Activity Section */}
          <section>
            <h2 className="text-brutalist-h1 font-black uppercase mb-6" style={{ color: 'var(--foundation-text)' }}>
              Recent Activity
            </h2>
            
            <div className="border rounded-xl p-6" style={{
              backgroundColor: 'var(--foundation-bg)',
              borderColor: 'var(--foundation-border)'
            }}>
              {/* Activity items with hover effects */}
              <div className="space-y-3">
                <div className="p-4 rounded-lg transition-all duration-200 hover-lighter hover-shadow">
                  <p className="text-brutalist-body font-bold" style={{ color: 'var(--foundation-text)' }}>
                    Vehicle MC-007 dispatched to Route #R2847
                  </p>
                  <p className="text-brutalist-small opacity-70 mt-1" style={{ color: 'var(--foundation-text)' }}>
                    5:58 PM - Mental Health Center pickup
                  </p>
                </div>
                
                {/* Alert activity - uses Casper */}
                <div className="p-4 rounded-lg shadow-status" style={{
                  backgroundColor: 'var(--status-accent)'
                }}>
                  <p className="text-brutalist-body font-bold" style={{ color: 'var(--foundation-text)' }}>
                    Maintenance Required: Vehicle MC-003
                  </p>
                  <p className="text-brutalist-small opacity-80 mt-1" style={{ color: 'var(--foundation-text)' }}>
                    5:30 PM - Scheduled for tomorrow 8:00 AM
                  </p>
                </div>

                <div className="p-4 rounded-lg transition-all duration-200 hover-lighter hover-shadow">
                  <p className="text-brutalist-body font-bold" style={{ color: 'var(--foundation-text)' }}>
                    Trip #T1847 completed successfully
                  </p>
                  <p className="text-brutalist-small opacity-70 mt-1" style={{ color: 'var(--foundation-text)' }}>
                    5:15 PM - Sober Living facility dropoff
                  </p>
                </div>

                <div className="p-4 rounded-lg transition-all duration-200 hover-lighter hover-shadow">
                  <p className="text-brutalist-body font-bold" style={{ color: 'var(--foundation-text)' }}>
                    Driver Alex Johnson clocked in
                  </p>
                  <p className="text-brutalist-small opacity-70 mt-1" style={{ color: 'var(--foundation-text)' }}>
                    4:45 PM - Assigned to Vehicle MC-012
                  </p>
                </div>
              </div>
            </div>
          </section>
          
        </main>
      </div>
    </div>
  );
}