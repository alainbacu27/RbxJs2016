export DISPLAY=:1 & sleep 1 & Xvfb :1 -screen 0 1024x768x16 & sleep 1 & lightdm-session & wine $@
