const db =require('../config/db.js')
const bcrypt =require('bcryptjs')
const crypto = require('crypto')

const BCRYPT_ROUNDS = 12
const ADMIN_ROLES = ['officer', 'admin', 'super_admin']
const ADMIN_COLUMNS = 'admin_id, full_name, username, role, is_active, created_at, last_login_at'

// Compared against when the username doesn't exist, so a wrong username takes as long as a wrong password
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value || '')

function sameText(a, b) {
    const hashA = crypto.createHash('sha256').update(String(a)).digest()
    const hashB = crypto.createHash('sha256').update(String(b)).digest()
    return crypto.timingSafeEqual(hashA, hashB)
}

function validatePassword(password) {
    if (typeof password !== 'string' || password.length < 10) return 'Password must be at least 10 characters.'
    if (password.length > 72) return 'Password must be at most 72 characters.'   // bcrypt only uses the first 72 bytes
    return null
}

// The active admin with this username and password, or null.
// Accounts created before passwords were hashed are upgraded to bcrypt on their first sign-in.
async function verifyAdminLogin(username, password) {
    const result = await db.query(
        `SELECT ${ADMIN_COLUMNS}, password_hash FROM admins WHERE username = $1`,
        [username]
    )
    const admin = result.rows[0]
    if (!admin){
        await bcrypt.compare(password, DUMMY_HASH)
        return null
      }

    const { password_hash, ...publicAdmin } = admin
    let valid
    if (isBcryptHash(password_hash)) {
        valid = await bcrypt.compare(password, password_hash)
    }
    else {
        valid = sameText(password, password_hash)
        if (valid) {
            await db.query('UPDATE admins SET password_hash = $2 WHERE admin_id = $1', [admin.admin_id, await bcrypt.hash(password, BCRYPT_ROUNDS)])
        }
    }
    if (!valid || !admin.is_active) return null
    return publicAdmin
}

async function createAdmin({ username, password, full_name, role }) {
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const result = await db.query(
        `INSERT INTO admins (full_name, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING ${ADMIN_COLUMNS}`,
        [full_name, username, password_hash, role]
    )
    return result.rows[0]
}

async function changeAdminPassword(adminId, currentPassword, newPassword) {
    const result = await db.query('SELECT password_hash FROM admins WHERE admin_id = $1', [adminId])
    const stored = result.rows[0]?.password_hash
    if (!stored) return false
    const valid = isBcryptHash(stored) ? await bcrypt.compare(currentPassword, stored) : sameText(currentPassword, stored)
    if (!valid) return false
    await db.query('UPDATE admins SET password_hash = $2 WHERE admin_id = $1', [adminId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS)])
    return true
}



async function findAdminById(adminId){
    const result = await db.query(`SELECT ${ADMIN_COLUMNS} FROM admins WHERE admin_id = $1`, [adminId])
    return result.rows[0] || null
}

module.exports = {
    ADMIN_ROLES, ADMIN_COLUMNS, BCRYPT_ROUNDS,
    isBcryptHash, validatePassword, verifyAdminLogin, createAdmin, changeAdminPassword, findAdminById
}
