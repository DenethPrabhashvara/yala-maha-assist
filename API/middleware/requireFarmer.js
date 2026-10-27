const jwt = require('jsonwebtoken')

// Checks the farmer's Bearer access token and puts their id on req.farmerId
function requireFarmer(req, res, next) {
    const token = req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(401).json({ status: "error", message: "token not found" })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.farmerId = decoded.id
        req.sessionId = decoded.sessionId
        return next()
    } catch {
        return res.status(401).json({ status: "error", message: "token invalid or expired" })
    }
}

module.exports = requireFarmer
