var { expressjwt: jwt } = require("express-jwt");

module.exports.verify = function () {
   const SECRET = process.env.SECRET;
   const API = process.env.API_URL;

   return jwt({
      secret: SECRET,
      algorithms: ['HS256'],
      isRevoked: isRevoked
   }).unless({
      path: [
         { url: /\/api\/v1\/products(.*)/, methods: ['GET', 'OPTIONS'] },
         { url: /\/api\/v1\/categories(.*)/, methods: ['GET', 'OPTIONS'] },
         { url: /\/public\/uploads(.*)/, methods: ['GET', 'OPTIONS'] },
         `${API}/users/login`,
         `${API}/users/register`
      ]
   })
}

async function isRevoked(req, token) {
   if (!token.payload.isAdmin) {
     return true;
   }
 
   return false;
}