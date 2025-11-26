require('dotenv').config();

const config = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/backend_erp_lp',
    jwtSecret: process.env.JWT_SECRET || 'konfio_jwt_secret_key_2024',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    appName: process.env.APP_NAME || 'Backend ERP'
};

module.exports = config;