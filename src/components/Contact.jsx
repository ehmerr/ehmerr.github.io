import { profile } from '../data/profile.js';
import SecHead from './SecHead.jsx';
import { text } from '../data/profile.js';
import { fill } from '../data/content.js';

// 05 / CONTACT. `plan` is the terraform plan → apply flow (Step 8); until then the links show directly.
export default function Contact({ plan = null }) {
  return (
    <section id="contact" className="sec wrap" aria-labelledby="contact-title">
      <SecHead num="05" kicker={text.contact.kicker} title={text.contact.title} id="contact-title">
        {text.contact.intro ? fill(text.contact.intro, { openTo: profile.openTo.join(', '), openWhere: profile.openWhere, city: profile.city }) : null}
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
      {profile.phone && (
        <div className="reach-row">
          <a className="reach-phone mono" href={profile.phoneHref}>{profile.phone}</a>
        </div>
      )}
      <div className="hero-cta">
        <a className="btn btn-primary" href={`mailto:${profile.email}`}>Send an email</a>
        {profile.links.linkedin && <a className="btn btn-ghost" href={profile.links.linkedin} target="_blank" rel="noopener">LinkedIn</a>}
        {profile.links.github && <a className="btn btn-ghost" href={profile.links.github} target="_blank" rel="noopener">GitHub</a>}
        <a className="btn btn-ghost" href={profile.resume.href} target="_blank" rel="noopener">Resume</a>
      </div>
    </div>
  );
}
