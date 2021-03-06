#!/bin/bash


# RUNNING THE DATA CONTAINER
# checking if the data container has been already started
# Don't remove it to not loose your data. If you need to do this,
# export your configuration before. In any case, it is good to
# export your data for any possible bad scenario.
# Alternatively, you can backup the data container,
# for example with https://github.com/discordianfish/docker-backup

ID=$(sudo docker inspect --format '{{ .Id }}' unicum_data 2> /dev/null)
if [ -z "$ID" ]; then
sudo docker run \
    --name unicum_data \
    -v /data \
    -v /log \
    busybox \
    true
fi
# notice that this is a pure data container that is shown only with
#   docker ps -a
# because it starts and stops immediately


# RUNNING THE REDIS CONTAINER

ID=$(sudo docker inspect --format '{{ .Id }}' unicum_redis 2> /dev/null)
if [ ! -z "$ID" ]; then
    docker stop unicum_redis
    docker rm unicum_redis
fi


# If you want to allow the access not only locally, you would set the port like
#   -p 63791:6379
# If you like to set a password uncomment the requirepass command

sudo docker run \
    --volumes-from unicum_data \
    --name unicum_redis \
    -d \
    redis \
    redis-server \
    --appendonly yes #--requirepass <password>


# RUNNING THE UNICUM CONTAINER

ID=$(sudo docker inspect --format '{{ .Id }}' unicum 2> /dev/null)
if [ ! -z "$ID" ]; then
    docker stop unicum
    docker rm unicum
fi

sudo docker run -d \
    --name unicum \
    --link unicum_redis:unicum_redis \
    -p 6961:6961 \
    --volumes-from unicum_data \
    hooq/unicum

# If you are using a password for redis, you have to communicate this to the unicum server
# in the variable $PASSWORD. For example you can do this adding the line
#   -e PASSWORD=<password> \
# before the last one

# When you add new key types in the unicum_config.js file you just need to run
# this script again to restart correctly the server