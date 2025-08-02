const jwt = require('jsonwebtoken')

exports.allowResubmit = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    // console.log("No token provided"); // Debug log
    return res.status(401).json({ message: 'Akses ditolak.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded token:", decoded); // Debug log
    
    if (decoded.scope === 'resubmit' || decoded.status === 'rejected') {
      req.user = decoded;
      return next();
    }
    
    console.log("Invalid token scope"); // Debug log
    return res.status(403).json({ message: 'Akses terbatas' });
    
  } catch (err) {
    console.log("Token verification failed:", err.message); // Debug log
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};