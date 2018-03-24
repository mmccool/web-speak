# Simple Webcam - Scripts
A webcam obviously needs to access a camera.  Unfortunately this can be
annoying to set up, may need root permissions when running headless, etc. etc.
The way this system avoids a tight dependency is to call a script "grab"
in this directory.  This script should take a filename as a single argument.
When run, it should grab a frame (at whatever resolution is convenient)
and store a JPEG file at the given location.

Two sample scripts are provided, one based on v4l2grab and the other on
fswebcam.  The v4l2grab version is also copied to "grab" as the default.
These are both set up to delay one second before grabbing a frame.  This is
to allow the camera (which may have been in a low-power state) time to 
adjust its exposure, etc.  Obviously this means the grab scripts cannot be 
used to simulate video streaming by grabbing frames very rapidly.

To handle permissions issues, you may have to do one of the following:
- Add the user to either the "video" or "camera" groups.  Check the 
  permissions on the camera device (typically /dev/video0, but that's
  something else you may have to check).
- Allow the frame-grabber program to run using sudo without prompting for
  a password by adding a line to the sudoers configuration file.
- Make the frame-grabber program setuid.
- Make the script setuid (NOT RECOMMENDED, allowing scripts to run as 
  setuid is a big and unpluggable security hole).

Before trying to debug these scripts make sure your camera works at all
using cheese or the like.

In addition to the frame-grabber scripts, this directory also contains
scripts to initialize the camera, check V4L settings, and manually set
the exposure.
