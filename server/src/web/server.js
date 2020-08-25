const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const logger = require('../logger')('root');
const useragent = require('express-useragent');
const env = require('../env');

module.exports = async function (routes = []) {

  if (!process.env.isProduction) {
    // development logger
    app.use(require('morgan')('dev'));
  }

  app.use(useragent.express());
  app.use(express.static(path.join(__dirname, 'public')));

  // disable "powered by" headers
  app.disable('x-powered-by');
  // allow cors
  app.use(cors());
  // express json body parser
  app.use(express.json());
  // express url parser
  app.use(express.urlencoded({ extended: false }));

  // setup module apis
  for (let route of routes) app.use(route);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    res.status(404).send({
      name: 'NotFoundError',
      message: `Path '${req.path}' not found`
    })
  });

  // express error handler
  app.use((err, req, res, next) => {
    const details = {
      stack: err.stack,
      errorObject: err
    };
    const error = {
      name: err.name,
      message: err.message,
      description: err.description,
      details: !env.isProduction ? details : undefined
    };
    logger.debug('debug', 'Error in response', error);
    res.status(err.statusCode || 400).send(error);
  });

  // start the server on port <PORT> or 3000
  app.listen(env.PORT, error => {
    if (error) throw error;
    logger.info(`Server listening on port ${env.PORT} 🙌`);
  });

};