import { useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { getAppearance, usePrefs } from "@/lib/astra/prefs";
import { seasonalMotionEnabled, seasonalThemeForPath } from "@/lib/astra/seasonal";

/** One viewport effect across shells and portals, excluding standalone gameplay. */
export function SeasonalExperience() {
  const prefs = usePrefs();
  const look = getAppearance(prefs);
  const pathname = useLocation({ select: location => location.pathname });
  const season = seasonalThemeForPath(prefs.seasonalTheme, pathname);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [systemReduced, setSystemReduced] = useState(false);
  const motion = seasonalMotionEnabled(look.reduceMotion, prefs.perfMode, systemReduced);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (season === "neither") delete root.dataset["season"];
    else root.dataset["season"] = season;
    return () => { delete root.dataset["season"]; };
  }, [season]);
  useEffect(() => {
    const node = canvas.current;
    if (!node || season === "neither" || !motion) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    let width = 0, height = 0, frame = 0, previous = 0;
    const resize = () => {
      width = window.innerWidth; height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      node.width = Math.round(width * dpr); node.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize(); window.addEventListener("resize", resize);
    const tokens = getComputedStyle(document.documentElement);
    const snow = tokens.getPropertyValue("--season-snow").trim();
    const colors = ["--season-leaf-red", "--season-leaf-gold", "--season-leaf-copper"].map(key => tokens.getPropertyValue(key).trim());
    const vein = tokens.getPropertyValue("--season-leaf-vein").trim();
    const count = season === "christmas" ? Math.min(200, Math.round(width / 7)) : Math.min(52, Math.round(width / 23));
    const points = Array.from({ length: count }, (_, i) => ({ x: Math.random() * width, y: Math.random() * height,
      size: season === "christmas" ? .9 + Math.random() * 3.2 : 8 + Math.random() * 11,
      speed: 16 + Math.random() * (season === "christmas" ? 48 : 33), phase: Math.random() * Math.PI * 2,
      alpha: .22 + Math.random() * .55, kind: i % 3 }));
    const leaf = new Path2D("M0 -1 L.18 -.5 .43 -.72 .4 -.27 .9 -.35 .66 .06 1 .25 .45 .42 .3 .75 0 .6 -.3 .75 -.45 .42 -1 .25 -.66 .06 -.9 -.35 -.4 -.27 -.43 -.72 -.18 -.5 Z");
    const draw = (now: number) => {
      if (document.hidden || document.fullscreenElement) { frame = 0; return; }
      frame = requestAnimationFrame(draw);
      if (now - previous < 32) return;
      const delta = previous ? Math.min((now - previous) / 1000, .06) : .032;
      previous = now; ctx.clearRect(0, 0, width, height);
      points.forEach(p => {
        p.y += p.speed * delta; p.x += (Math.sin(now / 2900 + p.phase) * 11 + 5) * delta;
        if (p.y > height + 24) { p.y = -24; p.x = Math.random() * width; }
        if (p.x > width + 24) p.x = -24;
        const x = p.x + Math.sin(now / 1800 + p.phase) * (season === "christmas" ? 15 : 34);
        ctx.save(); ctx.translate(x, p.y); ctx.globalAlpha = p.alpha;
        if (season === "christmas") {
          ctx.fillStyle = snow; ctx.beginPath(); ctx.arc(0, 0, p.size, 0, Math.PI * 2); ctx.fill();
          if (p.size > 3) { ctx.globalAlpha = p.alpha * .13; ctx.beginPath(); ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2); ctx.fill(); }
        } else {
          ctx.rotate(now / 2600 + p.phase); ctx.scale(p.size * (.55 + Math.abs(Math.sin(now / 1800 + p.phase)) * .45), p.size);
          ctx.fillStyle = colors[p.kind] ?? vein; ctx.fill(leaf); ctx.strokeStyle = vein; ctx.lineWidth = .04;
          ctx.beginPath(); ctx.moveTo(0, -.85); ctx.lineTo(0, .94);
          for (const y of [-.25, .05, .3]) { ctx.moveTo(0, y + .2); ctx.lineTo(.48, y); ctx.moveTo(0, y + .2); ctx.lineTo(-.48, y); }
          ctx.stroke();
        }
        ctx.restore();
      });
    };
    const resume = () => {
      cancelAnimationFrame(frame); frame = 0; previous = 0;
      if (!document.hidden && !document.fullscreenElement) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", resume); document.addEventListener("fullscreenchange", resume);
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", resume); document.removeEventListener("fullscreenchange", resume); };
  }, [season, motion]);
  if (season === "neither") return null;
  return <div className="seasonal-experience" data-season-decoration={season} aria-hidden="true">
    {motion && <canvas ref={canvas} className="seasonal-particles"/>}
    <div className="seasonal-corner seasonal-corner-left">{season === "christmas" ? "🌲" : "🍂 🥧"}</div>
    <div className="seasonal-corner seasonal-corner-right">{season === "christmas" ? "🌲" : "🌽 🎃"}</div>
    {season === "christmas" && <div className="seasonal-snowbank"/>}
  </div>;
}