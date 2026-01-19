require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const joinLeagues = require('./routes/leagueJoin');
const playerRoutes = require('./routes/playerRoutes'); 


const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use('/api', authRoutes);
app.use('/api/league', joinLeagues)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/market', playerRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
