# RbxJs2016 Fixed

# Requirements

NPM

GIT

NODEJS

MONGODB

PYTHON3

Systemd (MANDATORY YOU MUST HAVE SYSTEMD ON IF NOT MONGO DB WILL NOT WORK)

https://www.youtube.com/watch?v=UnCjLs8UWVo&t=4s

More in package.json

# Setup

it took me a long time to learn how this crap works with my knowledge

REMEMBER normal use does not have permission to use the default HTTP port (80). check this:

https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps#give-safe-user-permission-to-use-port-80

or

> sudo apt-get install libcap2-bin 
> sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\`` 

btw we have a setup now

1. Install WSL Ubuntu 20.04
2. Install NodeJS, npm and mongodb using:

sudo apt-get install curl

> curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&\

> sudo apt-get install nodejs

> node -v 

https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/

3. Install GIT and clone this repo

https://github.com/godmod9/RbxJs2016.git

4. Setup.rar (create a folder called setup inside the public folder and put the files in the folder)

https://www.mediafire.com/file/34zg6a6kevig1tk/setup.rar/file

5. Create Database Using

6. Do sudo npm i, ignore warnings (use sudo npm i --force if something bad happens)
7. After npm i finish, use sudo npm start to start the servers (REQUIRES A GOOD PC)

# Thanks Malte for telling me this thing used mongdb




