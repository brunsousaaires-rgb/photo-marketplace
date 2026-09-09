import Hero from '@/components/home/Hero';
import ScrollStory from '@/components/home/ScrollStory';
import VehicleShowcase from '@/components/home/VehicleShowcase';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import SellerSection from '@/components/home/SellerSection';
import AboutSection from '@/components/home/AboutSection';
import DifferentialsSection from '@/components/home/DifferentialsSection';
import ExperienceSection from '@/components/home/ExperienceSection';
import FinanceSection from '@/components/home/FinanceSection';
import InstagramFeed from '@/components/home/InstagramFeed';
import CTASection from '@/components/home/CTASection';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ScrollStory />
      <VehicleShowcase />
      <CategoryShowcase />
      <SellerSection />
      <AboutSection />
      <DifferentialsSection />
      <ExperienceSection />
      <FinanceSection />
      <InstagramFeed />
      <CTASection />
    </>
  );
}
