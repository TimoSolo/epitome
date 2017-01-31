angular.module('starter.controllers', ['ionic','leaflet-directive','ngMessages',"angularGrid",'ion-autocomplete']) // ,'datatables.scroller' ,'templates' - for cached templates..
.constant('AUTH_EVENTS', {
  loginSuccess: 'auth-login-success',
  loginFailed: 'auth-login-failed',
  logoutSuccess: 'auth-logout-success',
  sessionTimeout: 'auth-session-timeout'
  //notAuthenticated: 'auth-not-authenticated',
  //notAuthorized: 'auth-not-authorized'
})
.factory('API', function($http, $q) {
  var API = this;
  API.url = 'http://demo2103758.mockable.io/';

  // wrap call into a promise to make similar to our local db interaction.
  API.call = function(query, params) {
    var deferred = $q.defer();
    $http.get(API.url + query)
        .success(function(result) {
            console.log("API DEBUG: ",result);
            deferred.resolve(result);
        })
        .error(function(error) {
            console.log("API ERROR: ",error);
            //alert("DB ERROR: "+error.message); // TODO: use toast rather
            //deferred.reject(error);
            deferred.resolve(error); // *************************************** temp.. just resolve for now
        });
    
    return deferred.promise;
  }

  API.getUserByCredentials = function(email,password) {
    return API.call('user/login');
  }
  API.registerUser = function(user) {
    // using login for now..
    return API.call('user/login', user);
  }
  API.forgotPassword = function(email) {
    // using login for now..
    return API.call('user/login', email);
  }

  return API;
})
.factory('AuthService', function($rootScope, $q, $window, AUTH_EVENTS, User, API) {
  var AuthService = this;
  AuthService.loggedIn=false;
  AuthService.currentUser={};
  

    // checkLogin : function() {
    //   $rootScope.$broadcast('loggedIn', { 'loggedIn' : loggedIn });
    //   return loggedIn;

    // },
    
  AuthService.login = function(credentials) {
      // if online, use API service.. 
    if (!credentials.email) 
      return $q.reject('Please enter your email address');
    if (!credentials.password) 
      return $q.reject('Please enter your password');
    if ($rootScope.online) { // available in root scope..
      
      // user not in db. therefore hasnt registered on this device.
      return User.getByEmail(credentials.email).then(function(user){
        if (!user)
          return $q.reject('User not registered on this device. Please check email or register first.');
        var cuser = user;
        // if online MUST check online. (TODO: add failsafe if online but cant reach server? use promise chaining http://stackoverflow.com/a/19400396/253096)
        return API.getUserByCredentials(credentials.email,credentials.password).then(function(result){
          // check in db for username. update password + any details from api.
          if (cuser.change_password) {
            cuser.password = User.hashPassword(credentials.password);
            cuser.change_password = 0; // prevent from changing password every time. shouldnt happen, but usefull when testing
          }
          cuser.last_online = cuser.last_login = moment().format('YYYY-MM-DD');
          return User.save(cuser).then(function(user){
            return user;
          });
          
        });
      },function(error){ // couldnt find email in local db
        return $q.reject('User not registered on this device. Please check email or register first.');
      });
    } else {
      // otherwise offline. Check in the db
      // offline

      return User.getByEmail(credentials.email)
      .then(function(user){
        if (!user)
          return $q.reject('User not registered on this device. Please register first.');
        if (!user.last_online)
          return $q.reject("You have to be online to log-in for the first time."); 

        return User.getByCredentials(credentials.email,credentials.password);
        })
      .then(function(user){
          if (!user)
            return $q.reject("Incorrect password. Please try again or use 'forgot password'");
          if (moment(user.last_online) < moment().subtract(30, 'days') )
            return $q.reject("Sorry, it's been a while... You need to be online to log in.");
          var cuser = user;
          cuser.last_login = moment().format('YYYY-MM-DD'); // set last_login date.
          return User.save(cuser);
        })
      .then(function(user){
            return user;
        });
      
      //$rootScope.$broadcast('loggedIn', { 'loggedIn' : loggedIn });
    }
  }

   AuthService.logout = function() {
      $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
    }


    AuthService.setCurrentUser = function (user) {
      AuthService.currentUser = user;
      $window.sessionStorage.currentUser = JSON.stringify(user);
      //$rootScope.apply(); // is this needed?????????????????????????????
    };
    AuthService.getCurrentUser = function () {
      return AuthService.currentUser;
    };

    AuthService.load = function () {
      if ($window.sessionStorage && $window.sessionStorage.currentUser)
        AuthService.currentUser = angular.fromJson($window.sessionStorage.currentUser);
    }
    AuthService.load(); // load from session if refresh

    return AuthService;

})

.controller('AppCtrl', function($scope,$rootScope, $state, $ionicActionSheet, $timeout, $location,  $cordovaNetwork, UI, AuthService, AUTH_EVENTS) {
  var app = this;
  //$scope.currentUser = null;
  
  $rootScope.online = true;
  $rootScope.online_status="...";

  app.updateConnectionStatus = function() {
    if(window.cordova) {
      $rootScope.online = $cordovaNetwork.isOnline();
      $rootScope.online_status=(($rootScope.online)?"Online":"Offline");
      UI.toast($rootScope.online_status+"...", 'long', 'bottom');
      // TODO: if online call sync
    }
  }
  app.setConnectionClick = function() {
    console.log("set connection");
    // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: 'Online' },
       { text: 'Offline' }
     ],
     titleText: 'FOR DEBUG PURPOSES: set online status. Currently '+$rootScope.online_status,
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       $rootScope.online = 1-index;
       $rootScope.online_status=(($rootScope.online)?"Online":"Offline");
       return true;
     }
   });
  }



  // GLOBAL EVENTS /////////////////////////////////////////////////////
  $rootScope.$on('$cordovaNetwork:online', function() {
    app.updateConnectionStatus();
  });
  $rootScope.$on('$cordovaNetwork:offline', function() {
    app.updateConnectionStatus();
  });

  $scope.$on(AUTH_EVENTS.loginSuccess, function(event,message) {
      console.log('LOGGED IN!');
      $location.path('/app');
  });
  $scope.$on(AUTH_EVENTS.loginFailed, function(event,message) {
      console.log('error logging in..', message);
      //$ionicLoading.show({ template: 'Incorrect username or password', noBackdrop: true, duration: 3000 });
      // native error
      if (!message)
        message = 'Incorrect username or password';
      // TODO: check if logged in before, otherwise must be registered first.
      //err +=". Please ensure you are registered.";
      UI.toast(message, 'long', 'top');

      // show error.
      //$location.path('/login');
  });
  $scope.$on(AUTH_EVENTS.logoutSuccess, function(event,message) {
      // set message. TODO: add logout button..
      $location.path('/login');
  });
  $scope.$on(AUTH_EVENTS.sessionTimeout, function(event,message) {
      //set message
      $location.path('/login');
  });



  app.go = function ( path ) {
    $location.path( path );
  };
  
  

})






// .controller('LibCtrl',  function ($scope, $filter, $ionicSideMenuDelegate, $ionicPlatform,   Category, Stock, DTOptionsBuilder, DTColumnDefBuilder, DTColumnBuilder, $compile, $window) {
//     var vm = this;
    
//     vm.toggleLeft = function() {
//      $ionicSideMenuDelegate.toggleLeft();
//   };
    
// })
// .controller('LibStockCtrl',  function ($scope, $filter, $ionicSideMenuDelegate, $ionicPlatform,   Category, Stock, DTOptionsBuilder, DTColumnDefBuilder, DTColumnBuilder, $compile, $window) {
//     var vm = this;
//      vm.navTitle = 'Home Page';
//      vm.leftButtons = [{
//             type: 'button-icon icon ion-navicon',
//             tap: function(e) {
//                 vm.toggleMenu();
//             }
//         }];
    
//      vm.dtLibraryOptions = DTOptionsBuilder
//     .fromFnPromise(Stock.all()) // Stock.all()
//     .withDOM('fti') // only show table
//     .withScroller()
//     .withOption('deferRender', true)
//     .withOption('createdRow', function (row) {
//             $compile(angular.element(row).contents())($scope);
//         })
//     // Do not forget to add the scorllY option!!!
//     .withOption('scrollY', $window.innerHeight - 240); // dont worry about resize for now..
        
//     vm.dtLibraryColumns = [
//         DTColumnBuilder.newColumn('id').withTitle('ID'),
//         DTColumnBuilder.newColumn('category').withTitle('Category'),
//         DTColumnBuilder.newColumn('description').withTitle('Description'),
//         DTColumnBuilder.newColumn('category_id').withTitle('').notSortable().renderWith(function(data, type, full) {
//             return '<button class="med-icon icon ion-information-circled button-clear button-dark" ng-click=""></button>';
//         })
        
//     ];
// })




.directive('ionSearch', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                getData: '&source',
                model: '=?',
                search: '=?filter'
            },
            link: function(scope, element, attrs) {
                attrs.minLength = attrs.minLength || 0;
                scope.placeholder = attrs.placeholder || '';
                scope.search = {value: ''};

                if (attrs.class)
                    element.addClass(attrs.class);

                if (attrs.source) {
                    scope.$watch('search.value', function (newValue, oldValue) {
                        if (newValue.length > attrs.minLength) {
                            scope.getData({str: newValue}).then(function (results) {
                                scope.model = results;
                            });
                        } else {
                            scope.model = [];
                        }
                    });
                }

                scope.clearSearch = function() {
                    scope.search.value = '';
                };
            },
            template: '<div class="item-input-wrapper">' +
                        '<i class="icon ion-android-search"></i>' +
                        '<input type="search" placeholder="{{placeholder}}" ng-model="search.value">' +
                        '<i ng-if="search.value.length > 0" ng-click="clearSearch()" class="icon ion-close"></i>' +
                      '</div>'
        };
    })

.directive('resizegrid', function($window,$timeout) {
    function updateUI(element, grid,scope,fullheight) {
        // var hh = document.getElementById('header').offsetHeight;
        // var fh = document.getElementById('footer').offsetHeight;
        // console.log('hh & fh', hh, fh);

        // var tp = hh + 2;
        // var bt = fh + 2;
        // console.log('tp & bt', tp, bt);   
        var headerh = grid.headerHeight;          
        var h = $window.innerHeight - element[0].offsetTop - headerh; // 40 for header?
        if (fullheight!==undefined) {
         
          var hsize = parseInt(element[0].getElementsByClassName("ag-body-container")[0].style.height) + headerh; // 40 for header
          if (hsize>headerh)
          h= hsize+7;
        }

        h-=1; // on android cant scroll inside scroller so cant go over edge!

        var changes = {
            height: h+'px'
            //top: tp + 'px',
        }
       
        element.css(changes);
        $timeout(function() {
           grid.api.sizeColumnsToFit(); // resize cols
           //grid.api.softRefreshView();

           // var vm = scope;
           // if (vm.loadFromSession)
           //  vm.loadFromSession();
        }, 500);
    }

    return function(scope, element, attr) {
        var w = angular.element($window);
        var fullheight = attr.fullheight;
        var grid = attr.agGrid; // eg "vm.gridoptions"
        var obj = scope;
        var arr = grid.split(".");
        while(arr.length && (obj = obj[arr.shift()]));

        updateUI(element,obj,scope,fullheight);

        w.on('resize', function() {
            updateUI(element,obj,scope,fullheight);
            scope.$apply();
            
            
        });
    };
});
