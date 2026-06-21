// api.js — Real API client + field mappers (UI format ↔ API format)

// Dev (port 3000) → ชี้ไป backend โดยตรง (ใช้ hostname จริง รองรับ mobile บน LAN)
// Prod (port 80) → ผ่าน nginx
const API_BASE = window.location.port === '3000'
  ? `http://${window.location.hostname}:8080/api/v1`
  : '/api/v1';

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
    id:            String(d.item_id),
    name:          d.item_name,
    qty:           d.item_quantity,
    min:           d.min_quantity,
    unit:          d.unit,
    cat:           d.category_id ? String(d.category_id) : '',
    isLowStock:    d.is_low_stock,
    packagePrice:  d.package_price  ?? '',
    packageSizeG:  d.package_size_g ?? '',
  };
}

function mapCategory(d) {
  return {
    id:   String(d.category_id),
    name: d.category_name,
  };
}

function mapTransaction(d) {
  return {
    id:             String(d.transaction_id),
    date:           d.txn_date,
    type:           d.type,
    amount:         d.amount,
    paymentMethod:  d.payment_method,
    description:    d.description,
    handledBy:      d.handled_by || '',
    note:           d.note || '',
    runningBalance: d.running_balance,
  };
}

function mapRecipeIngredient(d) {
  return {
    id:              d.recipe_ingredient_id ? String(d.recipe_ingredient_id) : undefined,
    itemId:          String(d.item_id),
    itemName:        d.item ? d.item.item_name : '',
    quantityG:       d.quantity_g,
    unitCostPerGram: d.unit_cost_per_gram,
    lineCost:        d.line_cost,
  };
}

function mapRecipe(d) {
  return {
    id:              String(d.recipe_id),
    name:            d.name,
    bagsPerBatch:    d.bags_per_batch,
    salePricePerBag: d.sale_price_per_bag,
    ingredients:     (d.ingredients || []).map(mapRecipeIngredient),
    costPerBatch:    d.cost_per_batch,
    costPerBag:      d.cost_per_bag,
    profitPerBag:    d.profit_per_bag,
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

  transactions: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch('/transactions' + (qs ? '?' + qs : '')).then(res => ({
        items:   res.items.map(mapTransaction),
        summary: res.summary,
      }));
    },
    create: (data)         => apiFetch('/transactions',     { method: 'POST',   body: data }).then(mapTransaction),
    update: (id, data)     => apiFetch(`/transactions/${id}`, { method: 'PUT',   body: data }).then(mapTransaction),
    delete: (id, password) => apiFetch(`/transactions/${id}`, { method: 'DELETE', body: { password } }),
  },

  recipes: {
    list:   ()              => apiFetch('/recipes').then(list => list.map(mapRecipe)),
    create: (data)           => apiFetch('/recipes',      { method: 'POST',   body: data }).then(mapRecipe),
    update: (id, data)       => apiFetch(`/recipes/${id}`, { method: 'PUT',   body: data }).then(mapRecipe),
    delete: (id, password)   => apiFetch(`/recipes/${id}`, { method: 'DELETE', body: { password } }),
  },

  users: {
    list:           ()         => apiFetch('/users').then(list => list.map(mapUser)),
    create:         (data)     => apiFetch('/users',             { method: 'POST',  body: data }).then(mapUser),
    update:         (id, data) => apiFetch(`/users/${id}`,       { method: 'PUT',   body: data }).then(mapUser),
    changePassword: (id, data) => apiFetch(`/users/${id}/password`, { method: 'PATCH', body: data }),
    deactivate:        (id)            => apiFetch(`/users/${id}`,           { method: 'DELETE' }),
    permanentDelete:   (id, password)  => apiFetch(`/users/${id}/permanent`, { method: 'DELETE', body: { password } }),
  },
};

Object.assign(window, { API, mapItem, mapCategory, mapUser, mapTransaction, mapRecipe });
