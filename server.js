const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const database = require('./database');
const QRCode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

// Configurações
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Validação
function validateParticipant(participant) {
    const errors = [];
    if (!participant.name) errors.push('Nome é obrigatório');
    if (!participant.email) errors.push('Email é obrigatório');
    if (!/\S+@\S+\.\S+/.test(participant.email)) errors.push('Email inválido');
    if (participant.phone && !/^\d{9}$/.test(participant.phone.replace(/\D/g, ''))) {
        errors.push('Telefone deve ter 9 dígitos');
    }
    return errors;
}

// Rotas
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/register', async (req, res) => {
    try {
        const participant = req.body;
        
        // Validação
        const errors = validateParticipant(participant);
        if (errors.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: errors.join(', ') 
            });
        }

        // Verifica email duplicado
        const emailExists = await database.checkEmail(participant.email);
        if (emailExists) {
            return res.status(200).json({
                success: false,
                error: 'Este email já está cadastrado'
            });
        }

        // Insere participante
        await database.addParticipant(participant);
        
        res.status(201).json({
            success: true,
            message: 'Cadastro realizado com sucesso! Boa sorte no sorteio!'
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

app.get('/admin', async (req, res) => {
    try {
        const participants = await database.getAllParticipants();
        res.render('admin', { participants });
    } catch (error) {
        console.error('Erro ao recuperar participantes:', error);
        res.status(500).render('error', { 
            message: 'Erro ao recuperar participantes' 
        });
    }
});

app.post('/draw', async (req, res) => {
    try {
        const winner = await database.getRandomParticipant();
        if (!winner) {
            return res.status(404).json({ 
                message: 'Nenhum participante encontrado para o sorteio' 
            });
        }
        res.json(winner);
    } catch (error) {
        console.error('Erro no sorteio:', error);
        res.status(500).json({ 
            error: 'Erro ao realizar o sorteio' 
        });
    }
});

app.post('/clear-database', async (req, res) => {
    try {
        await database.clearParticipants();
        res.json({ message: 'Banco de dados limpo com sucesso' });
    } catch (error) {
        console.error('Erro ao limpar banco de dados:', error);
        res.status(500).json({ 
            error: 'Erro ao limpar o banco de dados' 
        });
    }
});

// Inicialização
database.connect()
    .then(() => {
        app.listen(port, () => {
            console.log(`Servidor rodando em http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Erro ao inicializar o banco de dados:', err);
        process.exit(1);
    });