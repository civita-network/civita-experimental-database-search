import { ArrowRight, Database, FlaskConical, GitFork } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return <main id="main-content" className="page-wrap about-page">
    <div className="eyebrow"><Database size={14} /> ABOUT THE PROJECT</div>
    <h1>About CIVITA</h1>
    <p className="about-lead">Computational Infrastructure for Validation, Integration, Testing, and Assessment</p>
    <p>CIVITA supports the Grand Challenge on the Calibration, Validation, and Benchmarking of Concrete Computational Models. This search workspace helps researchers find experimental records and trace them to the source dataset.</p>
    <div className="about-cards">
      <section className="panel"><GitFork size={22} /><h2>Linked scientific records</h2>
        <p>Search conditions follow links among sources, batches, specimens, tests, and measurements. Open a result to see which records satisfied the query.</p></section>
      <section className="panel"><FlaskConical size={22} /><h2>Synthetic demonstration</h2>
        <p>All records in this prototype are synthetic. The parameter browser identifies provisional fields whose categories lack a shared record schema.</p></section>
      <section className="panel"><Database size={22} /><h2>Source datasets</h2>
        <p>Browse and download the original JSON for each demonstration source. The separate CIVITA ingestion application handles data collection and publication.</p></section>
    </div>
    <Button asChild><Link href="/">Open search <ArrowRight /></Link></Button>
  </main>;
}
