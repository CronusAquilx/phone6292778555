import { ArrowRight, Check, Gamepad2, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsoleShell } from "./ConsoleShell";

const additions = [
  "Admin site controls: turn movie sources on/off, reorder them and set the default look",
  "15 more personalization options: brightness, warm tint, color shift, fonts, line & word spacing, alignment, link underlines, uppercase headings, rounded pictures, typing cursor, picture style, button shape, shadows, borders",
  "5 more movie sources: VidSrc.xyz, VidSrc.pro, MoviesAPI, Vidora, RiveStream",
  "7 anime sites (Anikoto, HiAnime, AnimeKai, Miruro, 9Anime, AnimePahe, Kaido) shown only on anime",
  "12 new personalization options: cursor, color intensity, contrast, black & white, bold text, text glow, letter spacing, highlight color, scrollbars, animation speed, focus outline, smooth mode",
  "New working movie sources, ordered fastest first, plus a HiAnime anime source",
  "Home / At school choice for Movies in Personalization",
  "PNG/GIF backgrounds and MP3 imports in Personalization",
  "Christmas and Thanksgiving themes with adjustable snow and falling leaves",
  "A separate App Store, Windows Original Apps store, and owned-app Library",
  "Movable desktop apps that keep their place across visits",
  "YouTube and more web apps with navigation and picture-in-picture controls",
];

const fixes = [
  "Discord login no longer loads forever: it opens the Discord app page on the regular proxy",
  "Faster movie and anime loading with quicker retries for dropped video pieces",
  "Smoother desktop effects to reduce lag",
  "Movie sources switch to the next one faster when one stalls",
  "Anikoto now opens anikoto.ro",
  "Web apps get an Open directly button for sign-ins and captchas that block proxies",
  "BuildNow GG arcade connections to multiplayer game servers",
  "Full-song YouTube lookup before Music uses a 30-second preview",
  "More reliable web apps through the full-site proxy",
  "Home-screen icons stay stable when apps are added or removed",
];

export function FirstVisitChangelog({ onContinue }: { onContinue: () => void }) {
  return (
    <ConsoleShell>
      <main className="layout-chooser changelog-screen">
        <header className="layout-chooser-header">
          <span className="layout-wordmark">birch<span>OS</span></span>
          <span className="changelog-version">November 2026 update</span>
        </header>

        <section className="changelog-card" aria-labelledby="changelog-title">
          <div className="changelog-intro">
            <span className="changelog-symbol"><Sparkles aria-hidden="true" /></span>
            <div>
              <p className="changelog-eyebrow">WELCOME TO BIRCH OS</p>
              <h1 id="changelog-title">Here’s what’s new.</h1>
              <p>A quick look at the latest features and fixes before you choose your space.</p>
            </div>
          </div>

          <div className="changelog-columns">
            <section aria-labelledby="changelog-new">
              <h2 id="changelog-new"><Gamepad2 aria-hidden="true" />New features</h2>
              <ul>{additions.map((item) => <li key={item}><Check aria-hidden="true" /><span>{item}</span></li>)}</ul>
            </section>
            <section aria-labelledby="changelog-fixes">
              <h2 id="changelog-fixes"><Wrench aria-hidden="true" />Fixes & improvements</h2>
              <ul>{fixes.map((item) => <li key={item}><Check aria-hidden="true" /><span>{item}</span></li>)}</ul>
            </section>
          </div>

          <div className="changelog-action">
            <p>You’ll only see this update once on this device.</p>
            <Button size="lg" onClick={onContinue}>Choose your layout<ArrowRight /></Button>
          </div>
        </section>

        <footer className="layout-chooser-footer"><span>Latest changes & fixes</span><span>Birch OS</span></footer>
      </main>
    </ConsoleShell>
  );
}
