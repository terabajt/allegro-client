const express = require('express');
const axios = require('axios');
require('dotenv/config');

const app = express();
const port = process.env.PORT;

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUri = process.env.REDIRECT_URI;

app.get('/przekierowanie', (req, res) => {
	const code = req.query.code;

	if (!code) {
		res.status(400).send('Brak kodu autoryzacji.');
		return;
	}

	// Wymiana kodu autoryzacji na token dostępowy
	axios
		.post(
			'https://allegro.pl/auth/oauth/token',
			{
				grant_type: 'authorization_code',
				code: code,
				redirect_uri: redirectUri,
			},
			{
				auth: {
					username: clientId,
					password: clientSecret,
				},
			}
		)
		.then(response => {
			const accessToken = response.data.access_token;

			res.send('Przekierowanie zakończone pomyślnie. Możesz zamknąć to okno.');
		})
		.catch(error => {
			console.error('Błąd podczas wymiany kodu na token dostępowy:', error);
			res.status(500).send('Wystąpił błąd podczas wymiany kodu na token dostępowy.');
		});
});

app.listen(port, () => {
	console.log(`Serwer Node.js działa na porcie ${port}`);
});
