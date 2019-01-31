app.controller('appController', function AppController ($log, $scope, $rootScope, $timeout, $mdToast, $firebaseObject, User, $mdSidenav, $mdPanel, $mdDialog) {
  var db = firebase.firestore()

  db.settings({
    timestampsInSnapshots: true
  })

  $scope.galleries = []
  $scope.user = {}
  $scope.userId = {}
  $scope.colorPicker = {}

  $scope.isLoggedIn = false

  // sidebar toggle functions
  
  $scope.toggleLeft = buildDelayedToggler('left')
  function debounce (func, wait, context) {
    var timer

    return function debounced () {
      var context = $scope,
        args = Array.prototype.slice.call(arguments)
      $timeout.cancel(timer)
      timer = $timeout(function () {
        timer = undefined
        func.apply(context, args)
      }, wait || 10)
    }
  }

  function buildDelayedToggler (navID) {
    return debounce(function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug('toggle ' + navID + ' is done')
        })
    }, 200)
  }

  function buildToggler (navID) {
    return function () {
      // Component lookup should always be available since we are not using `ng-if`
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug('toggle ' + navID + ' is done')
        })
    }
  }
  $scope.checkSideBar = function(){
    if ($mdSidenav('left') && $mdSidenav('left').isOpen()) {
      $scope.toggleLeft()
    }
  }
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
      $scope.galleries = []
    })
  }
  $scope.getFirebaseUserGalleries = function () {
    db.collection('users').doc($scope.user.uid).collection('galleries').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        $timeout(function () {
          $scope.galleries.push(doc.data())
          
        })
      })
      
      console.log('galleries', $scope.galleries)
    })
  }
  $scope.editGallery = function (i) {
    if (i > -1) {
      $scope.gallery = $scope.galleries[i]
    }

    $scope.galleryFormOpen = true
  }
  $scope.addGallery = function (name) {

      var results = _.find($scope.galleries, ['name', name])
      if (!results) {
        let newGallery = {
          'name': _.snakeCase(name),
          'config': {
            direction: 'horizontal',
            loop: true,
            slidesPerView: 1,
            slidesPerGroup: 1
          },
          'slides': []
        }
        $scope.galleries.push(newGallery)
        $scope.saveGallery(newGallery)
      } else {
        $mdToast.show(
          $mdToast.simple()
            .textContent('Gallery name exists')
            .position('bottom left')
            .hideDelay(1000)
            .toastClass("error-toast")

        )
      }
    
  }
  $scope.formatGalleryName = function(name) {
    return _.startCase(name)
  }
  $scope.saveGallery = function (gallery) {
    $scope.imageIsUploading = false
    $scope.fileName = ""
    let newGallery = JSON.parse(angular.toJson( gallery ))
    db.collection('users').doc($scope.user.uid).collection('galleries').doc(newGallery.name).set(newGallery)
      .then(function () {
        console.log('Gallery written ')
        $timeout(function () {
          
          console.log('Galleries: ', $scope.galleries)
        })

        $mdToast.show(
          $mdToast.simple()
            .textContent('Gallery ' + newGallery.name + ' saved!')
            .position('bottom left')
            .hideDelay(1000)
            .toastClass("success-toast")
        )
      })
      .catch(function (error) {
        console.error('Error adding Gallery: ', error)
      })
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

  $scope.deleteGallerySlide = function (gallery, slide, index) {

    var galleryIndex = _.findIndex($scope.galleries, gallery);

    let galleryImagesRef = firebase.storage().ref()

    galleryImagesRef.child($scope.user.uid + '/' + gallery.name + '/' + $scope.getImageName(slide.image)).delete().then(function () {
      console.log('Image deleted successfully', slide.image)

      $scope.galleries[galleryIndex].slides.splice(index, 1)
      db.collection('users').doc($scope.user.uid).collection('galleries').doc(gallery.name).update({
        slides: $scope.galleries[galleryIndex].slides
      })
      $scope.$apply()

    }).catch(function (error) {
      // Uh-oh, an error occurred!
    })
  }
  $scope.deleteGallery = function (galleryName) {
    let galleryImagesRef = firebase.storage().ref()
    let gallery = _.find($scope.galleries, 'name', galleryName)
    gallery.slides.map(function (slide) {
      $timeout( function () {
        galleryImagesRef.child($scope.user.uid + '/' + galleryName + '/' + $scope.getImageName(slide.image)).delete().then(function () {
          console.log('Gallery deleted successfully', url)
          $scope.saveGallery(gallery)
        }).catch(function (error) {
          // Uh-oh, an error occurred!
        })
      })
    })

    db.collection('users').doc($scope.user.uid).collection('galleries').doc(galleryName).delete()
      .then(function () {
        console.log('Document successfully deleted!')
        $timeout( function () {
          _.remove($scope.galleries, function (e) {
            return e.name === galleryName;
          });
        })
      }).catch(function (error) {
        console.error('Error removing document: ', error)
      })
    
  }
  $scope.addImageToSlide = function (gallery, index, imageName, files) {
    $scope.imageIsUploading = true
    let filename = imageName.substring(imageName.lastIndexOf('\\') + 1)
    var hasFile = false
    for (i = 0; i < gallery.slides.length; i++) {
      if (gallery.slides[i].image.indexOf(filename) > 0 && gallery.slides[i].image.indexOf(gallery.name) > 0) {
        // hasFile = true
      }
    }
    if (typeof filename !== 'undefined' && !hasFile) {
      $scope.uploadFile(gallery, index, files)
    } else {
      $scope.imageIsUploading = false
      $mdToast.show(
        $mdToast.simple()
          .textContent('That Image URL Already Exists')
          .position('top left')
          .hideDelay(1500)
      )
    }

  }
  $scope.addSlideToGallery = function (gallery) {
    
      gallery.slides.push({
        'image': '',
        'title': '',
        'overlay': ''
      })

      $scope.saveGallery(gallery)
   
  }

  $scope.uploadFile = function (gallery, index, files) {
    let ref = firebase.storage().ref()
    const file = files[0]
    let name = file.name
    let metadata = {
      contentType: file.type
    }
    let task = ref.child($scope.user.uid + '/' + gallery.name + '/' + name).put(file, metadata)
    task.then(snapshot => snapshot.ref.getDownloadURL())
      .then((url) => {
        console.log(url)
        $timeout(function () {
          gallery.slides[index].image = url
          $scope.saveGallery(gallery)
          $scope.imageIsUploading = false
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
    for (i in gallery.slides) {
      resultArray.push(i)
    }
    return resultArray
  }

  $scope.reorderSlides = function (slide, index, gallery) {

    var galleryIndex = _.findIndex($scope.galleries, gallery);
    let tempSlides = $scope.galleries[galleryIndex].slides
    let currentIndex = tempSlides.indexOf(slide)
    tempSlides.splice(currentIndex, 1)
    tempSlides.splice(index, 0, slide)
    $scope.saveGallery(gallery)
  }
  $scope.showAddGalleryPrompt = function(ev) {
      // Appending dialog to document.body to cover sidenav in docs app
      var confirm = $mdDialog.prompt()
        .title('Gallery name?')
        .textContent('Spaces will be converted to underscores.')
        .placeholder('Gallery name')
        .ariaLabel('Gallery name')
        .targetEvent(ev)
        .required(true)
        .ok('Add')
        .cancel('Cancel');
  
      $mdDialog.show(confirm).then(function(result) {
        $scope.addGallery(result)
      }, function() {
        $scope.status = 'You didn\'t name your dog.';
      });
  }
  $scope.showGalleryConfirm = function(ev, name) {
    $scope.currentGalleryName = name

    // Appending dialog to document.body to cover sidenav in docs app
    var confirm = $mdDialog.confirm()
          .title('Are you sure you want to delete this entire gallery?')
          .textContent('All of the images and associated data will be lost permentently')
          .ariaLabel('Are you sure?')
          .targetEvent(ev)
          .ok('Delete')
          .cancel('Cancel');

    $mdDialog.show(confirm).then(function() {
      //$scope.status = 'You decided to get rid of your debt.';
      //addGallery(galleryForm, gallery)

      $log.info($scope.currentGalleryName)
      $scope.deleteGallery($scope.currentGalleryName)

 
    }, function() {
      $scope.status = 'You decided to keep your debt.';
    });
  };
  // Controller
  $scope.colorPicker.options = {
    type: 0,
    label: "Choose a background color",
    icon: "brush",
    default: "#000000",
    genericPalette: false,
    history: true,
    sliders: false,
    alphaChannel: false,
    spectrum: false,
    rgb: false,
    hsl: false
  };



})
