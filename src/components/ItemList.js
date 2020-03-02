import React, {Component} from 'react';
import {View} from 'react-native';
import PropTypes from 'prop-types';
import Item from '../components/Item';

export default class ItemList extends Component {
  static propTypes = {
    items: PropTypes.array.isRequired,
  };

  render() {
    return (
      <View>
        {this.props.items.map((item, index) => {
          return <Item key={index} item={item} />;
        })}
      </View>
    );
  }
}
