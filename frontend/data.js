// data.js — mock data for the Dinopop Corn inventory prototype
// All in Thai because the system is Thai-language.

const CATEGORIES = [
  { id: 'c1', name: 'วัตถุดิบหลัก' },
  { id: 'c2', name: 'เครื่องปรุง' },
  { id: 'c3', name: 'บรรจุภัณฑ์' },
  { id: 'c4', name: 'อุปกรณ์ใช้ในร้าน' },
  { id: 'c5', name: 'เครื่องดื่ม' },
];

const ITEMS = [
  { id: 'i1',  name: 'เมล็ดข้าวโพดมัชรูม',    cat: 'c1', qty: 24,  min: 10, unit: 'กก.' },
  { id: 'i2',  name: 'เมล็ดข้าวโพดบัตเตอร์ฟลาย', cat: 'c1', qty: 4,  min: 8,  unit: 'กก.' },
  { id: 'i3',  name: 'น้ำมันมะพร้าวสกัดเย็น',   cat: 'c1', qty: 12,  min: 6,  unit: 'ลิตร' },
  { id: 'i4',  name: 'เนยจืดแผ่น',              cat: 'c1', qty: 7,   min: 5,  unit: 'แท่ง' },
  { id: 'i5',  name: 'น้ำตาลทรายขาว',           cat: 'c2', qty: 18,  min: 8,  unit: 'กก.' },
  { id: 'i6',  name: 'น้ำตาลทรายแดง',           cat: 'c2', qty: 3,   min: 5,  unit: 'กก.' },
  { id: 'i7',  name: 'ผงคาราเมลพรีเมียม',       cat: 'c2', qty: 2,   min: 4,  unit: 'ถุง' },
  { id: 'i8',  name: 'ผงโรยรสชีส',              cat: 'c2', qty: 9,   min: 3,  unit: 'ถุง' },
  { id: 'i9',  name: 'ผงสาหร่ายญี่ปุ่น',         cat: 'c2', qty: 6,   min: 3,  unit: 'ถุง' },
  { id: 'i10', name: 'เกลือสมุทรเม็ดเล็ก',       cat: 'c2', qty: 14,  min: 4,  unit: 'ถุง' },
  { id: 'i11', name: 'ถุงกระดาษไซส์ S',          cat: 'c3', qty: 320, min: 100, unit: 'ใบ' },
  { id: 'i12', name: 'ถุงกระดาษไซส์ M',          cat: 'c3', qty: 80,  min: 100, unit: 'ใบ' },
  { id: 'i13', name: 'ถุงกระดาษไซส์ L',          cat: 'c3', qty: 145, min: 80,  unit: 'ใบ' },
  { id: 'i14', name: 'กล่อง Bucket ตราร้าน',      cat: 'c3', qty: 56,  min: 30,  unit: 'ใบ' },
  { id: 'i15', name: 'สติกเกอร์ปิดปาก',          cat: 'c3', qty: 1100,min: 400, unit: 'ดวง' },
  { id: 'i16', name: 'ช้อนตวง 30ml',             cat: 'c4', qty: 12,  min: 6,   unit: 'ชิ้น' },
  { id: 'i17', name: 'ผ้าเช็ดมือไมโครไฟเบอร์',    cat: 'c4', qty: 22,  min: 10,  unit: 'ผืน' },
  { id: 'i18', name: 'หลอดกระดาษ',               cat: 'c3', qty: 450, min: 200, unit: 'ชิ้น' },
  { id: 'i19', name: 'น้ำเปล่าขวด 600ml',         cat: 'c5', qty: 38,  min: 24,  unit: 'ขวด' },
  { id: 'i20', name: 'โซดาขวดเล็ก',               cat: 'c5', qty: 5,   min: 12,  unit: 'ขวด' },
];

const USERS = [
  { id: 'u1', firstName: 'ปิยะ',    lastName: 'แสนสุข',   email: 'piya@dinopop.co',   phone: '081-234-5678', role: 'admin', createdAt: '2025-08-12', active: true },
  { id: 'u2', firstName: 'นภา',    lastName: 'จันทร์เพ็ญ', email: 'napha@dinopop.co', phone: '089-111-2233', role: 'user',  createdAt: '2025-09-03', active: true },
  { id: 'u3', firstName: 'ธีรพงศ์', lastName: 'กิจเจริญ',  email: 'theera@dinopop.co', phone: '092-555-6677', role: 'user',  createdAt: '2025-10-21', active: true },
  { id: 'u4', firstName: 'สุชาดา', lastName: 'พรหมเดช',   email: 'sucha@dinopop.co',  phone: '084-777-8899', role: 'user',  createdAt: '2026-01-15', active: true },
  { id: 'u5', firstName: 'อนันต์',  lastName: 'รุ่งเรือง',  email: 'anan@dinopop.co',   phone: '086-321-4521', role: 'user',  createdAt: '2026-02-09', active: false },
];

const ME = {
  admin: USERS[0],
  user:  USERS[1],
};

Object.assign(window, { CATEGORIES, ITEMS, USERS, ME });
