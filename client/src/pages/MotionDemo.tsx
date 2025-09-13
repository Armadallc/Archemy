import { MapPin, Clock, User, Car, Calendar, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export default function MotionDemo() {
  const [animationDemo, setAnimationDemo] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [tripStatus, setTripStatus] = useState('pending');

  // Simulate form validation with animation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormEmail(value);
    if (value && !value.includes('@')) {
      setFormError('Please enter a valid email address');
    } else {
      setFormError('');
    }
  };

  // Simulate status changes with animation
  const handleStatusChange = (newStatus: string) => {
    setTripStatus(newStatus);
    // Add status change animation
    const statusElements = document.querySelectorAll('.status-indicator');
    statusElements.forEach(el => {
      el.classList.add('status-change');
      setTimeout(() => el.classList.remove('status-change'), 500);
    });
  };

  useEffect(() => {
    // Staggered reveal animation for cards
    const cards = document.querySelectorAll('.demo-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('stagger-reveal');
      }, index * 100);
    });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen" style={{ backgroundColor: 'var(--foundation-bg)' }}>
      {/* Refined Brutalist Header */}
      <div className="mb-12 border-2 p-8 rounded-xl shadow-xl" style={{
        backgroundColor: 'var(--foundation-text)',
        color: 'var(--foundation-bg)',
        borderColor: 'var(--foundation-border)',
        boxShadow: '0 25px 50px rgba(49, 47, 44, 0.15)'
      }}>
        <h1 className="text-mega mb-4" style={{ color: 'var(--foundation-bg)' }}>REFINED COMMAND SYSTEM</h1>
        <p className="text-brutalist-body mb-8 uppercase tracking-wide" style={{ color: 'var(--status-accent)' }}>
          Background Foundation: Cow's Milk (#F0EDE5) • Structure: Holy Crow & Stargazing
        </p>
        <p className="text-brutalist-body mb-8 uppercase tracking-wide" style={{ color: 'var(--status-accent)' }}>
          Interactive Reveals: Casper (#A4B7BB) • Ultra Moss (#D2F75A)
        </p>
        
        <div className="flex gap-6 mb-6">
          <button 
            onClick={() => setAnimationDemo(!animationDemo)}
            className="px-8 py-4 brutalist-button hover:shadow-lg transition-all duration-200"
            style={{
              backgroundColor: 'var(--status-accent)',
              color: 'var(--foundation-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-bg-light)';
              e.currentTarget.style.color = 'var(--foundation-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--status-accent)';
              e.currentTarget.style.color = 'var(--foundation-text)';
            }}
          >
            <Zap className="w-5 h-5 mr-3" />
            TOGGLE DEMO
          </button>
          <div className="px-6 py-4 flex items-center gap-3 rounded-md border-2" style={{
            backgroundColor: 'var(--hover-bg-dark)',
            borderColor: 'var(--status-accent)'
          }}>
            <div className="w-3 h-3 animate-pulse rounded-sm" style={{ backgroundColor: 'var(--status-accent)' }}></div>
            <span className="text-brutalist-caption" style={{ color: 'var(--status-accent)' }}>SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Refined Motion System Demo */}
      <div className="mb-12 p-8 rounded-lg border-2" style={{
        backgroundColor: 'var(--hover-bg-dark)',
        borderColor: 'var(--foundation-border)'
      }}>
        <h2 className="text-brutalist-h1 mb-8" style={{ color: 'var(--foundation-text)' }}>INTERACTIVE COMMAND DEMONSTRATIONS</h2>
        <p className="text-brutalist-body mb-8 uppercase tracking-wide" style={{ color: 'var(--status-accent)' }}>
          Default state components using cow's milk foundation with interactive reveals
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Command Card - Default State */}
          <div className="p-6 interactive-card transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>VEHICLE COMMAND</h3>
              <div className="px-3 py-1 border-2 rounded-sm" style={{
                backgroundColor: 'var(--hover-bg-dark)',
                borderColor: 'var(--foundation-border)'
              }}>
                <span className="text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>UNIT 001</span>
              </div>
            </div>
            <p className="text-brutalist-body mb-4" style={{ color: 'var(--foundation-text)' }}>Downtown Medical Center</p>
            <div className="flex items-center text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>
              <Clock className="w-4 h-4 mr-2" />
              14:30 - 15:15 HOURS
            </div>
            <button 
              className="mt-4 w-full py-3 brutalist-button transition-all duration-200 hover-darker"
              style={{ backgroundColor: 'var(--foundation-text)', color: 'var(--foundation-bg)' }}
            >
              EXECUTE COMMAND
            </button>
          </div>

          {/* Status Control Panel */}
          <div className="p-6 interactive-card" style={{
            backgroundColor: 'var(--foundation-text)',
            borderColor: 'var(--hover-bg-dark)'
          }}>
            <h3 className="text-brutalist-caption mb-4" style={{ color: 'var(--status-accent)' }}>STATUS CONTROL</h3>
            <div className="space-y-3">
              <button 
                className="w-full py-3 brutalist-button transition-all duration-200 hover-darker"
                style={{ backgroundColor: 'var(--hover-bg-dark)', color: 'var(--foundation-text)' }}
              >
                DISPATCH
              </button>
              <button 
                className="w-full py-3 brutalist-button transition-all duration-200 hover-lighter"
                style={{ backgroundColor: 'var(--foundation-bg)', color: 'var(--foundation-text)' }}
              >
                MONITOR
              </button>
              <button 
                className="w-full py-3 brutalist-button transition-all duration-200 hover-darker"
                style={{ backgroundColor: 'var(--hover-bg-dark)', color: 'var(--foundation-text)' }}
              >
                RECALL
              </button>
            </div>
          </div>

          {/* Live System Status */}
          <div className="p-6 interactive-card">
            <h3 className="text-brutalist-caption mb-4" style={{ color: 'var(--foundation-text)' }}>SYSTEM STATUS</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>OPERATIONAL</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 animate-pulse rounded-sm" style={{ backgroundColor: 'var(--status-accent)' }}></div>
                  <span className="text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>ACTIVE</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>FLEET COUNT</span>
                <span className="text-brutalist-h2" style={{ color: 'var(--foundation-text)' }}>24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>ALERT LEVEL</span>
                <div className="px-3 py-1 border-2 rounded-sm" style={{
                  backgroundColor: 'var(--hover-bg-dark)',
                  borderColor: 'var(--foundation-border)'
                }}>
                  <span className="text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>NORMAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive State Examples */}
        <div className="mt-8 p-8 rounded-lg border-2" style={{
          backgroundColor: 'var(--foundation-bg)',
          borderColor: 'var(--foundation-border)'
        }}>
          <h4 className="text-brutalist-h2 mb-6" style={{ color: 'var(--foundation-text)' }}>HOVER STATE DEMONSTRATIONS</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              className="p-6 transition-all duration-200 cursor-pointer rounded-lg border-2 hover:shadow-lg hover-lighter"
              style={{
                backgroundColor: 'var(--hover-bg-dark)',
                borderColor: 'var(--foundation-border)'
              }}
            >
              <h5 className="text-brutalist-caption mb-2" style={{ color: 'var(--foundation-text)' }}>DEFAULT → HOVER</h5>
              <p className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>
                Darker Cow's Milk background lightens on hover with subtle shadow reveal
              </p>
            </div>

            <div 
              className="p-6 transition-all duration-200 cursor-pointer group rounded-lg border-2 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--status-accent)',
                borderColor: 'var(--foundation-border)'
              }}
            >
              <h5 className="text-brutalist-caption mb-2" style={{ color: 'var(--foundation-text)' }}>STATUS ALERT</h5>
              <p className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>
                Casper blue-grey reserved for status alerts and important notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Color Foundation Form Interface */}
      <div className="mb-12 p-8 border-2 rounded-lg" style={{
        backgroundColor: 'var(--foundation-bg)',
        borderColor: 'var(--foundation-border)'
      }}>
        <h2 className="text-brutalist-h1 mb-8" style={{ color: 'var(--foundation-text)' }}>FOUNDATION FORM INTERFACE</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Controls */}
          <div className="p-6 border-2 rounded-lg" style={{
            backgroundColor: 'var(--hover-bg-dark)',
            borderColor: 'var(--foundation-border)'
          }}>
            <h3 className="text-brutalist-caption mb-6" style={{ color: 'var(--status-accent)' }}>INPUT CONTROLS</h3>
            <div className="space-y-4">
              <div>
                <label className="text-brutalist-caption mb-2 block" style={{ color: 'var(--foundation-text)' }}>OPERATOR ID</label>
                <input 
                  type="text" 
                  placeholder="ENTER OPERATOR ID" 
                  className="w-full p-4 text-brutalist-body border-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--foundation-text)',
                    borderColor: 'var(--foundation-bg)',
                    color: 'var(--foundation-bg)'
                  }}
                />
              </div>
              <div>
                <label className="text-brutalist-caption mb-2 block" style={{ color: 'var(--foundation-text)' }}>COMMAND TYPE</label>
                <select 
                  className="w-full p-4 text-brutalist-body border-2 rounded-md transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--foundation-text)',
                    borderColor: 'var(--foundation-bg)',
                    color: 'var(--foundation-bg)'
                  }}
                >
                  <option>SELECT COMMAND TYPE</option>
                  <option>DISPATCH VEHICLE</option>
                  <option>UPDATE STATUS</option>
                  <option>EMERGENCY OVERRIDE</option>
                </select>
              </div>
              <button 
                className="w-full py-4 brutalist-button hover-darker transition-all duration-200 mt-6"
                style={{
                  backgroundColor: 'var(--status-accent)',
                  color: 'var(--foundation-text)'
                }}
              >
                EXECUTE COMMAND
              </button>
            </div>
          </div>

          {/* Status Display */}
          <div className="p-6 border-2 rounded-lg" style={{
            backgroundColor: 'var(--foundation-text)',
            borderColor: 'var(--status-accent)'
          }}>
            <h3 className="text-brutalist-caption mb-6" style={{ color: 'var(--status-accent)' }}>SYSTEM STATUS</h3>
            <div className="space-y-4">
              <div className="p-4 border-2 rounded-md hover-shadow transition-all duration-200" style={{
                backgroundColor: 'var(--hover-bg-dark)',
                borderColor: 'var(--status-accent)'
              }}>
                <div className="flex items-center justify-between">
                  <span className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>ACTIVE OPERATORS</span>
                  <span className="text-brutalist-h2" style={{ color: 'var(--status-accent)' }}>08</span>
                </div>
              </div>
              <div className="p-4 border-2 rounded-md hover-shadow transition-all duration-200" style={{
                backgroundColor: 'var(--foundation-bg)',
                borderColor: 'var(--foundation-border)'
              }}>
                <div className="flex items-center justify-between">
                  <span className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>PENDING COMMANDS</span>
                  <span className="text-brutalist-h2" style={{ color: 'var(--foundation-text)' }}>03</span>
                </div>
              </div>
              <div className="p-4 border-2 rounded-md hover-shadow transition-all duration-200" style={{
                backgroundColor: 'var(--status-accent)',
                borderColor: 'var(--foundation-border)'
              }}>
                <div className="flex items-center justify-between">
                  <span className="text-brutalist-small" style={{ color: 'var(--foundation-text)' }}>SYSTEM ALERTS</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 animate-pulse rounded-sm" style={{ backgroundColor: 'var(--foundation-text)' }}></div>
                    <span className="text-brutalist-caption" style={{ color: 'var(--foundation-text)' }}>NORMAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refined State Transition Matrix */}
      <div className="mb-12 p-8 rounded-xl border-2 shadow-xl" style={{
        backgroundColor: 'var(--text-primary)',
        borderColor: 'var(--reveal-active)',
        boxShadow: '0 25px 50px rgba(49, 47, 44, 0.15)'
      }}>
        <h2 className="text-brutalist-h1 mb-8" style={{ color: 'var(--reveal-active)' }}>REFINED COLOR STRATEGY MATRIX</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Default State */}
          <div className="p-6 rounded-lg border-2" style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--text-secondary)'
          }}>
            <h3 className="text-brutalist-caption mb-4" style={{ color: 'var(--text-primary)' }}>DEFAULT FOUNDATION</h3>
            <div className="space-y-3">
              <div className="p-3 border-2 rounded-sm" style={{
                backgroundColor: 'var(--text-primary)',
                borderColor: 'var(--text-secondary)'
              }}>
                <span className="text-brutalist-small" style={{ color: 'var(--bg-primary)' }}>Holy Crow (#312F2C)</span>
              </div>
              <div className="p-3 border-2 rounded-sm" style={{
                backgroundColor: 'var(--text-secondary)',
                borderColor: 'var(--text-primary)'
              }}>
                <span className="text-brutalist-small" style={{ color: 'var(--bg-primary)' }}>Stargazing (#424348)</span>
              </div>
              <div className="p-3 border-2 rounded-sm" style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--text-primary)'
              }}>
                <span className="text-brutalist-small" style={{ color: 'var(--text-primary)' }}>Cows Milk (#F0EDE5)</span>
              </div>
            </div>
          </div>

          {/* Interactive Reveals */}
          <div className="p-6 rounded-lg border-2" style={{
            backgroundColor: 'var(--reveal-accent)',
            borderColor: 'var(--reveal-active)'
          }}>
            <h3 className="text-brutalist-caption mb-4" style={{ color: 'var(--text-primary)' }}>INTERACTIVE REVEALS</h3>
            <div className="space-y-3">
              <div className="p-3 border-2 rounded-sm" style={{
                backgroundColor: 'var(--reveal-accent)',
                borderColor: 'var(--reveal-active)'
              }}>
                <span className="text-brutalist-small" style={{ color: 'var(--text-primary)' }}>Casper (#A4B7BB)</span>
              </div>
              <div className="p-3 border-2 rounded-sm" style={{
                backgroundColor: 'var(--reveal-active)',
                borderColor: 'var(--text-primary)'
              }}>
                <span className="text-brutalist-small" style={{ color: 'var(--text-primary)' }}>Ultra Moss (#D2F75A)</span>
              </div>
              <div className="p-3 border-2 rounded-sm" style={{
                backgroundColor: 'var(--bg-primary)',
                borderColor: 'var(--text-primary)'
              }}>
                <span className="text-brutalist-small" style={{ color: 'var(--text-primary)' }}>Cows Milk Foundation</span>
              </div>
            </div>
          </div>

          {/* Live Interactive Demo */}
          <div 
            className="p-6 transition-all duration-200 cursor-pointer group rounded-lg border-2"
            style={{
              backgroundColor: 'var(--text-secondary)',
              borderColor: 'var(--reveal-accent)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--reveal-active)';
              e.currentTarget.style.borderColor = 'var(--text-primary)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(210, 247, 90, 0.25)';
              
              const elements = e.currentTarget.querySelectorAll('[data-hover-text]');
              elements.forEach(el => {
                (el as HTMLElement).style.color = 'var(--text-primary)';
              });
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--reveal-accent)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              
              const elements = e.currentTarget.querySelectorAll('[data-hover-text]');
              elements.forEach(el => {
                (el as HTMLElement).style.color = 'var(--bg-primary)';
              });
            }}
          >
            <h3 className="text-brutalist-caption mb-4" data-hover-text style={{ color: 'var(--bg-primary)' }}>LIVE DEMO</h3>
            <div className="space-y-3">
              <div className="text-brutalist-small" data-hover-text style={{ color: 'var(--bg-primary)' }}>
                Hover to see refined transition effects
              </div>
              <div className="text-brutalist-caption" data-hover-text style={{ color: 'var(--bg-primary)' }}>
                BACKGROUND: STARGAZING → ULTRA MOSS
              </div>
              <div className="text-brutalist-caption" data-hover-text style={{ color: 'var(--bg-primary)' }}>
                BORDER: CASPER → HOLY CROW
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}