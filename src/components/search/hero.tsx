import { Database } from "lucide-react";
import Image from "next/image";

export function SearchHero() {
  return <section className="hero" aria-labelledby="page-title">
    <div className="hero-copy">
      <div className="eyebrow"><Database size={14} /> CONCRETE GRAND CHALLENGE EXPERIMENTAL DATABASE</div>
      <h1 id="page-title">Concrete Database Search</h1>
      <p>Discover experimental datasets for concrete and cementitious materials. Build queries across material batches, specimens, tests, and measurements.</p>
    </div>
    <Image
      className="hero-logo"
      src="/images/civita-logo.png"
      alt="CIVITA logo"
      width={1254}
      height={1254}
      sizes="(max-width: 650px) 96px, (max-width: 850px) 100px, 130px"
    />
  </section>;
}
