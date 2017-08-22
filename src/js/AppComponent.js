import React, { Component } from 'react';

// import logo from '../logo.svg';
// import '../App.css';

export default class AppComponent extends Component {
  constructor(props){
    super(props);
    this.state = {
      targetHandle: '',
      targetTerm: '',
      results: []
    }

      this.handleInputChange = this.handleInputChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);

  }


  // componentDidMount(){
  // }


  handleInputChange(event){
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  handleSubmit(event){
    event.preventDefault();
    this.setState({
      targetHandle: this.state.targetHandle,
      targetTerm: this.state.targetTerm,
    }),
      
    // fetch('/api')
    //how do i pass in the above terms to this express call?

    fetch(`api/${this.state.targetHandle}/${this.state.targetTerm}`)
    .then(
      response => response.json() //decoding the json we sent
    )
    .then(
      (result) => {
        console.log("FOO",result.data)
        const relevantFollowers = result.data;
        this.setState({ results: relevantFollowers})
      }
    )
    .catch(
      e => e
    );
  }

  render() {
    const followers = this.state.results;
    return (
      <div>
        <h1>Search your Followers' Twitter Bios</h1>
          <h5> A tool for Journalists developed at <a href="https://www.theoutline.com">The Outline </a>
          </h5>

        <form onSubmit={this.handleSubmit}>
          <label htmlFor="Handle"> Twitter Handle: </label>
          <input type="text" name="targetHandle" onChange={this.handleInputChange}/>

          <label htmlFor="Term"> Search Term: </label>
          <input type="text" name="targetTerm" onChange={this.handleInputChange}/>
          <input type="submit" value="Search" />
        </form>

        <hr/> 
        <div className="table">
          <div className="table-row">
            <span className="numberColumn">
            </span>
            <span className= "handleColumn"> 
              <h2>Handle</h2>
            </span>
            <span className= "descriptionColumn"> 
              <h2>Description</h2>
            </span>
            <span className= "nameColumn">
              <h2>Name</h2> 
            </span>
          </div>

          {followers.map( (follower, i) => 
            <div key={i} className="table-row">
              <span className="numberColumn">
                {i+1}
              </span>
              <span className= "handleColumn"> 
                <a href={`https:\/\/www.twitter.com/${follower.userHandle}`} target="_blank">
                  {`@${follower.userHandle}`}
                </a>
              </span>
              <span className= "descriptionColumn">
                {follower.userDescription} 
              </span>
              <span className= "nameColumn">
                {follower.userName} 
              </span>
            </div>
          )}
        </div>

      </div>
        
  
    );
  }
}



