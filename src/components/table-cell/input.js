import React, { Component } from 'react';
import PropTypes from 'prop-types';
export default class QualityRanger extends Component {
    static propTypes = {
        value: PropTypes.number,
        onUpdate: PropTypes.func.isRequired
    }
    static defaultProps = {
        value: 0
    }
    getValue() {
        return parseInt(this.range.value, 10);
    }
    render() {
        const { value, onUpdate, ...rest } = this.props;
        return [
            <input
                {...rest}
                key="range"
                ref={node => this.range = node}
                type="text"
                min="0"
                max="100"
            />
        ];
    }
}

// export default QualityRanger;