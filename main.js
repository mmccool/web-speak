// Web Speak
// Make espeak available via a web service

var desc = "Web Speak";
var os = require('os');
var hostname = os.hostname();
var fs = require('fs');
var uuidv5 = require('uuid/v5');
var testing = false;
var options = [
    // local unencrypted, unauthenticated HTTP server
    {
        tdirs: [],
        name: "http://" + hostname + '.local',
        portals: ["https://portal.mmccool.net","https://tiktok.mmccool.org"],
        port: 8085,
        basicport: 8096,
        digestport: 8097
    }
];
for (let i=0; i<options.length; i++) {
    options[i].base = options[i].name + ":" + options[i].port + '/api';
    options[i].uuid = uuidv5(hostname, uuidv5.URL);
}
var http = require('http');
var https = require('https');

// Properties (and initial/default values)
var amplitude = 100;

// Operation scripts
var child_process = require('child_process');
var script_say = __dirname + '/scripts/say';

function serveLocalFile(res,path,contentType,responseCode) {
    if (!responseCode) responseCode = 200;
    fs.readFile(__dirname + path, function(err,data) {
        if (err) {
            res.writeHead(500,{'Content-Type': 'text/plain'});
            res.end('500 - Internal Error');
        } else {
            res.writeHead(responseCode,{'Content-Type': contentType});
            res.end(data);
        }
    });
}

function genTD(option,error,success) {
    var path = "/TD.template";
    fs.readFile(__dirname + path, function(err,template_data) {
        if (err) {
            error();
        } else {
            var data = template_data.toString();
            data = data.replace(/{{{hostname}}}/gi,hostname);
            data = data.replace(/{{{portal0}}}/gi,option.portals[0]);
            data = data.replace(/{{{portal1}}}/gi,option.portals[1]);
            data = data.replace(/{{{basicport}}}/gi,option.basicport);
            data = data.replace(/{{{digestport}}}/gi,option.digestport);
            data = data.replace(/{{{base}}}/gi,option.base);
            data = data.replace(/{{{uuid}}}/gi,option.uuid);
            success(data);
        }
    });
}

function serveTD(res,option) {
    var contentType = "application/ld+json";
    var responseCode = 200;
    genTD(
        option,
	function () {
            res.writeHead(500,{'Content-Type': 'text/plain'});
            res.end('500 - Internal Error');
        },
        function (data) {
            res.writeHead(responseCode,{'Content-Type': contentType});
            res.end(data);
        }
    );
}

// Register TDs
var request = require('request');
var td_resource = [];
var td_ttl_s = 600;
var td_ttl_refresh_ms = (td_ttl_s-100)*1000;
function regTD(i,option) {
    genTD(
        option,
        function () {
            console.log('Error generating TD for registration');
        },
        function (td) {
            for (let j=0; j<option.tdirs.length; j++) {
              let tdir = option.tdirs[j];
              console.log('Register TD',i,'on',tdir);
              request(
                {
                    url: tdir + '?lt='+td_ttl_s,
                    method: 'POST',
                    headers: {"Content-Type": "application/ld+json"},
                    body: td.toString()
                },
                function (error, response, body) {
                    //console.log('Registration response:',JSON.stringify(response));
                    if (error || !response.statusCode || Math.trunc(response.statusCode/100) != 2) {
                        console.log('Error registering TD',
                          error);
                    } else {
                        console.log(response.headers);
                        //td_resource[i] = response.headers.location.toString();
                        console.log("TD id:",JSON.parse(td).id);
                        td_resource[i] = JSON.parse(td).id;
                        console.log(response.statusCode +
                          ': TD '+i+' registered to "'+td_resource[i]+'"');
                    }
                }
              );
            }
        }
    );
}

// Operations
function speak_say(content,done) {
    console.log('saying "'+content+'"');
    child_process.exec(script_say+' "'+content+'"',(error,stdout,stderr) => {
        done(error,stdout,stderr);
    });
}

// Process Post Method - parse JSON body
function processPost(req,res,done) {
    var stringData = '';
    req.on('data', function(data) {
        stringData += data;
        // handle jerks trying to fill up memory and crash our server
        if (stringData.length > 1e6) {
            stringData = '';
            res.writeHead(413, {'Content-Type': 'text/plain'}).end();
            req.connection.destroy();
        }
    });
    // parse data (encoded as JSON)
    req.on('end', function() {
        try {
            let val = JSON.parse(stringData);
            done(val);
        } catch (error) {
            res.writeHead(405,{'Content-Type': 'text/plain'});
            res.end('Malformed POST parameters: ',error);
        }
    });
}

// Server for all API entry points
function server(req,res,option) {
    var path = req.url.replace(/\/?(?:\?.*)?$/,'').toLowerCase();
    var method = req.method;
    switch (path) {
        case '':
            res.writeHead(200,{'Content-Type': 'text/plain'});
            res.end(desc);
            break;
        case '/desc':
            serveLocalFile(res,'/public/DESC.md','text/markdown');
            break;
        case '/api':
            serveTD(res,option);
            break;
        case '/api/say':
            switch (method) {
                case 'POST':
                    processPost(req,res,(content) => {
                        console.log('INVOKE say: "'+content+'"');
                        speak_say(content,(error,stdout,stderr) => {
                            if (error) {
                                res.writeHead(500,{'Content-Type': 'text/plain'});
                                res.end('Internal error - could not perform "say" action');
                            } else {
                                res.writeHead(200,{'Content-Type': 'text/plain'});
                                res.end('said "'+content+'"');
                            }
                        });
                    });
                    break;
                default:
                    res.writeHead(405,{'Content-Type': 'text/plain'});
                    res.end('Method',method,'not supported');
            }
            break;
        case '/api/amplitude':
            switch (method) {
                case 'GET':
                    res.writeHead(200,{'Content-Type': 'application/json'});
                    res.end(JSON.stringify(amplitude));
                    console.log('READ amplitude: '+amplitude);
                    break;
                case 'PUT':
                case 'POST':
                    processPost(req,res,(amp) => {
                        if (!Number.isInteger(amp) || Number.isNaN(amp)) {
                            res.writeHead(500,{'Content-Type': 'text/plain'});
                            res.end('Internal error - cannot set "amplitude" property - value cannot be converted to integer');
                        } else if (amp < 0) {
                            res.writeHead(500,{'Content-Type': 'text/plain'});
                            res.end('Internal error - cannot set "amplitude" property - value cannot be negative');
                        } else if (amp > 200) {
                            res.writeHead(500,{'Content-Type': 'text/plain'});
                            res.end('Internal error - cannot set "amplitude" property - value cannot be greater than 200');
                        } else {
                            res.writeHead(200,{'Content-Type': 'text/plain'});
                            amplitude = amp;
                            res.end(""+amplitude);
                        }
                        console.log("WRITE amplitude: "+amplitude);
                    });
                    break;
                default:
                    res.writeHead(405,{'Content-Type': 'text/plain'});
                    res.end('Method',method,'not supported');
            }
            break;
        default:
            res.writeHead(404,{'Content-Type': 'text/plain'});
            res.end('Not found\n');
            break;
    }
}

// Start multiple servers (with different options)
for (let i=0; i<options.length; i++) {
   http.createServer(function(req,res) {server(req,res,options[i])})
       .listen(options[i].port, function () {
           console.log(desc,'via HTTP started on port',options[i].port);
   });
}

// Register TDs.  Set up with TTL and periodically refresh
function regAllTDs() {
    console.log("Registering TDs with options:",options);
    for (let i=0; i<options.length; i++) {
   	console.log("Registering TD for server",i);
        regTD(i,options[i]);
    }
}

//regAllTDs();
//setInterval(regAllTDs,td_ttl_refresh_ms);
