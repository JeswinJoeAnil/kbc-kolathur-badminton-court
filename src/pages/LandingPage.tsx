import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, MapPin, Clock, Users, Crown, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32 flex flex-col items-center text-center bg-background border-b-2 border-foreground">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 leading-[0.9]">
            PLAY BADMINTON AT <span className="bg-accent px-4 py-1 brutalist-border">KBC</span>
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-foreground/80">
            A single, high-quality indoor court in Kolathur. Open every day from 6 AM to 10 PM. 
            Book your slot online or just walk in.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/guest">
              <Button size="lg" className="bg-accent text-accent-foreground brutalist-border brutalist-shadow text-xl px-8 py-8 h-auto w-full sm:w-auto">
                Book as Guest <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <a href="tel:9846422644">
              <Button size="lg" variant="outline" className="brutalist-border brutalist-shadow-sm text-xl px-8 py-8 h-auto w-full sm:w-auto">
                Call 9846422644
              </Button>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Proof Section - Concrete Numbers */}
      <section className="px-4 py-20 border-b-2 border-foreground bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="p-8 brutalist-border bg-accent/10">
              <div className="text-6xl font-bold mb-2">300₹</div>
              <p className="text-xl font-medium">Per hour for up to 6 people</p>
              <p className="text-sm opacity-60 mt-2">The most affordable rate in the area</p>
            </div>
            <div className="p-8 brutalist-border bg-accent/10">
              <div className="text-6xl font-bold mb-2">16</div>
              <p className="text-xl font-medium">Hourly slots available daily</p>
              <p className="text-sm opacity-60 mt-2">From sunrise to late night</p>
            </div>
            <div className="p-8 brutalist-border bg-accent/10">
              <div className="text-6xl font-bold mb-2">100%</div>
              <p className="text-xl font-medium">Indoor & Weatherproof</p>
              <p className="text-sm opacity-60 mt-2">Never miss a game due to rain</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Info Section */}
      <section className="px-4 py-20 bg-background border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">WHAT WE HAVE</h2>
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="bg-accent p-2 brutalist-border mt-1">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Great Location</h3>
                  <p className="text-lg opacity-80">Right near National LP School in Kolathur. Easy to find and reach.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-accent p-2 brutalist-border mt-1">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Vast Parking</h3>
                  <p className="text-lg opacity-80">Plenty of space for your cars and bikes. No more parking stress.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="bg-accent p-2 brutalist-border mt-1">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Changing Rooms & Toilets</h3>
                  <p className="text-lg opacity-80">Clean facilities to freshen up before and after your game.</p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="brutalist-border brutalist-shadow overflow-hidden aspect-video bg-foreground/5 flex items-center justify-center">
              <img 
                src="https://picsum.photos/seed/badminton/800/450" 
                alt="KBC Badminton Court" 
                className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-accent p-6 brutalist-border brutalist-shadow hidden md:block">
              <p className="font-bold text-xl">1 Professional Court</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Book - Real Process */}
      <section className="px-4 py-20 bg-accent/5 border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 uppercase">HOW TO BOOK</h2>
            <p className="text-xl opacity-80">Simple 3-step process to get on the court.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white brutalist-border brutalist-shadow-sm">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-2xl mb-6 brutalist-border">1</div>
              <h3 className="text-2xl font-bold mb-4">Pick a Date</h3>
              <p className="opacity-70">Choose any day of the week. We are open 365 days a year from 6 AM to 10 PM.</p>
            </div>
            <div className="p-8 bg-white brutalist-border brutalist-shadow-sm">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-2xl mb-6 brutalist-border">2</div>
              <h3 className="text-2xl font-bold mb-4">Select a Slot</h3>
              <p className="opacity-70">See real-time availability. If a slot is green, it's yours to request.</p>
            </div>
            <div className="p-8 bg-white brutalist-border brutalist-shadow-sm">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-2xl mb-6 brutalist-border">3</div>
              <h3 className="text-2xl font-bold mb-4">Get Approval</h3>
              <p className="opacity-70">Our admin will confirm your booking quickly. You'll get a confirmation right here.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 py-20 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">PRICING PLANS</h2>
          <p className="text-xl opacity-80">Choose how you want to play at KBC</p>
        </div>
        
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Guest Plan */}
          <div className="p-10 brutalist-border bg-background flex flex-col h-full">
            <h3 className="text-3xl font-bold mb-2">Guest Player</h3>
            <p className="opacity-60 mb-6">Perfect for occasional games with friends</p>
            <div className="text-5xl font-bold mb-8">300₹ <span className="text-xl font-normal opacity-60">/ hour</span></div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-2"><CheckCircle2 size={20} className="text-accent" /> Up to 6 people allowed</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={20} className="text-accent" /> Use all facilities</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={20} className="text-accent" /> Online or cash payment</li>
            </ul>
            <Link to="/guest">
              <Button className="w-full bg-foreground text-background brutalist-border brutalist-shadow-sm h-14 text-lg">
                Book as Guest <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>

          {/* Member Plan */}
          <div className="p-10 brutalist-border flex flex-col h-full brutalist-shadow" style={{ backgroundColor: '#FBBF24' }}>
            <h3 className="text-3xl font-bold mb-2 flex items-center gap-2"><Crown size={28} /> Regular Member</h3>
            <p className="opacity-80 mb-6">For those who play every week</p>
            <div className="space-y-2 mb-8">
              <div className="text-5xl font-bold">1000₹ <span className="text-xl font-normal opacity-80">/ year</span></div>
              <div className="text-3xl font-bold">+ 500₹ <span className="text-xl font-normal opacity-80">/ month</span></div>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={20} /> Priority booking slots</li>
              <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={20} /> Exclusive member-only hours</li>
              <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={20} /> Significant savings for regulars</li>
              <li className="flex items-center gap-2 font-medium"><CheckCircle2 size={20} /> Join the KBC community</li>
            </ul>
            <Link to="/member">
              <Button className="w-full bg-foreground text-background brutalist-border brutalist-shadow-sm h-14 text-lg">
                Become a Member <Crown className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Three Portal CTA */}
      <section className="px-4 py-20 bg-foreground text-background text-center">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">READY TO PLAY?</h2>
        <p className="text-xl opacity-60 mb-12 max-w-xl mx-auto">Choose your portal to get started</p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-4xl mx-auto">
          <Link to="/guest" className="flex-1">
            <Button size="lg" className="w-full brutalist-border brutalist-shadow text-xl px-8 py-10 h-auto flex flex-col gap-2" style={{ backgroundColor: '#BEF264', color: '#1A1A1A' }}>
              <span className="text-2xl font-bold">Guest</span>
              <span className="text-sm font-normal opacity-70">300₹/hour · Walk-in</span>
            </Button>
          </Link>
          <Link to="/member" className="flex-1">
            <Button size="lg" className="w-full brutalist-border brutalist-shadow text-xl px-8 py-10 h-auto flex flex-col gap-2" style={{ backgroundColor: '#FBBF24', color: '#1A1A1A' }}>
              <Crown className="mb-1" size={24} />
              <span className="text-2xl font-bold">Member</span>
              <span className="text-sm font-normal opacity-70">Priority · Exclusive slots</span>
            </Button>
          </Link>
          <Link to="/admin" className="flex-1">
            <Button size="lg" className="w-full bg-red-500 text-white brutalist-border brutalist-shadow text-xl px-8 py-10 h-auto flex flex-col gap-2">
              <Shield className="mb-1" size={24} />
              <span className="text-2xl font-bold">Admin</span>
              <span className="text-sm font-normal opacity-70">Management Panel</span>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
