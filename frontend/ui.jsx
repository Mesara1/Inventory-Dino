// ui.jsx — Primitives: Button, Input, Select, Badge, Card, Modal, Toast.

// ── Button ─────────────────────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', icon, iconRight, children,
                  loading, disabled, type = 'button', onClick, className = '', ...rest }) {
  return (
    <button type={type} disabled={disabled || loading} onClick={onClick}
            className={`btn btn--${variant} btn--${size} ${className}`} {...rest}>
      {loading && <span className="btn__spinner" />}
      {!loading && icon && <span className="btn__icon">{icon}</span>}
      {children && <span className="btn__label">{children}</span>}
      {!loading && iconRight && <span className="btn__icon">{iconRight}</span>}
    </button>
  );
}

// ── Inputs ────────────────────────────────────────────────────────────────
function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <label className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <span className="field__label">
          {label}
          {required && <span className="field__req">*</span>}
        </span>
      )}
      {children}
      {error ? <span className="field__error">{error}</span>
             : hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

function TextInput({ icon, suffix, ...rest }) {
  return (
    <span className={`input ${icon ? 'input--has-icon' : ''}`}>
      {icon && <span className="input__icon">{icon}</span>}
      <input className="input__el" {...rest} />
      {suffix && <span className="input__suffix">{suffix}</span>}
    </span>
  );
}

function NumberInput(props) {
  return <TextInput type="number" inputMode="numeric" {...props} />;
}

function PasswordInput({ ...rest }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="input input--has-icon">
      <span className="input__icon"><I.Lock size={16}/></span>
      <input className="input__el" type={show ? 'text' : 'password'} {...rest}/>
      <button type="button" className="input__action"
              onClick={() => setShow(s => !s)} tabIndex={-1}
              aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>
        {show ? <I.EyeOff size={16}/> : <I.Eye size={16}/>}
      </button>
    </span>
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <span className="input input--select">
      <select className="input__el" value={value || ''}
              onChange={(e) => onChange(e.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="input__icon input__icon--right"><I.Chevron size={16}/></span>
    </span>
  );
}

// ── Badge / Pill ──────────────────────────────────────────────────────────
function Badge({ tone = 'neutral', children, icon }) {
  return (
    <span className={`badge badge--${tone}`}>
      {icon && <span className="badge__icon">{icon}</span>}
      {children}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────
function Card({ children, className = '', ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

// ── Modal ─────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, subtitle, children, footer, size = 'md',
                 closeOnBackdrop = true, tone }) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-root" onClick={(e) => closeOnBackdrop && e.target === e.currentTarget && onClose?.()}>
      <div className={`modal modal--${size} ${tone ? 'modal--' + tone : ''}`}
           role="dialog" aria-modal="true">
        <div className="modal__head">
          <div>
            {title && <h2 className="modal__title">{title}</h2>}
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="modal__close" onClick={onClose}
                  aria-label="ปิด"><I.X size={18}/></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
const ToastCtx = React.createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, tone: 'success', duration: 2600, ...toast };
    setToasts((cur) => [...cur, t]);
    setTimeout(() => setToasts((cur) => cur.filter(x => x.id !== id)), t.duration);
  }, []);
  const api = React.useMemo(() => ({
    success: (msg, opts) => push({ tone: 'success', msg, ...opts }),
    error:   (msg, opts) => push({ tone: 'error',   msg, ...opts }),
    info:    (msg, opts) => push({ tone: 'info',    msg, ...opts }),
  }), [push]);
  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.tone}`}>
            <span className="toast__icon">
              {t.tone === 'success' ? <I.Check size={16}/> :
               t.tone === 'error'   ? <I.Alert size={16}/> : <I.Bell size={16}/>}
            </span>
            <span className="toast__msg">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const useToast = () => React.useContext(ToastCtx);

// ── Confirmation helper (small wrapper) ───────────────────────────────────
function ConfirmDialog({ open, onClose, onConfirm, title, body, confirmLabel = 'ยืนยัน',
                          cancelLabel = 'ยกเลิก', danger, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
           tone={danger ? 'danger' : null}
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>{cancelLabel}</Button>
               <Button variant={danger ? 'danger' : 'primary'} loading={loading}
                       onClick={onConfirm}>{confirmLabel}</Button>
             </>
           }>
      {body}
    </Modal>
  );
}

// ── EmptyState ───────────────────────────────────────────────────────────
function EmptyState({ icon, title, body, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <p className="empty__title">{title}</p>
      {body && <p className="empty__body">{body}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}

Object.assign(window, {
  Button, Field, TextInput, NumberInput, PasswordInput, SelectInput,
  Badge, Card, Modal, ToastProvider, useToast, ConfirmDialog, EmptyState,
});
