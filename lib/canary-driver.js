const createError = require('http-errors');
const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const app = express();

let ip = ''
try
{
	ip = fs.readFileSync(path.join(__dirname,'dashboard/metrics/ip.txt')).toString();
}
catch(e)
{
	console.log(e);
	throw new Error("Missing required ip.txt file");	
}

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
  res.send('error');
});

app.post('/preview', async function(req, res) {
  let result;
  
  if (Date.now().getMinutes() % 2 === 0) {
    result = await axios.post(`http://${ip}:9001`, req.body)
  } else {
    result = await axios.post(`http://${ip}:9002`, req.body)
  }

  res.json(result.data);
});

app.listen(3030);