# Simple Webcam - Service
Instructions and configuration scripts to install as a systemd service.
1. Create a user to run the service; give permission to use camera
    sudo adduser webcam
    sudo usermod -a -G video webcam
2. Log in as that user and check out the git repo.
    su webcam
    cd
    git clone https://github.com/mmccool/simple-webcam.git
    cd simple-webcam
    npm install # if necessary
    which nodejs  # is this where Node.js is?
    which node    # or is this where Node.js is?
    nano service/simple-webcam.service # select correct path to Node.js
    exit
3. Install and start the service
    sudo cp /home/webcam/simple-webcam/service/simple-webcam.service /etc/systemd/system
    sudo systemctl start simple-webcam
4. Test the service by opening an appropriate URL 
    curl http://localhost:8071
   This should output the following text: Simple Web Camera
    curl http://localhost:8071/api
   This should output the Thing Description for the service
    curl -v http://localhost:8071/junk
   This should output "Not Found" and the return code 404
5. (Optional) Enable service to start at boot
    sudo systemctl enable simple-webcam
