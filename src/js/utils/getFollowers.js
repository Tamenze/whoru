const lookUpTerm = require("./lookUpTerm").lookUpTerm;
const getRateLimit = require("./getRateLimit").getRateLimit;

const getFollowers = (
  client,
  { searchHandle, searchTerm, cursor, followers }
) => {
  return (
    client
      .get("followers/ids", {
        cursor: cursor,
        screen_name: searchHandle,
        count: 5000,
      })
      .then(function (tweets) {
        let followerBunches = [];
        let newCursor = parseInt(tweets.next_cursor_str);
        let follower_ids = tweets.ids;
        for (let i = 0; i < follower_ids.length; i += 100) {
          followerBunches.push(follower_ids.slice(i, i + 100));
        }

        const promiseArray = followerBunches.map(function (bunch) {
          //bunch is called a bound variable
          return lookUpTerm(client, bunch, searchTerm);
          //searchTerm is called a free variable
        });

        return Promise.all(promiseArray).then(function (followerChunks) {
          // console.log(promiseArray.length);
          // if (promiseArray.length >= 750) {
          //   // return error
          //   // console.log("user must have less than 75k followers");
          //   return;
          // } else {
          //   //
          return { followerChunks, newCursor, client };
          // }
          // return Promise.all(promiseArray) //returns a promise that takes an array (promiseArray) of all the arrays returned from lookupTerm
        });
      })
      //
      .then(function (data) {
        const followerChunks = data.followerChunks;
        const cursor = data.newCursor;

        const newFollowers = [].concat(...followerChunks);
        const clientele = data.client;

        if (cursor !== 0) {
          return getFollowers(client, {
            searchHandle,
            searchTerm,
            cursor,
            followers: followers.concat(newFollowers),
          });
        } else {
          return getRateLimit(clientele).then(function (rateObj) {
            console.log("rate Obj: ", rateObj);
            return {
              remaining: rateObj.remainingReqs,
              expiration: rateObj.reset,
              newFollowers,
            };
          });
        }
      })
  );
};

module.exports.getFollowers = getFollowers;
