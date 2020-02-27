import Firebase from 'firebase';
import 'firebase/storage';

let config = {
  apiKey: 'AIzaSyC_jIYRhgx31TlxdJNbErvitlteTziRdG0',
  authDomain: 'test-1-d5f4f.firebaseapp.com',
  databaseURL: 'https://test-1-d5f4f.firebaseio.com',
  projectId: 'test-1-d5f4f',
  storageBucket: 'test-1-d5f4f.appspot.com',
  messagingSenderId: '270932927749',
  appId: '1:270932927749:web:14fd56e5194c5bbc14436c',
};

let app = Firebase.initializeApp(config);
export const vocalsStorage = app.storage().ref('vocals/');
export const vocalsDb = app.database().ref('/vocals');

export const vocalFileExt = 'mp4';
export const vocalRecordMimeType = 'audio/mp4';
export const newVocalFilePath = 'new.' + vocalFileExt;
