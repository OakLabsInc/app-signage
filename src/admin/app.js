var app = angular.module('signageApp', ['ngMaterial', 'ngMessages']);

(function(){
  'use strict';

  app.controller('appController', AppController)

  AppController.$inject = ['$scope', '$timeout'];

  function AppController($scope, $timeout) {
    $scope.isLoggedIn = false
    $scope.user = {}
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            $timeout(function () {
                $scope.user = user
                $scope.isLoggedIn = true
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
        })
        
    }

  }
})();