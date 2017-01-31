
// window.ionic.Platform.ready(function() {
//     angular.bootstrap(document, ['starter']);
// });
// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic','ngCordova','starter.controllers','starter.services','leaflet-directive']) //,'datatables'

.run(function($rootScope, $ionicPlatform, $cordovaSQLite, DB) {
  
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    /////// now using ngcordova.. easier. TODO: unistall network plugin
    // document.addEventListener("offline", onOffline, false);
    // function onOffline() {
    //     // Handle the offline event
    //     alert('you are offline');
    // }
      
    DB.init();

    $rootScope.$broadcast('$cordovaNetwork:online'); // just to check the status
    //window.dispatchEvent(new Event('resize')); // should only happen after {{stuff}} set..
    /*  
    // test db
    console.log("Open DB!");
      db = $cordovaSQLite.openDB("meercat.db");
      
    
      
      
    //$cordovaSQLite.execute(db, "CREATE TABLE IF NOT EXISTS users (id integer primary key, firstname text, lastname text)");
    db.transaction(function(tx) {
    tx.executeSql('DROP TABLE IF EXISTS test_table');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id integer primary key, data text, data_num integer)');

    // demonstrate PRAGMA:
    db.executeSql("pragma table_info (test_table);", [], function(res) {
      console.log("PRAGMA res: " + JSON.stringify(res));
    });

    tx.executeSql("INSERT INTO test_table (data, data_num) VALUES (?,?)", ["test", 100], function(tx, res) {
      console.log("insertId: " + res.insertId + " -- probably 1");
      console.log("rowsAffected: " + res.rowsAffected + " -- should be 1");

      db.transaction(function(tx) {
        tx.executeSql("select count(id) as cnt from test_table;", [], function(tx, res) {
          console.log("res.rows.length: " + res.rows.length + " -- should be 1");
          console.log("res.rows.item(0).cnt: " + res.rows.item(0).cnt + " -- should be 1");
        });
      });

    }, function(e) {
      console.log("ERROR: " + e.message);
    });
  }); //*/
      
      
  });
})
.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(50);
  $ionicConfigProvider.views.forwardCache(true); // use cache when going forward 

    
  $stateProvider

  .state('app', {
    url: "/app",
    templateUrl: "templates/browse.html",
    controller: 'AppCtrl as app'
  })
  .state('login', {
    url: "/login",
    cache: false,
    templateUrl: "templates/login.html",
    controller: 'LoginCtrl as vm'
  })
  .state('login2', {
    url: "/login2",
    cache: false,
    templateUrl: "templates/login2.html",
    controller: 'LoginCtrl as vm'
  })
  .state('login3', {
    url: "/login3",
    cache: false,
    templateUrl: "templates/login3.html",
    controller: 'LoginCtrl as vm'
  })
  .state('register', {
    url: "/register",
    cache: false,
    templateUrl: "templates/login-register.html",
    controller: 'RegCtrl as vm'
  })
  
  .state('order', {
    url: "/order",
    cache: false,
    templateUrl: "templates/place_order.html",
    controller: 'OrderCtrl as vm'
  })
  .state('order-confirm', {
    url: "/order-confirm",
    cache: false,
    templateUrl: "templates/order-confirm.html",
    controller: 'OrderCtrl as vm'
  })
  .state('order-ship', {
    url: "/order-ship",
    templateUrl: "templates/order-ship.html",
    controller: 'OrderCtrl as vm'
  })
  
  .state('orders', {
    url: "/orders",
    templateUrl: "templates/orders.html",
    controller: 'OrderStatusCtrl as vm'
  })
  .state('order-detail', {
    url: "/order/:orderId",
    templateUrl: "templates/order-detail.html",
    controller: 'OrderDetailCtrl as vm',
    resolve: {
      orderId: function($stateParams) {
        return $stateParams.orderId
      }
    }
  })
//  .state('orderDetail', {
//    url: "/order/:id",
//    templateUrl: "templates/order_detail.html",
//    controller: 'OrderCtrl as vm'
//  })
  .state('track', {
    url: "/track",
    templateUrl: "templates/track.html",
    controller: 'OrderTrackerCtrl as vm'
  })
  .state('track-detail', {
    url: "/track/:orderShipmentId",
    templateUrl: "templates/order-track.html",
    controller: 'OrderTrackDetailCtrl as vm',
    resolve: {
      orderShipmentId: function($stateParams) {
        return $stateParams.orderShipmentId
      }
    }
  })
  .state('notifications', {
    url: "/notifications",
    templateUrl: "templates/notifications.html",
    controller: 'OrderCtrl as vm'
  })
  
  
  .state('library', {
    url: "/library",
    abstract : true,
    templateUrl: "templates/library.html",
    controller: 'LibCtrl as lib'
  }) 
  .state('library.stock', {
    url: "/stock",
    views: {
        'main': {
            templateUrl: 'templates/library-stock.html',
            controller : 'LibStockCtrl as vm'
        }
    }
  })
  .state('library.assets', {
    url: "/assets",
    views: {
        'main': {
            templateUrl: 'templates/library-assets.html',
            controller : 'LibStockCtrl as vm'
        }
    }
  })
  .state('library.beneficiaries', {
    url: "/bene",
    views: {
        'main': {
            templateUrl: 'templates/library-beneficiaries.html',
            controller : 'LibBeneCtrl as vm'
        }
    }
  })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});
