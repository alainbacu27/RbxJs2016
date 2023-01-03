# RbxJs2016
"Fixed" version of https://github.com/InternalTransfers/RbxJs2016, includes some fixes made by me.

I removed issues because I'm not a developer, don't even try to send me direct messages about this project, I won't help

# Requirements

Basic knowledge of linux, how to use cd, terminal commands adn github

Windows Terminal (new one) is not required but i recommend it

big brain

# Localhost Setup

1. Install WSL Preview In Microsoft Store and Ubuntu 20.04:

https://aka.ms/wslstorepage

2. Enable systemd

You will need to edit the wsl.conf file to ensure systemd starts up on boot.

Add these lines to the /etc/wsl.conf (note you will need to run your editor with sudo privileges, e.g: sudo nano /etc/wsl.conf):

[boot]
systemd=true

3. Install Node.js, NPM and mongodb

dont know how? check this:

https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl

https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

4. Clone This Repo

5. Create Mongo Database called roblox (without capslock)

here if you dont know: https://www.youtube.com/watch?v=vnvcI8wLn5M

6. go to RbxJs2016 folder

7. do npm i ( ignore warnings )

8. run this:

sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``

9. go to \\wsl$ in your windows explorer bar

10. go to views

11. open notepad++ in the folder and press ctrl + f

12. click on "find in files"

13. put https on the first box

14. put http on the second box

15. and finnaly click "replace in files"

16. do npm start

WARNING THIS SHOULD NOT BE USED FOR PUBLIC REVIVALS ITS VERY DANGEROUS



