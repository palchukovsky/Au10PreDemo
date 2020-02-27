import {Player} from '@react-native-community/audio-toolkit';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {Button, Platform, View, Text, StyleSheet} from 'react-native';

export default class extends Component {
  static propTypes = {
    record: PropTypes.object.isRequired,
  };
  state = {
    playButton: '',
  };

  componentDidMount() {
    const time = new Date(this.props.record.time);
    this.time = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();
    this.player = null;
    this.setRecordState(false, false, false);
  }

  togglePlay() {
    if (!this.player) {
      this.initPlayer()
        .then(() => this.togglePlay())
        .catch(err => {
          console.error(`Failed to init player: "${err.message}".`);
        });
      return;
    }
    this.player.playPause((err, paused) => {
      if (!err) {
        this.setRecordState(false, !paused, false);
        return;
      }
      console.error(
        `Failed to play or pause player: "err.message" (${paused}).`,
      );
      this.setRecordState(false, false, false);
    });
  }

  initPlayer() {
    if (this.player) {
      this.player.destroy();
    }

    this.player = new Player(this.props.record.url, {autoDestroy: false});

    if (Platform.OS === 'android') {
      // workaround for the bug "playerId not found"
      this.player.speed = 0.0;
    }

    this.player.on('ended', () => this.setRecordState(false, false, true));

    const result = new Promise((resolve, reject) => {
      this.player.prepare(err => {
        this.setRecordState(false, false, false);
        if (!err) {
          resolve();
          return;
        }
        this.player.destroy();
        this.player = null;
        reject(err);
      });
    });

    this.setRecordState(true, false, false);
    return result;
  }

  setRecordState(isLoading, isPlaying, isStopped) {
    this.setState({
      playButton: isLoading
        ? 'Cancel loading...'
        : !isPlaying
        ? !this.player
          ? 'Listen'
          : isStopped
          ? 'Repeat'
          : 'Continue'
        : 'Pause',
    });
  }

  render() {
    return (
      <View style={styles.record}>
        <Button
          color="#841584"
          title={this.state.playButton}
          onPress={() => this.togglePlay()}
        />
        <Text style={styles.time}>{this.time}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  record: {
    marginTop: 10,
  },
  time: {
    fontSize: 10,
    color: 'gray',
    textAlign: 'center',
  },
});
