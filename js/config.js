angular.module('starter.config', [])

.constant('DB_CONFIG', {
    name: 'mdb4',
    db_loaded: 'db-loaded-event',
    tables: [
      {
            name: 'orders', // doesnt like order
            columns: [
                {name: 'id', type: 'integer primary key'},
                //{name: 'order_json', type: 'text'}, // Json blob of order.. easier
                {name: 'beneficiary_type', type: 'text'}, // redundant but useful
                {name: 'beneficiary_id', type: 'integer'}, // link to beneficiary
                {name: 'address_id', type: 'integer'}, // link to address? or per shipment?
                {name: 'status', type: 'text'}, // ENUM pending, ordered, delivered.. 
                {name: 'price', type: "float"}, // total price

                {name: 'date_depart', type: "datetime"},
                {name: 'date_arrive', type: "datetime"},

                {name: 'date_created', type: "datetime not null default CURRENT_DATETIME"},
                {name: 'date_modified', type: "datetime"},
                {name: 'date_sync', type: "datetime"},
                {name: 'sync_id', type: "integer"}, // meercat ID

            ],
            data : [
            [1,'Person',5,1,'Collected',503423,'2016-02-01','2016-02-21','2015-07-05',null,null,null],
            [2,'Asset',19,1,'50% Completed',1038999,'2016-01-01','2016-02-02','2015-06-18',null,null,null],
            ]
        },{
            name: 'stock_order', // linker table
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'order_id', type: 'integer not null'}, // link to order
                {name: 'stock_id', type: 'integer not null'}, // link to stock
                //{name: 'shipment_id', type: 'integer'}, // link to shipment.. added later
                {name: 'qty', type: "float"}, // i guess could have 2.5m depending on UoM
                {name: 'price', type: "integer"}, 
                {name: 'discount', type: "float"}, 
                {name: 'status', type: 'text'}, // ENUM pending, approved, declined.. status depends on shipment

                // sync fields

            ],
            data : [
            [1,1,5 ,1.5,400000,5,'Collected'],
            [2,1,19,1,100000,10,'Collected'],
            ]
        },{
            name: 'shipment', // not created / edited locally
            columns: [
                {name: 'id', type: 'integer primary key'},
                //{name: 'order_id', type: 'integer not null'}, // link back to order
                {name: 'status', type: 'text'}, // ENUM pending, ordered, delivered.. 


                // one way sync details.
                {name: 'sync_id', type: "integer"}, // meercat ID
                {name: 'date_sync', type: "datetime"},

            ],
            data : [
            [1,'On Route',1234],
            [2,'Collected',5678],
            ]
        },{
            name: 'order_shipment', // many-to-many linker table
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'order_id', type: 'integer'},
                {name: 'shipment_id', type: 'integer'}, 

            ],
            data : [
            [1,1,1],
            [2,2,1],
            [3,2,2],
            ]
        },{
            name: 'move', // shipment movements
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'shipment_id', type: 'integer'}, 
                {name: 'status', type: 'text'},  
                {name: 'description', type: 'text'}, 
                {name: 'lat', type: "float"}, // gps
                {name: 'lng', type: "float"}, // gps
                {name: 'date', type: "datetime"},
            ],
            data : [
            [1,1,"Dispatch DBN","",-29.872423, 31.024280,"2015-05-01 03:04:55"],
            [2,1,"Checked","All OK",48.83, 2.37,"2015-05-02 15:24:17"],
            [3,1,"Accepted Depot","Package Damaged. Repacked.",41.91, 12.48, "2015-05-03 13:04:55"],
            ]

        },{
            name: 'user',
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'email', type: 'text not null collate nocase UNIQUE'},
                {name: 'password', type: 'text'},
                {name: 'name', type: 'text'},
                {name: 'company', type: 'text'},
                {name: 'tel', type: 'text'},
                {name: 'last_login', type: 'date'},
                {name: 'last_online', type: 'date'},
                {name: 'date_created', type: "date not null default CURRENT_DATE"},
                {name: 'change_password', type: 'integer not null default 1'}, // whether to change password or not. eg on successful reset password
            ],
            data : [
            [1,'timothy@timosolo.me','9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
              ,'timothy solomon','firsttecheds','12345','2015-01-01','2015-01-01',null,1] // password: test
            ]
        },{
            name: 'category',
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'name', type: 'text'}
            ],
            data : [
            [1,'Spare Parts'],
            [2,'Widgets'],
            [3,'Dohickies'],
            ]
        },{
            name: 'address',
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'name', type: 'text not null collate nocase  UNIQUE'},
                {name: 'person', type: 'text'},
                {name: 'phone', type: 'text'},
                {name: 'email', type: 'text'},
                {name: 'address1', type: 'text'},
                {name: 'address2', type: 'text'},
                {name: 'city', type: 'text'},
                {name: 'state', type: 'text'},
                {name: 'zip', type: 'text'},
                {name: 'country', type: 'text'}, // or id?
                {name: 'hidden', type: 'integer not null default 0'},
            ],
            data : [
            [1,'Head Office','Sherrie Harlowe','123456789','unfearfully@balonea.edu','3 Pyrogallate Road','Westwood','Pretoria','Gauteng','1007','South Africa', null],
            ]
        },{
            name: 'beneficiary',
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'name', type: 'text'},
                {name: 'beneficiary_type', type: 'text key'},
            ],
            data : [
            [1,'Maurine Mcnamer','Person'],
            [2,'Pasty Gothe','Person'],
            [3,'Thanh Stonecipher','Person'],
            [4,'Camila Pauli','Person'],
            [5,'Carlie Mulloy','Person'],
            [6,'Shizuko Caren','Person'],
            [7,'Latrisha Fiely','Person'],
            [8,'Kory Scaffidi','Person'],
            [9,'Winifred Ego','Person'],
            [10,'Jacque Wahid','Person'],
            [11,'Emory Ee','Person'],
            [12,'Reiko Breaker','Person'],
            [13,'Clementina Nations','Person'],
            [14,'Andera Latourette','Person'],
            [15,'Mathew Hoyne','Person'],
            [16,'Linsey Printers','Person'],
            [17,'Eun Nickle','Person'],
            [18,'Amina Niemiec','Person'],

            [19,'BN23BD GP','Asset'],
            [20,'CA6DFF GP','Asset'],
            [21,'ED2E97 GP','Asset'],
            [22,'D5D506 GP','Asset'],
            [23,'C48110 GP','Asset'],
            [24,'EFA2B6 GP','Asset'],
            [25,'F798AB GP','Asset'],
            [26,'F1A36D GP','Asset'],
            [27,'265D5D GP','Asset'],
            [28,'173F08 GP','Asset'],
            [29,'29EB46 GP','Asset'],
            [30,'9D4A46 GP','Asset'],
            [31,'1A9839 GP','Asset'],


            [32,'Warehouse A','Stock'],
            [33,'Warehouse B','Stock'],
            [34,'Warehouse C','Stock'],
            ]
        },{
            name: 'stock',
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'category_id', type: 'integer'},
                {name: 'description', type: 'text'},
                {name: 'uom', type: 'text'}, // eg unit, set, m, kg
                {name: 'price', type: 'integer'}, //  in cents ie * 100
            ],
            data : [
            [1,2,"BRAKE BOOSTER 733bea51","unit"],
            [2,3,"BRAKE DISK 1f09d7e9","unit"],
            [3,3,"BUMPER 301ceb29","unit"],
            [4,2,"CABIN c7358240","unit"],
            [5,2,"CARTAGE 2fd41a0a","unit"],
            [6,1,"CHASSIS b3a92559","unit"],
            [7,2,"COIL SPRING c87bcc03","unit"],
            [8,2,"COMPLETE CHASSIS cf63be1c","unit"],
            [9,2,"COMPLETE CARTAGE 4c02b56c","unit"],
            [10,1,"COMPLETE CRANE 39df0b7d","unit"],
            [11,2,"CONDENSER bb79f26d","unit"],
            [12,2,"CROSS MEMBER cd23f318","unit"],
            [13,3,"DIFF 49dbd0e0","unit"],
            [14,1,"DIFF COMPLETE 2cd70c8f","unit"],
            [15,2,"DIFF ROD 314ea804","unit"],
            [16,2,"DOOR 3d0d8fed","unit"],
            [17,1,"DOOR MIRROR aabebf87","unit"],
            [18,3,"DRIVE SHAFT(C.V.JOIN) 9275de42","unit"],
            [19,1,"ENGINE MOUNTING 8b280b3a","unit"],
            [20,1,"FELXIBLE 4016a12c","unit"],
            [21,2,"FENDER 83adf92d","unit"],
            [22,2,"FLEXIBLE 825bf809","unit"],
            [23,3,"FRONT DIFF 82838e5f","unit"],
            [24,1,"FRONT HUB 5de38d52","unit"],
            [25,1,"FRONT LIGHT 876e4365","unit"],
            [26,3,"FUEL PUMP 794537dc","unit"],
            [27,1,"GEAR CABLE 9e1edcae","unit"],
            [28,3,"GENERATOR 5b4bb57a","unit"],
            [29,3,"GLASS d6554e80","unit"],
            [30,3,"GRILL 397eebd9","unit"],
            [31,2,"JACK 082795be","unit"],
            [32,3,"LIFT SPRING abc53cbf","unit"],
            ]
        }
        
    ]
});