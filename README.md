Unicum
=============

A restful server for unique id generation developed on the hashes of [ShardJS](https://github.com/sullof/shardjs).


## The key format

Unicum is based on Redis and uses integer in base 62 so that, for example, the key `2T4QmCrM03` is made up of 3 parts: 

`2T4QmC` `rM` `03`


`2T0QmC` is the difference between the current timestamp in microseconds and the epoch when you initialize the server. 
Specifically, the microseconds are in the last 4 digit `0QmC` and the seconds from the epoch are the rest `2T`.

`rM` is a variance for the specific type, managed with a sequence.

`03` is the key type.


## Why the keys are unique

Unicum uses Redis to generate the keys. First off, when you start the server for the first time, it takes the current timestamp and set the epoch (in seconds, like a Linux timestamp).

In the following, when you generate a key, Unicum read the time in Redis and use the difference in seconds between the current time and the epoch, and the microseconds in the following 4 digit. It uses this as the first part of the key, adding a variant (to avoid keys in the same microseconds -- despite this is very unlikely) and 2 digit for the key type. 

This way your key is a *talking key* that contains info about what it is and when it has been generated.


## Usage

You can use unicum.js in a Node application, as a library, or, preferably, starting the Unicum server. This is based on Docker and can be downloaded and ran in a minute or less.

To install the server, Docker has to be installed on your server. If not, look at [http://docs.docker.com/installation/](http://docs.docker.com/installation/). To start the server, you can run the shell script `run.sh`, cloning this repository, or executing the `run.sh` file directly from GitHub:
                                                                                                     
    curl -sSL https://raw.githubusercontent.com/Hooq/unicum/master/run.sh | sudo sh


It will create 

1. a data container, `unicum_data`, based on [busybox](https://registry.hub.docker.com/_/busybox/), 
2. a redis container, `unicum_redis`, based on [redis](https://registry.hub.docker.com/_/redis/)
3. the Unicum container, `unicum`, based on [hooq/unicum](https://registry.hub.docker.com/u/hooq/unicum/), listening on the post `9691`

The image `hooq/unicum`, has been built using the Dockerfile in this repository. If you prefer, you can build it with

    docker build -t <your_docker_username>/unicum .

If you call the Unicum server from inside other containers, the best way to connect them is to use a link. For example:

    docker run -d --link unicum:unicum dockerfile/python



## The API

To call the api, you just need to call the Unicum server which exposes the port 6961 on localhost:

    http://localhost:6961/<api>

If you need to use a different port number, just modify the `run.sh` file and run it again.

### Generate

#####`/generate/:type`

Generates a key of type `type`. For example `/generate/avatar` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0204",
        "type": "avatar"
    }

### Info
	
#####`/info/:key`
   
Returns info about a key. For example `/info/P7u1Xcq0205` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "type": "user",
        "date": "2014-11-16T07:27:15:14Z"
    }
    
### Time  
    
#####`/time/:key`
    
Returns the timestamp in milliseconds of the key. For example `/time/P7u1Xcq0205` returns
    
    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "time": 1416122835014
    }
	
### Date	
	
#####`/date/:key`

Returns the date of the key in ISO format. For example `/date/P7u1Xcq0205` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "date": "2014-11-16T07:27:15:14Z"
    }
	
### Fulltime
	
#####`/fulltime/:key`
	
Returns the time in seconds and microseconds of the key. For example `/fulltime/P7u1Xcq0205` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "seconds": 1416122827,
        "micros": 8014120
    }
    
### Epoch
    
#####`/epoch`    
	
Return the epoch. For example, in our case:
								
    {
        "success": true,
        "code": 200,
        "epoch": 1410134246
    }	
    	
### Export
    												
#####`/export`
    							
Returns a config object that can be used to restore the data in case you loose, for some reason, the Redis data. 

A tipical response is like the following:
  
    {
        "success": true,
        "config": {
            "epoch": 1410134246,
            "codes": {
                "user": 0,
                "avatar": 1,
                "post": "2",
                "comment": "3"
            }
        }
    }

In general, when you use pure data containers, you should backup them. Personally, I use [Docker-backup](https://github.com/discordianfish/docker-backup) for this.
			
### Init
			
#####`/init?config=<escaped_config_object>`
													
Initialize with existent data a new Unicum server. This action will fail if the server is already configured.

### Restore

#####`/restore/:secret?config=<escaped_config_object>`

Forces the reconfiguration of the server. To reduce the risk, you need to use a secret that will be generated the first time you run the server. This secret is stored in the /log/unicum.log file. You can see this file running, for example:

    docker run -ti --volumes-from unicum_data busybox cat /log/unicum.log

### Wrong API

If you call a wrong API the response will be:

    {
        "success": false,
        "code": 404,
        "message": "Wrong api call."
    }
																						
## Checking the database
																						
You can check the database running a second Redis container with the script `run_redis_cli.sh` or executing
																						
    sudo docker run -ti \
        --name redis_cli \
        --link unicum_redis:unicum_redis \
        dockerfile/redis \
        bash -c 'redis-cli -h "$UNICUM_REDIS_PORT_6379_TCP_ADDR"'
										

																																		
## Next step
																																		
Container linking via [Serf](http://www.serfdom.io).
																																		
													
## Credits

Unicum has been developed by Francesco Sullo <fs@hooq.co>

## License 

(The MIT License)

Copyright (c) 2014 Hooq <os@hooq.co>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	
