# Web Speak - Services
Instructions and configuration scripts to install as a systemd service.
1. Create a user to run the service; give permission to use audio
    sudo adduser webspeak
    sudo usermod -a -G audio webspeak
2. Log in as that user and check out the git repo.
    su webspeak
    cd
    git clone https://github.com/mmccool/web-speak.git
    cd web-speak
    npm install # if necessary
    which nodejs  # is this where Node.js is?
    which node    # or is this where Node.js is?
    nano service/webspeak.service # select correct path to Node.js
    exit
3. Install and start the service
    sudo cp /home/webspeak/web-speak/service/webspeak.service /etc/systemd/system
    sudo systemctl start webspeak
4. Test the service by opening an appropriate URL 
    curl http://localhost:8090
   This should output the following text: Web Speak
    curl http://localhost:8090/api
   This should output the Thing Description for the service
    curl -v http://localhost:8090/junk
   This should output "Not Found" and the return code 404
    curl http://localhost:8090/api/say -d '"hello world"'
   Say "hello world"
5. (Optional) Enable service to start at boot
    sudo systemctl enable webspeak
