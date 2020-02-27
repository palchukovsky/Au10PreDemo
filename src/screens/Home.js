import React, {Component} from 'react';
import {Button, View, Text, StyleSheet, ScrollView} from 'react-native';
import ItemList from '../components/ItemList';
import {vocalsDb} from '../config';

export default class Home extends Component {
  state = {
    items: [],
  };

  componentDidMount() {
    vocalsDb.on('value', (snapshot, event) => {
      let data = snapshot.val();
      let items = Object.values(data);
      this.setState({items});
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Button
          style={styles.button}
          title="Post Vocal"
          onPress={() => this.props.navigation.navigate('AddItem')}
        />
        <ScrollView>
          {this.state.items.length > 0 ? (
            <ItemList items={this.state.items} />
          ) : (
            <Text style={styles.emptyListMessage}>No vocals</Text>
          )}
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 1,
  },
  button: {
    fontWeight: 'bold',
  },
  emptyListMessage: {
    fontSize: 15,
    textAlign: 'center',
    padding: 20,
    color: 'gray',
  },
});
