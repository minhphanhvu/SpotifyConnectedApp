require('dotenv').config()
const express = require('express')
const randomstring = require("randomstring");
const querystring = require('querystring');
const axios = require('axios')

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URL = process.env.REDIRECT_URL

const app = express()

const state = randomstring.generate(16)
const scope = 'user-read-private user-read-email'

const stateKey = 'stotify_auth_state'

app.get('/', (req, res) => {
    res.send('hello World')
})

app.get('/login', (req, res) => {
    res.cookie(stateKey, state)
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URL,
      state: state,
      scope: scope
    }))
})

app.get('/callback', (req, res) => {
    const code = req.query.code || null

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URL  
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        }
    })
    .then(response => {
        if (response.status == 200) {
            const { access_token, refresh_token, expire_in } = response.data

            const queryParams = querystring.stringify({
                access_token,
                refresh_token,
                expire_in
            })

            // redirect to React app
            // pass long tokens in query params
            res.redirect(`http://localhost:3000/?${queryParams}`)
            
        } else {
            res.redirect(`/?${querystring.stringify({ error: 'invalid_token' })}`)
        }
    })
    .catch(error => {
        res.send(error)
    })
})

app.get('/refresh_token', (req, res) => {
    const { refresh_token } = req.query

    axios({
        method: 'post',
        url: 'https://accounts.spotify.com/api/token',
        data: querystring.stringify({
            grant_type: 'refresh_token',
            refresh_token: refresh_token, 
        }),
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + (new Buffer(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
        }
    })
    .then(response => {
        res.send(response.data)
    })
    .catch(error => {
        res.send(error)
    })
})

const port = 8888;

app.listen(port, () => {
    console.log(`Running on port 8888`)
})