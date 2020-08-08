const lookUpTerm = (client, bunch, searchTerm) => {
  //returns an array of info from up to 100 followers
  const cleanSearchTerm = searchTerm.toLowerCase();
  return client
    .post("users/lookup", {
      user_id: bunch.join(","),
    })
    .then(function (profiles) {
      return profiles
        .filter(function (profile) {
          const cleanDescription = profile.description.toLowerCase();
          return cleanDescription.includes(cleanSearchTerm);
        })
        .map(function (user) {
          return {
            userHandle: user.screen_name,
            userDescription: user.description,
            userName: user.name,
          };
        });
    });
  //.then always passes the result of the promise to the function named
};

module.exports.lookUpTerm = lookUpTerm;
