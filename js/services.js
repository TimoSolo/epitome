angular.module('starter.services', ['starter.config'])
// DB wrapper
.factory('UI', function($ionicLoading,$cordovaToast){
    var self = this;
    self.toast = function(msg, duration, position) {
    if(!duration)
        duration = 'long';
    if(!position)
        position = 'top';

    // cordova? Use native:
    if(window.cordova){
        $cordovaToast.show(msg, duration, position,
                function(a){}, function(err){})
        return;
    }
    
    // … fallback / customized $ionicLoading:
    $ionicLoading.show({
        template: msg,
        noBackdrop: true,
        duration: (duration == 'short' ? 700 : 1500)
    });

  }
  self.loadingShow = function() {
    $ionicLoading.show({
        template: '<ion-spinner></ion-spinner>',
    });
  }
  self.loadingHide = function() {
    $ionicLoading.hide();
  }
  return self;
})
.factory('DB', function($rootScope, $q,$timeout, DB_CONFIG) {
    var self = this;
    self.db = null;
    //self.pdb = null; // persistence db
    self.loaded = false;
    self.loadedpromise = $q.defer();

    self.isReady = function()
    {
        return self.loadedpromise.promise;
    }

    // Todo, get these and save them in init so dont have to do every time.
    self.getFieldsDef = function(tablename) {
        var fields = DB_CONFIG.tables.filter(function(o){ return o.name == tablename });
        if (fields && fields[0] && fields[0].columns)
            return fields[0].columns.map(function(col){ return col.name });
        return [];
    } 

    self.init = function() {
        if(window.cordova) {
      // App syntax
      self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); //$cordovaSQLite.openDB("myapp.db");
    } else {
      // Ionic serve syntax
     self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);
    }
        var promises = [];
        angular.forEach(DB_CONFIG.tables, function(table) {
            var columns = [];
            var data = [];
            angular.forEach(table.columns, function(column) {
                columns.push(column.name + ' ' + column.type);
            });
            // IF NOT EXISTS
            var query_table = 'CREATE TABLE ' + table.name + ' (' + columns.join(',') + '); ';
            //console.log(query_table);
            promises.push(self.query(query_table,null,true)
            .then(function(result){
                //self.loaded = true; // loaded one table atleast...
                // if created, add data.
                console.log('Table ' + table.name + ' created');
                if (table.data && table.data.length>0) 
                {
                    var query = '';
                    var row = [];
                    var rows = 0;
                    var cols = [];
                    query =' INSERT INTO ' + table.name ;
                    angular.forEach(table.data, function(row) {
                        data.push('(\'' + row.join('\',\'') + '\')');
                        if (!rows)
                            rows = row.length;
                    });
                    for (var i = 0; i < rows; i++) {
                        cols.push(table.columns[i].name)
                    };
                    query += ' (' + cols.join(',') + ') VALUES ' + data.join(',');
                    self.query(query,null,true); 
                }
            }));

            
            
            
            //console.log(query);
            // only do once so dont put in data if not exist
            // self.db.transaction(function(transaction) {
            //     transaction.executeSql(query_table);
            //     transaction.executeSql(query);
            // });
        });
        $q.all(promises).finally(function(){
            //$timeout(function() {
                self.loadedpromise.resolve(true);
            //}, 10000);
            
        })
        // call the dabase loaded event
        //$rootScope.$broadcast(DB_CONFIG.db_loaded);
        
    };
 
    self.query = function(query, bindings, init) {
        return $q.when(init || self.isReady()).then(function(){
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();
        //console.log(query, bindings);
        self.db.transaction(function(transaction) {
            transaction.executeSql(query, bindings, function(transaction, result) {
                // console.log("DB DEBUG: ",result.rows);
                deferred.resolve(result);
            }, function(transaction, error) {
                console.log("DB ERROR: ",query,error);
                deferred.reject(error);
            });
        });
 
        return deferred.promise;
        });
    };
 
    self.fetchAll = function(result) {
        var output = [];
 
        for (var i = 0; i < result.rows.length; i++) {
            output.push(result.rows.item(i));
        }
        
        return output;
    };
 
    self.fetch = function(result) {
        //console.log('result?',result);
        if (result && result.rows.length > 0)
            return result.rows.item(0);
        return null; //$q.reject("Item not found in local database.");
    };

    self.add = function(objClass, obj) {
        var sql = "INSERT INTO "+objClass.name+ " (";
        var keys = [];
        var vals = [];
        var valsplaceholder = [];
        var fields = self.getFieldsDef(objClass.name); 
        angular.forEach(obj, function(value, key) {
            if (key!='id' && fields.indexOf(key)>-1) { // dont "add" with id.
              keys.push(key);
              vals.push(value);
              valsplaceholder.push("?");
          }
        });
        sql += keys.join(",") +") VALUES (" + valsplaceholder.join(",") + ");"
        console.log(sql);

        return self.query(sql, vals)
        .then(function(res){
            console.log("inserted: ", res );
            obj.id = res.insertId;
            return obj;
        });
    };
    // todo: reuse code!
    // ... note this deletes the user and creates a new one with new id.. might be a problem? http://stackoverflow.com/a/4330694/253096
    // self.addedit = function(objClass, obj, unique) {
    //     // try add.. if exists, edit.
    //     return self.add(objClass, obj).then(function(obj){
    //         // check if rows affected = 0 then get id, and save rather!
    //         //todo here...
    //     }, function(error){
    //         return error;
    //     });

    //     // var sql = "INSERT OR REPLACE INTO "+objClass.name+ " (";
    //     // var keys = [];
    //     // var vals = [];
    //     // var valsplaceholder = []
    //     // angular.forEach(obj, function(value, key) {
    //     //   keys.push(key);
    //     //   vals.push(value);
    //     //   valsplaceholder.push("?");
    //     // });
    //     // sql += keys.join(",") +") VALUES (" + valsplaceholder.join(",") + ");"
    //     // console.log(sql);

    //     // return self.query(sql, vals)
    //     // .then(function(res){
    //     //     console.log("inserted: ", res );
    //     //     return res.insertId;
    //     // });
    // };
    self.save = function(objClass, obj) {
        if (!obj.id)
            return $q.reject("Cant update object without id");
        var sql = "UPDATE "+objClass.name+ " SET ";
        var keys = [];
        var vals = [];
        var valsplaceholder = []
        angular.forEach(obj, function(value, key) {
          keys.push(key);
          vals.push(value);
          valsplaceholder.push(key+" = ?");
        });
        sql += valsplaceholder.join(",");
        sql += " WHERE id =  "+ parseInt(obj.id);
        //console.log("SQL DEBUG:",sql);
        

        return self.query(sql, vals)
        .then(function(res){
            console.log("inserted: ", res );
            return obj; // or res?
        });
    };
    self.all = function(objClass, sql) {
        if (!sql)
            sql = ";";
        return self.query('SELECT * FROM '+objClass.name + ' '+sql)
            .then(function(result){ 
                return self.fetchAll(result); 
            });
    }
    self.getById = function(objClass, id) {
        return self.query('SELECT * FROM '+objClass.name + ' WHERE id = ?', [id])
        .then(function(result){
            return self.fetch(result);
        });
    };
 
    return self;
})
.factory('Category', function(DB) {
    var Category = this;
    Category.name = 'category';
    Category.all = function() {
        return DB.query('SELECT * FROM category')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    
    Category.getById = function(id) {
        return DB.getById(Category,id);
    };
    
    return Category;
})
.factory('Stock', function(DB) {
    var Stock = this;
    Stock.name = "stock";
    Stock.add = function(obj) {
        return DB.add(Stock,obj);
    };
    Stock.all = function() {
        return DB.query('SELECT s.*, c.name as category FROM stock s join category c on (s.category_id = c.id)')
        .then(function(result){
            //return [[1233,'Spare Parts', '02931473 BIG END BEARINGS Deutz BF6M1013','']];
            
            return DB.fetchAll(result);
        });
    };
    
    Stock.getById = function(id) {
        return DB.query('SELECT s.*, c.name as category FROM stock s join category c on (s.category_id = c.id) WHERE s.id = ?', [id])
        .then(function(result){
            return DB.fetch(result);
        });
    };
    
    return Stock;
})
// Users //////////////////////////////////////////////////
.factory('User', function(DB) {
    var User = this;
    User.name = 'user'; // table name

    User.all = function() {
        return DB.all(User);
    };
    User.save = function(obj) {
        return DB.save(User,obj);
    };
    // var User = persistence.define('user', {
    //       //id: "INT",
    //       username: "TEXT",
    //       password: "TEXT",
    //       email: "TEXT",
    //       name: "TEXT",
    //       company: "TEXT",
    //       last_login: "DATE"
    //     });
    //  User.index('username',{unique:true});
     
    
    User.addedit = function(obj) {
        // check if user exists (by email)
        return User.getByEmail(obj.email).then(function(user){
            // got the id, now save over it
            if (user && user.id) {
                obj.id = user.id;
                return DB.save(User,obj);
            }
            // user doesnt exist. add:
            return DB.add(User,obj);
        });
    };
    
    User.getByCredentials = function(email, pword) {
        return DB.query('SELECT * FROM user  WHERE email = ? AND password = ?', [email , User.hashPassword(pword)])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    User.getByEmail = function(email) {
        return DB.query('SELECT * FROM user  WHERE email = ? ', [email])
        .then(function(result){
            return DB.fetch(result);
        });
    };

    User.getLatestUser = function() {
        // get the lastest user that 
        return DB.query('SELECT * FROM user WHERE id > 1 ORDER BY MAX( last_login, date_created) DESC, id DESC LIMIT 1') // ignore id 1: demo user
        .then(function(result){
            return DB.fetch(result);
            // if (res && res.email)
            //     return res.email;
            // return ""; // else return blank
        });
    }

    User.getByEmail = function(email) {
        return DB.query('SELECT * FROM user WHERE email = ? LIMIT 1',[email]) 
        .then(function(result){
            return DB.fetch(result);
        });
    }

    User.hashPassword = function(pword) {
        return sha256_digest(pword);
    }




    return User;
})

// Beneficiary //////////////////////////////////////////////////
.factory('Beneficiary', function(DB) {
    var DBobj = this;
    DBobj.name = 'beneficiary'; // table name
    DBobj.all = function() {
        return DB.all(DBobj);
    };
    DBobj.getBySearch = function(query, beneficiary_type) {
        if (!query || query==undefined)
            query='';
        return DB.query('SELECT * FROM beneficiary  WHERE name LIKE ? and beneficiary_type=? LIMIT 30',['%'+query+'%',beneficiary_type])
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    DBobj.addedit = function(obj) {
        // check if  exists 
        if (obj && obj.id) {
            return DB.save(DBobj,obj);
        }
        // doesnt exist. add:
        return DB.add(DBobj,obj);
    };
    return DBobj;
})
// Address //////////////////////////////////////////////////
.factory('Address', function(DB) {
    var Address = this;
    Address.name = 'address'; // table name

    Address.all = function() {
        return DB.all(Address,"WHERE hidden != 1 ORDER BY name ");
    };
    Address.save = function(obj) {
        return DB.save(Address,obj);
    };
    Address.add = function(obj) {
        return DB.add(Address,obj);
    };
    Address.getByName = function(name) {
        return DB.query('SELECT * FROM '+this.name+' WHERE name = ? LIMIT 1',[name]) 
        .then(function(result){
            return DB.fetch(result);
        });
    };
    Address.addedit = function(obj) {
        // check if address exists 
        // if not, create a temp name
        if (!obj.name || obj.name == "") {
            obj.name = obj.person + Math.random(); // random name
            obj.hidden = 1;
        }
        return Address.getByName(obj.name).then(function(o){
            // got the id, now save over it
            if (o && o.id) {
                obj.id = o.id;
                return DB.save(Address,obj);
            }
            // address doesnt exist. add:
            return DB.add(Address,obj);
        });
    };

    return Address;
})
// Order //////////////////////////////////////////////////
.factory('Order', function(DB, StockOrder, $q) {
    var DBobj = this;
    DBobj.name = 'orders'; // table name
    DBobj.all = function() {
        return DB.query('SELECT o.*, b.name as beneficiary FROM orders o join beneficiary b on (o.beneficiary_id = b.id)')
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    DBobj.getById = function(id) {
        return DB.query('SELECT o.*, b.name as beneficiary, a.address1 || ", " || a.address2 || ", " || a.city || ", " || a.state || ", " || a.country as address FROM orders o join beneficiary b on (o.beneficiary_id = b.id) join address a on (o.address_id = a.id) WHERE o.id = ?',[id])
        .then(function(result){
            return DB.fetch(result);
        });
    };
    DBobj.save = function(obj) {
        return DB.save(DBobj,obj);
    };
    DBobj.add = function(obj) {
        return DB.add(DBobj,obj).then(function(o){
            // add items.
            if (obj.items) {
                var promises = obj.items.map(function(stockitem) {
                    stockitem.order_id = o.id;
                    stockitem.stock_id = stockitem.id; // its actually a stock item so get its own id
                    return StockOrder.add(stockitem);
                });
                return $q.all(promises).then(function(){
                    return o; // only return if all items added.
                });
            }
            return o;

        });
    };

    return DBobj;
})
// Stock Order //////////////////////////////////////////////////
.factory('StockOrder', function(DB) {
    var DBobj = this;
    DBobj.name = 'stock_order'; // table name
    DBobj.getByOrderId = function(order_id) {
        return DB.query('SELECT so.*, s.category_id, s.description, s.uom, c.name as category FROM stock_order so join stock s on (s.id = so.stock_id) join category c on (s.category_id = c.id)  WHERE order_id = ? ', [order_id])
        .then(function(result){
            return DB.fetchAll(result);
        });
    }
    DBobj.add = function(obj) {
        return DB.add(DBobj,obj);
    };

    return DBobj;
})
// OrderShipment //////////////////////////////////////////////////
.factory('OrderShipment', function(DB) {
    var DBobj = this;
    DBobj.name = 'order_shipment'; // table name
    DBobj.all = function(order_id) {
        // so.* last so overwrite id
        return DB.query('SELECT s.*, o.*, os.* FROM order_shipment os join shipment s on (s.id = os.shipment_id) join orders o on (os.order_id = o.id)  ')
        .then(function(result){
            return DB.fetchAll(result);
        });
    } 
    DBobj.getById = function(id) {
        return DB.getById(DBobj,id);
    };
    

    return DBobj;
})
// Shipment //////////////////////////////////////////////////
.factory('Shipment', function(DB) {
    var DBobj = this;
    DBobj.name = 'shipment'; // table name
    DBobj.getById = function(id) {
        return DB.getById(DBobj,id);
    };
    return DBobj;
})
// Movement //////////////////////////////////////////////////
.factory('Move', function(DB) {
    var DBobj = this;
    DBobj.name = 'move'; // table name
    DBobj.getByShipmentId = function(id) {
        return DB.query('SELECT * FROM move WHERE shipment_id = ?',[id])
        .then(function(result){
            return DB.fetchAll(result);
        });
    };
    return DBobj;
});
