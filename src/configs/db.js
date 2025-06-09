import mysql from 'mysql'
import dotenv from 'dotenv'

dotenv.config()

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error('Missing required database environment variables.');
}

const conn = mysql.createPool({
    connectionLimit: 100,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    waitForConnections: true,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    collate: 'utf8mb4_bin',
    dateStrings: [
        'DATE',
        'DATETIME'
    ]
})

conn.on('connection', (connection) => {
    connection.ping((err) => {
        if (err) console.error('Ping error:', err);
    });
});

conn.on('error', (err) => {
    console.error('Database connection error:', err);
});

process.on('SIGINT', () => {
    conn.end((err) => {
        if (err) console.error('Error closing the database connection pool:', err);
        else console.log('Database connection pool closed');
        process.exit(0);
    });
});

export default conn