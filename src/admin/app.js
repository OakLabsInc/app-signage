var app = angular.module('signageApp', ['ngMaterial', 'ngMessages', 'firebase'])
// .config(function($mdThemingProvider) {
//   // Extend the red theme with a different color and make the contrast color black instead of white.
//   // For example: raised button text will be black instead of white.
//   var neonRedMap = $mdThemingProvider.extendPalette('red', {
//     '500': '#ff0000',
//     'contrastDefaultColor': 'dark'
//   });
//   // Register the new color palette map with the name <code>neonRed</code>
//   $mdThemingProvider.definePalette('neonRed', neonRedMap);
//   // Use that theme for the primary intentions
//   $mdThemingProvider.theme('default')
//     .primaryPalette('neonRed');
// });

app.factory('User', ['$firebaseObject',
  function($firebaseObject) {
    return function(uid) {
      // create a reference to the database node where we will store our data
      var ref = firebase.database().ref('users').push();
      var userRef = ref.child(uid);

      // return it as a synchronized object
      return $firebaseObject(userRef);
    }
  }
]);


app.controller('appController', function AppController($scope, $timeout, $mdToast, $firebaseObject, User) {

  var db = firebase.firestore();

  db.settings({
    timestampsInSnapshots: true
  });

  $scope.galleries = []
  $scope.user = {}
  $scope.userId = {}

  $scope.isLoggedIn = false

  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        $timeout(function () {
            $scope.isLoggedIn = true
            $scope.user = user
            $scope.saveUser(user)
            
            db.collection("users").doc(user.uid).collection('galleries').get().then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  $timeout(function () {
                    $scope.userId[doc.id] = doc.data().urls
                  })
              });
          });
            
        })
    } else {
        $timeout(function () {
            $scope.isLoggedIn = false
            ui.start('#firebaseui-auth-container', uiConfig);
        })
    }
  });

  $scope.logout = function() {
      firebase.auth().signOut().then( function () {
          $scope.isLoggedIn = false
          $scope.user = {}
          $scope.userId = {}
      })
  }

  $scope.addGallery = function(galleryName) {
    if(galleryName !== undefined  && !$scope.userId.hasOwnProperty(galleryName) ) {
      $scope.userId[galleryName] = []
    } else {
      $mdToast.show($mdToast.simple().textContent('That Gallery Name Already Exists'));
    }
  }

  $scope.saveUser = function(user) {
    db.collection('users').doc(user.uid).set({
      'uid': user.uid,
      'displayName': user.displayName,
      'photoURL': user.photoURL,
      'email': user.email,
    })
    .then(function() {
      console.log('User written ');
    })
    .catch(function(error) {
      console.error('Error adding User: ', error);
    });
  };

  $scope.saveGalleries = function(user, galleryName, images) {
    db.collection('users').doc(user.uid).collection('galleries').doc(galleryName).set({
      urls : images
    })
    .then(function() {
      console.log('Gallery written ');
    })
    .catch(function(error) {
      console.error('Error adding Gallery: ', error);
    });
  };

  $scope.addImageToGallery = function(galleryName, imageUrl, gallery) {
  
    let filename = imageUrl.substring(imageUrl.lastIndexOf('\\') + 1)
    var hasFile = false
    for(i=0;i<$scope.userId[galleryName].length; i++) {
      if($scope.userId[galleryName][i].indexOf(filename) > 0 && $scope.userId[galleryName][i].indexOf(galleryName)) {
        hasFile=true 
      } 
    }
    if (typeof filename !== 'undefined' && !hasFile) {
      let displayImageId = (gallery.length) + "-" + galleryName + "-display"
      $scope.uploadFile(galleryName, displayImageId)
    } else {
      $mdToast.show(
        $mdToast.simple()
          .textContent('That Image URL Already Exists')
          .position('top left')
          .hideDelay(1500)
      );
    }
  }

  $scope.uploadFile = function (galleryName, displayImageId) {

    let ref = firebase.storage().ref();
    const file = document.querySelector('#' + galleryName).files[0]
    let name = file.name;
    let metadata = {
      contentType: file.type
    };
    let task = ref.child( $scope.user.uid + "-" + galleryName + "-" + name).put(file, metadata);
    task.then(snapshot => snapshot.ref.getDownloadURL())
    .then((url) => {
      console.log(url);
      $timeout( function() {
        $scope.userId[galleryName].push(url) 
        $scope.saveGalleries($scope.user, galleryName, $scope.userId[galleryName])
        document.querySelector('#' + displayImageId).src = url;
      })
      // $scope.galleryName = undefined
      return url
    })
    .catch(console.error);
  }

})
