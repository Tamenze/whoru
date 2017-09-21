var express = require('express');
var app = express();
var Twitter = require('twitter');
var passport = require('passport');
var Promise = require('promise');
var Strategy = require('passport-twitter').Strategy;


passport.use(new Strategy({
	consumerKey: process.env.BIOTWIT_CONSUMER_KEY,
	consumerSecret: process.env.BIOTWIT_CONSUMER_SECRET,
	callbackURL: 'http://127.0.0.1:3000/login/twitter/return'
},
	function(token, tokenSecret, profile, cb){	
		return cb(null, {token: token, tokenSecret: tokenSecret, signedIn: true})
	}
));

passport.serializeUser(function(user,cb){
	cb(null, user);
});

passport.deserializeUser(function(obj, cb){
	cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

app.use(require('morgan')('combined')); //look into
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true})); 
app.use(require('express-session')({secret: 'keyboard dog', resave: true, saveUninitialized: true}));




app.get('/login/twitter',
  passport.authenticate('twitter',{ forceLogin: true }),
  function(req,res){
  }
); 


app.get('/login/twitter/return', //the callback we specified at the top
  passport.authenticate('twitter', { failureRedirect: '/login' }), 
  function(req, res) {
    res.redirect('/'); //if successful authentication, redirect to /
  });


app.get('/api/checkLoggedIn', function(req,res){
//if token there, return it, and then on react side, change state
	if (req.session.passport && req.session.passport.user.token){
		console.log("there is a user");
		res.json({data: req.session.passport.user.signedIn});
	}
})

app.get('/api/signOut', function(req,res){
	req.session.destroy(function(err){
		console.log("req sessions: ", req.session);
		res.json({data: false})
	})
})


app.use('/', express.static('dist'));


app.get('/api/:searchHandle/:searchTerm', function(req,res){ 
	console.log(req.params);
	getBio(req, res) 

});


function getBio(request,response){

	const client = new Twitter({
		consumer_key: process.env.BIOTWIT_CONSUMER_KEY,
		consumer_secret: process.env.BIOTWIT_CONSUMER_SECRET,
		access_token_key: request.session.passport.user.token,
		access_token_secret: request.session.passport.user.tokenSecret
	})

	const searchHandle = request.params.searchHandle
	const searchTerm = request.params.searchTerm

	getRateLimit(client)
		.then( () => getUser(client, searchHandle) )
		.then( () => getFollowers(
			client, 
			{
				searchHandle, 
				searchTerm, 
				cursor: -1, 
				followers:[]
			})
		)
		.then( (data) => response.json({data: data.newFollowers, reset: data.expiration, remaining: data.remaining}))

		// .then((data) => console.log(data))

		.catch( (err) => {
			console.log(err);
			response.json({err: err,remaining: remainingReqs })
		})
}



function getFollowers(client, {searchHandle, searchTerm, cursor, followers}){
	return client.get('followers/ids',
		{
			cursor: cursor, 
			screen_name: searchHandle, 
			count: 5000
		})
		.then(function(tweets){
			let followerBunches = [];
			let newCursor = parseInt(tweets.next_cursor_str);
			let follower_ids = tweets.ids;
			for (let i = 0; i < follower_ids.length; i+=100){
				followerBunches.push(follower_ids.slice(i,i+100))
			};

			const promiseArray = followerBunches.map(function(bunch){ //bunch is called a bound variable
				return lookupBunch(client,bunch,searchTerm)
				//searchTerm is called a free variable
			})
			// return Promise.all(promiseArray) //returns a promise that takes an array (promiseArray) of all the arrays returned from lookupBunch 

			return Promise.all(promiseArray).then(function(followerChunks){
				return {followerChunks, newCursor, client}
			})
		})
			.then(
				function(data){
				const followerChunks = data.followerChunks
				const cursor = data.newCursor
				
				const newFollowers = [].concat(...followerChunks);
				const clientele = data.client

				if (cursor !== 0){
					return getFollowers(client, 
						{
							searchHandle, 
							searchTerm, 
							cursor, 
							followers: followers.concat(newFollowers)
						})
				}
				else{
					return getRateLimit(clientele)
					.then(
						function(rateObj){
						return{ 
							remaining: rateObj.remainingReqs, 
							expiration: rateObj.expireTime,
							newFollowers
						}
					})
				}
			})

}


function lookupBunch(client, bunch,searchTerm){//returns an array of info from up to 100 followers
	const cleanSearchTerm = searchTerm.toLowerCase()
	return client.post('users/lookup',
		{
			user_id: bunch.join(",")
		})
		.then(function(profiles){
			return profiles.filter(function(profile){
				const cleanDescription = profile.description.toLowerCase()
				return cleanDescription.includes(cleanSearchTerm)
			}).map(function(user){
				return {userHandle: user.screen_name, userDescription: user.description, userName: user.name}
			})

		})
		//.then always passes the result of the promise to the function named
}



function getUser(client, searchHandle){
	return client.post('users/lookup',
		{
			screen_name: searchHandle
		})
		.then(function(tweets){
			const followerCount = tweets[0].followers_count
			if (followerCount >= 75000){
				return Promise.reject("The requested user has too many followers.");
				//chains the string to our error that we return
			} 
		})
}

function getRateLimit(client){
	return client.get('application/rate_limit_status',
			{
				resources: 'followers'
			})
			.then(function(data){
				remainingReqs = data.resources.followers["/followers/ids"].remaining;	
				reset = data.resources.followers["/followers/ids"].reset;

          	myDate = new Date(parseInt(reset)*1000)
            expireTime = myDate.toLocaleTimeString()

				if (remainingReqs <= 0){
					return Promise.reject(`Not enough requests. Please wait until ${expireTime} to search.`);
				}
				return {remainingReqs, expireTime}
			})
}

app.listen(3000);




