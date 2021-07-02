require('dotenv').config();

const express = require('express');
const cors = require('cors');
const dns = require('dns')
const app = express();

var bodyParser = require('body-parser');

var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

//______________________________________________________________________________


//Basic logger
app.use(function logger(req, res, next) {
  var log = `Method: ${req.method} | Path: ${req.path} | IP: ${req.ip}`;
  console.log(log);
  next();
});






//Schema definition
const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: Number
});

let Url = mongoose.model('URL', urlSchema)

app.post('/api/shorturl', function(req, res) {
  response = {}
  
    let formUrl = req.body.url

    let noprefix=formUrl.replace(/^https?:\/\//,'');
    let root= noprefix.split('/')[0];

    console.log("Original :", formUrl)
    console.log("No Http: ", noprefix)
    console.log("Root Direcroty: ", root)
    
  
  dns.lookup(root, (err, addresses, family)=>{
    
    if(err){
      console.log("DNS error");
      response["error"] = "invalid url";
      res.json(response);
    } else {
      console.log("DNS OKAY");
      let inputShort = 1;

      Url.findOne({})
      .sort({ short_url: "desc" })
      .exec((error, result) => {
        if (!error && result != undefined) {
          inputShort = result.short_url + 1;
        }
        if (!error) {
          Url.findOneAndUpdate(
            { original_url: formUrl },
            { original_url: formUrl, short_url: inputShort },
            { new: true, upsert: true },
            (error, savedUrl) => {
              if (!error) {
                response["original_url"] = savedUrl.original_url;
                response["short_url"] = savedUrl.short_url;
                res.json(response);
              }
            }
          );
        }
      });
    }
  })


app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input

  Url.findOne({short_url: input}, (error, result) => {
    if(!error && result != undefined){

          var re = new RegExp("^(http|https)://", "i");
          var strToCheck = result.original_url
        if(re.test(strToCheck)){
            res.redirect(301, result.original_url);
        }else{
            res.redirect(301, 'http://' + result.original_url);
        }

    }else{
      res.json('URL not Found')
    }
  })
})

});