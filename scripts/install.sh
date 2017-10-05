#!/bin/bash

curl https://deb.nodesource.com/setup_8.x | sudo bash -
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 
sudo sh -c 'echo "deb https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'
sudo apt-get update
sudo apt-get install google-chrome-stable nginx supervisor nodejs -y
cp ./nginx/seo-render-$1.conf /etc/nginx/conf.d/seo-render.conf
cp ./supervisor/seo-render-$1.conf /etc/supervisor/conf.d/seo-render.conf
sudo service supervisor restart
sudo service nginx restart
