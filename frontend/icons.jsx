// icons.jsx — simple stroke icons (lucide-inspired but redrawn, no copy)
// All accept {size, className, style} and use currentColor.

const Icon = ({ children, size = 18, strokeWidth = 1.75, className = '', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round"
       className={className} style={style} aria-hidden="true">
    {children}
  </svg>
);

const I = {
  Home:    (p) => <Icon {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></Icon>,
  Box:     (p) => <Icon {...p}><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z"/><path d="M3 7.5 12 12l9-4.5"/><path d="M12 12v9"/></Icon>,
  Tag:     (p) => <Icon {...p}><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z"/><circle cx="8" cy="8" r="1.4"/></Icon>,
  Users:   (p) => <Icon {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20c1-3.5 3.5-5 6-5s5 1.5 6 5"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.4"/><path d="M21 19.5c-.6-2.4-2-3.7-3.7-4.3"/></Icon>,
  User:    (p) => <Icon {...p}><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20c1.2-3.5 4-5 7.5-5s6.3 1.5 7.5 5"/></Icon>,
  Logout:  (p) => <Icon {...p}><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M9 16l-4-4 4-4"/><path d="M5 12h11"/></Icon>,
  Plus:    (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Minus:   (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  Search:  (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></Icon>,
  Edit:    (p) => <Icon {...p}><path d="M4 20h4l10-10-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></Icon>,
  Trash:   (p) => <Icon {...p}><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7v13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7"/><path d="M10 11v6M14 11v6"/></Icon>,
  X:       (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18"/></Icon>,
  Alert:   (p) => <Icon {...p}><path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v5"/><circle cx="12" cy="17.5" r=".7" fill="currentColor" stroke="none"/></Icon>,
  Check:   (p) => <Icon {...p}><path d="m5 12.5 4.5 4.5L19 7"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>,
  Eye:     (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="2.8"/></Icon>,
  EyeOff:  (p) => <Icon {...p}><path d="M3 3l18 18"/><path d="M10.5 6.3A10 10 0 0 1 12 6c6.5 0 10 6 10 6a14 14 0 0 1-3 3.6"/><path d="M6.3 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.3 4.2-.8"/><path d="M9.6 9.7a3 3 0 0 0 4.2 4.2"/></Icon>,
  Filter:  (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5Z"/></Icon>,
  Sort:    (p) => <Icon {...p}><path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4M13 16l4 4 4-4"/></Icon>,
  Lock:    (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>,
  Mail:    (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></Icon>,
  Phone:   (p) => <Icon {...p}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></Icon>,
  Menu:    (p) => <Icon {...p}><path d="M3 6h18M3 12h18M3 18h18"/></Icon>,
  Sparkle: (p) => <Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></Icon>,
  Bell:    (p) => <Icon {...p}><path d="M6 17V11a6 6 0 1 1 12 0v6l2 2H4l2-2Z"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>,
  Wallet:  (p) => <Icon {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1h-2.5a3 3 0 0 0 0 6H19v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><circle cx="16.5" cy="11" r=".9" fill="currentColor" stroke="none"/></Icon>,
};

// Brand mark — original, simple geometric. A rounded "kettle" silhouette with
// three popcorn-kernel dots floating above. No likeness to any real brand.
function BrandMark({ size = 28, color }) {
  const c = color || 'var(--color-primary)';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {/* kettle */}
      <path d="M6 14h20l-2 13a2 2 0 0 1-2 1.6H10a2 2 0 0 1-2-1.6L6 14Z"
            fill={c}/>
      <path d="M6 14h20" stroke="rgba(0,0,0,.18)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* kernels above */}
      <circle cx="11"  cy="9"  r="3"   fill={c}/>
      <circle cx="17"  cy="6"  r="3.4" fill={c}/>
      <circle cx="23"  cy="9.5" r="2.6" fill={c}/>
      {/* highlight */}
      <path d="M9 17h2l.5 8h-2L9 17Z" fill="rgba(255,255,255,.5)"/>
    </svg>
  );
}

Object.assign(window, { Icon, I, BrandMark });
