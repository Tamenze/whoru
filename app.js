var express = require('express');
var app = express();
var Twitter = require('twitter');
var passport = require('passport');
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
	// console.log("deserialize", obj);
	cb(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

app.use(require('morgan')('combined')); //look into
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true})); //LOOK INTO DIFF FROM 60,61 BELOW
app.use(require('express-session')({secret: 'keyboard dog', resave: true, saveUninitialized: true}));




app.get('/login/twitter',
  passport.authenticate('twitter',{ forceLogin: true }),
  function(req,res){
  }
); 


app.get('/login/twitter/return', //the callback we specified at the top
  passport.authenticate('twitter', { failureRedirect: '/login' }), 
  function(req, res) {
  	// console.log(req.session);
  	// console.log("user is", req.user)
  	// acquiredKey = req.user.token;
	// acquiredSecret = req.user.tokenSecret;
	// res.json(user: "signed in"); //here trying to change state on front end, so userSignedIn is true
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


//http://expressjs.com/en/guide/routing.html#route-parameters
app.get('/api/:searchHandle/:searchTerm', function(req,res){
		getBio(req, res) 

});

function getBio(req,res){
	const client = new Twitter({
        consumer_key: process.env.BIOTWIT_CONSUMER_KEY,
        consumer_secret: process.env.BIOTWIT_CONSUMER_SECRET,
        access_token_key: req.session.passport.user.token,
        access_token_secret: req.session.passport.user.tokenSecret
	})
	let reset;
	let remainingReqs;
	let itemsProcessed = 0;
	var newArr = [];
	var secArr = [];

	function getRateLimit(){
		client.get('application/rate_limit_status',{resources: 'followers'}, function(req, res){
		remainingReqs = res.resources.followers["/followers/ids"].remaining;	
		console.log("remaining requests: ", remainingReqs);
		reset = res.resources.followers["/followers/ids"].reset;				
		})
	}
	getRateLimit();

	//1st check of information for follower count, if <75k, goes ahead with parsing
	client.post('users/lookup',{screen_name: req.params.searchHandle},function(error, tweets, response){
		if(error){
		res.json({err: error[0].message, remaining: remainingReqs});
		console.log(error);
		res.end() 
		};
		
		const followerCount = JSON.parse(response.body)[0].followers_count
		if (followerCount > 75000){
			res.json({err: "Queried User must have < 75K followers", remaining: remainingReqs})
			//think i need to return from entire function, not just this inner one
		}else{
			client.get('followers/ids',{cursor: -1, screen_name: req.params.searchHandle, count: 5000}, 
				function(error, tweets, response){
					if(error){
						console.log("error from line 127")
						console.log(error, reset, remainingReqs);
						res.json({err: error[0].message, reset: reset, remaining: remainingReqs});
						res.end()
					};

					
					var next = parseInt(tweets.next_cursor_str);
					var follower_ids = JSON.parse(response.body).ids;
					for (i = 0; i < follower_ids.length; i+=100){
						newArr.push(follower_ids.slice(i,i+100))
					};


					console.log("next cursor: ", next);
					if (next !== 0){
						console.log(`next is not zero, it is ${next}, now calling getNextFollowers for 1st time`)
						getNextFollowers(next);	
					}else{
						createAndSendFollowerResponse("notzero") //this is messy and dangerous
					}



					function getNextFollowers(){
						client.get('followers/ids',{cursor: next, screen_name: req.params.searchHandle, count:5000},function(error,tweets,response){
									if(error){
										// console.log("error: ",error[0].message )
										console.log("error from line 158")
										console.log(error, reset);
										res.json({err: error[0].message, reset: reset, remaining: remainingReqs});
										return
									};

							//add ids from this response to outside array 
							follower_ids = JSON.parse(response.body).ids;
							for (i = 0; i < follower_ids.length; i+=100){
								newArr.push(follower_ids.slice(i,i+100))
							}
							//reset next to be the next cursor string from THIS call's response
							next = parseInt(tweets.next_cursor_str);

							//make call to get rate limit status at the end of each get request 
							getRateLimit();

							//if we still have remaining requests to use & the next cursor isn't zero, go ahead and call getnext followers again 
							if (next!==0 && remainingReqs!==0){
								getNextFollowers(next); 
							} else if(next === 0 && remainingReqs!==0){	
								//but if we dont have remaining requests and the next cursor is zero, we're all good. we called get/followerids twice, and since the second time there was no next page (user had 10k or less followers), we are done and sending an array to the front end
								console.log("next was 0, remaining reqs were not");
								createAndSendFollowerResponse("notzero"); 
							}else if (next!==0 &&remainingReqs === 0){
								//but if the next cursor isnt zero AND we don't have remaining requests left to call another get, we call a function that just posts the followers we have accumulated already (in newArr), as well as the maxReached flag and the reset time to the front end
								console.log("next wasn't 0, but no remaining requests");
								createAndSendFollowerResponse("zero");

								//if ^happens to user and they refresh and try again, should hit res.json in the initial get call above (line 97)

								//tell user that an email service will email them the results in _ minutes  
								//how would i implement the email thing? and make it only hang for this user? 
							}
						})
					}
							
					function createAndSendFollowerResponse(arg){
						newArr.forEach(function(innerArr){
							client.post('users/lookup', {user_id: innerArr.join(',')}, function (error, tweets, response){
								if(error){
									// getRateLimit()
									console.log(error, reset); 
									console.log("error from line 201")
									// console.log(error[0].message);
									res.json({err: error, reset: reset, remaining: remainingReqs});
									return
									// throw error
								};
								var x = JSON.parse(response.body);
								i = 0;

								x.forEach(function(user){
									if(user.description.toLowerCase().includes(req.params.searchTerm.toLowerCase())){
										var y = {userHandle: user.screen_name, userDescription:user.description, userName: user.name};
										secArr.push(y);
										i++;
									}
								});
								
								itemsProcessed ++; //iterates per array of 100 items
								console.log("still fetching: ", itemsProcessed);
								if (itemsProcessed === newArr.length){
								getRateLimit();
									if(arg === "notzero"){
										console.log("last 100 array reached, none left");
										res.json({ data: secArr ,remaining: remainingReqs})	
									}else if(arg ==="zero"){
										console.log("no requests remaining");
										res.json({ data: secArr, reset: reset, remaining: remainingReqs})
									}

								}
							})
						})
					}//end of createAndSendFollowerResponse

			}) //end of inner client call to twitter api
		} //end of if else 

	})//end of original client call

};	




app.listen(3000);




