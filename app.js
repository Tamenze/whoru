var express = require('express');
var app = express();
var Twitter = require('twitter');

var client = new Twitter({
        consumer_key: process.env.OUTLINE_CONSUMER_KEY,
        consumer_secret: process.env.OUTLINE_CONSUMER_SECRET,
        access_token_key: process.env.OUTLINE_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.OUTLINE_ACCESS_TOKEN_SECRET
})


// app.get('/api', function(req,res){
// 		getBio(req,res)
// });

app.get('/api/:searchHandle/:searchTerm', function(req,res){
		getBio(req.params, res)
});
//http://expressjs.com/en/guide/routing.html#route-parameters

app.use('/', express.static('dist'));


function getBio(params,res){

	console.log(params);
	// console.log("api call started");
	client.get('followers/ids',{cursor: -1, screen_name: params.searchHandle, count: 5000}, 
	function(error, tweets, response){
		if(error){
			console.log(error)
		};
		// res.send(response)
		console.log("fetching");
		var follower_ids = JSON.parse(response.body).ids;
		var newArr = [];
		for (i = 0; i < follower_ids.length; i+=100){
			newArr.push(follower_ids.slice(i,i+100))
		}

		var secArr = [];
		var itemsProcessed = 0;

		newArr.forEach(function(innerArr){
				client.post('users/lookup', {user_id: innerArr.join(',')}, function (error, tweets, response){
					if(error){
						console.log(error);
					};
					var x = JSON.parse(response.body)
					i = 0;
					// console.log("lookup length: " + x.length);

					x.forEach(function(user){
						if(user.description.toLowerCase().includes(params.searchTerm.toLowerCase())){
							// console.log(user);					   
							var y = {userHandle: user.screen_name, userDescription:user.description, userName: user.name};
							secArr.push(y);
							i++;
						}
					})
					console.log("still fetching");
					itemsProcessed ++;
					if (itemsProcessed === newArr.length){
						console.log("last 100 array reached");
						// console.log(__dirname + '/dist/index.html');

						res.json({ data: secArr }); //sends response as json (data) to appcomponent (bc fetched it)
					}

				})

		})


	})
};	




app.listen(3000);




