import { Database } from "lucide-react";

export function SearchHero() {
  return <section className="hero" aria-labelledby="page-title">
    <div className="hero-copy">
      <div className="eyebrow"><Database size={14} /> GRAND CHALLENGE EXPERIMENTAL DATABASE</div>
      <h1 id="page-title">Concrete Database Search</h1>
      <p>Discover experimental datasets for concrete and cementitious materials. Build queries across material batches, specimens, tests, and measurements.</p>
    </div>
    <svg className="hero-drawing" viewBox="0 0 390 186" aria-hidden="true" fill="none">
      <defs><pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" stroke="#cdddf3" strokeWidth="1"/></pattern></defs>
      <path d="M1 1h388v184H1z" fill="url(#grid)" />
      <g stroke="#87a8d2" strokeWidth="1.1" strokeDasharray="4 4"><path d="M52 138h278M88 48v105M288 48v105M187 28v126"/><path d="M85 154h202M85 150v8m202-8v8"/></g>
      <path d="m88 100 23-16h200l-23 16H88Z" fill="#edf4ff" stroke="#6c98cb" strokeWidth="1.4"/>
      <path d="M88 100h200v26h-93l-8-12-8 12H88v-26Z" fill="#c6daf4" stroke="#6c98cb" strokeWidth="1.4"/>
      <path d="m288 100 23-16v26l-23 16v-26Z" fill="#a8c4eb" stroke="#6c98cb" strokeWidth="1.4"/>
      <g stroke="#376eaf" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M187 43v37m-6-6 6 6 6-6M113 126l-8 12h16l-8-12Zm151 0-8 12h16l-8-12Z"/>
        <path d="M177 43h20M147 61h23m34 0h23" opacity=".5"/>
      </g>
      <g fill="#4475ac" fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="1"><text x="246" y="49">TEST SETUP</text><text x="213" y="167">SPAN</text></g>
    </svg>
  </section>;
}
