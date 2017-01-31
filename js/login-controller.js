angular.module('starter.controllers') // ,'templates'
.controller('LoginCtrl',  function ($scope, $rootScope, $q, $ionicModal, $ionicLoading, API, UI, AuthService, AUTH_EVENTS, DB_CONFIG, User) {
    // Form data for the login modal
    var vm = $scope;
    $scope.loginData = {};

    // get the last logged in user and display email so dont have to retype every time!
    User.getLatestUser().then(function(user){
        if (user) {
            user.password = "";
            vm.loginData = user;
            //vm.apply();
        }
    }); // just email
    

  // Create the login modal that we will use later
//  $ionicModal.fromTemplateUrl('templates/login.html', function($ionicModal) {
//    $scope.modal = $ionicModal;
//  }, {
//    // Use our scope for the scope of the modal to keep it simple
//    scope: $scope,
//    // The animation we want to use for the modal entrance
//    animation: 'slide-in-up',
//      backdropClickToClose: false,
//      hardwareBackButtonClose: false
//  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    //$scope.modal.hide();
      
       
  };

  // Open the login modal
  $scope.showLogin = function() {
    //$scope.modal.show();
      $location.path('/login');
    
  };
  // Perform the login action when the user submits the login form
  

  $scope.doLogin = function() {

    if (navigator && navigator.connection)
      console.log('connected?',navigator.connection.type);



    console.log('Doing login', $scope.loginData);

    
    AuthService.login($scope.loginData).then(function (user) {
      console.log('user?',user);
      if (user) {
        AuthService.setCurrentUser(user);
        $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
      }
      else {
        $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
      }
    }, function (error) {
        console.log("LOGIN ERROR",error);
      $rootScope.$broadcast(AUTH_EVENTS.loginFailed, error);
    });

  };

  $scope.forgotPassword = function() {
    if (!$rootScope.online)
        UI.toast("You must be online."); // TODO make generic alert / error log service
    else {
        // $ionicLoading.show({
        //   template: 'Loading...',
        // });
        UI.loadingShow();
        if (!$scope.loginData.email)
        {
            UI.toast("Please enter your email address.");
            return;
        }
        User.getByEmail($scope.loginData.email).then(function(user){
            var cuser = user;
            if (!cuser)
                return $q.reject("User not found on device. Please check email or register first.");

            return API.forgotPassword($scope.loginData.email).then(function(){
                return User.save({id:cuser.id,change_password:1});
            },function(){ // error in api call
                return $q.reject("Sorry the was an error on the server. Your password has NOT been reset. Please try again later.");
            })
        })
        .then(function(user){ // API call ok! this is the save "then"
            //AuthService.setCurrentUser($scope.loginData);
            //UI.toast("SUCCESS! Please check your email for your new password.");
            vm.loginData.change_password = 1;
            //vm.apply(); // show notice that email sent
        })
        .then(function(){
                //$ionicLoading.hide();
                UI.loadingHide();
            }
            ,function(error) {
                UI.loadingHide();
                UI.toast(error);
        });
    }
  };

})

.controller('RegCtrl',  function ($scope,$rootScope, $state, $ionicModal, $ionicLoading, $cordovaToast, AuthService, AUTH_EVENTS, API, UI, User) {
  var vm = this;
    // Form data for the login modal
  vm.loginData = {};
//   if (AuthService.getCurrentUser()) {
//     var cuser = AuthService.getCurrentUser();
//     $scope.loginData.name = cuser.name;
//     $scope.loginData.email = cuser.email;
//     $scope.loginData.tel = cuser.tel;
//     $scope.loginData.company = cuser.company;
//     //$scope.loginData.password = null; // clear password
//     //$scope.loginData.id = null; // clear id
// }
  vm.doRegister = function() {
    
    if (!vm.form.$valid) 
      return UI.toast("Please enter all required fields first.");

    if (!$rootScope.online)
        UI.toast("You must be online."); 
    else {
        UI.loadingShow();
        API.registerUser(vm.loginData).then(function(){
            cuser = vm.loginData;
            cuser.change_password = 1;
            return User.addedit(cuser);
        }).then(function(id){
            //AuthService.setCurrentUser(vm.loginData);
            //$scope.go('/login',true);
            $state.go('login',{},{reload:true});
        }).catch(function(error){
          UI.toast("Sorry could not connect to server. Please try again.");
        }).finally(function(){
          UI.loadingHide();
        });
    }
  }
});
