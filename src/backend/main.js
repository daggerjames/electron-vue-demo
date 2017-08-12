var express = require('express')
var app = express()

app.get('/api/greeting', function (req, res) {
  res.send('hello world!')
})

var port = process.env.PORT || 8081
app.listen(port, function () {
  console.log('express listening on port ' + port + '!')
})
