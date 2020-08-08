## Hi, Who Are You? 🤔
This app was commissioned by my former boss [Adrianne Jeffries](https://twitter.com/adrjeffries), during her time as an editor at [The Outline](https://theoutline.com/). She needed a way to parse her social media following for potential sources to contact for reporting on tech, and since Twitter currently has no way of doing that, the idea for this app was born. 

It allows you to search through your (or anyone's) Twitter followers for a specific term or phrase (ex: "Google" or "design") to find those followers who have that term in their Twitter bio. Often people list their employer or field of work in their bio, so this introduces a new people search engine for our modern times – it's helpful not only for journalists, but for job seekers, and really anyone who is trying to find specific connections on Twitter. 

You can find a deployed version of this app [here](http://hiwhoru.herokuapp.com/).

## Tech
This app uses the following technologies:
1. [React with Webpack](https://facebook.github.io/react/) for compiling
2. [Bootstrap](https://react-bootstrap.github.io/) for styling
3. [Twitter's Rest API](https://developer.twitter.com/en/docs/basics/getting-started)
4. [Node](https://nodejs.org/en/)/[Express](https://expressjs.com/) back-end for routing

## Running Locally 
* To run locally, comment in the local callback url in app.js and comment out the online version. You'll also need to have admin privileges in the developer.twitter.com dashboard and change the callback url there as well to the local version. 
* Visit `http://127.0.0.1:3000/` instead of `localhost:3000`, the latter will give an error when trying to sign in to Twitter. [Details here](https://github.com/jaredhanson/passport-twitter/issues/45).
* When making cosmetic changes, run `npm run-script watch` in an additional terminal window alongside `npm start` in the other. 