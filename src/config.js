import Firebase from 'firebase';
import 'firebase/storage';

let config = {
  apiKey: "AIzaSyCU2GEX7AF9YYh0AXnG3XLsJyQGKq0Ebs0",
  authDomain: "au10-pre-demo.firebaseapp.com",
  databaseURL: "https://au10-pre-demo.firebaseio.com",
  projectId: "au10-pre-demo",
  storageBucket: "au10-pre-demo.appspot.com",
  messagingSenderId: "728737786021",
  appId: "1:728737786021:web:272c45f1fe0675dbaf454c",
  measurementId: "G-HZWP2L00K6",
};

let app = Firebase.initializeApp(config);
export const vocalsStorage = app.storage().ref('vocals/');
export const vocalsDb = app.database().ref('/vocals');

export const vocalFileExt = 'mp4';
export const vocalRecordMimeType = 'audio/mp4';
export const newVocalFilePath = 'new.' + vocalFileExt;
