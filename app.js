// Configurazione API di OpenAI
const OPENAI_API_KEY = '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'; // Sostituisci con la tua chiave API
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

let selectedCaption = ''; // Variabile per memorizzare la caption selezionata
let selectedStyle = ''; // Variabile per memorizzare lo stile selezionato
let stylePrompts = {}; // Oggetto per memorizzare i prompt relativi ai pulsanti

// Caricamento del file JSON con i dati dei pulsanti
fetch('styles.json')
    .then(response => response.json())
    .then(data => {
        const styleButtonsContainer = document.getElementById('styleButtons');
        data.buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = 'style-button';
            btn.dataset.style = button.text.toLowerCase();
            btn.textContent = button.text;
            stylePrompts[button.text.toLowerCase()] = button.prompt;

            btn.addEventListener('click', function() {
                // Logica per la selezione dello stile
                document.querySelectorAll('.style-button').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                selectedStyle = button.text.toLowerCase();
                console.log('Stile selezionato:', selectedStyle);

                if (document.getElementById('imageUpload').files.length > 0) {
                    document.getElementById('generateBtn').style.backgroundColor = '#28a745';
                }
            });
            styleButtonsContainer.appendChild(btn);
        });
    })
    .catch(error => console.error('Errore nel caricamento del file JSON:', error));

// Funzione per caricare l'immagine e ottenere un URL base64
async function encodeImage(imageFile) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            console.log('Immagine caricata e codificata in base64');
            resolve(reader.result.split(',')[1]); // Ottieni solo il base64
        };
        reader.onerror = (error) => {
            console.error('Errore nella codifica dell\'immagine:', error);
            reject(error);
        };
        reader.readAsDataURL(imageFile);
    });
}

// Funzione per generare una caption utilizzando OpenAI API
async function generateCaptionWithAI(imageBase64, style) {
    const prompt = stylePrompts[style];

    console.log('Prompt inviato all\'API:', prompt);

    const requestBody = {
        model: "gpt-4o-mini",  // Specifica il modello GPT-4o mini
        messages: [
            {
                role: "user",
                content: [
                    { "type": "text", "text": prompt },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": `data:image/jpeg;base64,${imageBase64}`
                        }
                    }
                ]
            }
        ],
        max_tokens: 150
    };

    console.log('Richiesta API:', requestBody);

    const response = await fetch(OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        console.error('Errore nella risposta dell\'API:', response.statusText);
        throw new Error(`Errore nell'API OpenAI: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Risposta dell\'API:', data);
    return data.choices[0].message.content.trim();
}

// Evento per la generazione delle caption
document.getElementById('generateBtn').addEventListener('click', async () => {
    try {
        const fileInput = document.getElementById('imageUpload');
        const imageFile = fileInput.files[0];

        if (!imageFile) {
            alert('Seleziona un\'immagine prima di generare le caption.');
            return;
        }

        if (!selectedStyle) {
            alert('Seleziona uno stile di scrittura prima di generare le caption.');
            return;
        }

        const imageBase64 = await encodeImage(imageFile); // Codifica l'immagine in base64

        // Genera due caption separate con lo stile selezionato
        const caption1 = await generateCaptionWithAI(imageBase64, selectedStyle);
        const caption2 = await generateCaptionWithAI(imageBase64, selectedStyle);

        console.log('Caption 1:', caption1);
        console.log('Caption 2:', caption2);

        const captionContainer = document.getElementById('captionContainer');
        captionContainer.innerHTML = ''; // Pulisce i risultati precedenti

        // Mostra la prima caption con id e name per il checkbox e l'icona di copia
        const captionBox1 = document.createElement('div');
        captionBox1.className = 'caption-box';
        captionBox1.innerHTML = `
            <span class="caption-text">${caption1}</span>
            <input type="checkbox" id="caption1-checkbox" name="caption1" class="caption-checkbox" data-caption="${caption1}">
            <div class="copy-icon" data-caption="${caption1}">
                <i class="fas fa-copy"></i>
                <span>Copia</span>
            </div>
        `;
        captionContainer.appendChild(captionBox1);

        // Mostra la seconda caption con id e name per il checkbox e l'icona di copia
        const captionBox2 = document.createElement('div');
        captionBox2.className = 'caption-box';
        captionBox2.innerHTML = `
            <span class="caption-text">${caption2}</span>
            <input type="checkbox" id="caption2-checkbox" name="caption2" class="caption-checkbox" data-caption="${caption2}">
            <div class="copy-icon" data-caption="${caption2}">
                <i class="fas fa-copy"></i>
                <span>Copia</span>
            </div>
        `;
        captionContainer.appendChild(captionBox2);

        // Aggiungi l'evento ai checkbox per selezionare la caption
        document.querySelectorAll('.caption-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                document.querySelectorAll('.caption-checkbox').forEach(cb => cb.checked = false);
                this.checked = true;

                // Memorizza la caption selezionata dall'elemento .caption-text
                selectedCaption = this.previousElementSibling.textContent; 
                console.log('Caption selezionata:', selectedCaption);
                document.getElementById('previewBtn').style.display = 'block'; // Mostra il pulsante Anteprima
            });
        });

        // Aggiungi l'evento all'icona di copia
        document.querySelectorAll('.copy-icon').forEach(icon => {
            icon.addEventListener('click', function() {
                const textToCopy = this.dataset.caption;
                copyToClipboard(textToCopy);
            });
        });

        // Mostra il contenitore del quarto step
        document.getElementById('step4Container').style.display = 'block';

        // Resetta il colore del pulsante "Genera Caption con AI" dopo la generazione
        document.getElementById('generateBtn').style.backgroundColor = '#d3d3d3'; // Grigio chiaro

    } catch (error) {
        console.error('Errore durante la generazione delle caption:', error);
        alert('Si è verificato un errore durante la generazione delle caption.');
    }
});

let image = new Image(); // Variabile globale per l'immagine

// Caricamento dell'immagine selezionata dall'utente
document.getElementById('imageUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        image.src = e.target.result;
        console.log('Immagine caricata per l\'anteprima:', image.src);

        // Nascondere il nome del file selezionato e mostrare la miniatura
        document.getElementById('imageUpload').style.display = 'none';
        const imageText = document.getElementById('imageText');
        const imagePreview = document.getElementById('imagePreview');
        imagePreview.src = e.target.result;
        imageText.style.display = 'inline';
        imagePreview.style.display = 'block';

        // Se uno stile è già stato selezionato, abilita il pulsante "Genera Caption con AI"
        if (selectedStyle) {
            document.getElementById('generateBtn').style.backgroundColor = '#28a745'; // Verde acceso
        }
    };
    reader.readAsDataURL(file);
});



// Funzione per copiare il testo negli appunti
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert('Caption copiata negli appunti!');
}

// Funzione per aggiornare l'anteprima del post Instagram
document.getElementById('previewBtn').addEventListener('click', () => {
    const instagramCaption = document.getElementById('instagramCaption');
    const instagramPreview = document.getElementById('instagramPreview');
    const instagramImage = document.getElementById('instagramImage');

    console.log('Aggiornamento dell\'anteprima con la caption selezionata:', selectedCaption);

    // Assegna la caption selezionata al div corrispondente
    instagramCaption.textContent = selectedCaption;

    // Verifica se il testo è stato correttamente inserito
    if (instagramCaption.textContent.trim() !== selectedCaption.trim()) {
        console.error('Errore nella visualizzazione della caption: testo non corrisponde.');
    }

    // Usa l'immagine caricata dall'utente
    instagramImage.src = image.src;

    // Mostra il box di anteprima
    instagramPreview.style.display = 'block';

    console.log('Anteprima aggiornata con l\'immagine e la caption.');
});
