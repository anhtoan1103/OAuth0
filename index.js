const express = require('express')
const bodyParser = require("body-parser")
const app = express()

const PORT = 3000

// set view engine
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'pug')

app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req, res) => {
    
    //res.json({"hehe": req.body.Password + 12})
    if (req.body.email || !req.body.password) {
        res.status(400).json({ message: "Invailed email or password"})
    }
})

app.listen(PORT, () => {
    console.log('app is listening')
})