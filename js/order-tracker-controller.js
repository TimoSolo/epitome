angular.module('starter.controllers') 
.controller('OrderTrackerCtrl',  function ($scope, $location,  OrderShipment, UI) { 
    var vm = this;
    
    vm.columnDefs = [
        {headerName: "Order ID", field: "order_id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Shipping ID", field: "shipment_id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Date Created", field: "date_created", suppressSizeToFit:true, width: 150},
        {headerName: "Consignee", field: "beneficiary",width: 300},
        {headerName: "Status", field: "status", suppressSizeToFit:true, width: 150},
        {headerName: "Exp. Departure", field: "date_depart", suppressSizeToFit:true, width: 150},
        {headerName: "Exp. Arrival", field: "date_arrive", suppressSizeToFit:true, width: 150},
        {headerName: "", field: "id", width: 100, suppressSorting: true, suppressSizeToFit:true, 
          cellStyle: {"cursor":"pointer"}, // not really needed on a mobile device :P LOLLLZ
          cellClicked: function(params) {
            console.log(params);
            var button = params.eventSource.firstChild.firstChild.firstChild; // get the buttton yo
            var ang = angular.element(button).scope(); // hacky hacky hacky
            ang.$apply(function () {
              // go to detail
              console.log('go to detail...');
              $location.path("/track/"+params.value);
            });
          },
          cellRenderer: function(params) {
              return '<button class="med-icon icon ion-map button-clear button-dark"></button>'; //ng-click="vm.addToBasket('+ params.value+'); 
        }}
    ];


    vm.gridOptions = {
        columnDefs: vm.columnDefs,
        rowData: null,
        enableSorting: true,
        //angularCompileRows:true,
        headerHeight: 40,
        rowHeight: 40,
        suppressUnSort: true,
        suppressCellSelection: true,
        ready: function() {

          vm.gridOptions.api.sizeColumnsToFit();
          OrderShipment.all().then(function(res) {
              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();
              // window resize
          });
        }
    };


   
}).controller('OrderTrackDetailCtrl',  function (orderShipmentId, leafletData, $window, $scope, $timeout, $ionicSideMenuDelegate, $ionicActionSheet,  Order, OrderShipment, Shipment, Move, UI) { //DTOptionsBuilder, DTColumnDefBuilder, DTColumnBuilder, 
    var vm = this;
    vm.order = {};
    vm.shipment = {};
    vm.ordershipment = {};
    vm.moves = [];
    vm.address = "";


    OrderShipment.getById(orderShipmentId).then(function(os) {
      vm.ordershipment = os;
      return Order.getById(os.order_id);
    }).then(function(o) {
      vm.order = o;
      vm.address = o.address.split(", ").join("<br>");
      return Shipment.getById(vm.ordershipment.shipment_id);
    }).then(function(s) {
      vm.shipment = s;
      return Move.getByShipmentId(s.id);
    }).then(function(m) {
      vm.moves = m;
      for (var i = vm.moves.length - 1; i >= 0; i--) {
        var mv = vm.moves[i];
        vm.markers["p"+i] = mv;
        vm.paths.p1.latlngs.push(mv); // just need the lat and long
      };
      vm.showMap(m.length-1); // show the last move
      $timeout(function() { window.dispatchEvent(new Event('resize')); }, 50); // should only happen after address set..
    });

    vm.showMap = function(i) {
      console.log("move it",i);
      var move = vm.moves[i];
      vm.center = {
                    lat: move.lat, 
                    lng: move.lng,
                    zoom: 10
                }
    }

    leafletData.getMap("map").then(function(map) {
                     var layer = new StorageTileLayer("http://b.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                      storage: $window.sessionStorage
                   })
                    layer.addTo(map);
       });

    //vm.layers = new StorageTileLayer("http://b.tile.openstreetmap.org/{z}/{x}/{y}.png"
      //, {storage: $window.sessionStorage}
    //  );

    vm.center = {};
    vm.markers = {};
    //         { centerPin: {
    //             lat: -29.872423, 
    //             lng: 31.024280,
    //             zoom: 10,
    //             message: "Dispatched",
    //             focus: true,
    //             draggable: false
    //             }
    //         }
    vm.paths = {
            p1: {
                color: '#008000',
                weight: 6,
                latlngs: [
                    // { lat: -29.872423, lng: 31.024280 },
                    // { lat: 48.83, lng: 2.37 },
                    // { lat: 41.91, lng: 12.48 }
                ],
            }
        }
    



   
})
.directive('resizetracker', function($window,$timeout) {
    function updateUI(element) {
        var map = angular.element(document.getElementById("map"));
        var headerh = document.getElementById("header").offsetHeight + 15;          
        var h = $window.innerHeight - headerh - 43; // 40 for header?
        
        var changes = {
            height: h+'px',
            "margin-top": headerh + 'px'
        }
        element.css(changes);

        // update map height
        h-=65;
        changes = {
            height: h+'px',
        }
        map.css(changes);
    }

    return function(scope, element, attr) {
        var w = angular.element($window);
        updateUI(element);

        w.on('resize', function() {
            updateUI(element);
            scope.$apply();
            
            
        });
    };
});
