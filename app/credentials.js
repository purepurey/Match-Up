// ============================================
// แก้ตรงนี้เพื่อเพิ่ม / ลบ / เปลี่ยน user (built-in)
// เพิ่ม object ใหม่ใน array เพื่อเพิ่ม user
// ============================================

export const VALID_USERS = [
  { email: 'demo@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'admin1234' },
]

// อ่าน user ที่ผู้ใช้สมัครเองจาก localStorage
function getRegisteredUsers() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('registeredUsers') || '[]')
  } catch {
    return []
  }
}

// เช็คว่า email + password ตรงกับ user คนใดคนหนึ่ง (built-in หรือสมัครใหม่)
export function isValidLogin(email, password) {
  const all = [...VALID_USERS, ...getRegisteredUsers()]
  return all.some((u) => u.email === email && u.password === password)
}

// เช็คว่า email นี้มีคนใช้อยู่แล้วหรือยัง
export function emailExists(email) {
  const all = [...VALID_USERS, ...getRegisteredUsers()]
  return all.some((u) => u.email.toLowerCase() === email.toLowerCase())
}

// บันทึก user ใหม่ลง localStorage
export function registerUser(email, password) {
  if (typeof window === 'undefined') return false
  const existing = getRegisteredUsers()
  existing.push({ email, password })
  localStorage.setItem('registeredUsers', JSON.stringify(existing))
  return true
}
