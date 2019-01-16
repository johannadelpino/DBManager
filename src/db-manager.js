(function(){
	"use strict";
	
	var __curtrans__ = "";
	const TRANSACTION_TYPE = {
		CREATE_STORE: "CREATE_STORE",
		DELETE_STORE: "DELETE_STORE",
		DONE: "DONE",
	};
	
	/************************************************************
	*	Helper Methods (return promises)
	*************************************************************/
	const requestDatabaseUpgrade = function (dbName, version){
		new Promise(function(resolve, reject){
			const request = indexedDB.open(dbName, version + 1);
			request.onupgradeneeded = handleUpgradeNeeded;
			request.onsuccess = function (){
				resolve(request.result);
			};
			request.onerror = function (){
				reject(request.error);
			};
		});
	};
	
	const openDatabase = function (dbName){
		return new Promise(function (resolve, reject){
			const request = indexedDB.open(dbName);
			request.onsuccess = function (){
				resolve(request.result);
			};
			request.onerror = function (){
				reject(request.error);
			};
		});
	};
	
	/************************************************************
	*	Event Handlers
	*************************************************************/
	const handleUpgradeNeeded = function (event){
		const db = this.result;
		
		try{
			const config = (__curtrans__) ? JSON.parse(__curtrans__) : {};
			switch(config.type){
				case TRANSACTION_TYPE.CREATE_STORE:
					const primaryKey = {};
					
					if(config.store.primaryKey && config.store.primaryKey.keyPath){
						primaryKey.keyPath = config.store.primarKey.keyPath;
					}
					
					if(config.store.primaryKey && config.store.primaryKey.autoIncrement){
						primaryKey.autoIncrement = config.store.primaryKey.autoIncrement;
					}
					
					const store = (!config.store.primaryKey)
					? db.createObjectStore(config.store.name)
					: db.createObjectStore(config.store.name, primaryKey);
					
					config.store.indexes.forEach(function(){
						const index = store.createIndex("by_" + index.name, index.name, {unique: index.unique});
					});
				break;
				case TRANSACTION_TYPE.DELETE_STORE:
					db.deleteObjectStore(config.store.name);
				break;
			}
		}catch(error){
			console.trace(error);
			throw "DBManager exception: error reading transaction configuration.";
		}
	};
	
	/*****************************************************************
	*	Constructor
	******************************************************************/
	const DBManager = function(dbName){
		if(!dbName){
			throw "DBManager error: database name must be provided as parameter.";
			return;
		}
		this.name = name;
	};
	
	/******************************************************************
	*	Class Methods
	*******************************************************************/
	/*
	*	Create Store
	*/
	DBManager.prototype.createStore = function (storeName, config){
		var dbName = this.name;
		
		const transactionConfig = {
			type: TRANSACTION_TYPE.CREATE_STORE,
			store: {
				name: storeName,
				indexes: [],
			},
		};
		
		if(config && config.primaryKey){
			transactionConfig.store.primaryKey = config.primaryKey;
		}
		
		if(config && config.indexes){
			transactionConfig.store.indexes = config.indexes;
		}
		
		__curtrans__ = JSON.stringify(transactionConfig);
		
		return new Promise(function(resolve, reject){
			openDatabase(dbName).then(function(connectedDB){
				if(!storeName){
					connectedDB.close();
					throw "DBManager exception: no store name provided.";
					return;
				}
				
				if(connectedDB.objectStoreNames.contains(storeName)){
					connectedDB.close();
					throw "DBManager exception: database " + dbName + "already contains a store named "+ storeName + ".";
					return;
				}
				
				const currentVersion = connectedDB.version;
		
				connectedDB.close();
				
				requestDatabaseUpgrade(dbName, currentVersion).then(function(newConnectedDB){
					newConnectedDB.close();
					resolve(TRANSACTION_TYPE.DONE);
				}).catch(function(error){
					reject(error);
				});				
			});
		});
	};
	/*
	*	Delete Store
	*/
	DBManager.prototype.deleteStore = function(storeName){
		const dbName = this.name;
		const transactionConfig = {
			type: TRANSACTION_TYPE.DELETE_STORE,
			store:{
				name: storeName,
			},
		};
		
		__curtrans__ = JSON.stringify(transactionConfig);
		
		return new Promise(function(resolve, reject){
			openDatabase(dbName).then(function(connectedDB){
				if(!connectedDB.objectStoreNames.contains(storeName)){
					connectedDB.close();
					throw "DBManager exception: database " + dbName + " does not contain a stored named " + storeName + ".";
					return;
				}
				
				const currentVersion = connectedDB.version;
				
				connectedDB.close();
				
				requestDatabaseUpgrade(dbName, currentVersion).then(function(newConnectedDB){
					newConnectedDB.close();
					resolve(TRANSACTION_TYPE.DONE);
				}).catch(function(error){
					reject(error);
				});
			});
		});
	};
	/*
	*	Put Record
	*/
	DBManager.prototype.putRecord = function (storeName, record, key){
		var dbName = this.name;
		return new Promise(function(resolve, reject){
			openDatabase(dbName).then(function(connectedDB){
				if(!connectedDB.objectStoreNames.contains(storeName)){
					connectedDB.close();
					throw "DBManager exception: database "+ dbName + "doesn't contain a store named "+ storeName + ".";
					return;
				}
				const tx = connectedDB.transaction(storeName, "readwrite");
				const store = tx.objectStore(storeName);
				
				if(!store.autoIncrement && !store.keyPath && !key){
					throw "DBManager exception: you must provide a key for stores without autoIncrement enabled or keyPath set.";
				}
				
				if(key){
					store.put(record, key);
				} else {
					store.put(record);
				}
				connectedDB.close();
				resolve(TRANSACTION_TYPE.DONE);
				
			}).catch(function(error){
				reject(error);
			});
		});
	};
	/*
	*	Delete record
	*/
	DBManager.prototype.deleteRecord = function (storeName, key){
		var dbName = this.name;
		
		return new Promise(function (resolve, reject){
			openDatabase(dbName).then(function(connectedDB){
				if(!conntectedDB.objectStoreNames.contains(storeName)){
					connectedDB.close();
					throw "DBManager exception: database "+ dbName + "doesn't contain a store named "+ storeName + ".";
					return;
				}
				
				const tx = connectedDB.transaction(storeName, "readwrite");
				const store =  tx.objectStore(storeName);
				store.delete(key);
				connectedDB.close();
				resolve(TRANSACTION_TYPE.DONE);
			}).catch(function(error){
				reject(error);
			});
		});
	};
	/*
	*	Delete all records
	*/
	DBManager.prototype.deleteAllRecords = function (){
		var dbName = this.name;
		
		return new Promise(function (resolve, reject){
			openDatabase(dbName).then(function(connectedDB){
				if(!conntectedDB.objectStoreNames.contains(storeName)){
					connectedDB.close();
					throw "DBManager exception: database "+ dbName + "doesn't contain a store named "+ storeName + ".";
					return;
				}
				
				const tx = connectedDB.transaction(storeName, "readwrite");
				const store =  tx.objectStore(storeName);
				store.clear(key);
				connectedDB.close();
				resolve(TRANSACTION_TYPE.DONE);
			}).catch(function(error){
				reject(error);
			});
		});
	};
	/*
	*	Search record
	*/
	DBManager.prototype.getRecords = function(){
		var dbName = this.name;
		
		return new Promise(function(resolve, reject){
			openDatabase(dbName).then(function(connectedDB){
				if(!conntectedDB.objectStoreNames.contains(storeName)){
					connectedDB.close();
					throw "DBManager exception: database "+ dbName + "doesn't contain a store named "+ storeName + ".";
					return;
				}
				const tx =  connectedDB.transaction(storeName, "readonly");
				const store = tx.objectStore(storeName);
				
				let request = null;
				
				if(!config){
					request = store.getAll();
				} else if(config.key){
					request = store.get(config.key);
				} else if (config.index && config.index.name && config.index.param){
					request = store.index(config.index.name).get(config.index.param);
				} else {
					throw "Invalid config parameter.";
				}
				
				request.onsuccess = function (){
					const results = event.target.result;
					connectedDB.close();
					resolve(results);
				};
				
				request.onerror = function (){
					throw request.error;
				};
			}).catch(function (error){
				reject(error);
			});
		});
	};
	
	window.DBManager = DBManager;
	
})();