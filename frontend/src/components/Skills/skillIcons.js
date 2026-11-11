import React from 'react';
import {
  SiReact, SiJavascript, SiNodedotjs, SiPocketbase, SiAnthropic, SiHtml5, SiCss3,
  SiNextdotjs, SiExpress, SiExpo, SiAndroidstudio, SiSass, SiThreedotjs, SiGreensock,
  SiMongodb, SiMongoose, SiSqlite, SiGit, SiVisualstudiocode, SiVercel, SiPuppeteer,
  SiGooglesearchconsole, SiLetsencrypt, SiDocker, SiDiscord, SiJsonwebtokens, SiStripe,
  SiNpm, SiDotenv, SiNodemon, SiAxios, SiReactrouter, SiSharp, SiJest, SiSwagger, SiTwilio,
} from 'react-icons/si';

// Logos monochromes Simple Icons (react-icons/si), rendus en currentColor.
const SIMPLE_ICONS = {
  SiReact, SiJavascript, SiNodedotjs, SiPocketbase, SiAnthropic, SiHtml5, SiCss3,
  SiNextdotjs, SiExpress, SiExpo, SiAndroidstudio, SiSass, SiThreedotjs, SiGreensock,
  SiMongodb, SiMongoose, SiSqlite, SiGit, SiVisualstudiocode, SiVercel, SiPuppeteer,
  SiGooglesearchconsole, SiLetsencrypt, SiDocker, SiDiscord, SiJsonwebtokens, SiStripe,
  SiNpm, SiDotenv, SiNodemon, SiAxios, SiReactrouter, SiSharp, SiJest, SiSwagger, SiTwilio,
};

// Glyphes maison pour les outils sans logo dans Simple Icons (TipTap, Reanimated, Skia, ML Kit, Lottie…).
const GLYPHS = {
  rest: 'M4 4h16a1 1 0 0 1 1 1v3H3V5a1 1 0 0 1 1-1zm-1 6h18v3H3zm0 5h18v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM5 6h2v1H5zm0 6h2v1H5zm0 6h2v1H5z',
  dot: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z',
  mail: 'M2 6a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v1.4l-10 6.2L2 7.4zm0 3.7 10 6.2 10-6.2V18a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z',
  scan: 'M3 3h5v2H5v3H3zm13 0h5v5h-2V5h-3zM3 16h2v3h3v2H3zm16 0h2v5h-5v-2h3zM7 9h10v2H7zm0 4h7v2H7z',
  pen: 'M4 17.3 15.3 6l2.7 2.7L6.7 20H4zM16.7 4.6l1.4-1.4a1 1 0 0 1 1.4 0l1.3 1.3a1 1 0 0 1 0 1.4l-1.4 1.4z',
  motion: 'M3 6h9v2H3zm0 5h13v2H3zm0 5h7v2H3zm14-7 5 4-5 4z',
  brush: 'M15 3l6 6-8.6 8.6a3 3 0 0 1-4.2 0L6 15.4a3 3 0 0 1 0-4.2zM4.5 17.5 3 21l3.5-1.5z',
  wave: 'M2 12c3-6 5-6 8 0s5 6 8 0 3-2 4 0v2c-1-2-2-2-4 0s-5 6-8 0-5-6-8 0z',
  film: 'M3 4h18v16H3zm2 2v2h2V6zm12 0v2h2V6zM5 11v2h2v-2zm12 0v2h2v-2zM5 16v2h2v-2zm12 0v2h2v-2zM9 6v12h6V6z',
};

const SkillIcon = ({ name, className }) => {
  const Icon = SIMPLE_ICONS[name];
  if (Icon) return <Icon className={className} aria-hidden="true" />;
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d={GLYPHS[name] || GLYPHS.dot} />
    </svg>
  );
};

export default SkillIcon;
