// modals.jsx — Item & User modals.

// ── Add / Edit Item ────────────────────────────────────────────────────────
function ItemFormModal({ open, mode, item, categories, onClose, onSave, existingNames = [] }) {
  const isEdit = mode === 'edit';
  const empty = { name: '', cat: categories[0]?.id || '', qty: 0, min: 0, unit: '' };
  const [form, setForm] = React.useState(empty);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(item ? { ...item } : empty);
      setErrors({});
      setSaving(false);
    }
    // eslint-disable-next-line
  }, [open, item]);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const setVal = (k) => (e) => set(k)(e.target.value);

  const validate = () => {
    const e = {};
    const trimmed = form.name.trim();
    if (!trimmed) e.name = 'กรุณากรอกชื่อรายการ';
    else if (existingNames.includes(trimmed.toLowerCase()) && trimmed.toLowerCase() !== (item?.name || '').toLowerCase())
      e.name = 'มีชื่อรายการนี้อยู่แล้ว';
    if (!form.cat) e.cat = 'กรุณาเลือกประเภท';
    if (form.qty === '' || form.qty < 0) e.qty = 'จำนวนต้องไม่ติดลบ';
    if (!form.unit?.trim()) e.unit = 'กรุณากรอกหน่วยนับ';
    if (form.min === '' || form.min < 0) e.min = 'จำนวนขั้นต่ำต้องไม่ติดลบ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 480));
    onSave({ ...form, name: form.name.trim(), unit: form.unit.trim(),
             qty: Number(form.qty), min: Number(form.min) });
  };

  return (
    <Modal open={open} onClose={onClose}
           title={isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการสินค้า'}
           subtitle={isEdit ? 'อัปเดตข้อมูลของรายการนี้' : 'กรอกรายละเอียดรายการใหม่ที่ต้องการเก็บสต็อก'}
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
               <Button variant="primary" loading={saving} onClick={submit}>
                 {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
               </Button>
             </>
           }>
      <form className="form-grid" onSubmit={submit}>
        <Field label="ชื่อรายการ" required error={errors.name} className="col-2">
          <TextInput value={form.name} onChange={setVal('name')}
                     placeholder="เช่น เมล็ดข้าวโพดมัชรูม" autoFocus/>
        </Field>
        <Field label="ประเภท" required error={errors.cat}>
          <SelectInput value={form.cat} onChange={set('cat')}
                       options={categories.map(c => ({ value: c.id, label: c.name }))}
                       placeholder="เลือกประเภท"/>
        </Field>
        <Field label="หน่วยนับ" required error={errors.unit} hint="เช่น ถุง / กก. / ใบ">
          <TextInput value={form.unit} onChange={setVal('unit')} placeholder="ถุง"/>
        </Field>
        <Field label={isEdit ? 'จำนวนปัจจุบัน' : 'จำนวนเริ่มต้น'} required error={errors.qty}>
          <NumberInput value={form.qty} onChange={setVal('qty')} min={0}
                       suffix={form.unit || 'หน่วย'}/>
        </Field>
        <Field label="แจ้งเตือนเมื่อต่ำกว่า" required error={errors.min}
               hint="ระบบจะติดป้าย “ใกล้หมด” เมื่อจำนวนลดถึงค่านี้">
          <NumberInput value={form.min} onChange={setVal('min')} min={0}
                       suffix={form.unit || 'หน่วย'}/>
        </Field>
      </form>
    </Modal>
  );
}

// ── Update Quantity ────────────────────────────────────────────────────────
function UpdateQtyModal({ open, item, onClose, onSave }) {
  const [delta, setDelta] = React.useState(0);
  const [mode, setMode] = React.useState('add'); // 'add' | 'sub'
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) { setDelta(0); setMode('add'); setError(''); setSaving(false); }
  }, [open]);

  if (!item) return null;
  const signed = (mode === 'add' ? 1 : -1) * Number(delta || 0);
  const next = (item.qty || 0) + signed;
  const invalid = next < 0;

  const submit = async () => {
    if (delta === 0 || delta === '') { setError('กรุณากรอกจำนวน'); return; }
    if (invalid) { setError('จำนวนคงเหลือต้องไม่ติดลบ'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 380));
    onSave(next);
  };

  return (
    <Modal open={open} onClose={onClose} size="sm"
           title="อัปเดตจำนวน"
           subtitle={item.name}
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
               <Button variant="primary" loading={saving} onClick={submit}
                       disabled={invalid || delta === 0 || delta === ''}>
                 ยืนยัน
               </Button>
             </>
           }>
        <div className="qty-modal">
          <div className="qty-modal__current">
            <span className="qty-modal__label">จำนวนปัจจุบัน</span>
            <span className="qty-modal__num">{item.qty}<small> {item.unit}</small></span>
          </div>
          <div className="qty-modal__mode">
            <button type="button" className={`qty-modal__mode-btn ${mode === 'add' ? 'is-on' : ''}`}
                    onClick={() => setMode('add')}>
              <I.Plus size={16}/> รับเข้า
            </button>
            <button type="button" className={`qty-modal__mode-btn ${mode === 'sub' ? 'is-on' : ''}`}
                    onClick={() => setMode('sub')}>
              <I.Minus size={16}/> เบิกออก
            </button>
          </div>
          <div className="qty-modal__pad">
            <button type="button" className="qty-modal__step"
                    onClick={() => setDelta(d => Math.max(0, Number(d || 0) - 1))}>
              <I.Minus size={18}/>
            </button>
            <input className="qty-modal__input" type="number" inputMode="numeric"
                   value={delta} onChange={(e) => { setDelta(e.target.value); setError(''); }}/>
            <button type="button" className="qty-modal__step"
                    onClick={() => setDelta(d => Number(d || 0) + 1)}>
              <I.Plus size={18}/>
            </button>
          </div>
          <div className="qty-modal__quick">
            {[1, 5, 10, 50].map(n => (
              <button key={n} type="button" className="qty-modal__chip"
                      onClick={() => setDelta(d => Number(d || 0) + n)}>+{n}</button>
            ))}
          </div>
          <div className={`qty-modal__result ${invalid ? 'is-bad' : ''}`}>
            <span>คงเหลือใหม่</span>
            <strong>{next} <small>{item.unit}</small></strong>
          </div>
          {error && <div className="form-msg form-msg--error">{error}</div>}
        </div>
    </Modal>
  );
}

// ── Delete Item ────────────────────────────────────────────────────────────
function DeleteItemModal({ open, item, onClose, onConfirm }) {
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { if (open) { setPw(''); setErr(''); setLoading(false); } }, [open]);

  const submit = async () => {
    if (!pw) { setErr('กรุณายืนยันด้วยรหัสผ่าน'); return; }
    setLoading(true);
    try {
      await onConfirm(pw);
    } catch (e) {
      setErr(e.message || 'รหัสผ่านไม่ถูกต้อง');
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" tone="danger"
           title="ยืนยันการลบรายการ"
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
               <Button variant="danger" loading={loading} onClick={submit}>ลบรายการ</Button>
             </>
           }>
      <div className="confirm">
        <div className="confirm__icon"><I.Alert size={22}/></div>
        <p className="confirm__msg">
          คุณกำลังลบรายการ <strong>“{item?.name}”</strong> ออกจากระบบ
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
      </div>
      <Field label="ยืนยันรหัสผ่านผู้ดูแล" error={err} required>
        <PasswordInput value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }}
                       placeholder="รหัสผ่านบัญชี Admin"/>
      </Field>
    </Modal>
  );
}

// ── Add / Edit User ────────────────────────────────────────────────────────
function UserFormModal({ open, mode, user, onClose, onSave, existingEmails = [] }) {
  const isEdit = mode === 'edit';
  const empty = { firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user' };
  const [form, setForm] = React.useState(empty);
  const [errors, setErrors] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(user ? { ...user, password: '' } : empty);
      setErrors({});
      setSaving(false);
    }
  }, [open, user]);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const setVal = (k) => (e) => set(k)(e.target.value);

  const validate = () => {
    const e = {};
    if (!form.firstName?.trim()) e.firstName = 'กรุณากรอกชื่อ';
    if (!isEdit) {
      if (!form.email?.trim()) e.email = 'กรุณากรอกอีเมล';
      else if (existingEmails.includes(form.email.trim().toLowerCase()))
        e.email = 'มีอีเมลนี้ในระบบแล้ว';
      if (!form.password || form.password.length < 6) e.password = 'อย่างน้อย 6 ตัวอักษร';
      if (!form.role) e.role = 'เลือก Role';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 480));
    onSave({ ...form,
             firstName: form.firstName.trim(),
             lastName: (form.lastName || '').trim(),
             email: form.email.trim(),
             phone: (form.phone || '').trim() });
  };

  return (
    <Modal open={open} onClose={onClose}
           title={isEdit ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งาน'}
           subtitle={isEdit ? 'อีเมลและ Role ไม่สามารถแก้ไขผ่านหน้านี้'
                            : 'กรอกข้อมูลพนักงานที่ต้องการให้เข้าใช้ระบบ'}
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
               <Button variant="primary" loading={saving} onClick={submit}>
                 {isEdit ? 'บันทึก' : 'สร้างบัญชี'}
               </Button>
             </>
           }>
      <form className="form-grid" onSubmit={submit}>
        <Field label="ชื่อ" required error={errors.firstName}>
          <TextInput value={form.firstName} onChange={setVal('firstName')} autoFocus/>
        </Field>
        <Field label="นามสกุล">
          <TextInput value={form.lastName} onChange={setVal('lastName')}/>
        </Field>
        <Field label="อีเมล" required={!isEdit} error={errors.email} className="col-2">
          <TextInput type="email" icon={<I.Mail size={16}/>}
                     value={form.email} onChange={setVal('email')}
                     disabled={isEdit}
                     placeholder="name@dinopop.co"/>
        </Field>
        <Field label="เบอร์โทรศัพท์">
          <TextInput icon={<I.Phone size={16}/>}
                     value={form.phone} onChange={setVal('phone')}
                     placeholder="08x-xxx-xxxx"/>
        </Field>
        {!isEdit && (
          <Field label="Role" required error={errors.role}>
            <SelectInput value={form.role} onChange={set('role')}
                         options={[{ value: 'user', label: 'พนักงาน (User)' },
                                   { value: 'admin', label: 'ผู้ดูแลระบบ (Admin)' }]}/>
          </Field>
        )}
        {!isEdit && (
          <Field label="รหัสผ่าน" required error={errors.password}
                 hint="อย่างน้อย 6 ตัวอักษร" className="col-2">
            <PasswordInput value={form.password} onChange={setVal('password')}/>
          </Field>
        )}
      </form>
    </Modal>
  );
}

// ── Add / Edit Category (small modal) ──────────────────────────────────────
function CategoryFormModal({ open, mode, category, onClose, onSave, existingNames = [] }) {
  const isEdit = mode === 'edit';
  const [name, setName] = React.useState('');
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) { setName(category?.name || ''); setErr(''); setSaving(false); }
  }, [open, category]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return setErr('กรุณากรอกชื่อประเภท');
    if (existingNames.includes(trimmed.toLowerCase()) &&
        trimmed.toLowerCase() !== (category?.name || '').toLowerCase())
      return setErr('มีประเภทนี้อยู่แล้ว');
    setSaving(true);
    await new Promise(r => setTimeout(r, 320));
    onSave({ ...(category || {}), name: trimmed });
  };

  return (
    <Modal open={open} onClose={onClose} size="sm"
           title={isEdit ? 'แก้ไขประเภท' : 'เพิ่มประเภทใหม่'}
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
               <Button variant="primary" loading={saving} onClick={submit}>
                 {isEdit ? 'บันทึก' : 'เพิ่ม'}
               </Button>
             </>
           }>
      <Field label="ชื่อประเภท" required error={err}>
        <TextInput value={name} onChange={(e) => { setName(e.target.value); setErr(''); }}
                   placeholder="เช่น วัตถุดิบหลัก" autoFocus/>
      </Field>
    </Modal>
  );
}

function PermanentDeleteUserModal({ open, user, onClose, onConfirm }) {
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => { if (open) { setPw(''); setErr(''); setLoading(false); } }, [open]);

  const submit = async () => {
    if (!pw) { setErr('กรุณายืนยันด้วยรหัสผ่าน'); return; }
    setLoading(true);
    try {
      await onConfirm(pw);
    } catch (e) {
      setErr(e.message || 'รหัสผ่านไม่ถูกต้อง');
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="sm" tone="danger"
           title="ลบบัญชีถาวร"
           footer={
             <>
               <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
               <Button variant="danger" loading={loading} onClick={submit}>ลบถาวร</Button>
             </>
           }>
      <div className="confirm">
        <div className="confirm__icon"><I.Alert size={22}/></div>
        <p className="confirm__msg">
          คุณกำลังลบบัญชี <strong>"{user?.firstName} {user?.lastName}"</strong> ออกจากระบบถาวร
          ข้อมูลทั้งหมดจะหายไปและไม่สามารถกู้คืนได้
        </p>
      </div>
      <Field label="ยืนยันรหัสผ่านผู้ดูแล" error={err} required>
        <PasswordInput value={pw} onChange={(e) => { setPw(e.target.value); setErr(''); }}
                       placeholder="รหัสผ่านบัญชี Admin"/>
      </Field>
    </Modal>
  );
}

Object.assign(window, {
  ItemFormModal, UpdateQtyModal, DeleteItemModal,
  UserFormModal, CategoryFormModal, PermanentDeleteUserModal,
});
