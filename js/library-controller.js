angular.module('starter.controllers') 
.controller('LibCtrl',  function ($scope, $filter, $ionicSideMenuDelegate  ) {
    var vm = this;
    //$scope.subtitle = 'Stock..';
    vm.toggleLeft = function() {
     $ionicSideMenuDelegate.toggleLeft();
  };
  vm.leftButtons = [{
            type: 'button-icon icon ion-navicon',
            tap: function(e) {
                vm.toggleMenu();
            }
        }];
    
})
.controller('LibStockCtrl',  function ($scope, Stock, UI ) {
    var vm = this;
     
    vm.columnDefs = [
        {headerName: "ID", field: "id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Category", field: "category", suppressSizeToFit:true, width: 150},
        {headerName: "Description", field: "description",width: 300},
        {headerName: "Price", field: "price", width: 150,  suppressSizeToFit:true, 
          cellStyle: {'text-align': 'right', 'padding-right':'5px'},
          cellRenderer: function(p) {
            if (p.value == undefined)
              return "";
            return "R " + (p.value / 100 ).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
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
        ready: function() {

          vm.gridOptions.api.sizeColumnsToFit();
          Stock.all().then(function(res){
              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();
          });
        }
    };
})

.controller('LibBeneCtrl',  function ($scope, Beneficiary , $ionicModal, UI) {
    var vm = this;
    vm.beneficiary = {};
    vm.columnDefs = [
        {headerName: "ID", field: "id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Type", field: "beneficiary_type", suppressSizeToFit:true, width: 150},
        {headerName: "Name", field: "name",width: 300},
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
          Beneficiary.all().then(function(res){
              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();
          });
        }
    };

vm.modal = null;
$ionicModal.fromTemplateUrl('templates/library-bene-add.html', {
scope: $scope,
animation: 'slide-in-up'
  }).then(function(modal) {
    vm.modal = modal
  })  
  vm.add = function() {
    vm.modal.show()
  }
  vm.closeModal = function() {
    vm.modal.hide();
  };
  vm.saveModal = function() {
    if (!vm.form.$valid) 
        return UI.toast("Please enter all required fields.");
      
      // add to DB
      Beneficiary.addedit(vm.beneficiary).then(function(bene){
        // refresh data
        Beneficiary.all().then(function(res){
              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();
          });
        vm.modal.hide();
        UI.toast("Beneficiary Added!");
      }).catch(function(error){
        UI.toast("Error saving. Please try again.");
        // 
      });
    
  };
  $scope.$on('$destroy', function() {
    vm.modal.remove();
  });

})
