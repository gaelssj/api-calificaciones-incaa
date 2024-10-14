const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000; 

const baseUrlImagen = 'https://calificaciones.incaa.gob.ar/images/calificaciones/';

async function obtenerPeliculas(peliculas, pagina) {
  const url = `https://calificaciones.incaa.gob.ar/index.php?q=${peliculas}&director=&bt_buscar=Buscar%20Calificaciones&pag=${pagina}`;
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const peliculasArray = [];

    $('tr.tr_en_stock').each((index, element) => {
      const nombre = $(element).find('td').eq(0).find('b').first().text().trim();
      let calificacion = $(element).find('td').eq(1).find('div').css('background-image');

      if (calificacion) {
        calificacion = calificacion.match(/(\d+)\.png/)[0];
        calificacion = baseUrlImagen + calificacion;
      }

      const duracion = $(element).find('td').eq(2).text().trim();

      peliculasArray.push({
        nombre,
        calificacion,
        duracion,
      });
    });

    return peliculasArray;

  } catch (error) {
    throw new Error(`Error al obtener los datos: ${error.message}`);
  }
}

async function obtenerTodasLasPaginas(peliculas) {
  let pagina = 1;
  let todasLasPeliculas = [];
  let resultados = [];

  do {
    resultados = await obtenerPeliculas(peliculas, pagina);
    todasLasPeliculas = todasLasPeliculas.concat(resultados);
    pagina++;
  } while (resultados.length > 0);

  return todasLasPeliculas;
}

app.get('/peliculas', async (req, res) => {
  const { peliculas } = req.query;

  if (!peliculas) {
    return res.status(400).json({ error: 'Debes proporcionar el parámetro "peliculas".' });
  }

  try {
    const resultado = await obtenerTodasLasPaginas(peliculas);
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});