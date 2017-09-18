import React, { Component } from 'react';
// import '../App.css';
import Background from '../Lines.gif';


export default class AppComponent extends Component {
  constructor(props){
    super(props);
    this.state = {
      targetHandle: '',
      targetTerm: '',
      userSignedIn: false,
      results: [],
      fetchInProgress: false,
      noResults: false,
      waitTime: '',
      errorMessage: '',
      remainingRequests: ''
    }

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSignOut = this.handleSignOut.bind(this);

    this.renderResults = this.renderResults.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.renderNone = this.renderNone.bind(this);
    this.renderError = this.renderError.bind(this);
    this.renderRemainingRequests = this.renderRemainingRequests.bind(this);
  }


  handleInputChange(event){
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSignOut(){
    fetch('api/signOut',{credentials: 'include'})
    .then(
      response => response.json()
    )
    .then(
      (result) =>{
        // console.log("sign out return: ", result.data)
        this.setState({userSignedIn: result.data})
      }
    )
  }

  handleSubmit(event){
    event.preventDefault();
    this.setState({
      fetchInProgress: true,
      targetHandle: this.state.targetHandle,
      targetTerm: this.state.targetTerm,
      noResults: false,
      errorMessage: '',
      results: []
    }),

    //EVERY REQUEST SHOULD RETURN THE NUMBER OF REMAINING REQUESTS
      
    fetch(`api/${this.state.targetHandle}/${this.state.targetTerm}`, { credentials: 'include'}) 
    //bc fetch by default doesnt send along cookies with the request
    .then(function(response){
      if(!response.ok){
        console.log("Sorry Tolu, there was an error with the fetch.")
        throw Error(response.statusText); //this comes up when searching for hashtags

      }
      return response
    })
    .then(
      response => response.json() //decoding the json we sent from the express server
    )
    .then(
      (result) => {
        console.log("FOO",result)
        if (!result.err && result.data.length > 0 && !result.reset){
          //IS THERE EVER A CASE WHERE I SEND BACK AN ERROR AND A FULL DATA ARRAY FROM SERVER? 
          //no errors, data array returns at least one result, no max reached, no result.reset
          const relevantFollowers = result.data;
          const remainder = result.remaining;
          this.setState({ 
            results: relevantFollowers,
            fetchInProgress: false,
            remainingRequests: remainder
          })
        }else if(!result.err && result.data.length > 0){
          //if there is no error, non empty data array BUT
              // there is a max reached, and a reset 
          //this occurs in the final else if in app.js, when too many requests but still want to send the results we received
          const relevantFollowers = result.data;
          const remainder = result.remaining;
          // const reset = result.reset
          let myDate = new Date(parseInt(result.reset)*1000)
          let localDate = myDate.toLocaleTimeString()
          const reset = localDate
          console.log('resets at: ',reset)
          this.setState({ 
            results: relevantFollowers,
            fetchInProgress: false,
            waitTime: reset,
            remainingRequests: remainder
          })
        } else if(result.err ){
          //if there is an error (that got through the fetch error catch above), set state, and renders error message on page (using renderError function made)
          console.log(result.err)
          const remainder = result.remaining;
          let error = result.err[0].message || result.err

          if (result.reset){
            console.log("reset ", result.reset);
            let myDate = new Date(parseInt(result.reset)*1000)
            const reset = myDate.toLocaleTimeString()
            this.setState({waitTime: reset})
          }

          this.setState({
            errorMessage: error,
            fetchInProgress: false,
            remainingRequests: remainder
          })
        }
        else if(result.data.length === 0){
          //calls renderNone function to show "No results found."
          const remainder = result.remaining;
          console.log("no results found")
          this.setState({ 
          noResults: true,
          fetchInProgress: false,
          remainingRequests: remainder
          })
        }else{
          console.log("else line 147 reached")
        }

      }
    )
    // .catch(
    //   e => e
    // );
  }

  renderError(){
    if(this.state.remainingRequests === 0){
      return <h1 className="alert alert-danger">{this.state.errorMessage} Please wait until {this.state.waitTime} to make another request.</h1>
    }else if (this.state.errorMessage){
      return <h1 className="alert alert-danger"> {this.state.errorMessage} </h1>
    }
  }

  renderNone(){
    if(this.state.noResults){
      return <h1 className="alert alert-info"> No results found.</h1>
    }
  }

  componentDidMount(){
    fetch('api/checkLoggedIn', { credentials: 'include'})
    .then(
      response => response.json()
    )
    .then(
      (result) => {
        console.log("user check: ", result.data);
        if (result.data){
          this.setState({userSignedIn: result.data})
        }
      }
    )
  }


  renderForm(){
    if(this.state.userSignedIn){
    return <div className="marginCenter"> 
            <form className = "form-inline" onSubmit={this.handleSubmit}>

              <label className="sr-only" htmlFor="inlineFormInputGroup"> Handle </label>
              <div className="input-group mb-2 mr-sm-2 mb-sm-0">
                <div className="input-group-addon">@</div>
                <input type="text" className=
                "form-control inlineFormInputGroup" name="targetHandle" placeholder = "Handle" onChange={this.handleInputChange}/>
                <small className="underHelp"> User should have under 75k followers.</small>
              </div>

              <label className="sr-only" htmlFor="inlineFormInputGroup"> Search Term </label>
              <input type="text" className="form-control mb-2 mr-sm-2 mb-sm-0 inlineFormInputGroup" name="targetTerm" placeholder="Search Term" onChange={this.handleInputChange}/>

              <input type="submit" value="Search" className="btn btn-primary"/>
            </form>

            <br/>

            <div>
              <button type="submit" onClick={this.handleSignOut} data-toggle="tooltip" data-placement="top" title="Tooltip on top"> 
                Sign Out
              </button>  
            </div>

          </div> 
    }else{
      return <div className="marginCenter">
              <button> 
              <a href="/login/twitter">Sign In With Twitter</a>
              </button>  
            </div>
    }
  }

  renderResults(followers){
    if(this.state.fetchInProgress){
      return <div className="loading col-md-8 centric" style={backstyle}> 
                <img className="vert-centric" src={require('../tiffany.gif')}/>
                <h2 className="load-notice"> One moment please</h2>
              </div>
    }else if((this.state.fetchInProgress === false) && followers.length > 0){
      if ((this.state.remainingRequests === 0) && this.state.waitTime){
        return <div className="col-md-10">
            <h1> You have reached your maximum # of requests. Please wait {this.state.waitTime} before searching again.</h1> 
            <FollowerTable followers={this.state.results}/>
            </div>
      }
      return <div className="col-md-10">
            <FollowerTable followers={this.state.results}/>
            </div>
    }
      return 
  }

  renderRemainingRequests(){
    if (this.state.remainingRequests){
      return <div className="col-md-10"> {this.state.remainingRequests} requests remaining</div>
    }
  }

  render() {
    const followers = this.state.results;

    return (
      <div>
        <div className="jumbotron jumbotron-fluid col-md-8 centric">
          <div className="container">
            <h1 className="display-3">
              Hi, Who Are You? 🤔 
            </h1> 
            <h5 className="lead">
              Search your Followers' Twitter Bios
            </h5>
            <hr/>
            <h5 className="lead"> 
              A tool for Journalists developed at <a href="https://www.theoutline.com">The Outline</a>
            </h5>
            <br/>

            <div className="row marginCenter">
            {this.renderForm()}
            </div>
          </div>
        </div>
        <div className="row justify-content-md-center centric">
            {this.renderRemainingRequests()}
            {this.renderNone()}
            {this.renderError()}
            {this.renderResults(followers)}
        </div>
      </div>
    );
  }
}



const backstyle = {
  // backgroundImage: `url(${Background})`
  backgroundColor: 'black'
}

const FollowerTable = ({followers}) =>
  <table className="table table-bordered table-responsive">
    <thead>
      <tr >
        <th className="centric">#</th>
        <th className="centric">Handle</th>
        <th className="centric">Description</th>
        <th className="centric">Name</th>
      </tr>
    </thead>
    <tbody>
    {followers.map( (follower, i) => 
    <tr key={i}>
      <th scope="row">
        {i+1}
      </th>
      <td>
        <a href={`https:\/\/www.twitter.com/${follower.userHandle}`} target="_blank">
          {`@${follower.userHandle}`}
        </a>
      </td>
      <td>
        {follower.userDescription} 
      </td>
      <td>
        {follower.userName} 
      </td>
    </tr>
    )}
    </tbody>
  </table>

