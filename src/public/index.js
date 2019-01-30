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

app.controller('appController', function ($log, $timeout, $scope, $http, $window, oak, _) {
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
    if (typeof $scope.gallery !== 'undefined' && data.show !== $scope.gallery.show) {
      $scope.shouldReload = true
    }
    $scope.gallery = data
    let config = {
      autoplay: {
        delay: parseInt($scope.gallery.interval)
      },
      slidesPerView: parseInt($scope.gallery.show),
      spaceBetween: 10,
      slidesPerGroup: parseInt($scope.gallery.show),
      observer: true,
      loop: true
      // effect: "coverflow",
      // coverflowEffect: {
      //   rotate: 30,
      //   slideShadows: false,
      // },

      // effect: "fade",
      // fadeEffect: {
      //   crossFade: true
      // },

    }
    if (!$scope.swiper) {
      $timeout(function () {
        $scope.swiper = new Swiper('.swiper-container', config)
      })
    } else {
      if ($scope.shouldReload) oak.reload()

      $timeout(function () {
        $scope.swiper.update()
        // $scope.swiper.destroy(true, true)
        // $scope.swiper = new Swiper('.swiper-container', config);
      })
    }
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
