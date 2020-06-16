# Web Speech - Scripts
This service needs to access audio, and needs to do so when running headless.
First, install espeak and make sure it works.  This may require setting up
a default audio device. For instance, to use an external USB audio device,
something like the following may be needed in /etc/asound.conf:
    pcm.!default {
      type hw
      card 2
      device 0
    }
Use aplay -l to get a list of audio devices, then pick appropriate values for type,
card, and device above. After changing this rebooting may be necessary before it
takes effect.

Then add the user that will run the service (eg webspeak) to the "audio" group 
and make sure "espeak" works from a headless login from that user (eg login via
ssh and test it).  You may have to reboot before the group change is effective.

Note that access to the audio device may conflict with other uses of audio.
For example if you log into the desktop and use audio, even accidentally (for 
instance, by going to a browser page with audio in an ad) it may break the service.
If you need to support multiple users of audio you will have to also install
a system-wide mixer service.  If you have pulseaudio installed (and you should...)
then this can be done as follows:
1. Add all users that need to use audio to the audio group.
2. Delete any per-user pulseaudio configs in /home/*/.config/pulse/
3. Make sure 
       auto-connect-localhost = yes
   is set in /etc/pulse/client.conf
4. Add the line
       load-module module-native-protocol-tcp listen=127.0.0.1 auth-ip-acl=127.0.0.1 auth-anonymous=1
   to /etc/pulse/default.pa
