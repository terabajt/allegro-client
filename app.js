const express = require('express');
const axios = require('axios');
require('dotenv/config');
const querystring = require('querystring');

const app = express();
const port = process.env.PORT || 3000;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;
let accessToken = null;

// Obsługuje przekierowanie po autoryzacji
app.get('/przekierowanie', async (req, res) => {
	const code = req.query.code;

	if (!code) {
		return res.status(400).send('Brak kodu autoryzacji.');
	}

	try {
		// Wymiana kodu autoryzacji na token dostępowy
		const response = await axios.post(
			'https://allegro.pl/auth/oauth/token',
			querystring.stringify({
				grant_type: 'authorization_code',
				code,
				redirect_uri: redirectUri,
			}),
			{
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				auth: {
					username: clientId,
					password: clientSecret,
				},
			}
		);

		accessToken = response.data.access_token;
		res.redirect('/');
	} catch (error) {
		console.error('Błąd podczas wymiany kodu na token dostępowy:', error);
		res.status(500).send('Wystąpił błąd podczas wymiany kodu na token dostępowy.');
	}
});

// Strona główna z przyciskiem autoryzacji, pobierania produktów i wyświetlania kategorii
app.get('/', (req, res) => {
	let content = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Twoja Aplikacja</title>
    </head>
    <body>
        <h1>Witaj w Twojej Aplikacji</h1>
  `;

	if (accessToken) {
		content += `
      <p>Uwierzytelniono. Możesz pobierać produkty i wyświetlać kategorie.</p>
      <a href="/produkty">Pobierz produkty</a>
      <a href="/kategorie">Wyświetl kategorie</a>
       <form action="/wyloguj" method="post">
        <button type="submit">Wyloguj</button>
      </form>
    `;
	} else {
		content += `
      <a href="https://allegro.pl/auth/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}">
          Zaloguj do Allegro
      </a>
    `;
	}

	content += `
    </body>
    </html>
  `;

	res.send(content);
});

// Obsługuje pobieranie listy produktów
app.get('/produkty', async (req, res) => {
	if (!accessToken) {
		return res.status(401).send('Brak dostępu. Uwierzytelnij się.');
	}

	try {
		const response = await axios.get('https://api.allegro.pl/sale/offers', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/vnd.allegro.public.v1+json',
			},
		});

		const products = response.data;
		res.json(products);
	} catch (error) {
		console.error('Błąd podczas pobierania produktów:', error);
		res.status(500).send('Wystąpił błąd podczas pobierania produktów.');
	}
});

// Obsługuje wyświetlanie kategorii
app.get('/kategorie', async (req, res) => {
	if (!accessToken) {
		return res.status(401).send('Brak dostępu. Uwierzytelnij się.');
	}

	try {
		const response = await axios.get('https://api.allegro.pl/sale/categories', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				Accept: 'application/vnd.allegro.public.v1+json',
			},
		});

		const categories = response.data;
		res.json(categories);
	} catch (error) {
		console.error('Błąd podczas wyświetlania kategorii:', error);
		res.status(500).send('Wystąpił błąd podczas wyświetlania kategorii.');
	}
});
app.post('/wyloguj', (req, res) => {
	// Wyczyszczenie tokenu dostępowego
	accessToken = null;
	res.redirect('/');
});

app.listen(port, () => {
	console.log(`Serwer Node.js działa na porcie ${port}`);
});
