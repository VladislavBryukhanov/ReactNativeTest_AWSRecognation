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
// import aws from 'aws-sdk/dist/aws-sdk-react-native';

type Props = {};
export default class App extends Component<Props> {

  state = {};

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
    this.permissionAlert();
  };

  permissionAlert = () => {
    Alert.alert(
        'Provide permission',
        'You should provide permission to camera and storage for app can get your photo and verify person',
        [
          { text: 'Cancel' },
          { text: 'OK' }
        ],
        { cancelable: false }
    );
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

        // You can also display the image using data:
        // const source = { uri: 'data:image/jpeg;base64,' + response.data };

        this.setState({
          avatarSource: source,
        });
      }
    });
  };

  render() {
    return (
        <View style={styles.container}>
          <Text style={styles.welcome}>For authorization, you must provide a photo of the person and it will be authenticated.</Text>

          <View style={styles.signIn}>
            <Button
                onPress={this.verifyPerson}
                title="Sing in"
                color="#1A567B"
                accessibilityLabel="Learn more about this purple button"
                containerViewStyle={{width: '100%', marginLeft: 0}}
            />
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
  }
});
