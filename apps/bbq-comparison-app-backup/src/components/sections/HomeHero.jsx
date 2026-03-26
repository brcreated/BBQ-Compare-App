import Button from "../ui/Button";

export default function HomeHero() {
  return (
    <section className="home-hero">
      <p className="home-hero-eyebrow">Showroom Comparison Experience</p>

      <h2 className="home-hero-title">Find Your Perfect Grill</h2>

      <p className="home-hero-description">
        Explore smokers and grills, compare top models side by side, and find
        the right setup for your cooking style.
      </p>

      <div className="home-hero-actions">
        <Button>Browse Grills</Button>
      </div>
    </section>
  );
}