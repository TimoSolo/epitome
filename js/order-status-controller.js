angular.module('starter.controllers') 
.controller('OrderStatusCtrl',  function ($scope, $filter, $ionicSideMenuDelegate, $ionicPlatform,$ionicPopup, $window, $location,  Category, Stock, Beneficiary, Address, Order, UI, $compile) { //DTOptionsBuilder, DTColumnDefBuilder, DTColumnBuilder, 
    var vm = this;
    
    vm.columnDefs = [
        {headerName: "ID", field: "id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
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
              $location.path("/order/"+params.value);
            });
          },
          cellRenderer: function(params) {
              return '<button class="med-icon icon ion-information-circled button-clear button-dark"></button>'; //ng-click="vm.addToBasket('+ params.value+'); 
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
          Order.all().then(function(res) {
              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();
              // window resize
          });
        }
    };


   
}).controller('OrderDetailCtrl',  function (orderId, $scope, $timeout, $filter, $ionicSideMenuDelegate, $ionicPlatform,$ionicActionSheet, $window, $location,  Category, StockOrder, Order, UI, $compile) { //DTOptionsBuilder, DTColumnDefBuilder, DTColumnBuilder, 
    var vm = this;
    vm.order = {};
    vm.address = "";

    Order.getById(orderId).then(function(o) {
      vm.order = o;
      vm.address = o.address.split(", ").join("<br>");
    });
    
    vm.actionClick = function() {

   // Show the action sheet
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: 'Revise' },
       { text: 'Approve' }
     ],
     destructiveText: 'Decline',
     titleText: 'Order Actions: "Revise" to edit the order, or "Approve" to confirm. "Decline" to cancel this order.',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       return true;
     }
   });
 }

    vm.columnDefs = [
        {headerName: "ID", field: "id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Category", field: "category", suppressSizeToFit:true, width: 150},
        {headerName: "Description", field: "description",width: 300},
        {headerName: "Qty", field: "qty", width: 50, suppressSizeToFit:true,
          cellStyle: {'text-align': 'center'},},
        {headerName: "Price", field: "price", width: 150,  suppressSizeToFit:true, 
          cellStyle: {'text-align': 'right', 'padding-right':'5px'},
          cellRenderer: function(p) {
            if (p.value == undefined)
              return "";
            return "R " + (p.value / 100 ).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
              //return p.value / 100 ; 
        }},
        {headerName: "Discount", field: "discount", width: 150,  suppressSizeToFit:true, 
          cellStyle: {'text-align': 'right', 'padding-right':'5px'},
          cellRenderer: function(p) {
            if (p.value == undefined)
              return "";
            return  (p.value ) + "%";
              //return p.value / 100 ; 
        }},
        {headerName: "Total", field:"total", width: 150,  suppressSizeToFit:true, 
          cellStyle: {'text-align': 'right', 'padding-right':'5px'},
          cellRenderer: function(p) {
              var price = p.value;
              return  "R " + price.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
              //return p.value / 100 ; 
        }},
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
    };

    vm.gridOptionsTotals = {
        columnDefs: vm.columnDefs,
        rowData: null,
        enableSorting: true,
        //angularCompileRows:true,
        headerHeight: 0,
        rowHeight: 40,
        suppressUnSort: true,
        suppressCellSelection: true,
        //data: [],
        //suppressVerticalScroll: true, // fit to content height
        ready: function() {

          vm.gridOptions.api.sizeColumnsToFit();
          StockOrder.getByOrderId(orderId).then(function(res) {
              
              var totals = [];
              var totalcost = 0;
              angular.forEach(res, function(row) {
                totalcost += row.total = row.price / 100 * row.qty * (100 - row.discount) / 100;
              });
              totals.push({description:"<b>Sub Total</b>",total:totalcost});
              totals.push({description:"<b>VAT</b>",total:totalcost*0.14});
              totals.push({description:"<b>Total</b>",total:totalcost*1.14});

              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();

              vm.gridOptionsTotals.rowData = totals;
              vm.gridOptionsTotals.api.onNewRows();
              //$window.triggerHandler('resize');
              $timeout(function() { window.dispatchEvent(new Event('resize')); }, 50);  // annoying that have to call the window resize event to trigger resize of grid for fullheight
          });
        }
    };



   
});