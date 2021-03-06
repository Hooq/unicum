#!/bin/bash

ID=$(docker inspect --format '{{ .Id }}' redis_cli 2> /dev/null)
if [ ! -z "$ID" ]; then
    sudo docker stop redis_cli
    sudo docker rm redis_cli
fi

sudo docker run -ti \
    --name redis_cli \
    --link unicum_redis:unicum_redis \
    redis \
    bash -c 'redis-cli -h "$UNICUM_REDIS_PORT_6379_TCP_ADDR"'
