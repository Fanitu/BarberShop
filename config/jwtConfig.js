JWT_SECRET= "1e9c80d19d6b5f5ac2732fbdc1996ed508c3b5546c3aa2ea6c2ba2d18016c82ce1b0ed3d40743968d23ad2764cc9bd5ab31ba29e32fb5370aabf86499f4a0149"

JWT_REFRESH_SECRET="3ef069ecbc4dea1adf3c6c254845e7de79a992254c43b6ebdfb402810b7eb4c3d9e2b12583f22312d53e237fe7d6aeb6b670558ba22ff968307f2b09d7703f42"



module.exports = {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};