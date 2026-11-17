import { useState } from 'react';
import { GameProvider, useGame } from './game/GameProvider.jsx';
import Nav from './components/Nav.jsx';
import NavTools from './components/NavTools.jsx';
import Hero from './components/Hero.jsx';
import Terminal from './components/Terminal.jsx';
import HangingBot from './components/HangingBot.jsx';
import Experience from './components/Experience.jsx';
import Pipeline from './components/Pipeline.jsx';
import Cluster from './components/Cluster.jsx';
import StackLab from './components/StackLab.jsx';
import Education from './components/Education.jsx';
import Contact from './components/Contact.jsx';
import TerraformPlan from './components/TerraformPlan.jsx';
import Footer from './components/Footer.jsx';
import NightBot from './components/NightBot.jsx';
import Hud from './components/Hud.jsx';
import Workers, { HudBotControls } from './components/Workers.jsx';
import Toasts from './components/Toasts.jsx';
import AchievementsDrawer from './components/AchievementsDrawer.jsx';
import Palette from './components/Palette.jsx';
import { SelfDestruct, Matrix, Gravity, Boot, useScramble } from './components/Effects.jsx';
import './styles/sections.css';
import './styles/game.css';
import './styles/play.css';
import './styles/fx.css';

function Site() {
  const { status, bus } = useGame();
  const [hudText, setHudText] = useState('bots clocking in…');
  useScramble();

  return (
    <>
      <a className="skip mono" href="#experience">Skip to content</a>
      <Nav status={status.level} statusText={status.text} tools={<NavTools onPalette={() => bus.emit('palette:open')} />} />
      <main>
        <Hero terminal={<Terminal />} bot={<HangingBot />} />
        <Experience />
        <Pipeline />
        <Cluster />
        <StackLab />
        <Education />
        <Contact plan={<TerraformPlan />} />
      </main>
      <Footer bot={<NightBot />} onDanger={() => bus.emit('fx:destroy-cover')} />
      <Workers onHudText={setHudText} />
      <Hud text={hudText}>
        <HudBotControls />
      </Hud>
      <Toasts />
      <AchievementsDrawer />
      <Palette />
      <SelfDestruct />
      <Matrix />
      <Gravity />
      <Boot />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Site />
    </GameProvider>
  );
}
