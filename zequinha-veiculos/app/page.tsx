import { Header } from "@/components/Header";
import { HeroExperience } from "@/components/HeroExperience";
import { Stock } from "@/components/sections/Stock";
import { FeaturedVehicle } from "@/components/sections/FeaturedVehicle";
import { CompraVendaTroca } from "@/components/sections/CompraVendaTroca";
import { Sobre } from "@/components/sections/Sobre";
import { ClientGallery } from "@/components/sections/ClientGallery";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative bg-black">
        <HeroExperience />
        <Stock />
        <FeaturedVehicle />
        <CompraVendaTroca />
        <Sobre />
        <ClientGallery />
        <InstagramSection />
      </main>
      <Footer />
    </>
  );
}
