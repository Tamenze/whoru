const getRateLimit = (client) => {
  return client
    .get("application/rate_limit_status", {
      resources: "followers",
    })
    .then(function (data) {
      let remainingReqs = data.resources.followers["/followers/ids"].remaining;
      let reset = data.resources.followers["/followers/ids"].reset;

      let myDate = new Date(parseInt(reset) * 1000);
      let expireTime = myDate.toLocaleTimeString();

      // console.log("remaining requests: ", remainingReqs);
      // console.log("expireTime: ", expireTime);
      // console.log("reset: ", reset);
      if (remainingReqs <= 0) {
        return Promise.reject(
          `Not enough requests left. Please wait until ${expireTime} EDT to search.`
        );
      }
      return { remainingReqs, reset };
    });
};

module.exports.getRateLimit = getRateLimit;
