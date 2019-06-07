/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  PermissionsAndroid,
  Image
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
// import AWS from 'aws-sdk/dist/aws-sdk-react-native';
// AWS.config.loadFromPath('./config.json');
import AWS from 'aws-sdk';
AWS.config.update({
    region: "us-east-1",
    accessKeyId: "...",
    secretAccessKey: "...",
});

const Bucket = 'rekognition-face-verification';

import base64 from 'base-64';
import _ from 'lodash';

type Props = {};
export default class App extends Component<Props> {

    state = {
        url: '',
        CollectionId: 'MyCollection',
        Bucket,
        rekognition: new AWS.Rekognition(),
        s3: new AWS.S3({
            apiVersion: '2006-03-01',
            params: { Bucket }
        }),
        alerts: {
            permissionAlert: () => {
                Alert.alert(
                    'Provide permission',
                    'You should provide permission to camera and storage for app can get your photo and verify person',
                    [
                        { text: 'Cancel' },
                        { text: 'OK' }
                    ],
                    { cancelable: false }
                );
            },
            userAlreadyExistsAlert: () => {
                Alert.alert(
                    'Such user already exists',
                    'The application is not intended for multiple accounts',
                    [
                        { text: 'Cancel' },
                        { text: 'OK' }
                    ],
                    { cancelable: false }
                );
            },
            userRegistrationSuccess: () => {
                Alert.alert(
                    'Registration completed',
                    'Your account was verified and created',
                    [
                        { text: 'Cancel' },
                        { text: 'OK' }
                    ],
                    { cancelable: false }
                );
            }
        }
    };

    requestPermissions = async () => {
        const permissionsGranted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        ]);

        const permissionsResult = Object.values(permissionsGranted);
        const isAnyPermissionDenied = permissionsResult.some(perm => perm !== PermissionsAndroid.RESULTS.GRANTED);

        if (!isAnyPermissionDenied) {
            return true;
        }
        this.alerts.permissionAlert();
    };

    verifyPerson = async () => {
        const permissionsGranted = await this.requestPermissions();

        if (!permissionsGranted) {
            return;
        }

        const options = {
            title: 'Select photo for authorization',
        };

        ImagePicker.showImagePicker(options, (response) => {
            if (response.error) {
                console.log('ImagePicker Error: ', response.error);
            } else if (!response.didCancel) {
                const source = { uri: response.uri };

                this.DetectFaces(response.data);
                // You can also display the image using data:
                // const source = { uri: 'data:image/jpeg;base64,' + response.data };

                this.setState({
                    avatarSource: source
                });
            }
        });
    };

    DetectFaces (fileContent) {
        const { CollectionId } = this.state;
        const fileBuffer = this.base64ToArrayBuffer(fileContent);

        this.state.rekognition.searchFacesByImage({
            CollectionId,
            Image: {
                Bytes: fileBuffer
            },
            MaxFaces: 1
        }, (err, data) => {
            if (err) {
                return console.log(err);
            }

            if (!_.isEmpty(data.FaceMatches)) {
                return this.state.alerts.userAlreadyExistsAlert();
            }
            console.log(data);

            this.state.rekognition.indexFaces({
                CollectionId,
                Image: {
                    Bytes: fileBuffer
                },
                MaxFaces: 1,
                QualityFilter: 'AUTO',
                DetectionAttributes: ['ALL']
            }, (err, data) => {
                if (err) console.log(err, err.stack); // an error occurred
                console.log(data);

                return this.state.alerts.userRegistrationSuccess();
            });
        })
    }

    base64ToArrayBuffer (content) {
        const binaryString = base64.decode(content);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /*fetchPicture = () => {
        const s3 = new AWS.S3();

        const bucketName = 'rekognition-face-verification';

        s3.getObject({ Bucket: bucketName, Key: 'u11307_3076_Wallpaper330.jpg'},
            (error, data) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(data);
                    const blob = new Blob([data.Body], {'type': 'image/jpeg'});
                    // const source = URL.createObjectURL(blob);
                    const source = "data:image/jpeg;base64," + blob;
                    // do something with data.Body

                    // var urlCreator = window.URL || window.webkitURL;
                    // var imageUrl = urlCreator.createObjectURL( blob );

                    /!*   this.setState({
                           avatarSource:  imageUrl,
                       });*!/
                }
            })
    };*/

    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.welcome}>For authorization, you must provide a photo of the person and it will be authenticated.</Text>

                <View style={styles.signIn}>
                    <Button
                        onPress={this.verifyPerson}
                        title="Sing up"
                        color="#1A567B"
                        accessibilityLabel="Learn more about this purple button"
                        containerViewStyle={{width: '100%', marginLeft: 0}}
                    />

                    {/*<Button
                        onPress={this.fetchPicture}
                        title="Fetch picture"
                        color="#1A567B"
                        accessibilityLabel="Learn more about this purple button"
                        containerViewStyle={{width: '100%', marginLeft: 0}}
                    />*/}
                </View>

                {
                    this.state.avatarSource ?
                        <Image source={this.state.avatarSource} style={styles.uploadAvatar}/>
                        :
                        null
                }
            </View>
        );
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  signIn: {
    width: '60%'
  },
  uploadAvatar: {
    flex: 1,
    width: '60%',
    height: 'auto'
  }
});
