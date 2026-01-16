import React, { useEffect } from 'react';
import Footer from '../../components/Footer';
import {
  LandingNavbar,
  LandingHero,
  FocusFeatures,
  SolutionSection,
  IconButtonsRow,
  GrowthPaths,
  FocusSystem,
  Testimonials,
  LandingPricing,
  LandingFAQ,
  LandingCTA,
} from './components';

interface LandingViewProps {
  onGetStarted?: () => void;
}

const LandingView: React.FC<LandingViewProps> = ({ onGetStarted }) => {
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.color = '#f8fafc';
  }, []);

  return (
    <div className="min-h-screen w-full animate-in fade-in duration-700 bg-gradient-to-b from-background via-background to-surface/20">
      {/* Navigation */}
      <LandingNavbar onGetStarted={onGetStarted} />

      {/* Hero Section */}
      <LandingHero onGetStarted={onGetStarted} />

      {/* Focus On What Matters */}
      <FocusFeatures />

      {/* The XPeak Solution */}
      <SolutionSection />

      {/* Feature Icon Buttons */}
      <IconButtonsRow />

      {/* Simple Growth Paths */}
      <GrowthPaths />

      {/* Practical Focus System */}
      <FocusSystem />

      {/* Customer Feedback */}
      <Testimonials />

      {/* Pricing */}
      <LandingPricing onGetStarted={onGetStarted} />

      {/* FAQ */}
      <LandingFAQ />

      {/* Call to Action */}
      <LandingCTA onGetStarted={onGetStarted} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingView;
