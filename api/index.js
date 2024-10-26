const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const moment = require('moment');
const xss = require('xss'); // Proteção contra injeção de código

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com o MongoDB Atlas
async function conectarMongoDB() {
    try {
        await mongoose.connect('mongodb+srv://suportepontovp:kUHEzvMWrjlnqWH9@pontobeta.1rtcv.mongodb.net/?retryWrites=true&w=majority&appName=PontoBeta');
        console.log('Conectado ao MongoDB Atlas');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err);
        process.exit(1); // Encerra o servidor se não conectar
    }
}

conectarMongoDB();

// Definição do esquema de ponto
const pontoSchema = new mongoose.Schema({
    Nome: { type: String, required: true },
    Data: { type: Date, required: true },
    Categoria: { type: String, required: true },
    Entrada: String,
    'Café 1': String,
    'Retorno Café 1': String,
    Almoço: String,
    'Retorno Almoço': String,
    'Café 2': String,
    'Retorno Café 2': String,
    Saída: String
});

const Ponto = mongoose.model('Ponto', pontoSchema);

app.use(cors({
    origin: 'https://meu-frontend.vercel.app', // Substitua pela URL do seu frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
}));
app.use(express.json());

// Função para calcular horas trabalhadas
const calcularHorasTrabalhadas = (ponto) => {
    const entrada = moment(ponto.Entrada, 'HH:mm');
    const saida = moment(ponto.Saída, 'HH:mm');
    const retornoCafé1 = moment(ponto['Retorno Café 1'], 'HH:mm');
    const café1 = moment(ponto['Café 1'], 'HH:mm');
    const retornoAlmoço = moment(ponto['Retorno Almoço'], 'HH:mm');
    const almoço = moment(ponto.Almoço, 'HH:mm');
    const retornoCafé2 = moment(ponto['Retorno Café 2'], 'HH:mm');
    const café2 = moment(ponto['Café 2'], 'HH:mm');

    let totalHoras = moment.duration(saida.diff(entrada)).asHours();

    if (ponto.Categoria === 'CLT') {
        totalHoras -= moment.duration(retornoCafé1.diff(café1)).asHours();
        totalHoras -= moment.duration(retornoAlmoço.diff(almoço)).asHours();
        totalHoras -= moment.duration(retornoCafé2.diff(café2)).asHours();
    } else if (ponto.Categoria === 'Estagiário') {
        totalHoras -= moment.duration(retornoCafé1.diff(café1)).asHours();
        totalHoras -= moment.duration(retornoAlmoço.diff(almoço)).asHours();
    }

    return totalHoras.toFixed(2);
};

// Endpoint para buscar pontos
app.get('/pontos', async (req, res) => {
    try {
        const pontos = await Ponto.find();
        const pontosComHoras = pontos.map(ponto => ({
            ...ponto.toObject(),
            HorasTrabalhadas: calcularHorasTrabalhadas(ponto)
        }));
        res.json(pontosComHoras);
    } catch (error) {
        console.error('Erro ao buscar pontos:', error);
        res.status(500).json({ error: 'Erro ao buscar pontos' });
    }
});

// Endpoint para registrar um novo ponto
app.post('/pontos', async (req, res) => {
    const { nome, categoria, tipo, data, hora } = req.body;

    // Sanitização de entradas para evitar injeção
    const nomeSeguro = xss(nome);
    const categoriaSegura = xss(categoria);
    const tipoSeguro = xss(tipo);
    const dataSegura = xss(data);
    const horaSegura = xss(hora);

    if (!nomeSeguro || !categoriaSegura || !tipoSeguro || !dataSegura || !horaSegura) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    try {
        const dataConvertida = moment(dataSegura, "DD/MM/YYYY").toDate();
        let pontoExistente = await Ponto.findOne({ Nome: nomeSeguro, Data: dataConvertida });

        if (pontoExistente) {
            pontoExistente[tipoSeguro] = horaSegura;
            await pontoExistente.save();
        } else {
            const novoPonto = new Ponto({
                Nome: nomeSeguro,
                Data: dataConvertida,
                Categoria: categoriaSegura,
                [tipoSeguro]: horaSegura
            });
            await novoPonto.save();
        }

        res.status(201).json({ message: 'Ponto registrado com sucesso' });
    } catch (error) {
        console.error('Erro ao registrar ponto:', error);
        res.status(500).json({ error: 'Erro ao registrar ponto' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
