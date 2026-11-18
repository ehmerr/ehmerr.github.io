import { useRef, useState, useEffect } from 'react';
import { profile } from '../data/profile.js';
import { useGame } from '../game/GameProvider.jsx';
import { ContactLinks } from './Contact.jsx';
import { centerOf } from '../motion/motion.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Contact as `terraform plan` → Approve → `terraform apply`, which reveals the contact details.
export default function TerraformPlan() {
  const { unlock, play, toast, bus } = useGame();
  const boxRef = useRef(null);
  const [phase, setPhase] = useState('plan'); // plan | applying | done
  const [applyLog, setApplyLog] = useState([]);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; // set on (re)mount too: StrictMode unmounts and remounts once in dev
    return () => { alive.current = false; };
  }, []);

  const apply = async () => {
    setPhase('applying');
    play('click');
    const steps = [
      { t: 'engineer.ahmar_rahmani: Creating...', k: 'out' },
      { t: 'engineer.ahmar_rahmani: Still creating... [2s elapsed]', k: 'dim' },
      { t: 'engineer.ahmar_rahmani: Creation complete after 3s [id=hired]', k: 'ok' },
      { t: '', k: 'out' },
      { t: 'Apply complete! Resources: 1 added, 0 changed, 0 destroyed.', k: 'ok' },
      { t: 'Outputs: contact details below. One step left: say hello.', k: 'out' },
    ];
    for (const s of steps) {
      await sleep(550);
      if (!alive.current) return;
      setApplyLog((l) => [...l, s]);
      play('key');
    }
    unlock('apply');
    play('ok');
    setPhase('done');
    const at = centerOf(boxRef.current?.querySelector('.tf-actions'));
    bus.emit('fx:burst', { ...at, kind: 'confetti' });
    bus.emit('fx:pulse', { ...at, power: 1.2 });
  };

  const reset = () => {
    setPhase('plan');
    setApplyLog([]);
  };

  return (
    <div className="tf" ref={boxRef} data-reveal>
      <div className="term tf-term">
        <div className="term-bar">
          <span className="term-dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="term-title mono">hire.tf</span>
        </div>
        <div className="tf-body mono">
          <p className="t-cmd">$ terraform plan -out=hire.tfplan</p>
          <p className="t-dim">&nbsp;</p>
          <p className="t-out">Terraform will perform the following actions:</p>
          <p className="t-dim">&nbsp;</p>
          <p className="t-ok">  # engineer.ahmar_rahmani will be created</p>
          <p className="t-ok">  + resource "engineer" "ahmar_rahmani" {'{'}</p>
          <p className="t-ok">      + role      = "{profile.track}"</p>
          <p className="t-ok">      + current   = "{profile.role} @ {profile.company}"</p>
          <p className="t-ok">      + location  = "{profile.city} / remote"</p>
          <p className="t-ok">      + open_to   = [{profile.openTo.map((o) => `"${o}"`).join(', ')}]</p>
          <p className="t-ok">      + stack     = ["GKE", "Helm", "Terraform", "GitLab CI/CD"]</p>
          <p className="t-ok">      + on_call   = true</p>
          <p className="t-ok">    {'}'}</p>
          <p className="t-dim">&nbsp;</p>
          <p className="t-out">Plan: <b>1 to add</b>, 0 to change, 0 to destroy.</p>
          {applyLog.length > 0 && (
            <>
              <p className="t-dim">&nbsp;</p>
              <p className="t-cmd">$ terraform apply hire.tfplan</p>
              {applyLog.map((l, i) => (
                <p key={i} className={`t-${l.k}`}>{l.t || ' '}</p>
              ))}
            </>
          )}
        </div>
        <div className="tf-actions">
          {phase === 'plan' && (
            <>
              <button type="button" className="btn btn-primary" onClick={apply} data-magnetic data-cur="apply">Approve &amp; apply</button>
              <button type="button" className="btn btn-ghost" onClick={async () => { try { await navigator.clipboard.writeText(profile.email); toast('email copied'); } catch { toast(profile.email); } }}>
                skip, just copy email
              </button>
            </>
          )}
          {phase === 'applying' && <span className="mono t-dim">applying…</span>}
          {phase === 'done' && <button type="button" className="btn btn-ghost" onClick={reset}>plan again</button>}
        </div>
      </div>
      {phase === 'done' && (
        <div className="tf-out">
          <ContactLinks onCopy={(ok) => toast(ok ? 'email copied' : profile.email)} />
        </div>
      )}
    </div>
  );
}
