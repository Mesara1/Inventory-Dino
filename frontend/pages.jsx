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
// ── Dashboard constants & helpers ────────────────────────────────────────────
const CAT_PALETTE = ['#E5A12A','#6F9E6E','#5B8DB8','#C9603F','#9A7CB8','#3B7A9E','#B87A3B','#7A3BB8'];
const STATUS_META = {
  critical: { label: 'ใกล้หมด',  color: '#C0392B', bg: '#fff1f2' },
  warning:  { label: 'เหลือน้อย', color: '#D9912B', bg: '#fdf3e0' },
  ok:       { label: 'ปกติ',     color: '#3F8060', bg: '#f0fdf4' },
};

function itemStatus(it) {
  if (!it.min || it.min === 0) return 'ok';
  if (it.qty <= it.min) return 'critical';
  if (it.qty <= it.min * 1.5) return 'warning';
  return 'ok';
}

function useStats(items, categories) {
  return React.useMemo(() => {
    const catsWithColor = categories.map((c, i) => ({ ...c, color: CAT_PALETTE[i % CAT_PALETTE.length] }));
    const withStatus = items.map(it => ({ ...it, status: itemStatus(it) }));
    const counts = { critical: 0, warning: 0, ok: 0 };
    withStatus.forEach(it => counts[it.status]++);
    const totalUnits = items.reduce((s, it) => s + it.qty, 0);
    const byCat = catsWithColor.map(c => ({
      ...c,
      count: items.filter(it => it.cat === c.id).length,
    }));
    const critical = withStatus.filter(it => it.status === 'critical')
      .sort((a, b) => (a.qty / Math.max(a.min, 1)) - (b.qty / Math.max(b.min, 1)));
    return { withStatus, counts, totalUnits, byCat, critical };
  }, [items, categories]);
}

function thaiDate() {
  const d = new Date();
  const m = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function useChart(config, deps) {
  const ref  = React.useRef(null);
  const inst = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current || !window.Chart) return;
    if (inst.current) inst.current.destroy();
    inst.current = new Chart(ref.current, config);
    return () => { inst.current && inst.current.destroy(); };
  }, deps);
  return ref;
}

// ── Dashboard: Attention hero ─────────────────────────────────────────────────
function AttentionHero({ critical, onOpen }) {
  if (critical.length === 0) {
    return (
      <div className="attn attn--clear">
        <div className="attn__deco"/><div className="attn__deco2"/>
        <div className="attn__head">
          <span className="attn__icon"><I.Check size={20}/></span>
          <div>
            <div className="attn__title">สต็อกพร้อมจำหน่าย</div>
            <div className="attn__sub">ไม่มีรายการใกล้หมด ทุกอย่างเพียงพอ</div>
          </div>
        </div>
      </div>
    );
  }
  const shown = critical.slice(0, 3);
  const more  = critical.length - shown.length;
  return (
    <div className="attn attn--alert">
      <div className="attn__deco"/><div className="attn__deco2"/>
      <div className="attn__head">
        <span className="attn__icon"><I.Alert size={20}/></span>
        <div>
          <div className="attn__title">ต้องสั่งเพิ่มวันนี้</div>
          <div className="attn__sub">{critical.length} รายการใกล้หมดสต็อก</div>
        </div>
      </div>
      <div className="attn__list">
        {shown.map(it => (
          <div key={it.id} className="attn__row">
            <span className="attn__name">{it.name}</span>
            <span className="attn__qty">
              <I.Minus size={11}/> เหลือ {it.qty}/{it.min} {it.unit}
            </span>
          </div>
        ))}
      </div>
      <button className="attn__cta" onClick={onOpen}>
        {more > 0 ? `ดูทั้งหมด · อีก ${more} รายการ` : 'ดูรายละเอียดคลัง'} <I.ChevronRight size={16}/>
      </button>
    </div>
  );
}

// ── Dashboard: Hero widget ────────────────────────────────────────────────────
function HeroWidget({ stats, onOpen }) {
  const total = stats.counts.critical + stats.counts.warning + stats.counts.ok || 1;
  const segs  = [
    { k: 'ok', n: stats.counts.ok },
    { k: 'warning', n: stats.counts.warning },
    { k: 'critical', n: stats.counts.critical },
  ];
  return (
    <button className="wtile" onClick={onOpen} style={{ gridColumn: '1 / -1' }}>
      <div className="wtile__top">
        <span className="wtile__icon"><I.Box size={20}/></span>
        <span className="wtile__chev"><I.ChevronRight size={18}/></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="wtile__value">{stats.withStatus.length}</span>
        <span className="wtile__label">คลังสินค้า · {stats.totalUnits.toLocaleString('th-TH')} หน่วย</span>
      </div>
      <div style={{ marginTop: 4 }}>
        <div className="health__bar" style={{ height: 10 }}>
          {segs.filter(s => s.n > 0).map(s => (
            <div key={s.k} className="health__seg"
                 style={{ width: `${(s.n / total) * 100}%`, background: STATUS_META[s.k].color }}/>
          ))}
        </div>
        <div className="health__legend" style={{ marginTop: 9 }}>
          {['ok','warning','critical'].map(k => (
            <span key={k} className="health__leg" style={{ fontSize: 11.5 }}>
              <span className="health__dot" style={{ background: STATUS_META[k].color }}/>
              {STATUS_META[k].label} <b>{stats.counts[k]}</b>
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

// ── Detail: Donut chart ───────────────────────────────────────────────────────
function DonutChart({ byCat }) {
  const data  = byCat.filter(c => c.count > 0);
  const total = data.reduce((s, c) => s + c.count, 0);
  const ref   = useChart({
    type: 'doughnut',
    data: {
      labels: data.map(c => c.name),
      datasets: [{
        data: data.map(c => c.count),
        backgroundColor: data.map(c => c.color),
        borderColor: '#fff', borderWidth: 3, borderRadius: 4, hoverOffset: 6,
      }],
    },
    options: {
      cutout: '68%', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#2a2118', padding: 10, cornerRadius: 8,
          callbacks: { label: c => ` ${c.label}: ${c.raw} รายการ` },
        },
      },
    },
  }, [JSON.stringify(data.map(c => c.count))]);

  return (
    <div className="chartcard">
      <div className="chartcard__title">สัดส่วนตามประเภท</div>
      <div className="chartcard__sub">จำนวนรายการในแต่ละหมวด</div>
      <div className="donut-wrap">
        <canvas ref={ref}/>
        <div className="donut-center"><b>{total}</b><span>รายการ</span></div>
      </div>
      <div className="donut-legend">
        {data.map(c => (
          <div key={c.id} className="donut-leg">
            <span className="donut-leg__dot" style={{ background: c.color }}/>
            <span className="donut-leg__name">{c.name}</span>
            <span className="donut-leg__val">{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Detail: Watch bar chart ───────────────────────────────────────────────────
function WatchBarChart({ withStatus }) {
  const ranked = [...withStatus]
    .filter(it => it.min > 0)
    .sort((a, b) => (a.qty / a.min) - (b.qty / b.min))
    .slice(0, 8);

  const ref = useChart({
    type: 'bar',
    data: {
      labels: ranked.map(it => it.name),
      datasets: [{
        data: ranked.map(it => Math.round((it.qty / it.min) * 100)),
        backgroundColor: ranked.map(it => STATUS_META[it.status].color),
        borderRadius: 5, barThickness: 16,
      }],
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#2a2118', padding: 10, cornerRadius: 8,
          callbacks: {
            label: c => {
              const it = ranked[c.dataIndex];
              return ` ${it.qty}/${it.min} ${it.unit} (${c.raw}% ของขั้นต่ำ)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,.05)' },
          ticks: { callback: v => v + '%', font: { size: 10 } },
          suggestedMax: 200,
        },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  }, [JSON.stringify(ranked.map(it => it.qty))]);

  if (ranked.length === 0) return null;
  return (
    <div className="chartcard">
      <div className="chartcard__title">รายการต้องดูแล</div>
      <div className="chartcard__sub">% ของจำนวนคงเหลือเทียบกับขั้นต่ำ — ยิ่งสั้นยิ่งต้องสั่ง</div>
      <div className="hbar-wrap"><canvas ref={ref}/></div>
    </div>
  );
}

// ── Detail: Watch list ────────────────────────────────────────────────────────
function WatchList({ withStatus }) {
  const [filter, setFilter] = React.useState('attention');
  const filtered = React.useMemo(() => {
    let list = withStatus;
    if (filter === 'attention') list = withStatus.filter(it => it.status !== 'ok');
    else if (filter !== 'all')  list = withStatus.filter(it => it.status === filter);
    return [...list].sort((a, b) => (a.qty / Math.max(a.min, 1)) - (b.qty / Math.max(b.min, 1)));
  }, [withStatus, filter]);

  return (
    <div className="chartcard">
      <div className="chartcard__title" style={{ marginBottom: 12 }}>รายการสินค้า</div>
      <div className="seg-filter">
        {[['attention','ต้องดูแล'],['critical','ใกล้หมด'],['warning','เหลือน้อย'],['all','ทั้งหมด']].map(([k,l]) => (
          <button key={k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="watchlist">
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--ink-3)', fontSize:13 }}>
            ไม่มีรายการในกลุ่มนี้
          </div>
        )}
        {filtered.map(it => {
          const meta = STATUS_META[it.status];
          const pct  = Math.min(100, (it.qty / (Math.max(it.min, 1) * 2)) * 100);
          return (
            <div key={it.id} className="watchrow">
              <div className="watchrow__main">
                <div className="watchrow__name">{it.name}</div>
                <div className="watchrow__track">
                  <div className="watchrow__fill" style={{ width:`${pct}%`, background: meta.color }}/>
                </div>
              </div>
              <div className="watchrow__qty">
                <b style={{ color: it.status === 'critical' ? meta.color : 'inherit' }}>{it.qty}</b>
                <small>ขั้นต่ำ {it.min}</small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Detail: Warehouse ─────────────────────────────────────────────────────────
function WarehouseDetail({ stats, onBack, onNavStock }) {
  return (
    <div className="d-page-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="backhdr">
        <button className="backhdr__btn" onClick={onBack} aria-label="ย้อนกลับ">
          <I.Chevron size={20} style={{ transform:'rotate(90deg)' }}/>
        </button>
        <div>
          <div className="backhdr__title">คลังสินค้า</div>
          <div className="backhdr__sub">
            {stats.withStatus.length} รายการ · รวม {stats.totalUnits.toLocaleString('th-TH')} หน่วย
          </div>
        </div>
      </div>

      <div className="statpills">
        {['critical','warning','ok'].map(k => {
          const m = STATUS_META[k];
          return (
            <div key={k} className="statpill" style={{ background: m.bg, borderColor: m.color + '33' }}>
              <span className="statpill__num" style={{ color: m.color }}>{stats.counts[k]}</span>
              <span className="statpill__lbl" style={{ color: m.color }}>{m.label}</span>
            </div>
          );
        })}
      </div>

      <DonutChart byCat={stats.byCat}/>
      <WatchBarChart withStatus={stats.withStatus}/>
      <WatchList withStatus={stats.withStatus}/>

      {onNavStock && (
        <button className="attn__cta"
                style={{ background:'var(--color-primary)', color:'#fff', border:'none',
                         borderRadius:12, height:48, fontWeight:700, fontSize:15,
                         display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onClick={() => onNavStock('low')}>
          ไปอัปเดตสต็อก <I.ChevronRight size={16}/>
        </button>
      )}
    </div>
  );
}

// ── Dashboard widgets ─────────────────────────────────────────────────────────
// เพิ่ม widget ใหม่ (แบบ tile เล็ก) ที่ WIDGETS array นี้อย่างเดียว
const WIDGETS = [
  // ─── เพิ่ม tile widget ที่นี่ (size: 'tile') ──────────────────────────────
  // { id:'x', label:'ชื่อ', icon:(sz)=><I.Box size={sz}/>,
  //   value:(s)=>0, hint:(s)=>'', tone:(s)=>'neutral', detail:'warehouse' }
];

function DashboardPage({ items, categories, me, onNavStock }) {
  const [detail, setDetail] = React.useState(null);
  const stats = useStats(items, categories);

  if (detail === 'warehouse')
    return <WarehouseDetail stats={stats} onBack={() => setDetail(null)} onNavStock={onNavStock}/>;

  return (
    <div className="d-page-enter" style={{ display:'flex', flexDirection:'column', gap:14, padding:'0 0 8px' }}>
      <div className="d-greet">
        <div className="d-greet__eyebrow">สาขาแจ้งวัฒนะ-ปากเกร็ด 19</div>
        <div className="d-greet__title">สวัสดี, {me?.firstName || 'คุณ'} 👋</div>
        <div className="d-greet__sub">ภาพรวมสต็อกวันนี้ · {thaiDate()}</div>
      </div>

      <AttentionHero critical={stats.critical} onOpen={() => setDetail('warehouse')}/>

      <div className="d-section-label">วิดเจ็ต</div>
      <div className="wgrid">
        <HeroWidget stats={stats} onOpen={() => setDetail('warehouse')}/>
        {WIDGETS.map(w => (
          <button key={w.id} className={`wtile wtile--${w.tone(stats)}`}
                  onClick={() => setDetail(w.detail)}>
            <div className="wtile__top">
              <span className="wtile__icon">{w.icon(18)}</span>
              <span className="wtile__chev"><I.ChevronRight size={16}/></span>
            </div>
            <div className="wtile__value">{w.value(stats)}</div>
            <div className="wtile__label">{w.label}</div>
            <div className="wtile__hint">{w.hint(stats)}</div>
          </button>
        ))}
      </div>

      <div className="d-section-label">ตามประเภท</div>
      <div className="catchips">
        {stats.byCat.filter(c => c.count > 0).map(c => (
          <div key={c.id} className="catchip">
            <span className="catchip__dot" style={{ background: c.color }}/>
            {c.name} <b>{c.count}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockPage({ items, categories, role, onAddItem, onEditItem,
                     onDeleteItem, onUpdateQty, onAdjustOne, initialScope = 'all' }) {
  const [q, setQ] = React.useState('');
  const [catFilter, setCatFilter] = React.useState('');
  const [editStockId, setEditStockId] = React.useState(null);
  const [scope, setScope] = React.useState(initialScope);
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
