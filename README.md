# Web Speak
This is a simple Node.js-based web service to access voice synthesis.

To install, follow the
[instructions in scripts/README.md](scripts/README.md)
to make sure speech can be generated on your system using `espeak`.
To run automatically at boot as a service follow the 
[instructions in service/README.md](service/README.md) 
to set up a systemd service.

This service returns a Thing Description which describes the API
according to the W3C Web of Things 
[W3C Web of Things (WoT)](https://github.com/w3c/wot).
The API can be fetched from a running instance of the service
using the [http://localhost:8071/api](http://localhost:8071/api).

