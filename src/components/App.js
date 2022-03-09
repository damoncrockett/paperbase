import React, { Component } from "react";
import Field from './Field';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,
      model: 'pn'
    }

    this.returnDomain = this.returnDomain.bind(this);
    this.getData = this.getData.bind(this);
    this.handleModel = this.handleModel.bind(this);

  }

  componentDidMount() {
    this.getData();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.model!==this.state.model && this.state.data !== null) {
      this.getData();
    }

  }

  returnDomain() {
    const production = process.env.NODE_ENV === 'production';
    return production ? '' : 'http://localhost:8888/'
  }

  getData() {
    fetch(this.returnDomain()+this.state.model+'.json')
      .then(response => response.json())
      .then(data => this.setState(state => ({
        data: data
      })));
    }

  handleModel(e) {
    const model = e.target.value
    this.setState(state => ({
      model: model
    }));
    }

  render() {
      return (
        <div className='app'>
          <div id='componentEnclosure'>
            <Field
              data={this.state.data}
              model={this.state.model}
            />
          </div>
          <div className='buttonStrip'>
            <div className='radSwitch' onChange={this.handleModel}>
              <input type="radio" value={'pn'} name="Model" defaultChecked /> PCA
              <input type="radio" value={'tn'} name="Model" /> t-SNE
              <input type="radio" value={'un'} name="Model" /> UMAP
            </div>
          </div>
        </div>
    );
  }
}

export default App;
