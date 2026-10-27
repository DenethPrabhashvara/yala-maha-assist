// Creates an admin portal account from the command line (use it for the first super_admin;
// after that a super_admin can add accounts with POST /admin/auth/admins).
//
//   node scripts/create-admin.js <username> "<full name>" [officer|admin|super_admin]
//
// The password is asked for without echoing it, or read from ADMIN_PASSWORD if set.
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env'), quiet: true })
const db = require('../config/db.js')
const { ADMIN_ROLES, validatePassword, createAdmin } = require('../services/adminService.js')

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question)
    const stdin = process.stdin
    stdin.setRawMode?.(true)
    stdin.resume()
    stdin.setEncoding('utf8')
    let value = ''
    const onData = (char) => {
      if (char === '\r' || char === '\n' || char === '\u0004') {
        stdin.setRawMode?.(false)
        stdin.pause()
        stdin.off('data', onData)
        process.stdout.write('\n')
        resolve(value)
      } else if (char === '\u0003') {
        process.exit(1)
      } else if (char === '\u007f') {
        value = value.slice(0, -1)
      } else {
        value += char
      }
    }
    stdin.on('data', onData)
  })
}

async function main() {
  const [username, fullName, role = 'super_admin'] = process.argv.slice(2)
  if (!username || !fullName) {
    console.error('Usage: node scripts/create-admin.js <username> "<full name>" [officer|admin|super_admin]')
    process.exit(1)
  }
  if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username)) {
    console.error('username must be 3-40 letters, numbers, dots, dashes or underscores.')
    process.exit(1)
  }
  if (!ADMIN_ROLES.includes(role)) {
    console.error(`role must be one of: ${ADMIN_ROLES.join(', ')}`)
    process.exit(1)
  }

  const password = process.env.ADMIN_PASSWORD || await askHidden('Password: ')
  const problem = validatePassword(password)
  if (problem) {
    console.error(problem)
    process.exit(1)
  }
  if (!process.env.ADMIN_PASSWORD && password !== await askHidden('Repeat password: ')) {
    console.error('Passwords do not match.')
    process.exit(1)
  }

  try {
    const admin = await createAdmin({ username, password, full_name: fullName, role })
    console.log(`Created ${admin.role} '${admin.username}' (${admin.admin_id}).`)
  } catch (error) {
    console.error(error.code === '23505' ? `An admin called '${username}' already exists.` : error.message)
    process.exitCode = 1
  } finally {
    await db.pool.end()
  }
}

main()
