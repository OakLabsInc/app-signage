(function(app){
    'use strict';
    
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
  
})(window.app);
