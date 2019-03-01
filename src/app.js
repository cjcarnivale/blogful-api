'use strict'; 

require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const ArticlesService = require('./articles-service');
const usersRouter = require('./users/users-router'); 
const commentsRouter = require('./comments/comments-router');

const app = express();

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use('/api/users', usersRouter);
app.use('/api/comments', commentsRouter); 

app.get('/articles', (req, res, next) =>{
  const knexInstance = req.app.get('db');
  ArticlesService.getAllArticles(knexInstance)
    .then(articles => {
      res.json(articles); 
    })
    .catch(next); 
});

app.get('/articles/:article_id', (req, res, next) => {
  const knexInstance = req.app.get('db');
  ArticlesService.getById(knexInstance, req.params.article_id)
    .then(articles => {
      if (!articles) {
        return res.status(404).json({
          error: { message: 'Article doesn\'t exist' }
        });
      }
      res.json(articles);
    })
    .catch(next);
});

app.get('/', (req, res) => {
  res.send('Hello, boilerplate!');
});

app.patch('/articles/:article_id', jsonParser, (req, res, next) => {
  const { title, content, style } = req.body;
  const articleToUpdate = { title, content, style };

  const numberOfValues = Object.values(articleToUpdate).filter(Boolean).length;
  if (numberOfValues === 0) {
    return res.status(400).json({
      error: {
        message: 'Request body must content either \'title\', \'style\' or \'content\''
      }
    });
  }

  ArticlesService.updateArticle(
    req.app.get('db'),
    req.params.article_id,
    articleToUpdate
  )
    .then(numRowsAffected => {
      res.status(204).end();
    })
    .catch(next);
});


app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
    console.error(error);
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;