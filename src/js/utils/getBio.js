var Twitter = require("twitter");
const getRateLimit = require("./getRateLimit").getRateLimit;
const getFollowers = require("./getFollowers").getFollowers;
const getUser = require("./getUser").getUser;

//test
const getBio = (request, response) => {
  const client = new Twitter({
    consumer_key: process.env.BIOTWIT_CONSUMER_KEY,
    consumer_secret: process.env.BIOTWIT_CONSUMER_SECRET,
    access_token_key: request.session.passport.user.token,
    access_token_secret: request.session.passport.user.tokenSecret,
  });

  const searchHandle = request.params.searchHandle;
  const searchTerm = request.params.searchTerm;

  getRateLimit(client)
    .then(() => getUser(client, searchHandle))
    .then(() =>
      getFollowers(client, {
        searchHandle,
        searchTerm,
        cursor: -1,
        followers: [],
      })
    )
    .then((data) =>
      response.json({
        data: data.newFollowers,
        reset: data.expiration,
        remaining: data.remaining,
      })
    )
    // .then((data) => console.log(data))
    .catch((err) => {
      console.log(err);
      response.json({ err: err });
    });
};

module.exports.getBio = getBio;
