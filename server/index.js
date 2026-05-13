const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

let do1 = 0;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Servidor funcionando' });
});

app.get('/', (req, res) => {
  res.send('Servidor activo');
});

app.get('/api/io/di1', (req, res) => {
  res.json({
    signal: 'Local_IO_0_DI1',
    value: do1,
    message: 'DI1 leído correctamente',
  });
});

app.post('/api/io/do1/on', (req, res) => {
  do1 = 1;
  res.json({
    signal: 'Local_IO_0_DO1',
    value: do1,
    message: 'DO1 encendido',
  });
});

app.post('/api/io/do1/off', (req, res) => {
  do1 = 0;
  res.json({
    signal: 'Local_IO_0_DO1',
    value: do1,
    message: 'DO1 apagado',
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});