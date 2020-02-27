import {Player, Recorder} from '@react-native-community/audio-toolkit';
import Slider from '@react-native-community/slider';
import React, {Component} from 'react';
import {
  Button,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  vocalsDb,
  vocalsStorage,
  newVocalFilePath,
  vocalFileExt,
  vocalRecordMimeType,
} from '../config';
import UUIDGenerator from 'react-native-uuid-generator';
import RNFetchBlob from 'react-native-fetch-blob';

const Blob = RNFetchBlob.polyfill.Blob;
window.XMLHttpRequest = RNFetchBlob.polyfill.XMLHttpRequest;
window.Blob = Blob;

export default class AddItem extends Component {
  state = {
    pausePlayButton: 'Preparing...',
    recordButton: 'Preparing...',

    playButtonDisabled: true,
    publishButtonDisabled: true,

    progress: 0,

    error: null,
  };

  componentDidMount() {
    this.player = null;
    this.recorder = null;
    this.lastSeek = 0;

    this.reloadRecorder();

    this.progressInterval = setInterval(() => {
      if (!this.player) {
        return;
      }
      if (Date.now() - this.lastSeek <= 200) {
        // Debounce progress bar update by 200 ms
        return;
      }
      let currentProgress =
        Math.max(0, this.player.currentTime) / this.player.duration;
      if (isNaN(currentProgress)) {
        currentProgress = 0;
      }
      this.setState({
        progress: currentProgress,
      });
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this.progressInterval);
  }

  updateState() {
    const playButtonDisabled =
      !this.player || !this.player.canPlay || this.recorder.isRecording;
    this.setState({
      pausePlayButton:
        this.player && this.player.isPlaying ? 'Pause' : 'Listen',
      recordButton: this.recorder.isRecording
        ? 'Stop Recording'
        : playButtonDisabled
        ? 'Record'
        : 'Record Again',
      playButtonDisabled: playButtonDisabled,
      publishButtonDisabled: playButtonDisabled,
    });
  }

  pausePlay() {
    this.player.playPause((err, paused) => {
      if (err) {
        this.setState({
          error: err.message,
        });
      }
      this.updateState();
    });
  }

  stop() {
    this.player.stop(() => {
      this.updateState();
    });
  }

  seek(percentage) {
    if (!this.player) {
      return;
    }
    this.lastSeek = Date.now();
    let position = percentage * this.player.duration;
    this.player.seek(position, () => {
      this.updateState();
    });
  }

  reloadPlayer() {
    if (this.player) {
      this.player.destroy();
    }

    this.player = new Player(newVocalFilePath, {
      autoDestroy: false,
    });
    if (Platform.OS === 'android') {
      // workaround for the bug "playerId not found"
      this.player.speed = 0.0;
    }
    this.player.prepare(err => {
      if (err) {
        console.error(
          'Failed to reload player: "' + JSON.stringify(err) + '".',
        );
        this.player.destroy();
        this.player = null;
      }
      this.updateState();
    });

    this.updateState();

    this.player.on('ended', () => {
      this.updateState();
    });
    this.player.on('pause', () => {
      this.updateState();
    });
  }

  reloadRecorder() {
    if (this.recorder) {
      this.recorder.destroy();
    }
    this.recorder = new Recorder(newVocalFilePath, {
      bitrate: 256000,
      channels: 2,
      sampleRate: 44100,
      quality: 'max',
    });
    this.updateState();
  }

  toggleRecord() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }

    let recordAudioRequest =
      Platform.OS === 'android'
        ? this.requestRecordAudioPermission()
        : new Promise(function(resolve, reject) {
            resolve(true);
          });

    recordAudioRequest.then(hasPermission => {
      if (!hasPermission) {
        this.setState({
          error: 'Record Audio Permission was denied',
        });
        return;
      }
      this.recorder.toggleRecord((err, stopped) => {
        if (err) {
          this.setState({
            error: err.message,
          });
        }
        if (stopped) {
          this.reloadPlayer();
          this.reloadRecorder();
        }
        this.updateState();
      });
    });
  }

  publish() {
    const time = new Date().getTime();
    let source = RNFetchBlob.fs.dirs.DocumentDir + '/' + newVocalFilePath;
    Blob.build(RNFetchBlob.wrap(source), {type: vocalRecordMimeType})
      .then(blob => {
        this.storeBlob(blob)
          .then(url => {
            blob.close();
            this.storeRecord(time, url)
              .then(() => {
                console.log(`Vocal uploaded: "${url}".`);
              })
              .catch(err => {
                console.error(`Failed to store vocal record: "${err}".`);
              });
          })
          .catch(err => {
            blob.close();
            console.error(
              'Failed to upload vocal: "' + JSON.stringify(err) + '".',
            );
          });
      })
      .catch(err => {
        console.error(
          'Failed to read new vocal file: "' + JSON.stringify(err) + '".',
        );
      });
    this.props.navigation.goBack();
  }

  async storeBlob(blob) {
    return UUIDGenerator.getRandomUUID().then(uuid => {
      return new Promise((resolve, reject) => {
        let ref = vocalsStorage.child(uuid + '.' + vocalFileExt);
        ref
          .put(blob, {contentType: vocalRecordMimeType})
          .then(() => {
            resolve(ref.getDownloadURL());
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  }

  async storeRecord(time, url) {
    return vocalsDb.push({
      url: url,
      time: time,
    });
  }

  async requestRecordAudioPermission() {
    let status;
    try {
      status = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message:
            'ExampleApp needs access to your microphone to test react-native-audio-toolkit.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
    } catch (ex) {
      console.error('Failed to grand RECORD_AUDIO: ' + ex);
      return false;
    }
    if (status !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Grand RECORD_AUDIO status: ' + status);
      return false;
    }
    return true;
  }

  render() {
    return (
      <SafeAreaView>
        <View style={styles.button}>
          <Button
            title={this.state.recordButton}
            onPress={() => this.toggleRecord()}
          />
        </View>
        <View style={styles.button}>
          <Button
            title={this.state.pausePlayButton}
            disabled={this.state.playButtonDisabled}
            onPress={() => this.pausePlay()}
          />
          <Slider
            step={0.0001}
            disabled={this.state.playButtonDisabled}
            onValueChange={percentage => this.seek(percentage)}
            value={this.state.progress}
          />
        </View>
        <View style={styles.button}>
          <Button
            title={'Publish'}
            disabled={this.state.publishButtonDisabled}
            onPress={() => this.publish()}
          />
        </View>
        <View>
          <Text style={styles.errorMessage}>{this.state.error}</Text>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  slider: {
    height: 10,
    margin: 10,
    marginBottom: 50,
  },
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    padding: 10,
    color: 'red',
  },
  button: {
    marginBottom: 5,
    marginTop: 5,
  },
});
