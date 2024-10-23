const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.resolve(__dirname, 'ukalia.db');
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Erro ao conectar ao banco de dados:', err);
                    reject(err);
                    return;
                }
                console.log('Conectado ao banco de dados SQLite');
                this.initialize()
                    .then(resolve)
                    .catch(reject);
            });
        });
    }

    async initialize() {
        const query = `
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                company TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;

        return new Promise((resolve, reject) => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Erro ao criar tabela:', err);
                    reject(err);
                    return;
                }
                console.log('Banco de dados inicializado com sucesso');
                resolve();
            });
        });
    }

    checkEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM participants WHERE LOWER(email) = LOWER(?)', [email], (err, row) => {
                if (err) reject(err);
                resolve(!!row);
            });
        });
    }

    addParticipant(participant) {
        return new Promise((resolve, reject) => {
            const { name, email, phone, company } = participant;
            this.db.run(
                'INSERT INTO participants (name, email, phone, company) VALUES (?, ?, ?, ?)',
                [name, email, phone, company],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    getAllParticipants() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT DISTINCT id, name, email, phone, company, created_at 
                 FROM participants 
                 GROUP BY email 
                 ORDER BY created_at DESC`, 
                [], 
                (err, rows) => {
                    if (err) {
                        console.error('Erro ao buscar participantes:', err);
                        reject(err);
                        return;
                    }
                    resolve(rows);
                }
            );
        });
    }

    getRandomParticipant() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM participants ORDER BY RANDOM() LIMIT 1', [], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    clearParticipants() {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM participants', [], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
}

const database = new Database();

module.exports = database;