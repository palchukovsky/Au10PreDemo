import {Player} from '@react-native-community/audio-toolkit';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {Button, Platform, View, Text, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';

export default class extends Component {
  static propTypes = {
    record: PropTypes.object.isRequired,
  };
  state = {
    playButton: '',
    progress: 0,
    duration: '',
    position: '',
  };

  componentDidMount() {
    const time = new Date(this.props.record.time);
    this.time = time.toLocaleDateString() + ' ' + time.toLocaleTimeString();

    this.setDuration(this.props.record.duration);

    this.player = null;

    this.lastSeek = 0;
    this.progressInterval = setInterval(() => {
      if (!this.player) {
        return;
      }
      if (Date.now() - this.lastSeek <= 200) {
        // Debounce progress bar update by 200 ms
        return;
      }
      this.updatePosition();
    }, 100);

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

  seek(percentage) {
    if (!this.player) {
      this.initPlayer()
        .then(() => this.seek(percentage))
        .catch(err => {
          console.error(`Failed to init player: "${err.message}".`);
        });
      return;
    }
    this.lastSeek = Date.now();
    let position = percentage * this.player.duration;
    this.player.seek(position, () => {
      this.updatePosition();
      this.setRecordState(false, this.player.isPlaying, false);
    });
  }

  setDuration(source) {
    this.setState({duration: this.getTimeStrFromDuration(source)});
  }

  updatePosition() {
    if (this.player.duration < 0 || this.player.currentTime < 0) {
      // workaround for https://github.com/react-native-community/react-native-audio-toolkit/issues/183
      return;
    }
    let currentProgress =
      Math.max(0, this.player.currentTime) / this.player.duration;
    if (isNaN(currentProgress)) {
      currentProgress = 0;
    }
    this.setState({
      progress: currentProgress,
      position: this.getTimeStrFromDuration(this.player.currentTime),
    });
  }

  getTimeStrFromDuration(source) {
    let secs = Math.round(source / 1000);
    let mins = Math.floor(secs / 60);
    secs -= mins * 60;
    let hours = Math.floor(mins / 60);
    mins -= hours * 60;
    const pad = val => {
      var result = val + '';
      while (result.length < 2) {
        result = '0' + result;
      }
      return result;
    };
    hours = pad(hours);
    mins = pad(mins);
    secs = pad(secs);
    return `${hours}:${mins}:${secs}`;
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
          this.setDuration(this.player.duration);
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
        <View>
          <View style={styles.column1}>
            <Text style={styles.time}>{this.time}</Text>
            <Button
              color="#841584"
              title={this.state.playButton}
              onPress={() => this.togglePlay()}
            />
          </View>
        </View>
        <View style={styles.column2}>
          <View>
            <Slider
              step={0.0001}
              onValueChange={position => this.seek(position)}
              value={this.state.progress}
            />
          </View>
          <View style={styles.positionDuration}>
            <View>
              <Text style={styles.position}>{this.state.position}</Text>
            </View>
            <View>
              <Text style={styles.duration}>{this.state.duration}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  record: {
    marginTop: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  column1: {
    flex: 1,
    flexDirection: 'column',
    width: 150,
  },
  column2: {
    flex: 1,
    flexDirection: 'column',
    marginTop: 9,
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 9,
    color: 'gray',
    textAlign: 'center',
  },
  positionDuration: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  position: {
    fontSize: 14,
    marginLeft: 15,
    color: 'dimgray',
  },
  duration: {
    fontSize: 14,
    marginRight: 15,
    color: 'dimgray',
  },
});
