const jwt = require('jsonwebtoken')

const authenticate = async (req, res, next) => {
  try {
    let token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' })
  }
}

module.exports = authenticate