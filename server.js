const express = require('express');
const axios = require('axios');
const cors = require('cors');  // Importa il pacchetto CORS

const app = express();

// Configura CORS per consentire richieste dal dominio del frontend
const corsOptions = {
    origin: '*',  // Sostituisci con il dominio del tuo frontend
    methods: 'GET,POST',  // Permetti solo i metodi necessari
    allowedHeaders: 'Content-Type,Authorization'  // Specifica gli headers consentiti
};

app.use(cors(corsOptions));  // Applica le opzioni CORS

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/generate-caption', async (req, res) => {
    try {
        const { prompt, imageBase64 } = req.body;

        const requestBody = {
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 150
        };

        const response = await axios.post('https://api.openai.com/v1/chat/completions', requestBody, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ caption: response.data.choices[0].message.content.trim() });
    } catch (error) {
        console.error('Errore nella richiesta all\'API OpenAI:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Errore nella generazione della caption.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
});
