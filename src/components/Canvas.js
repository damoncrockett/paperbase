import React, { Component } from 'react';

class Canvas extends Component {
  constructor(props) {
    super(props);

    this.state = {
    }

    this.returnDomain = this.returnDomain.bind(this);
    this.drawCanvas = this.drawCanvas.bind(this);

  }

  componentDidUpdate(prevProps, prevState) {
    // conditional prevents infinite loop
    if (prevProps.data !== this.props.data && prevProps.data === null) {
      this.drawCanvas();
    }

    if (prevProps.data !== this.props.data && prevProps.data !== null) {
      this.drawCanvas();
    }
  }

  returnDomain() {
    const production = process.env.NODE_ENV === 'production';
    return production ? '' : 'http://localhost:8888/'
  }


  drawCanvas() {


  }

  render() {
    return (
      <div id='appField'>
        <div id='canvas'>
        </div>
      </div>
    );
  }
}

export default Canvas;
