// app.jsx — Shell + App root (connected to real API)

const NAV_ITEMS = [
  { key: 'dashboard',  label: 'แดชบอร์ด',     icon: I.Home,   roles: ['admin', 'user'] },
  { key: 'categories', label: 'ประเภทสินค้า', icon: I.Tag,    roles: ['admin'] },
  { key: 'users',      label: 'ผู้ใช้งาน',     icon: I.Users,  roles: ['admin'] },
  { key: 'profile',    label: 'โปรไฟล์',      icon: I.User,   roles: ['admin', 'user'] },
];

function Sidebar({ active, onNav, me, onLogout }) {
  const items = NAV_ITEMS.filter(n => n.roles.includes(me.role));
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <BrandMark size={32}/>
        <div className="sidebar__brand-text">
          <div className="sidebar__brand-name">Dinopop Corn</div>
          <div className="sidebar__brand-sub">Inventory</div>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="หลัก">
        {items.map(n => {
          const Ico = n.icon;
          const on = active === n.key;
          return (
            <button key={n.key} className={`navlink ${on ? 'is-on' : ''}`}
                    onClick={() => onNav(n.key)}>
              <span className="navlink__icon"><Ico size={18}/></span>
              <span className="navlink__label">{n.label}</span>
              {on && <span className="navlink__indicator" aria-hidden="true"/>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__foot">
        <button className="sidebar__user" onClick={() => onNav('profile')}>
          <span className="avatar">{me.firstName[0]}</span>
          <span className="sidebar__user-text">
            <span className="sidebar__user-name">{me.firstName} {me.lastName}</span>
            <span className="sidebar__user-role">
              {me.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
            </span>
          </span>
        </button>
        <button className="sidebar__logout" onClick={onLogout} aria-label="ออกจากระบบ">
          <I.Logout size={18}/>
        </button>
      </div>
    </aside>
  );
}

function BottomNav({ active, onNav, me }) {
  const items = NAV_ITEMS.filter(n => n.roles.includes(me.role));
  return (
    <nav className="bottomnav" aria-label="หลัก (มือถือ)">
      {items.map(n => {
        const Ico = n.icon;
        const on = active === n.key;
        return (
          <button key={n.key} className={`bottomnav__item ${on ? 'is-on' : ''}`}
                  onClick={() => onNav(n.key)}>
            <Ico size={20}/>
            <span>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ active, me, onLogout, onOpenMenu }) {
  const current = NAV_ITEMS.find(n => n.key === active);
  return (
    <div className="topbar show-mobile">
      <button className="topbar__menu" onClick={onOpenMenu} aria-label="เมนู">
        <I.Menu size={20}/>
      </button>
      <div className="topbar__title">
        <BrandMark size={22}/>
        <span>{current?.label || 'Dinopop Corn'}</span>
      </div>
      <button className="topbar__logout" onClick={onLogout} aria-label="ออกจากระบบ">
        <I.Logout size={18}/>
      </button>
    </div>
  );
}

// ── App root ───────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Auth state
  const [me, setMe]           = React.useState(null);
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [checking, setChecking] = React.useState(true); // initial auth check
  const [page, setPage]       = React.useState('dashboard');

  // Data state
  const [items,      setItems]      = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [users,      setUsers]      = React.useState([]);

  const toast = useToast();

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadItems      = () => API.items.list().then(setItems).catch(() => {});
  const loadCategories = () => API.categories.list().then(setCategories).catch(() => {});
  const loadUsers      = () => API.users.list().then(setUsers).catch(() => {});
  const loadAll        = () => Promise.all([loadItems(), loadCategories(), loadUsers()]);

  // ── Check session on mount ────────────────────────────────────────────────
  React.useEffect(() => {
    API.auth.me()
      .then(user => { setMe(user); setLoggedIn(true); return loadAll(); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  // ── Theme ─────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary',     t.primary);
    root.style.setProperty('--color-primary-ink', t.primaryInk);
    root.dataset.density = t.density;
  }, [t.primary, t.primaryInk, t.density]);

  // ── Page permission guard ─────────────────────────────────────────────────
  React.useEffect(() => {
    const allowed = NAV_ITEMS.find(n => n.key === page)?.roles.includes(me?.role);
    if (!allowed) setPage('dashboard');
  }, [me?.role, page]);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [itemModal,     setItemModal]     = React.useState({ open: false, mode: 'add', item: null });
  const [qtyModal,      setQtyModal]      = React.useState({ open: false, item: null });
  const [delModal,      setDelModal]      = React.useState({ open: false, item: null });
  const [catModal,      setCatModal]      = React.useState({ open: false, mode: 'add', category: null });
  const [delCatModal,   setDelCatModal]   = React.useState({ open: false, category: null });
  const [userModal,     setUserModal]     = React.useState({ open: false, mode: 'add', user: null });
  const [deacUserModal, setDeacUserModal] = React.useState({ open: false, user: null });
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const user = await API.auth.me();
    setMe(user);
    await loadAll();
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    try { await API.auth.logout(); } catch (_) {}
    toast.info('ออกจากระบบเรียบร้อย');
    setTimeout(() => { setLoggedIn(false); setMe(null); }, 400);
  };

  // ── Item handlers ─────────────────────────────────────────────────────────
  const handleAddItem  = () => setItemModal({ open: true, mode: 'add',  item: null });
  const handleEditItem = (item) => setItemModal({ open: true, mode: 'edit', item });

  const handleSaveItem = async (data) => {
    try {
      const payload = {
        item_name:     data.name,
        item_quantity: Number(data.qty),
        unit:          data.unit,
        min_quantity:  Number(data.min),
        category_id:   data.cat ? Number(data.cat) : null,
      };
      if (itemModal.mode === 'edit') {
        const updated = await API.items.update(Number(data.id), payload);
        setItems(s => s.map(x => x.id === updated.id ? updated : x));
        toast.success(`บันทึกการแก้ไข "${updated.name}" เรียบร้อย`);
      } else {
        const created = await API.items.create(payload);
        setItems(s => [...s, created]);
        toast.success(`เพิ่ม "${created.name}" เข้าระบบแล้ว`);
      }
      setItemModal({ open: false, mode: 'add', item: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateQty = (it) => setQtyModal({ open: true, item: it });

  const handleSaveQty = async (newQty) => {
    try {
      const delta   = newQty - qtyModal.item.qty;
      const updated = await API.items.updateQty(Number(qtyModal.item.id), delta);
      setItems(s => s.map(x => x.id === updated.id ? updated : x));
      toast.success(`อัปเดต "${updated.name}" คงเหลือ ${updated.qty} ${updated.unit}`);
      setQtyModal({ open: false, item: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAdjustOne = async (id, delta) => {
    try {
      const updated = await API.items.updateQty(Number(id), delta);
      setItems(s => s.map(x => x.id === updated.id ? updated : x));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteItem   = (it) => setDelModal({ open: true, item: it });
  const confirmDeleteItem  = async (password) => {
    await API.items.delete(Number(delModal.item.id), password); // throws on wrong pw → modal catches
    setItems(s => s.filter(x => x.id !== delModal.item.id));
    toast.success(`ลบ "${delModal.item.name}" เรียบร้อย`);
    setDelModal({ open: false, item: null });
  };

  // ── Category handlers ─────────────────────────────────────────────────────
  const handleAddCategory    = () => setCatModal({ open: true, mode: 'add', category: null });
  const handleEditCategory   = (c) => setCatModal({ open: true, mode: 'edit', category: c });

  const handleSaveCategory = async (c) => {
    try {
      if (catModal.mode === 'edit') {
        const updated = await API.categories.update(Number(c.id), c.name);
        setCategories(s => s.map(x => x.id === updated.id ? updated : x));
        toast.success('บันทึกประเภทเรียบร้อย');
      } else {
        const created = await API.categories.create(c.name);
        setCategories(s => [...s, created]);
        toast.success(`เพิ่ม "${c.name}" แล้ว`);
      }
      setCatModal({ open: false, mode: 'add', category: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory  = (c) => setDelCatModal({ open: true, category: c });
  const confirmDeleteCategory = async () => {
    try {
      await API.categories.delete(Number(delCatModal.category.id));
      setCategories(s => s.filter(x => x.id !== delCatModal.category.id));
      toast.success(`ลบประเภท "${delCatModal.category.name}"`);
      setDelCatModal({ open: false, category: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── User handlers ─────────────────────────────────────────────────────────
  const handleAddUser  = () => setUserModal({ open: true, mode: 'add',  user: null });
  const handleEditUser = (u) => setUserModal({ open: true, mode: 'edit', user: u });

  const handleSaveUser = async (u) => {
    try {
      if (userModal.mode === 'edit') {
        const updated = await API.users.update(Number(u.id), {
          firstname: u.firstName, lastname: u.lastName, tel: u.phone,
        });
        setUsers(s => s.map(x => x.id === updated.id ? updated : x));
        toast.success('บันทึกข้อมูลผู้ใช้เรียบร้อย');
      } else {
        const created = await API.users.create({
          username: u.email, password: u.password,
          firstname: u.firstName, lastname: u.lastName,
          tel: u.phone, role: u.role,
        });
        setUsers(s => [...s, created]);
        toast.success(`สร้างบัญชีของ ${u.firstName} แล้ว`);
      }
      setUserModal({ open: false, mode: 'add', user: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeactivateUser  = (u) => setDeacUserModal({ open: true, user: u });
  const confirmDeactivateUser = async () => {
    try {
      await API.users.deactivate(Number(deacUserModal.user.id));
      setUsers(s => s.map(x => x.id === deacUserModal.user.id ? { ...x, active: false } : x));
      toast.success(`ปิดบัญชี ${deacUserModal.user.firstName} แล้ว`);
      setDeacUserModal({ open: false, user: null });
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Profile handlers ──────────────────────────────────────────────────────
  const handleSaveProfile = async (info) => {
    const updated = await API.users.update(Number(me.id), {
      firstname: info.firstName, lastname: info.lastName, tel: info.phone,
    });
    setMe(updated);
    toast.success('บันทึกโปรไฟล์เรียบร้อย');
  };

  const handleChangePassword = async (pwData) => {
    await API.users.changePassword(Number(me.id), {
      current_password: pwData.current,
      new_password:     pwData.next,
    });
    toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
  };

  const handleDeactivateSelf = async () => {
    try {
      await API.users.deactivate(Number(me.id));
      toast.info('บัญชีของคุณถูกปิดเรียบร้อย ออกจากระบบ…');
      setTimeout(() => { setLoggedIn(false); setMe(null); }, 600);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (checking) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100vh', color: 'var(--color-text-muted)' }}>
        กำลังโหลด…
      </div>
    );
  }

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin}/>;
  }

  return (
    <div className="app" data-density={t.density}>
      <Sidebar active={page} onNav={setPage} me={me} onLogout={handleLogout}/>
      <TopBar  active={page} me={me} onLogout={handleLogout}
               onOpenMenu={() => setMobileMenuOpen(true)}/>

      <main className="main">
        <div className="main__inner">
          {page === 'dashboard' && (
            <DashboardPage
              items={items} categories={categories} role={me.role}
              onAddItem={handleAddItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onUpdateQty={handleUpdateQty}
              onAdjustOne={handleAdjustOne}/>
          )}
          {page === 'categories' && me.role === 'admin' && (
            <CategoriesPage
              categories={categories} items={items}
              onAdd={handleAddCategory}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}/>
          )}
          {page === 'users' && me.role === 'admin' && (
            <UsersPage
              users={users}
              onAdd={handleAddUser}
              onEdit={handleEditUser}
              onDeactivate={handleDeactivateUser}/>
          )}
          {page === 'profile' && (
            <ProfilePage
              me={me}
              onSaveProfile={handleSaveProfile}
              onChangePassword={handleChangePassword}
              onDeactivateSelf={handleDeactivateSelf}/>
          )}
        </div>
      </main>

      <BottomNav active={page} onNav={setPage} me={me}/>

      {mobileMenuOpen && (
        <div className="sheet-root" onClick={() => setMobileMenuOpen(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet__head">
              <BrandMark size={28}/>
              <span>Dinopop Corn</span>
              <button className="sheet__close" onClick={() => setMobileMenuOpen(false)}>
                <I.X size={18}/>
              </button>
            </div>
            <div className="sheet__user">
              <span className="avatar avatar--lg">{me.firstName[0]}</span>
              <div>
                <div className="sheet__name">{me.firstName} {me.lastName}</div>
                <div className="sheet__email">{me.email}</div>
              </div>
            </div>
            <button className="sheet__action"
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
              <I.Logout size={18}/> ออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ItemFormModal
        open={itemModal.open} mode={itemModal.mode} item={itemModal.item}
        categories={categories}
        existingNames={items.map(i => i.name.toLowerCase())}
        onClose={() => setItemModal({ open: false, mode: 'add', item: null })}
        onSave={handleSaveItem}/>
      <UpdateQtyModal
        open={qtyModal.open} item={qtyModal.item}
        onClose={() => setQtyModal({ open: false, item: null })}
        onSave={handleSaveQty}/>
      <DeleteItemModal
        open={delModal.open} item={delModal.item}
        onClose={() => setDelModal({ open: false, item: null })}
        onConfirm={confirmDeleteItem}/>
      <CategoryFormModal
        open={catModal.open} mode={catModal.mode} category={catModal.category}
        existingNames={categories.map(c => c.name.toLowerCase())}
        onClose={() => setCatModal({ open: false, mode: 'add', category: null })}
        onSave={handleSaveCategory}/>
      <ConfirmDialog
        open={delCatModal.open}
        onClose={() => setDelCatModal({ open: false, category: null })}
        onConfirm={confirmDeleteCategory}
        title="ลบประเภท?"
        body={<>คุณกำลังลบประเภท <strong>"{delCatModal.category?.name}"</strong></>}
        confirmLabel="ลบ"
        danger/>
      <UserFormModal
        open={userModal.open} mode={userModal.mode} user={userModal.user}
        existingEmails={users.map(u => u.email.toLowerCase())}
        onClose={() => setUserModal({ open: false, mode: 'add', user: null })}
        onSave={handleSaveUser}/>
      <ConfirmDialog
        open={deacUserModal.open}
        onClose={() => setDeacUserModal({ open: false, user: null })}
        onConfirm={confirmDeactivateUser}
        title="ปิดบัญชีผู้ใช้?"
        body={<>คุณกำลังปิดบัญชีของ <strong>{deacUserModal.user?.firstName} {deacUserModal.user?.lastName}</strong>
          ผู้ใช้รายนี้จะไม่สามารถเข้าสู่ระบบได้อีก</>}
        confirmLabel="ปิดบัญชี"
        danger/>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakColor label="สีหลัก" value={t.primary}
                      options={['#E5A12A','#E26A2C','#C04A3F','#0E7C66','#3F4A8A']}
                      onChange={(v) => setTweak({ primary: v, primaryInk: '#2a1f0d' })}/>
          <TweakRadio label="ความหนาแน่น" value={t.density}
                      options={['compact', 'regular', 'comfy']}
                      onChange={(v) => setTweak('density', v)}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function Root() {
  return (
    <ToastProvider>
      <App/>
    </ToastProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
