function itemAdjust(id, amount)
{
  console.log(id,amount);
  var q = document.getElementById("qty"+id);
  q.value = Math.max( parseInt(q.value) + amount,0);
  // update angular model
  var ang = angular.element(q).scope();
  ang.vm.saveSession();
  ang.vm.confirmGridOptions.api.setRows(ang.vm.basketItems);
}

angular.module('starter.controllers') 
.controller('OrderCtrl',  function ($scope,$timeout,$filter,$ionicSideMenuDelegate, $window, $location,  Category, Stock, Beneficiary, Address, Order, UI, $compile) { //DTOptionsBuilder, DTColumnDefBuilder, DTColumnBuilder, 
    var vm = this;
    // test db:
    vm.categories = [];
    vm.category = null;
    
    vm.saveToBook = 0;
    vm.stockList = [];

    vm.basketItems = [];
    vm.noOfItems = 0;

    vm.Beneficiary = Beneficiary;
    vm.beneficiary_type = "Person";
    

    vm.columnDefs = [
        {headerName: "ID", field: "id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Category", field: "category", suppressSizeToFit:true, width: 150},
        {headerName: "Description", field: "description",width: 300},
        {headerName: "", field: "id", width: 80, suppressSorting: true, suppressSizeToFit:true, 
          cellStyle: {"cursor":"pointer"}, // not really needed on a mobile device :P LOLLLZ
          cellClicked: function(params) {
            console.log(params);
            var button = params.eventSource.firstChild.firstChild.firstChild; // get the buttton yo
            var ang = angular.element(document.getElementById("placeorder")).scope(); // hacky hacky hacky
            ang.$apply(function () {
              var res = ang.vm.addToBasket(params.data);
              // or use button.classList.toggle !
              if (res > 0 ) { // added, set to delete.
                button.className = "med-icon icon ion-minus-circled button-clear button-dark";
                button.style.color="#ef473a";
              } else {
                button.className = "med-icon icon ion-plus-circled button-clear button-dark";
                button.style.color="";
              }
            });
          },
          cellRenderer: function(params) {
              var ang = angular.element(document.getElementById("placeorder")).scope();
              var index = ang.vm.basketItems.map(function(item) { return item.id; }).indexOf(params.value);
              var color = 'class="med-icon icon ion-plus-circled button-clear button-dark"';
              if (index > -1 ) { // in basket
                color = 'style="color:#ef473a" class="med-icon icon ion-minus-circled button-clear button-dark"';
              } 
              return '<button id="add'+params.value+'" '+color+'></button>'; //ng-click="vm.addToBasket('+ params.value+'); 
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
          Stock.all().then(function(res){
              vm.gridOptions.rowData = res;
              vm.gridOptions.api.onNewRows();
              $timeout(function() {
               vm.loadFromSession(); // load from session if refresh
            }, 50);
              
          });
        }
    };


    
    // vm.dtOptions = DTOptionsBuilder
    // .fromFnPromise(Stock.all())
    // .withDOM('fti') // only show table
    // .withScroller()
    // .withOption('deferRender', true)
    // .withOption('createdRow', function (row) {
    //         $compile(angular.element(row).contents())($scope);
    //     })
    // // Do not forget to add the scorllY option!!!
    // .withOption('scrollY', $window.innerHeight - 155); // dont worry about resize for now..

    
    // vm.dtColumns = [
    //     DTColumnBuilder.newColumn('id').withTitle('ID'),
    //     DTColumnBuilder.newColumn('category').withTitle('Category'),
    //     DTColumnBuilder.newColumn('description').withTitle('Description'),

    //     // .renderWith(function(data, type, full) {
    //     //     return '<a ui-ref="/stock/"'+full.id+'>'
    //     //             + data + '</a>';
    //     //             //'<button class="med-icon icon ion-information-circled button-clear button-dark" ng-click="vm.viewDetail('+full.id+'); "></button> '           
    //     // }),
    //     DTColumnBuilder.newColumn('category_id').withTitle('').notSortable().renderWith(function(data, type, full) {
    //         return '<button class="med-icon icon ion-plus-circled button-clear button-dark" ng-click="vm.addToBasket('+full.id+'); "></button>';
    //     })
    // ];
    
    //*/

    

    vm.gotoOrderConfirm = function()
    {
      vm.saveSession();
      if (vm.noOfItems<1)
        {
          UI.toast("Your basket is empty. Please select an item.");
          return false;
        }
      $location.path("/order-confirm");
    }
    vm.gotoOrderShip = function()
    {
      // update quantity
      // TODO: remove 0 quantity items. check if at least one item!
      // TODO: add UoM
      
      //$window.sessionStorage.basketItems = JSON.stringify(vm.basketItems);
      $location.path("/order-ship");
    }
    vm.gotoFinish = function() {
      // check if address details complete.
      if (!vm.form.$valid) 
        return UI.toast("Please enter all required fields first.");
      
      // add order to DB
      var order = {}; // db object
      var address = angular.copy(vm.fulladdress);
      if (!vm.saveToBook)
        address.name = "";

      order.items = angular.copy(vm.basketItems); // gets inserted later
      order.beneficiary_type = vm.beneficiary_type;
      order.beneficiary_id = vm.beneficiary;
      order.status = "pending";
      Address.addedit(address).then(function(ad){
        order.address_id = ad.id;
        return Order.add(order);
      }).then(function(o){
        // got the newly created order
        UI.toast("Order Completed!");
        //saved
        // clear session order
        delete $window.sessionStorage.basketItems
        // go to /app
        $location.path("/app");
      }).catch(function(error){
        UI.toast("Error saving your order. Please try again.");
        // 
      });

      
    }


    vm.saveSession = function() {
      angular.forEach(vm.basketItems, function(item, key) {
          var el = document.getElementById("qty"+item.id);
          if (el) {
            var val = el.value;
            item.qty = parseInt(val);
            val = document.getElementById("date"+item.id).value;
            item.date = val; 
            val = document.getElementById("deliver"+item.id).checked;
            item.deliver = val; 
          }
        });
      console.log('update qty of items:',vm.basketItems);

      $window.sessionStorage.basketItems = JSON.stringify(vm.basketItems);
    }

    vm.loadFromSession = function () {
      if ($window.sessionStorage && $window.sessionStorage.basketItems) // TODO: mark items if in basket on load
        vm.basketItems = angular.fromJson($window.sessionStorage.basketItems);
        vm.noOfItems = 0;
        angular.forEach(vm.basketItems, function(item, key) {
          if (item) {
            vm.noOfItems++;
            var button = document.getElementById("add"+ item.id);
            if (button) {
              button.className = "med-icon icon ion-minus-circled button-clear button-dark";
              button.style.color="#ef473a";
            }
            var el = document.getElementById("qty"+item.id);
            if (el) {
              el.value = item.qty ;
              document.getElementById("date"+item.id).value = item.date; 
              document.getElementById("deliver"+item.id).checked = item.deliver; 
            }
          }
        });
    }
    vm.loadFromSession(); 
    
    
    vm.addToBasket = function(obj) {
      console.log("add item to basket:",obj);
      //var sid = "id"+obj.id; // make a string----
      var returnval = 1;
      var index = vm.basketItems.map(function(item) { return item.id; }).indexOf(obj.id)
      if (index>-1)
      {
        // remove 
        if (vm.noOfItems == 1) 
          vm.basketItems = [];// delete
        else
          vm.basketItems.splice(index, 1);
        vm.noOfItems -= 1;
        returnval = -1;
      }
      else {
        vm.basketItems.push(obj);
        vm.noOfItems ++;
        //return 1;
      }
      vm.saveSession();
      return returnval;
    }
    

// confirm order /////////////////////////////////////



    vm.confirmColumnDefs = [
        {headerName: "ID", field: "id", width: 50, suppressSizeToFit:true, comparator:function(a,b){return parseInt(a)-parseInt(b)}},
        {headerName: "Category", field: "category", suppressSizeToFit:true, width: 150},
        {headerName: "Description", field: "description",width: 300},
        {headerName: "Deliver?", field: "deliver", width: 100, suppressSorting: true, suppressSizeToFit:true, 
          cellStyle: {'text-align': 'center'},
          cellRenderer: function(p) {
             //var ang = angular.element(document.getElementById("placeorder")).scope();
             //var index = ang.vm.basketItems.map(function(item) { return item.id; }).indexOf(params.value);
             var val = 'checked';
              if ("deliver" in p.data)
                val = (p.data.deliver)?'checked':'';
              return '<label class="toggle"><input type="checkbox"  onchange="itemAdjust('+p.data.id+',0)" id="deliver'+p.data.id+'" '+val+'><div class="track"><div class="handle">'; //ng-click="vm.addToBasket('+ params.value+'); 
              //return '<ion-checkbox id="deliver'+p.data.id+'" '+val+'></ion-checkbox>';
        }},
        {headerName: "Date Required", field: "date", width: 150, suppressSorting: true, suppressSizeToFit:true, 
          cellRenderer: function(p) {
              var val = '';
              if (p.data.date)
                val = p.data.date;
              return '<input type="date" id="date'+p.data.id+'"  onchange="itemAdjust('+p.data.id+',0)"  value="'+val+'" >'; //ng-click="vm.addToBasket('+ params.value+'); 
        }},
        {headerName: "Qty", field: "qty", width: 150, suppressSorting: true, suppressSizeToFit:true, 
          cellRenderer: function(p) {
              var val = 1;
              if (p.data.qty)
                val = p.data.qty;
              return '<div class="row"><div class="cell"><button class=" med-icon icon ion-minus-circled button-clear button-dark" '+
                ' onclick="itemAdjust('+p.data.id+',-1)"></button></div> <div class="cell"><input class=" form-control input-sm" type="number" '+
                ' id="qty'+p.data.id+'" value="'+val+'" style="width:70px; text-align:center" ></div> <div class="cell"><button class=" med-icon icon ion-plus-circled button-clear button-dark" '+
                ' onclick="itemAdjust('+p.data.id+',1)"></button></div>'; //ng-click="vm.addToBasket('+ params.value+'); 
        }}
    ];

    vm.confirmGridOptions = {
        columnDefs: vm.confirmColumnDefs,
        rowData: null,
        enableSorting: true,
        angularCompileRows:true,
        headerHeight: 40,
        rowHeight: 40,
        suppressUnSort: true,
        suppressCellSelection: true,
        //data:vm.basketItems,
        ready: function() {
          vm.confirmGridOptions.api.sizeColumnsToFit();
          // var data = [];
          // angular.forEach(vm.basketItems, function(value, key) {
          //   if (value) 
          //     data.push(value);
          // });
          vm.confirmGridOptions.rowData = vm.basketItems;
          vm.confirmGridOptions.api.onNewRows();
        }
    };


/// address ////////////
  vm.addressBook = [];
  vm.fulladdress = {};
  vm.countryList = ["Afghanistan","Åland Islands","Albania","Algeria","American Samoa","Andorra","Angola","Anguilla","Antarctica","Antigua and Barbuda","Argentina","Armenia","Aruba","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bermuda","Bhutan","Bolivia, Plurinational State of","Bonaire, Sint Eustatius and Saba","Bosnia and Herzegovina","Botswana","Bouvet Island","Brazil","British Indian Ocean Territory","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Cayman Islands","Central African Republic","Chad","Chile","China","Christmas Island","Cocos (Keeling) Islands","Colombia","Comoros","Congo","Congo, the Democratic Republic of the","Cook Islands","Costa Rica","Côte d'Ivoire","Croatia","Cuba","Curaçao","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Ethiopia","Falkland Islands (Malvinas)","Faroe Islands","Fiji","Finland","France","French Guiana","French Polynesia","French Southern Territories","Gabon","Gambia","Georgia","Germany","Ghana","Gibraltar","Greece","Greenland","Grenada","Guadeloupe","Guam","Guatemala","Guernsey","Guinea","Guinea-Bissau","Guyana","Haiti","Heard Island and McDonald Islands","Holy See (Vatican City State)","Honduras","Hong Kong","Hungary","Iceland","India","Indonesia","Iran, Islamic Republic of","Iraq","Ireland","Isle of Man","Israel","Italy","Jamaica","Japan","Jersey","Jordan","Kazakhstan","Kenya","Kiribati","Korea, Democratic People's Republic of","Korea, Republic of","Kuwait","Kyrgyzstan","Lao People's Democratic Republic","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Macao","Macedonia, the former Yugoslav Republic of","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Martinique","Mauritania","Mauritius","Mayotte","Mexico","Micronesia, Federated States of","Moldova, Republic of","Monaco","Mongolia","Montenegro","Montserrat","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Caledonia","New Zealand","Nicaragua","Niger","Nigeria","Niue","Norfolk Island","Northern Mariana Islands","Norway","Oman","Pakistan","Palau","Palestinian Territory, Occupied","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Pitcairn","Poland","Portugal","Puerto Rico","Qatar","Réunion","Romania","Russian Federation","Rwanda","Saint Barthélemy","Saint Helena, Ascension and Tristan da Cunha","Saint Kitts and Nevis","Saint Lucia","Saint Martin (French part)","Saint Pierre and Miquelon","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Sint Maarten (Dutch part)","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Georgia and the South Sandwich Islands","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Svalbard and Jan Mayen","Swaziland","Sweden","Switzerland","Syrian Arab Republic","Taiwan, Province of China","Tajikistan","Tanzania, United Republic of","Thailand","Timor-Leste","Togo","Tokelau","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Turks and Caicos Islands","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","United States Minor Outlying Islands","Uruguay","Uzbekistan","Vanuatu","Venezuela, Bolivarian Republic of","Viet Nam","Virgin Islands, British","Virgin Islands, U.S.","Wallis and Futuna","Western Sahara","Yemen","Zambia","Zimbabwe"];
  vm.getCountry = function(query) {
    return $filter('filter')(vm.countryList, query);
  }
  // get address book
      Address.all().then(function(list){
        vm.addressBook = list;
      });
  vm.loadFromAddressBook = function(ad) {
    console.log("address:",ad);
    // todo: confirm overwrite
    vm.fulladdress = angular.copy(ad); // dont want to link to actuall address book obj!
  }
  vm.saveAddress = function() {
    console.log("lets save this address!");
    if (!vm.fulladdress.name) 
      return UI.toast("Please enter a name to save the address as (eg. Head Office)");

    if (!vm.form.$valid) 
      return UI.toast("Please enter all required fields first.");
    // check if name exists and warn:
    Address.getByName(vm.fulladdress.name).then(function(ad){
      if (ad)
        return $ionicPopup.confirm({
           title: 'Overwrite Existing Address?',
           template: 'Saving this address will replace the one with the same name.'
         }).then(function(res) {
           if(res) {
             return ad.id;
           } else {
             return false;
           }
        });
      return 0;
    }).then(function(ok){
      if (ok!==false) {
        UI.loadingShow();
        vm.fulladdress.id = ok; // ok is the id ok?!

        if (ok>0)
          return Address.save(vm.fulladdress);
        else
          return Address.add(vm.fulladdress);
      }
    }).then(function(ad){
      // reload the address book.
      Address.all().then(function(list){
        UI.loadingHide();
        UI.toast("Address saved");
        vm.addressBook = list;
      });
    },function(error){
      // error saving address
      UI.toast("Sorry, couldn't save the address");
    }).finally(UI.loadingHide); 
  }
  

    vm.toggleLeft = function() {
     $ionicSideMenuDelegate.toggleLeft();
  };
    
        
   
})
