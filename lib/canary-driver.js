const createError = require('http-errors');
const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.get('/preview', async function(req, res) {
  let result;
  
  if (Date.now().getMinutes() % 2 === 0) {
    result = await axios.get('http://192.168.1.228:9001')
  } else {
    result = await axios.get('http://192.168.1.228:9002')
  }

  res.json(result.data);
});

app.listen(3000);