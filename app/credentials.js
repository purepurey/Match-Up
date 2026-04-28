// ============================================
// แก้ตรงนี้เพื่อเพิ่ม / ลบ / เปลี่ยน user
// เพิ่ม object ใหม่ใน array เพื่อเพิ่ม user
// ============================================

export const VALID_USERS = [
  { email: 'demo@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'admin1234' },
  { email: '6731012625@student.chula.ac.th', password: 'T6aQ3ndX' },
  { email: '6731013225@student.chula.ac.th', password: '123456' },
]

// ฟังก์ชันเช็คว่า email + password ตรงกับ user ใน list ไหม
export function isValidLogin(email, password) {
  return VALID_USERS.some(
    (user) => user.email === email && user.password === password
  )
}
