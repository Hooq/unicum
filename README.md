Unicum
=============

A restful server for unique id generation


## The key format

Unicum is based on Redis and uses integer in base 62 so that, for example, the key `2T4QmCrM03` is made up of 3 parts: 

`2T4QmC` `rM` `03`


`2T0QmC` is the difference between the current timestamp in microseconds and the epoch when you initialize the server. 
Specifically, the microseconds are in the last 4 digit `0QmC` and the seconds from the epoch are the rest `2T`.

`rM` is a variance on the single shard, managed with a sequence.

`03` is the key type.


## Why the keys are unique

Unicum uses Redis to generate the keys. First off, when you start the server for the first time, it takes the current timestamp and set the epoch (in seconds, like a Linux timestamp).

In the following, when you generate a key, Unicum read the time in Redis and use the difference in seconds between the 
current time and the epoch, and the microseconds in the following 4 digit.  


## Usage

You can use unicum.js in a Node application, as a library, or, preferably, starting the Unicum server. This is
based on Docker and can be downloaded and ran in a minute or less.

To start the server you can run the shell script `run.sh`.

It will create 

1. a data container, `unicum_data`, based on *busybox*, 
2. a redis container, `unicum_redis`, based on *dokcerfile/redis*
3. the Unicum container, `unicum`, based on *node*, listening on the post `9691`


###`/generate/:type`

Generates a key of type `type`. For example `/generate/avatar` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0204",
        "type": "avatar"
    }


###`/convert/:existent_key/:new_type`
	
Generates 1 derivated key of type `new_type` from `existent_key`. For example `/convert/P7u1Xcq0204/user` returns
	
	{
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "type": "user"
    }
	
###`/info/:key`
   
Returns info about a key. For example `/info/P7u1Xcq0205` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "type": "user",
        "date": "2014-11-16T07:27:15:14Z"
    }
    
###`/time/:key`
    
Returns the timestamp in milliseconds of the key. For example `/time/P7u1Xcq0205` returns
    
    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "time": 1416122835014
    }
	
###`/date/:key'

Returns the date of the key in ISO format. For example `/date/P7u1Xcq0205` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "date": "2014-11-16T07:27:15:14Z"
    }
	
###`/fulltime/:key'
	
Returns the time in seconds and microseconds of the key. For example `/fulltime/P7u1Xcq0205` returns

    {
        "success": true,
        "code": 200,
        "key": "P7u1Xcq0205",
        "seconds": 1416122827,
        "micros": 8014120
    }
    
###`/epoch`    
	
Return the epoch. For example, in our case:
								
    {
        "success": true,
        "code": 200,
        "epoch": 1410134246
    }	
    							
###`/export`
    							
Returns a config object that can be used to restore the data in case you loose, for some reason, the Redis data. To avoid this 
you should backup the unicum_data container using, for example, [Docker-backup](https://github.com/discordianfish/docker-backup)

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
			
###`/init?config=<escaped_config_object>`
													
Initialize with existent data a new Unicum server. This action will fail if the server is already configured.

###`/restore/:secret?config=<escaped_config_object>`

Forces the reconfiguration of the server. To reduce the risk, you need to use a secret that will be generated the first time you
run the server. This secret is stored in the /log/unicum.log file. You can see this file running, for example:

    docker run -ti --volumes-from unicum_data --name viewer sullof/unicum bash -c 'less /log/unicum.log'
													
													
## Credits

Unicum is (c) Francesco Sullo <fs@hooq.co>

## License 

(The MIT License)

Copyright (c) 2014 Hooq <os@hooq.co>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	