// pages.jsx — Login, Dashboard, Categories, Users, Profile

// ── Login Page ─────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!email || !pw) { setErr('กรุณากรอกอีเมลและรหัสผ่าน'); return; }
    setLoading(true);
    try {
      await API.auth.login(email, pw);
      onLogin();
    } catch (err) {
      setErr(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-aside">
        <div className="login-aside__brand">
          <BrandMark size={40}/>
          <div>
            <div className="login-aside__name">Dinopop Corn</div>
            <div className="login-aside__sub">Inventory · แจ้งวัฒนะ-ปากเกร็ด 19</div>
          </div>
        </div>
        <div className="login-aside__hero">
          <p className="login-aside__lede">ดูแลสต็อกร้าน<br/>ในที่เดียว</p>
          <p className="login-aside__body">
            ระบบจัดการวัตถุดิบและบรรจุภัณฑ์สำหรับทีมหลังร้าน
            — แจ้งเตือนของใกล้หมด อัปเดตจำนวนได้รวดเร็วในไม่กี่แตะ
          </p>
        </div>
        <div className="login-aside__deco" aria-hidden="true">
          {Array.from({ length: 28 }).map((_, i) => <i key={i}/>)}
        </div>
      </div>

      <div className="login-main">
        <form className="login-form" onSubmit={submit}>
          <div className="login-form__brand">
            <BrandMark size={36}/>
            <span>Dinopop Corn</span>
          </div>
          <h1 className="login-form__title">เข้าสู่ระบบ</h1>
          <p className="login-form__sub">ลงชื่อเข้าใช้เพื่อจัดการสต็อกของร้าน</p>

          {err && (
            <div className="form-msg form-msg--error">
              <I.Alert size={16}/> <span>{err}</span>
            </div>
          )}

          <Field label="อีเมล" required>
            <TextInput type="email" icon={<I.Mail size={16}/>}
                       value={email} placeholder="name@dinopop.co"
                       onChange={(e) => setEmail(e.target.value)}/>
          </Field>
          <Field label="รหัสผ่าน" required>
            <PasswordInput value={pw} placeholder="••••••••"
                           onChange={(e) => setPw(e.target.value)}/>
          </Field>

          <Button type="submit" variant="primary" size="lg" loading={loading}
                  className="login-form__submit">
            เข้าสู่ระบบ
          </Button>

          <p className="login-form__note">
            ต้องการบัญชีใหม่? ติดต่อผู้ดูแลระบบของร้าน
          </p>

        </form>
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function DashboardPage({ items, categories }) {
  const totalCount = items.length;
  const lowCount   = items.filter(it => it.qty <= it.min).length;
  const totalQty   = items.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="page">
      <PageHeader
        eyebrow="สาขาแจ้งวัฒนะ-ปากเกร็ด 19"
        title="แดชบอร์ด"
      />
      <div className="dash-summary">
        <SummaryCard icon={<I.Box size={20}/>} label="รายการทั้งหมด"
                     value={totalCount} hint={`${categories.length} ประเภท`}/>
        <SummaryCard icon={<I.Alert size={20}/>} tone={lowCount > 0 ? 'danger' : 'success'}
                     label="ของใกล้หมด" value={lowCount}
                     hint={lowCount > 0 ? 'ต้องสั่งเพิ่มภายในวันนี้' : 'ทุกอย่างพร้อมจำหน่าย'}/>
        <SummaryCard icon={<I.Sparkle size={20}/>} label="หน่วยคงเหลือรวม"
                     value={totalQty.toLocaleString('th-TH')}
                     hint="นับทุกหมวด"/>
      </div>
    </div>
  );
}

function StockPage({ items, categories, role, onAddItem, onEditItem,
                     onDeleteItem, onUpdateQty, onAdjustOne }) {
  const [q, setQ] = React.useState('');
  const [catFilter, setCatFilter] = React.useState('');
  const [editStockId, setEditStockId] = React.useState(null);
  const [scope, setScope] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'name', dir: 'asc' });

  const totalCount = items.length;
  const lowCount   = items.filter(it => it.qty <= it.min).length;
  const catMap     = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    return items
      .filter(it => !ql || it.name.toLowerCase().includes(ql))
      .filter(it => !catFilter || it.cat === catFilter)
      .filter(it => scope === 'all' || it.qty <= it.min)
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1;
        if (sort.key === 'name') return a.name.localeCompare(b.name, 'th') * dir;
        if (sort.key === 'qty')  return (a.qty - b.qty) * dir;
        return 0;
      });
  }, [items, q, catFilter, scope, sort]);

  const toggleSort = (key) => setSort(s =>
    s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });

  return (
    <div className="page">
      <PageHeader
        eyebrow="สาขาแจ้งวัฒนะ-ปากเกร็ด 19"
        title="สินค้า"
        subtitle={`${totalCount} รายการในระบบ`}
        actions={role === 'admin' && (
          <Button variant="primary" icon={<I.Plus size={16}/>} onClick={onAddItem}>
            เพิ่มรายการ
          </Button>
        )}
      />

      {/* Filter bar */}
      <Card className="filter-bar">
        <div className="filter-bar__search">
          <TextInput icon={<I.Search size={16}/>} value={q}
                     onChange={(e) => setQ(e.target.value)}
                     placeholder="ค้นหาชื่อรายการ…"/>
        </div>
        <div className="filter-bar__cat">
          <SelectInput value={catFilter} onChange={setCatFilter}
                       placeholder="ทุกประเภท"
                       options={categories.map(c => ({ value: c.id, label: c.name }))}/>
        </div>
        <div className="seg-tabs">
          <button className={`seg-tabs__btn ${scope === 'all' ? 'is-on' : ''}`}
                  onClick={() => setScope('all')}>
            ทั้งหมด <span className="seg-tabs__count">{totalCount}</span>
          </button>
          <button className={`seg-tabs__btn ${scope === 'low' ? 'is-on' : ''}`}
                  onClick={() => setScope('low')}>
            ใกล้หมด <span className="seg-tabs__count seg-tabs__count--danger">{lowCount}</span>
          </button>
        </div>
      </Card>

      {/* Table (desktop) */}
      <Card className="table-card hide-mobile">
        {filtered.length === 0 ? (
          <EmptyState icon={<I.Search size={28}/>}
                      title="ไม่พบรายการที่ตรงกับเงื่อนไข"
                      body="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง"/>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th className="th--sort" onClick={() => toggleSort('name')}>
                  ชื่อรายการ <SortIcon active={sort.key === 'name'} dir={sort.dir}/>
                </th>
                <th>ประเภท</th>
                <th className="th--sort th--right" onClick={() => toggleSort('qty')}>
                  จำนวน <SortIcon active={sort.key === 'qty'} dir={sort.dir}/>
                </th>
                <th className="th--right">ขั้นต่ำ</th>
                <th>สถานะ</th>
                <th className="th--right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(it => {
                const isLow = it.qty <= it.min;
                const ratio = Math.min(1, it.qty / Math.max(1, it.min * 2));
                return (
                  <tr key={it.id} className={isLow ? 'row--low' : ''}>
                    <td>
                      <div className="cell-item">
                        <span className="cell-item__dot" style={{
                          background: isLow ? 'var(--color-danger)' : 'var(--color-primary)'
                        }}/>
                        <span className="cell-item__name">{it.name}</span>
                      </div>
                    </td>
                    <td><span className="cell-cat">{catMap[it.cat] || '—'}</span></td>
                    <td className="td--right">
                      <div className="cell-qty">
                        <strong>{it.qty.toLocaleString('th-TH')}</strong>
                        <span className="cell-qty__unit">{it.unit}</span>
                      </div>
                      <div className="qty-bar">
                        <i style={{ width: `${ratio * 100}%`,
                                    background: isLow ? 'var(--color-danger)' : 'var(--color-primary)' }}/>
                      </div>
                    </td>
                    <td className="td--right td--muted">
                      {it.min} {it.unit}
                    </td>
                    <td>
                      {isLow
                        ? <Badge tone="danger" icon={<I.Alert size={12}/>}>ใกล้หมด</Badge>
                        : <Badge tone="success" icon={<I.Check size={12}/>}>ปกติ</Badge>}
                    </td>
                    <td className="td--right">
                      <div className="row-actions">
                        {editStockId === it.id ? (
                          <>
                            <button className="icon-btn" aria-label="ลดจำนวน"
                                    onClick={() => onAdjustOne(it.id, -1)}>
                              <I.Minus size={16}/>
                            </button>
                            <button className="icon-btn icon-btn--qty" aria-label="อัปเดตจำนวน"
                                    onClick={() => onUpdateQty(it)}>
                              {it.qty}
                            </button>
                            <button className="icon-btn" aria-label="เพิ่มจำนวน"
                                    onClick={() => onAdjustOne(it.id, +1)}>
                              <I.Plus size={16}/>
                            </button>
                            <button className="icon-btn icon-btn--done"
                                    onClick={() => setEditStockId(null)}
                                    aria-label="เสร็จสิ้น">
                              <I.Check size={16}/>
                            </button>
                          </>
                        ) : (
                          <button className="stock-edit-btn"
                                  onClick={() => setEditStockId(it.id)}>
                            <I.Edit size={14}/> แก้ไขสต็อก
                          </button>
                        )}
                        {role === 'admin' && (
                          <>
                            <span className="row-actions__sep"/>
                            <button className="icon-btn" aria-label="แก้ไขข้อมูล"
                                    onClick={() => onEditItem(it)}>
                              <I.Edit size={16}/>
                            </button>
                            <button className="icon-btn icon-btn--danger" aria-label="ลบ"
                                    onClick={() => onDeleteItem(it)}>
                              <I.Trash size={16}/>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Cards (mobile) */}
      <div className="mobile-list show-mobile">
        {filtered.length === 0 ? (
          <Card><EmptyState icon={<I.Search size={28}/>}
                            title="ไม่พบรายการ"
                            body="ลองเปลี่ยนคำค้นหา"/></Card>
        ) : filtered.map(it => {
          const isLow = it.qty <= it.min;
          return (
            <Card key={it.id} className={`item-card ${isLow ? 'item-card--low' : ''}`}>
              <div className="item-card__head">
                <div className="item-card__title">
                  <span className="item-card__name">{it.name}</span>
                  <span className="item-card__cat">{catMap[it.cat]}</span>
                </div>
                {isLow
                  ? <Badge tone="danger" icon={<I.Alert size={12}/>}>ใกล้หมด</Badge>
                  : <Badge tone="success" icon={<I.Check size={12}/>}>ปกติ</Badge>}
              </div>
              <div className="item-card__body">
                <div className="item-card__qty">
                  <span>{it.qty.toLocaleString('th-TH')}</span>
                  <small> {it.unit}</small>
                </div>
                <div className="item-card__min">ขั้นต่ำ {it.min} {it.unit}</div>
              </div>
              <div className="item-card__actions">
                <Button variant="primary" size="md" icon={<I.Plus size={16}/>}
                        className="item-card__primary"
                        onClick={() => onUpdateQty(it)}>
                  อัปเดตจำนวน
                </Button>
                {role === 'admin' && (
                  <>
                    <button className="icon-btn icon-btn--lg" onClick={() => onEditItem(it)}
                            aria-label="แก้ไข">
                      <I.Edit size={16}/>
                    </button>
                    <button className="icon-btn icon-btn--lg icon-btn--danger"
                            onClick={() => onDeleteItem(it)}
                            aria-label="ลบ">
                      <I.Trash size={16}/>
                    </button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, hint, tone = 'neutral' }) {
  return (
    <Card className={`summary-card summary-card--${tone}`}>
      <div className="summary-card__icon">{icon}</div>
      <div className="summary-card__body">
        <div className="summary-card__label">{label}</div>
        <div className="summary-card__value">{value}</div>
        {hint && <div className="summary-card__hint">{hint}</div>}
      </div>
    </Card>
  );
}

function SortIcon({ active, dir }) {
  return (
    <span className={`sort-icon ${active ? 'is-active' : ''}`}>
      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
        <path d="M5 1l3.5 4h-7L5 1Z" fill={active && dir === 'asc' ? 'currentColor' : 'rgba(0,0,0,.22)'}/>
        <path d="M5 13 1.5 9h7L5 13Z" fill={active && dir === 'desc' ? 'currentColor' : 'rgba(0,0,0,.22)'}/>
      </svg>
    </span>
  );
}

function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="page-header__eyebrow">{eyebrow}</div>}
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
}

// ── Categories Page ────────────────────────────────────────────────────────
function CategoriesPage({ categories, items, onAdd, onEdit, onDelete }) {
  const count = (catId) => items.filter(it => it.cat === catId).length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="การตั้งค่า"
        title="ประเภทสินค้า"
        subtitle="จัดกลุ่มรายการเพื่อค้นหาและกรองได้ง่ายขึ้น"
        actions={
          <Button variant="primary" icon={<I.Plus size={16}/>} onClick={() => onAdd()}>
            เพิ่มประเภท
          </Button>
        }
      />
      <Card className="table-card hide-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อประเภท</th>
              <th className="th--right">จำนวนรายการ</th>
              <th className="th--right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => {
              const n = count(c.id);
              const canDel = n === 0;
              return (
                <tr key={c.id}>
                  <td>
                    <div className="cell-item">
                      <span className="cell-item__dot" style={{ background: 'var(--color-primary)' }}/>
                      <span className="cell-item__name">{c.name}</span>
                    </div>
                  </td>
                  <td className="td--right">
                    <span className="count-pill">{n} รายการ</span>
                  </td>
                  <td className="td--right">
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => onEdit(c)} aria-label="แก้ไข">
                        <I.Edit size={16}/>
                      </button>
                      <button className={`icon-btn icon-btn--danger ${canDel ? '' : 'is-disabled'}`}
                              title={canDel ? 'ลบประเภท' : 'มีรายการในประเภทนี้ ลบไม่ได้'}
                              onClick={() => canDel && onDelete(c)}
                              aria-label="ลบ">
                        <I.Trash size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Mobile cards */}
      <div className="mobile-list show-mobile">
        {categories.map(c => {
          const n = count(c.id);
          const canDel = n === 0;
          return (
            <Card key={c.id} className="cat-card">
              <div className="cat-card__main">
                <div className="cat-card__title">
                  <span className="cell-item__dot" style={{ background: 'var(--color-primary)' }}/>
                  <span className="cat-card__name">{c.name}</span>
                </div>
                <span className="count-pill">{n} รายการ</span>
              </div>
              <div className="cat-card__actions">
                <Button variant="ghost" size="sm" icon={<I.Edit size={14}/>}
                        onClick={() => onEdit(c)}>แก้ไข</Button>
                <Button variant="ghost-danger" size="sm" icon={<I.Trash size={14}/>}
                        disabled={!canDel} onClick={() => canDel && onDelete(c)}>
                  {canDel ? 'ลบ' : 'มีสินค้าอยู่'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Users Page ─────────────────────────────────────────────────────────────
function UsersPage({ users, onAdd, onEdit, onDeactivate, onPermanentDelete }) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="การตั้งค่า"
        title="ผู้ใช้งานระบบ"
        subtitle={`${users.filter(u => u.active).length} บัญชีที่ใช้งานอยู่ จากทั้งหมด ${users.length} บัญชี`}
        actions={
          <Button variant="primary" icon={<I.Plus size={16}/>} onClick={onAdd}>
            เพิ่มผู้ใช้
          </Button>
        }
      />
      <Card className="table-card hide-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>ชื่อ-นามสกุล</th>
              <th>อีเมล</th>
              <th>เบอร์โทร</th>
              <th>Role</th>
              <th>วันที่สร้าง</th>
              <th>สถานะ</th>
              <th className="th--right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={u.active ? '' : 'row--dim'}>
                <td>
                  <div className="cell-user">
                    <span className="avatar">{u.firstName[0]}</span>
                    <span>
                      <span className="cell-user__name">{u.firstName} {u.lastName}</span>
                    </span>
                  </div>
                </td>
                <td className="td--muted">{u.email}</td>
                <td className="td--muted">{u.phone || '—'}</td>
                <td>
                  {u.role === 'admin'
                    ? <Badge tone="primary">Admin</Badge>
                    : <Badge tone="neutral">User</Badge>}
                </td>
                <td className="td--muted">{u.createdAt}</td>
                <td>
                  {u.active
                    ? <Badge tone="success">ใช้งานอยู่</Badge>
                    : <Badge tone="muted">ปิดบัญชีแล้ว</Badge>}
                </td>
                <td className="td--right">
                  <div className="row-actions">
                    {u.active ? (
                      <>
                        <button className="icon-btn" onClick={() => onEdit(u)} aria-label="แก้ไข">
                          <I.Edit size={16}/>
                        </button>
                        <button className="icon-btn icon-btn--danger"
                                onClick={() => onDeactivate(u)}
                                aria-label="ปิดบัญชี">
                          <I.Trash size={16}/>
                        </button>
                      </>
                    ) : (
                      <button className="icon-btn icon-btn--danger"
                              onClick={() => onPermanentDelete(u)}
                              title="ลบออกจากระบบถาวร"
                              aria-label="ลบถาวร">
                        <I.Trash size={16}/>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mobile-list show-mobile">
        {users.map(u => (
          <Card key={u.id} className="user-card">
            <div className="user-card__head">
              <span className="avatar avatar--lg">{u.firstName[0]}</span>
              <div className="user-card__title">
                <div className="user-card__name">{u.firstName} {u.lastName}</div>
                <div className="user-card__email">{u.email}</div>
              </div>
              {u.role === 'admin'
                ? <Badge tone="primary">Admin</Badge>
                : <Badge tone="neutral">User</Badge>}
            </div>
            <div className="user-card__meta">
              <span>{u.phone || '—'}</span>
              <span>{u.active ? 'ใช้งานอยู่' : 'ปิดบัญชี'}</span>
            </div>
            <div className="user-card__actions">
              {u.active ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(u)}
                          icon={<I.Edit size={14}/>}>แก้ไข</Button>
                  <Button variant="ghost-danger" size="sm" onClick={() => onDeactivate(u)}
                          icon={<I.Trash size={14}/>}>ปิดบัญชี</Button>
                </>
              ) : (
                <Button variant="ghost-danger" size="sm" onClick={() => onPermanentDelete(u)}
                        icon={<I.Trash size={14}/>}>ลบถาวร</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Profile Page ───────────────────────────────────────────────────────────
function ProfilePage({ me, onSaveProfile, onChangePassword, onDeactivateSelf }) {
  const [info, setInfo] = React.useState({
    firstName: me.firstName, lastName: me.lastName || '', phone: me.phone || ''
  });
  const [pw, setPw] = React.useState({ current: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = React.useState({});
  const [savingInfo, setSavingInfo] = React.useState(false);
  const [savingPw, setSavingPw] = React.useState(false);
  const [confirmDeac, setConfirmDeac] = React.useState(false);

  React.useEffect(() => {
    setInfo({ firstName: me.firstName, lastName: me.lastName || '', phone: me.phone || '' });
  }, [me]);

  const submitInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    await new Promise(r => setTimeout(r, 400));
    onSaveProfile(info);
    setSavingInfo(false);
  };

  const submitPw = async (e) => {
    e.preventDefault();
    const err = {};
    if (!pw.current) err.current = 'กรุณากรอกรหัสปัจจุบัน';
    if (!pw.next || pw.next.length < 6) err.next = 'อย่างน้อย 6 ตัวอักษร';
    if (pw.next !== pw.confirm) err.confirm = 'รหัสผ่านไม่ตรงกัน';
    setPwErr(err);
    if (Object.keys(err).length) return;
    setSavingPw(true);
    try {
      await onChangePassword(pw);
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwErr({ current: err.message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="บัญชีของฉัน"
        title="โปรไฟล์"
        subtitle="จัดการข้อมูลส่วนตัวและความปลอดภัยของบัญชี"
      />
      <div className="profile-grid">
        <Card className="profile-card">
          <div className="profile-card__head">
            <span className="avatar avatar--xl">{me.firstName[0]}</span>
            <div>
              <div className="profile-card__name">{me.firstName} {me.lastName}</div>
              <div className="profile-card__meta">{me.email}</div>
              <div className="profile-card__role">
                {me.role === 'admin'
                  ? <Badge tone="primary">ผู้ดูแลระบบ</Badge>
                  : <Badge tone="neutral">พนักงาน</Badge>}
              </div>
            </div>
          </div>
          <dl className="profile-card__list">
            <div><dt>เบอร์โทร</dt><dd>{me.phone || '—'}</dd></div>
            <div><dt>วันที่สร้าง</dt><dd>{me.createdAt}</dd></div>
          </dl>
        </Card>

        <Card className="profile-section">
          <header className="profile-section__head">
            <h3>ข้อมูลส่วนตัว</h3>
            <p>อัปเดตชื่อและเบอร์ติดต่อของคุณ</p>
          </header>
          <form className="form-grid" onSubmit={submitInfo}>
            <Field label="ชื่อ" required>
              <TextInput value={info.firstName}
                         onChange={(e) => setInfo({ ...info, firstName: e.target.value })}/>
            </Field>
            <Field label="นามสกุล">
              <TextInput value={info.lastName}
                         onChange={(e) => setInfo({ ...info, lastName: e.target.value })}/>
            </Field>
            <Field label="เบอร์โทร" className="col-2">
              <TextInput icon={<I.Phone size={16}/>} value={info.phone}
                         onChange={(e) => setInfo({ ...info, phone: e.target.value })}/>
            </Field>
            <div className="form-actions col-2">
              <Button type="submit" variant="primary" loading={savingInfo}>
                บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          </form>
        </Card>

        <Card className="profile-section">
          <header className="profile-section__head">
            <h3>เปลี่ยนรหัสผ่าน</h3>
            <p>ตั้งรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร</p>
          </header>
          <form className="form-grid" onSubmit={submitPw}>
            <Field label="รหัสผ่านปัจจุบัน" required error={pwErr.current} className="col-2">
              <PasswordInput value={pw.current}
                             onChange={(e) => setPw({ ...pw, current: e.target.value })}/>
            </Field>
            <Field label="รหัสผ่านใหม่" required error={pwErr.next}>
              <PasswordInput value={pw.next}
                             onChange={(e) => setPw({ ...pw, next: e.target.value })}/>
            </Field>
            <Field label="ยืนยันรหัสผ่านใหม่" required error={pwErr.confirm}>
              <PasswordInput value={pw.confirm}
                             onChange={(e) => setPw({ ...pw, confirm: e.target.value })}/>
            </Field>
            <div className="form-actions col-2">
              <Button type="submit" variant="primary" loading={savingPw}>
                เปลี่ยนรหัสผ่าน
              </Button>
            </div>
          </form>
        </Card>

        <Card className="profile-section profile-section--danger">
          <header className="profile-section__head">
            <h3>โซนอันตราย</h3>
            <p>การปิดบัญชีจะทำให้คุณเข้าใช้ระบบไม่ได้อีก</p>
          </header>
          <div className="profile-danger">
            <div>
              <strong>ปิดบัญชีของฉัน</strong>
              <p>ผู้ดูแลระบบสามารถเปิดบัญชีให้คุณใหม่ได้ภายหลัง</p>
            </div>
            <Button variant="ghost-danger" onClick={() => setConfirmDeac(true)}>
              ปิดบัญชี
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDeac}
        onClose={() => setConfirmDeac(false)}
        onConfirm={() => { setConfirmDeac(false); onDeactivateSelf(); }}
        title="ยืนยันการปิดบัญชี?"
        body={<>คุณกำลังปิดบัญชี <strong>{me.firstName} {me.lastName}</strong>.
                หลังจากนี้คุณจะออกจากระบบทันที</>}
        confirmLabel="ปิดบัญชี"
        danger
      />
    </div>
  );
}

Object.assign(window, {
  LoginPage, DashboardPage, CategoriesPage, UsersPage, ProfilePage,
  PageHeader, SummaryCard, SortIcon,
});
