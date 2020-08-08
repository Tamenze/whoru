const getUser = (client, searchHandle) => {
  return client
    .post("users/lookup", {
      screen_name: searchHandle,
    })
    .then(function (tweets) {
      const followerCount = tweets[0].followers_count;
      if (followerCount >= 75000) {
        return Promise.reject("The requested user has too many followers.");
        //chains the string to our error that we return
      }
    });
};

module.exports.getUser = getUser;
