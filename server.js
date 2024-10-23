const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;
const QRCode = require('qrcode');

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

function validateParticipant(participant) {
  const errors = [];
  if (!participant.name) errors.push('Nome é obrigatório');
  if (!participant.email) errors.push('Email é obrigatório');
  if (!/\S+@\S+\.\S+/.test(participant.email)) errors.push('Email inválido');
  if (participant.phone && !/^\d{10,}$/.test(participant.phone)) errors.push('Telefone inválido');
  return errors;
}

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/register', (req, res) => {
  const { name, email, phone, company } = req.body;
  
  const errors = validateParticipant({ name, email, phone, company });
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  db.run('INSERT INTO participants (name, email, phone, company) VALUES (?, ?, ?, ?)', 
    [name, email, phone, company], 
    function(err) {
      if (err) {
        console.error('Erro ao inserir participante:', err.message);
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(409).json({ error: 'Este email já está cadastrado' });
        }
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
      res.status(201).json({ message: 'Cadastro realizado com sucesso', participant: { name, email, phone, company } });
    }
  );
});

app.get('/admin', (req, res) => {
  db.all('SELECT * FROM participants', [], (err, rows) => {
    if (err) {
      console.error('Erro ao recuperar participantes:', err.message);
      return res.status(500).render('error', { message: 'Erro ao recuperar participantes' });
    }
    res.render('admin', { participants: rows });
  });
});

app.post('/draw', (req, res) => {
  db.get('SELECT * FROM participants ORDER BY RANDOM() LIMIT 1', [], (err, row) => {
    if (err) {
      console.error('Erro ao realizar o sorteio:', err.message);
      return res.status(500).json({ error: 'Erro ao realizar o sorteio' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Nenhum participante encontrado para o sorteio' });
    }
    res.json(row);
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo deu errado!');
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

app.post('/clear-database', (req, res) => {
  db.run('DELETE FROM participants', [], (err) => {
    if (err) {
      console.error('Erro ao limpar o banco de dados:', err.message);
      return res.status(500).json({ error: 'Erro ao limpar o banco de dados' });
    }
    console.log('Banco de dados limpo com sucesso');
    res.json({ message: 'Banco de dados limpo com sucesso' });
  });
});

app.get('/print-qr', async (req, res) => {
  try {
      // Gere o URL completo para sua aplicação
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      
      // Gere o QR Code como uma string de dados URL
      const qrCodeDataUrl = await QRCode.toDataURL(baseUrl);
      
      // Renderize a página com o QR Code
      res.render('print-qr', { 
          qrCodeDataUrl,
          baseUrl
      });
  } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      res.status(500).send('Erro ao gerar QR Code');
  }
});