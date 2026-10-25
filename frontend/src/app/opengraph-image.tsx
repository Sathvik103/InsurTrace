import { ImageResponse } from 'next/og';

export const alt = 'ClearClaim: know if a car insurance claim is worth it';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: 'linear-gradient(135deg, #141310 0%, #27241e 60%, #264f3a 100%)', color: 'white', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 40, fontWeight: 700 }}>
          <svg width="64" height="64" viewBox="0 0 40 40"><rect x="1" y="1" width="38" height="38" rx="11" fill="#1c1a16" stroke="#56906d" strokeWidth="1" /><path d="M27.5 12.6A10.5 10.5 0 1 0 29.8 24" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" fill="none" /><path d="M15.5 20.2l3.6 3.6 9.2-9.6" stroke="#56906d" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
          ClearClaim
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>Had a dent or a scrape? Know if claiming is worth it.</div>
          <div style={{ fontSize: 30, color: '#aecdb9' }}>Insurer payout, your cost and No-Claim Bonus impact, line by line. Free.</div>
        </div>
      </div>
    ),
    size
  );
}
