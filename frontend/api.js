// api.js — Real API client + field mappers (UI format ↔ API format)

const API_BASE = '/api/v1';

async function apiFetch(path, opts = {}) {
  const { body, ...rest } = opts;
  const res = await fetch(API_BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'เกิดข้อผิดพลาด');
  return json.data;
}

// API response → UI format
function mapItem(d) {
  return {
    id:         String(d.item_id),
    name:       d.item_name,
    qty:        d.item_quantity,
    min:        d.min_quantity,
    unit:       d.unit,
    cat:        d.category_id ? String(d.category_id) : '',
    isLowStock: d.is_low_stock,
  };
}

function mapCategory(d) {
  return {
    id:   String(d.category_id),
    name: d.category_name,
  };
}

function mapUser(d) {
  return {
    id:        String(d.user_id),
    firstName: d.firstname || '',
    lastName:  d.lastname  || '',
    email:     d.username,
    phone:     d.tel       || '',
    role:      d.role,
    createdAt: d.created_at ? d.created_at.slice(0, 10) : '',
    active:    !d.deleted_at,
  };
}

const API = {
  auth: {
    login:  (username, password) =>
      apiFetch('/auth/login', { method: 'POST', body: { username, password } }),
    logout: () => apiFetch('/auth/logout', { method: 'POST' }),
    me:     () => apiFetch('/auth/me').then(mapUser),
  },

  items: {
    list: (params = {}) => {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== false)
      );
      const qs = new URLSearchParams(clean).toString();
      return apiFetch('/items' + (qs ? '?' + qs : '')).then(list => list.map(mapItem));
    },
    create:    (data)          => apiFetch('/items',                  { method: 'POST',  body: data }).then(mapItem),
    update:    (id, data)      => apiFetch(`/items/${id}`,            { method: 'PUT',   body: data }).then(mapItem),
    updateQty: (id, delta)     => apiFetch(`/items/${id}/quantity`,   { method: 'PATCH', body: { delta } }).then(mapItem),
    delete:    (id, password)  => apiFetch(`/items/${id}`,            { method: 'DELETE', body: { password } }),
  },

  categories: {
    list:   ()         => apiFetch('/categories').then(list => list.map(mapCategory)),
    create: (name)     => apiFetch('/categories',      { method: 'POST',   body: { category_name: name } }).then(mapCategory),
    update: (id, name) => apiFetch(`/categories/${id}`, { method: 'PUT',   body: { category_name: name } }).then(mapCategory),
    delete: (id)       => apiFetch(`/categories/${id}`, { method: 'DELETE' }),
  },

  users: {
    list:           ()         => apiFetch('/users').then(list => list.map(mapUser)),
    create:         (data)     => apiFetch('/users',             { method: 'POST',  body: data }).then(mapUser),
    update:         (id, data) => apiFetch(`/users/${id}`,       { method: 'PUT',   body: data }).then(mapUser),
    changePassword: (id, data) => apiFetch(`/users/${id}/password`, { method: 'PATCH', body: data }),
    deactivate:     (id)       => apiFetch(`/users/${id}`,       { method: 'DELETE' }),
  },
};

Object.assign(window, { API, mapItem, mapCategory, mapUser });
