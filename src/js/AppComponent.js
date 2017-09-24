import React, { Component } from 'react';


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
    });

    if (this.state.targetTerm === " " ||this.state.targetHandle ===" "){
      // console.log("something is empty");
      this.setState({
        fetchInProgress: false,
        errorMessage: "Something is empty."
      })
      return
    }
    
    const encodedTerm = encodeURIComponent(this.state.targetTerm)  
    fetch(`api/${this.state.targetHandle}/${encodedTerm}`, { credentials: 'include'}) 
    .then(
      response => response.json() 
      //decoding the json we sent from the express server
    )
    .then(
      (result) => {
        console.log("FOO",result)
        if(result.err){
          const remainder = result.remaining;
          const reset = result. reset
          const error = result.err[0].message || result.err 
          this.setState({
            errorMessage: error,
            fetchInProgress: false,
            remainingRequests: remainder,
          })
        }else if (result.data.length > 0){ 
          //data array returns and has at least one result
          const relevantFollowers = result.data;
          const remainder = result.remaining;
          this.setState({ 
            results: relevantFollowers,
            fetchInProgress: false,
            remainingRequests: remainder
          })
        }else if(result.data.length <= 0){
          // console.log("No results found")
          //calls renderNone function which shows "No results found."
          //here in case server doesnt error when no results found.
          const remainder = result.remaining;
          this.setState({ 
          noResults: true,
          fetchInProgress: false,
          remainingRequests: remainder
          })
        }
      })
      .catch( () => {
        this.setState({
            fetchInProgress: false,
            errorMessage: "Something went wrong."
        })
      })

  } //close of handleSubmit

  renderError(){
    if (this.state.errorMessage){
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
        // console.log("user check: ", result.data);
        if (result.data){
          this.setState({
            userSignedIn: result.data,
            fetchInProgress: false

          })
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
                "form-control inlineFormInputGroup" name="targetHandle" placeholder = "Handle" onChange={this.handleInputChange} required/>
                <small className="underHelp"> User should have under 75k followers.</small>
              </div>

              <label className="sr-only" htmlFor="inlineFormInputGroup"> Search Term </label>
              <input type="text" className="form-control mb-2 mr-sm-2 mb-sm-0 inlineFormInputGroup" name="targetTerm" placeholder="Search Term" onChange={this.handleInputChange} required/>

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
      return <div className="col-md-10">
            <FollowerTable followers={this.state.results}/>
            </div>
    }
      return 
  }

  renderRemainingRequests(){
    if (this.state.remainingRequests){
      return <div className="col-md-10"> {this.state.remainingRequests} requests remaining ({this.state.remainingRequests*5000} followers).</div>
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
              A tool for journalists developed at <a href="https://www.theoutline.com" target="_blank">The Outline</a>.*
            </h5>
            <br/>

            <div className="row marginCenter">
            {this.renderForm()}
            </div>


          </div>
            <div className="row marginCenter notes"> 
              <p className="col-md-8 rateNotice">*This tool is subject to rate limiting by Twitter.</p>
              <div className="col-md-4 tipjar">
                <a className="btn btn-outline-success btn-sm" href="https://PayPal.Me/lu2moons" target="_blank" role="button">Tip Jar</a>
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

