const createError = require('http-errors');
const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const app = express();

let ip = ''
try
{
	ip = fs.readFileSync(path.join(__dirname,'ip.txt')).toString();
}
catch(e)
{
	console.log(e);
	throw new Error("Missing required ip.txt file");	
}

app.use(express.json());

app.post('/preview', async function(req, res) {
  let result;
  try {
    if (req.headers['canary-instance'] === 'compare') {
      result = await axios.post(`http://${ip}:9002/preview`, req.body)
    } else {
      result = await axios.post(`http://${ip}:9001/preview`, req.body)
    }
    res.json(result.data);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

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

app.listen(3030);