const jwt = require('jsonwebtoken')
const db =require('../config/db.js')



const ADMIN_TOKEN_ROLE = 'admin-yalamaha'
const ADMIN_TOKEN_AUDIENCE = 'yalamaha-admin-portal'

// Checks the admin's Bearer access token, then that the session is still open and the account

async function requireAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'token not found' })
    }

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET, { audience: ADMIN_TOKEN_AUDIENCE })
    } catch {
        return res.status(401).json({ status: 'error', message: 'token invalid or expired' })
      }
    if (decoded.role !== ADMIN_TOKEN_ROLE || !decoded.sessionId) {
        return res.status(401).json({ status: 'error', message: 'token invalid or expired' })
    }

    try {
        const result = await db.query(
            `SELECT a.admin_id, a.username, a.full_name, a.role
             FROM admin_sessions s JOIN admins a ON a.admin_id = s.admin_id
             WHERE s.id = $1 AND s.admin_id = $2 AND s.revoked_at IS NULL AND s.expires_at > NOW() AND a.is_active`,
            [decoded.sessionId, decoded.sub]
        )
        if (!result.rows[0]) {
            return res.status(401).json({ status: 'error', message: 'session ended, sign in again' })
        }
        req.admin = result.rows[0]
        req.adminSessionId = decoded.sessionId
        return next()
    }catch(error){
        return next(error)
    }

}

// Use after requireAdmin: only these admins.role values may continue
function allowRoles(...roles) {
    return (req,res,next)=>{
        if (!roles.includes(req.admin?.role)) {
            return res.status(403).json({ status: 'fail', message: 'Your account is not allowed to do this.' })
          }
        return next()
    }
}

// admin and super_admin may change data; officers can only view
const canEdit = allowRoles('admin', 'super_admin')
const superAdminOnly = allowRoles('super_admin')

module.exports = { requireAdmin, allowRoles, canEdit, superAdminOnly, ADMIN_TOKEN_ROLE, ADMIN_TOKEN_AUDIENCE }
