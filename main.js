// Web Speak
// Make espeak available via a web service

var desc = "Web Speak";
var os = require('os');
var hostname = os.hostname();
var fs = require('fs');
var uuidv5 = require('uuid/v5');
var testing = false;
var options = [
    // Local unencrypted, unauthenticated HTTP server
    // Authentication and encryption handled by reverse proxy as needed
    {
        tdirs: [],
        protocol: "http",
        name: hostname + '.local',
        port: testing ? 8086 : 8085,
    }
];
for (let i=0; i<options.length; i++) {
    options[i].base = 
	options[i].protocol + 
	'://' + 
        options[i].name + 
        (options[i].remote_port ? 
            ':' + options[i].remote_port :
	    (options[i].port ? 
                ":" + options[i].port : 
                ''
            )
        ) +
        '/api';
    options[i].uuid = uuidv5(options[i].base, uuidv5.URL);
}
var http = require('http');
var https = require('https');

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
            data = data.replace(/{{{name}}}/gi,option.name);
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

// Process Post Method
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
            done(JSON.parse(stringData));
        } catch (error) {
            res.writeHead(405,{'Content-Type': 'text/plain'});
            res.end('Malformed POST parameters');
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
                        console.log('asked to say "'+content+'"');
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
        default:
            res.writeHead(404,{'Content-Type': 'text/plain'});
            res.end('Not found\n');
            break;
    }
}

// Start multiple servers (with different options)
for (let i=0; i<options.length; i++) {
    if (undefined !== options[i].credentials) {
        https.createServer(basic,
                           options[i].credentials,
                           function(req,res) {server(req,res,options[i])})
             .listen(options[i].port, function () {
                console.log(desc,'via HTTPS started on port',options[i].port);
             });
    } else {
        if (options.security) {
            http.createServer(basic,function(req,res) {server(req,res,options[i])})
                .listen(options[i].port, function () {
                    console.log(desc,'via HTTP started on port',options[i].port);
                });
        } else {
            http.createServer(function(req,res) {server(req,res,options[i])})
                .listen(options[i].port, function () {
                    console.log(desc,'via HTTP started on port',options[i].port);
                });
        }
    }
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
