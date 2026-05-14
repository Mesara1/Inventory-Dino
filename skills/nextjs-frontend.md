# Next.js Frontend Patterns

## Setup
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install @tanstack/react-query axios
```

## API Client
```typescript
// lib/api.ts
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1',
    withCredentials: true, // ส่ง cookie ไปด้วยทุก request
})

api.interceptors.response.use(
    res => res,
    err => {
        if (err.response?.status === 401) window.location.href = '/login'
        return Promise.reject(err)
    }
)

export default api
```

## React Query: Fetch Items
```typescript
// hooks/useItems.ts
export function useItems(params?: { category?: string; lowStock?: boolean }) {
    return useQuery({
        queryKey: ['items', params],
        queryFn: () => api.get('/items', { params }).then(r => r.data.data),
    })
}

export function useUpdateQuantity() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, delta }: { id: number; delta: number }) =>
            api.patch(`/items/${id}/quantity`, { delta }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
    })
}
```

## Low Stock Highlight Component
```typescript
// components/ItemRow.tsx
function ItemRow({ item }: { item: Item }) {
    const isLow = item.item_quantity <= item.min_quantity
    return (
        <tr className={isLow ? 'bg-red-50' : ''}>
            <td>{item.item_name}</td>
            <td className={isLow ? 'text-red-600 font-bold' : ''}>
                {item.item_quantity} {item.unit}
                {isLow && <span className="ml-2 text-xs text-red-500">⚠ ใกล้หมด</span>}
            </td>
        </tr>
    )
}
```

## Dashboard Summary Cards
```typescript
// components/DashboardStats.tsx
function DashboardStats({ items }: { items: Item[] }) {
    const total = items.length
    const lowStock = items.filter(i => i.item_quantity <= i.min_quantity).length
    return (
        <div className="grid grid-cols-2 gap-4">
            <StatCard label="รายการทั้งหมด" value={total} />
            <StatCard label="ของใกล้หมด" value={lowStock} highlight={lowStock > 0} />
        </div>
    )
}
```

## Form Validation Pattern
```typescript
// ใช้ react-hook-form + zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const itemSchema = z.object({
    item_name: z.string().min(1, 'กรุณากรอกชื่อ'),
    item_quantity: z.number().int().min(0, 'จำนวนต้องไม่ติดลบ'),
    unit: z.string().min(1, 'กรุณากรอกหน่วยนับ'),
    min_quantity: z.number().int().min(0),
    category_id: z.number().positive('กรุณาเลือกประเภท'),
})
```

## Folder Structure
```
frontend/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── dashboard/page.tsx
│   ├── items/page.tsx
│   └── layout.tsx
├── components/
│   ├── ui/          # reusable UI (Button, Modal, etc.)
│   └── items/       # item-specific components
├── hooks/           # React Query hooks
├── lib/             # api client, utils
└── middleware.ts    # route protection
```
