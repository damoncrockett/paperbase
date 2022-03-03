import React, { Component } from "react";
import Canvas from './Canvas';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null
    }

    this.returnDomain = this.returnDomain.bind(this);
    this.getData = this.getData.bind(this);

  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps, prevState) {

  }

  returnDomain() {
    const production = process.env.NODE_ENV === 'production';
    return production ? '' : 'http://localhost:8888/'
  }

  getData() {
    fetch(this.returnDomain()+'_0.json')
      .then(response => response.json())
      .then(data => this.setState(state => ({
        data: data
      })));
    }

  render() {
      return (
        <div className='app'>
          <div id='componentEnclosure'>
            <Canvas
              data={this.state.data}
            />
          </div>
        </div>
    );
  }
}

export default App;
