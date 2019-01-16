# DBManager
Wrapper of the indexedDB API

# Methods

- constructor(database_name:String)
get a reference to the database with the name provided. All methods from this object will  be performed in the database setup in constructor.


- createStore(store_name:String, store_configuration:JSON)
creates a store in the database.
