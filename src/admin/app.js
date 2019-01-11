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
  function ($firebaseObject) {
    return function (uid) {
      // create a reference to the database node where we will store our data
      var ref = firebase.database().ref('users').push()
      var userRef = ref.child(uid)

      // return it as a synchronized object
      return $firebaseObject(userRef)
    }
  }
])

app.directive('chooseFile', function () {
  return {
    link: function (scope, elem, attrs) {
      var button = elem.find('button')
      let galleryName = attrs.galleryName
      let gallery = attrs.galleryObj
      let input = angular.element(elem[0].querySelector('input#fileInput'))

      button.bind('click', function () {
        input[0].click()
        
      })
      input.bind('change', function (e) {
        scope.$apply(function () {
          var files = e.target.files
          if (files[0]) {
            scope.fileName = files[0].name
            console.log(files[0].name)
            scope.addSlideToGallery(galleryName, scope.fileName, gallery, files)
            
          } else {
            scope.fileName = null
          }
        })
      })
    }
  }
})

app.controller('appController', function AppController ($scope, $timeout, $mdToast, $firebaseObject, User) {
  var db = firebase.firestore()

  db.settings({
    timestampsInSnapshots: true
  })

  $scope.galleries = []
  $scope.user = {}
  $scope.userId = {}

  $scope.isLoggedIn = false

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      $timeout(function () {
        $scope.isLoggedIn = true
        $scope.user = user
        $scope.saveUser(user)
        $scope.getFirebaseUserGalleries()
      })
    } else {
      $timeout(function () {
        $scope.isLoggedIn = false
        ui.start('#firebaseui-auth-container', uiConfig)
      })
    }
  })

  $scope.logout = function () {
    firebase.auth().signOut().then(function () {
      $scope.isLoggedIn = false
      $scope.user = {}
      $scope.userId = {}
    })
  }
  $scope.getFirebaseUserGalleries = function () {
    db.collection('users').doc($scope.user.uid).collection('galleries').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $timeout(function () {
          $scope.userId[doc.id] = doc.data().slides
        })
      })
    })
  }
  $scope.addGallery = function (galleryName) {
    if (galleryName !== undefined && !$scope.userId.hasOwnProperty(galleryName)) {
      $scope.userId[galleryName] = []
    } else {
      $mdToast.show($mdToast.simple().textContent('That Gallery Name Already Exists'))
    }
  }

  $scope.saveUser = function (user) {
    db.collection('users').doc(user.uid).set({
      'uid': user.uid,
      'displayName': user.displayName,
      'photoURL': user.photoURL,
      'email': user.email
    })
      .then(function () {
        console.log('User written ')
      })
      .catch(function (error) {
        console.error('Error adding User: ', error)
      })
  }

  $scope.saveGalleries = function (user, galleryName, slides) {
    $scope.imageIsUploading = false
    db.collection('users').doc(user.uid).collection('galleries').doc(galleryName).set({
      'slides': slides
    })
      .then(function () {
        console.log('Gallery written ')
      })
      .catch(function (error) {
        console.error('Error adding Gallery: ', error)
      })
  }

  $scope.deleteGallerySlide = function (galleryName, slide, index) {
    let galleryImagesRef = firebase.storage().ref()

    galleryImagesRef.child($scope.user.uid + '/' + galleryName + '/' + $scope.getImageName(slide.image)).delete().then(function () {
      console.log('Image deleted successfully', slide.image)

      $scope.userId[galleryName].splice(index, 1)
      $scope.$apply()
      db.collection('users').doc($scope.user.uid).collection('galleries').doc(galleryName).update({
        slides: $scope.userId[galleryName]
      })
    }).catch(function (error) {
      // Uh-oh, an error occurred!
    })
  }
  $scope.deleteGallery = function (galleryName) {
    let galleryImagesRef = firebase.storage().ref()
    $scope.userId[galleryName].map(function (slide) {
      galleryImagesRef.child($scope.user.uid + '/' + galleryName + '/' + $scope.getImageName(slide.image)).delete().then(function () {
        console.log('Gallery deleted successfully', url)
        $scope.saveGalleries($scope.user, galleryName, $scope.userId[galleryName])
      }).catch(function (error) {
        // Uh-oh, an error occurred!
      })
    })

    db.collection('users').doc($scope.user.uid).collection('galleries').doc(galleryName).delete()
      .then(function () {
        console.log('Document successfully deleted!')
        $timeout(function () {
          $scope.userId = {}
          $scope.getFirebaseUserGalleries()
        })
      }).catch(function (error) {
        console.error('Error removing document: ', error)
      })
  }

  $scope.addSlideToGallery = function (galleryName, imageName, gallery, files) {
    $scope.imageIsUploading = true
    let filename = imageName.substring(imageName.lastIndexOf('\\') + 1)
    var hasFile = false
    for (i = 0; i < $scope.userId[galleryName].length; i++) {
      if ($scope.userId[galleryName][i].image.indexOf(filename) > 0 && $scope.userId[galleryName][i].image.indexOf(galleryName) > 0) {
        hasFile = true
      }
    }
    if (typeof filename !== 'undefined' && !hasFile) {
      let displayImageId = (gallery.length) + '-' + galleryName + '-display'
      $scope.uploadFile(galleryName, displayImageId, files)
    } else {
      $mdToast.show(
        $mdToast.simple()
          .textContent('That Image URL Already Exists')
          .position('top left')
          .hideDelay(1500)
      )
    }
  }

  $scope.uploadFile = function (galleryName, displayImageId, files) {
    let ref = firebase.storage().ref()
    const file = files[0]
    let name = file.name
    let metadata = {
      contentType: file.type
    }
    let task = ref.child($scope.user.uid + '/' + galleryName + '/' + name).put(file, metadata)
    task.then(snapshot => snapshot.ref.getDownloadURL())
      .then((url) => {
        console.log(url)
        $timeout(function () {
          $scope.userId[galleryName].push({ 
            'image': url 
          })
          $scope.saveGalleries($scope.user, galleryName, $scope.userId[galleryName])
        })
        return url
      })
      .catch(console.error)
  }

  $scope.getImageName = function (fullUrl) {
    return fullUrl.slice((fullUrl.lastIndexOf('%2F') + 3), fullUrl.lastIndexOf('?'))
  }

  $scope.returnImageArray = function (gallery) {
    let resultArray = []
    for(i in gallery){
      resultArray.push(i)
    }
    return resultArray
  }

  $scope.reorderSlides = function (slide, index, galleryName) {
    let tempSlides = $scope.userId[galleryName]
    let currentIndex = tempSlides.indexOf(slide)
    tempSlides.splice(currentIndex, 1)
    tempSlides.splice(index,0,slide)
    $scope.saveGalleries($scope.user, galleryName, tempSlides)
  }

})
