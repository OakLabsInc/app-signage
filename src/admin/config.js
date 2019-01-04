var config = {
    apiKey: "AIzaSyCNpkPav8JyQq7kZwlHVT78MxsRaYLnQMo",
    authDomain: "oak-signage.firebaseapp.com",
    databaseURL: "https://oak-signage.firebaseio.com",
    projectId: "oak-signage",
    storageBucket: "oak-signage.appspot.com",
    messagingSenderId: "270582494300"
  };
firebase.initializeApp(config);

// FirebaseUI config.
var uiConfig = {
    signInSuccessUrl: 'index.html',
    // signInFlow: 'popup',
    signInOptions: [
      // Leave the lines as is for the providers you want to offer your users.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
      // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      // firebase.auth.GithubAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
      // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
    ],
    // tosUrl and privacyPolicyUrl accept either url string or a callback
    // function.
    // Terms of service url/callback.
    tosUrl: 'tos.html',
    // Privacy policy url/callback.
    privacyPolicyUrl: function() {
      window.location.assign('privacy.html');
    }
  };

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(firebase.auth());
  // The start method will wait until the DOM is loaded.
    // ui.start('#firebaseui-auth-container', uiConfig);
  


