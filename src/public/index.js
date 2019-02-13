window.oak.disableZoom()

window.reload = function () {
  window.oak.reload()
}

var app = window.angular
  .module('signageApp', [])
  .constant('os', window.os)
  .constant('oak', window.oak)
  .constant('_', window.lodash)
  .run(function ($rootScope) {
    $rootScope._ = window.lodash
  })
  .config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist(['self'])
  })

app.controller('appController', function ($log, $sce, $timeout, $scope, $http, $window, oak, _) {
  // ripples
  $scope.untapped = true
  $scope.swiper = false
  $scope.cursor = {
    x: 0, y: 0
  }
  $scope.showCursor = false
  $scope.shouldReload = false
  $scope.cursorTimeout = 10000
  var cursorPromises = []
  var timer

  // main window touches. this will log all tapped items, and also add the UI ripple of the tapped area
  $scope.ripples = []

  $http({
    method: 'GET',
    url: '/env'
  }).then(function successCallback (response) {
    $scope.environment = response.data

    db.collection('users').doc($scope.environment.apiKey).collection('galleries').doc($scope.environment.galleryName)
      .onSnapshot(function (doc) {
        var source = doc.metadata.hasPendingWrites ? 'Local' : 'Server'
        console.log(source, ' data: ', doc.data())
        $timeout(function () {
          $scope.initApp(doc.data())
        })
      })
  }, function errorCallback (response) {
    // called asynchronously if an error occurs
    // or server returns response with an error status.
  })

  $scope.initApp = function (data) {
    $scope.shouldReload = true
    if (typeof $scope.gallery !== 'undefined' && data.enableAutoplay !== $scope.gallery.enableAutoplay) {
    }
    $scope.gallery = data
    if (!$scope.swiper) {
      if (!$scope.gallery.enableAutoplay) {
        $scope.gallery.config.autoplay = false
      } else {
        $scope.gallery.config.autoplay = $scope.gallery.autoplay
      }
      $timeout(function () {
        $scope.swiper = new Swiper('.swiper-container', $scope.gallery.config)
      })
    } else {
      if ($scope.shouldReload) oak.reload()

      $timeout(function () {
        $scope.swiper.slideTo(0)
        $scope.swiper.update()
      })
    }
  }

  $scope.mdToHtml = function (text) {
    return $sce.trustAsHtml(markdown.toHTML(text))
  }

  oak.ready()
})
