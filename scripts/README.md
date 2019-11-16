# Web Speech - Scripts
This service needs to access audio, and needs to do so when running headless.
First, install espeak and make sure it works.  Then add the user that will run
the service to the "audio" group and make sure "espeak" works from a headless
login from that user (eg login via ssh and test it).

Note that access to the audio device may conflict with other uses of audio.
If you need to support multiple users of audio you will have to also install
a mixer service (left as an exercise for the reader).

The script "say" provides a generic interface to espeak but may be modified
to support other speech generators.  It accepts a set of parameters as well,
for example, for volume control.
