window.oak.disableZoom()

window.reload = function () {
  window.oak.reload()
}

window.app = window.angular
  .module('signageApp', [
    'ngAnimate',
    'ngMessages',
    'ngMaterial'
  ])
  .constant('os', window.os)
  .constant('oak', window.oak)
  .constant('_', window.lodash)
  .run(function ($rootScope) {
    $rootScope._ = window.lodash
  })
  .config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self'])
  })

window.app.controller('appController', function ($log, $timeout, $scope, $http, $window, oak, _) {
  // ripples
  $scope.untapped = true
  $scope.cursor = {
    x: 0, y: 0
  }
  $scope.showCursor = false
  $scope.cursorTimeout = 10000
  var cursorPromises = []
  var timer

  // main window touches. this will log all tapped items, and also add the UI ripple of the tapped area
  $scope.ripples = []

  $http({
    method: 'GET',
    url: '/env'
  }).then(function successCallback(response) {
      $scope.environment = response.data
      db.collection("users").doc($scope.environment.apiKey).collection("galleries").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            if (doc.id === $scope.environment.galleryName) {
              
              $scope.initApp(doc.data())
            }
        });
    });
    
    }, function errorCallback(response) {
      // called asynchronously if an error occurs
      // or server returns response with an error status.
    });

  $scope.initApp = function (data) {

    $scope.gallery = data

    db.collection("users").doc($scope.environment.apiKey).collection("galleries").doc($scope.environment.galleryName)
    .onSnapshot(function(doc) {
        var source = doc.metadata.hasPendingWrites ? "Local" : "Server";
        console.log(source, " data: ", doc.data());
        $scope.initApp(doc.data())
    });
    
  }


  $scope.mouseMoved = function ({ pageX: x, pageY: y }) {
    // dont show cursor if the settings has `false` or 0 as the cursorTimeout
    if ($scope.cursorTimeout) {
      resetCursorTimer()
      $scope.cursor = { x, y }
    }
  }
  var clearCursorPromises = function () {
    cursorPromises.forEach(function (timeout) {
      $timeout.cancel(timeout)
    })
    cursorPromises = []
  }
  var resetCursorTimer = function () {
    clearCursorPromises()
    $scope.showCursor = true
    timer = $timeout(function () {
      $scope.showCursor = false
    }, $scope.cursorTimeout)
    cursorPromises.push(timer)
  }

  $scope.$on('$destroy', function () {
    clearCursorPromises()
  })

  $scope.tapped = function ({ pageX, pageY }) {
    let id = $window.uuid.v4()
    $scope.showCursor = false
    $scope.ripples.push({
      x: pageX, y: pageY, id
    })
    $timeout(function () {
      _.remove($scope.ripples, { id })
    }, 500)

    if ($scope.untapped) {
      $scope.untapped = false
    }
  }

  oak.ready()
  
})
