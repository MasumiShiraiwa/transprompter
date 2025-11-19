import axios from 'axios';
import Cookie from 'universal-cookie';

export async function getTokenOrRefresh() {
    console.log('getTokenOrRefresh')
    const cookie = new Cookie();
    const speechToken = cookie.get('speech-token');

    if (speechToken === undefined) {
        try {
            const res = await fetch('/api/azure_speech', {
                method: 'GET',
            });
            const data = await res.json();
            const token = data.token;
            const region = data.region;
            cookie.set('speech-token', region + ':' + token, {maxAge: 540, path: '/'}); // 10分でトークンが切れるため9分でリロードさせる

            console.log('Token fetched from back-end: ' + token);
            return { authToken: token, region: region };
        } catch (err) {
            console.error(err);
            return { authToken: null, error: err.response.data };
        }
    } else {
        console.log('Token fetched from cookie: ' + speechToken);
        const idx = speechToken.indexOf(':');
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
    }
}