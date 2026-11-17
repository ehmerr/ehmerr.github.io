import { profile } from '../data/profile.js';
import SecHead from './SecHead.jsx';

// 05 / CONTACT. `plan` is the terraform plan → apply flow (Step 8); until then the links show directly.
export default function Contact({ plan = null }) {
  return (
    <section id="contact" className="sec wrap" aria-labelledby="contact-title">
      <SecHead num="05" kicker="CONTACT" title="Let's ship something." id="contact-title">
        Open to {profile.openTo.join(', ')} roles, {profile.openWhere}. Based in {profile.city}.
      </SecHead>
      {plan || <ContactLinks />}
    </section>
  );
}

export function ContactLinks({ onCopy }) {
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      onCopy?.(true);
    } catch {
      onCopy?.(false);
    }
  };
  return (
    <div className="reach">
      <div className="reach-row">
        <code className="reach-email mono">{profile.email}</code>
        <button type="button" className="btn btn-ghost" onClick={() => copy(profile.email)}>
          copy email
        </button>
      </div>
      <div className="reach-row">
        <a className="reach-phone mono" href={profile.phoneHref}>{profile.phone}</a>
      </div>
      <div className="hero-cta">
        <a className="btn btn-primary" href={`mailto:${profile.email}`}>Send an email</a>
        <a className="btn btn-ghost" href={profile.links.linkedin} target="_blank" rel="noopener">LinkedIn</a>
        <a className="btn btn-ghost" href={profile.links.github} target="_blank" rel="noopener">GitHub</a>
        <a className="btn btn-ghost" href={profile.resume.href} target="_blank" rel="noopener">Resume</a>
      </div>
    </div>
  );
}
