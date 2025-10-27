const express = require('express');
const cors    = require('cors');
const app     = express();
app.use(cors());
app.use(express.json());

const items = [{id:1, text:'Hello from Lambda'}];

app.get('/items', (req,res)=>res.json(items));
app.post('/items',(req,res)=>{
  items.push({ id: Date.now(), text: req.body.text });
  res.json(items);
});

module.exports.handler = require('serverless-http')(app);