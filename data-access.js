const { MongoClient } = require('mongodb');
const dbName = 'custdb';
const baseUrl = "mongodb://127.0.0.1:27017";
const collectionName = "customers"
const apiKeyCollectionName = "apikeys";
const connectString = baseUrl + "/" + dbName;
let collection;

async function dbStartup() {
    const client = new MongoClient(connectString);
    await client.connect();
    collection = client.db(dbName).collection(collectionName);
    apiKeyCollection = client.db(dbName).collection(apiKeyCollectionName);
}

async function getCustomers() {
    try {
        const customers = await collection.find().toArray();
        return [customers, null];
    } catch (error) {
        console.error('Error fetching customers from the database:', error);
        return [null, error.message];
    }
}

async function getCustomerById(id) {
    try {
        console.log('Fetching customer with ID:', id);
        const customer = await collection.findOne({ id: +id });
        // return array [customer, errMessage]
        if (!customer) {
            return [null, "invalid customer number"];
        }
        return [customer, null];
    } catch (error) {
        console.error('Error fetching customer by ID:', error.message);
        return [null, err.message];
    }
}

async function resetCustomers() {
    let data = [{ "id": 0, "name": "Mary Jackson", "email": "maryj@abc.com", "password": "maryj" },
    { "id": 1, "name": "Karen Addams", "email": "karena@abc.com", "password": "karena" },
    { "id": 2, "name": "Scott Ramsey", "email": "scottr@abc.com", "password": "scottr" }];

    try {
        await collection.deleteMany({});
        await collection.insertMany(data);
        const customers = await collection.find().toArray();
        const message = "Data was refreshed. There are now " + customers.length + " customer records!" + "<br><br>" + JSON.stringify(customers, null, 2);
        return [message, null];
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}

async function addCustomer(customer) {
    try {
        const insertResult = await collection.insertOne(customer);
        // return array [status, id, errMessage]
        return ["success", insertResult.insertedId, null];
    } catch (err) {
        console.log(err.message);
        return ["fail", null, err.message];
    }
}

async function updateCustomer(id, customer) {
    try {
        const updateResult = await collection.updateOne(
            { id: +id },
            { $set: { ...customer } }
        );
        if (updateResult.matchedCount === 0) {
            return [null, "Customer not found"];
        }
        return ["one record updated", null];
    } catch (error) {
        console.log(error.message);
        return [null, error.message];
    }
}

async function deleteCustomerById(id) {
    try {
        const deleteResult = await collection.deleteOne({ id: +id });
        if (deleteResult.deletedCount === 0) {
            return [null, "Customer not found, no record deleted"];
        }
        return ["One record deleted", null];
    } catch (error) {
        console.log(error.message);
        return [null, error.message];
    }
}

//Determine if the API key in request header is valid
async function isValidApiKey(apiKey) {  
    try {
        const apiKeyDoc = await apiKeyCollection.findOne({ "x-api-key": apiKey });
        return apiKeyDoc !== null;
    } catch (error) {
        console.error('API key doesn\'t exist:', error);
        return false;
    }
}

async function findCustomers(filterObject) {
    try {
        console.log('Finding customers with filter:', filterObject);
        const customers = await collection.find(filterObject).toArray();
        // return array [customer, errMessage]
        if(!customers|| customers.length == 0 ){
          return [ null, "no customer documents found"];
        }
        return [customers, null];
    } catch (err) {
        console.log(err.message);
        return [null, err.message];
    }
}

dbStartup();
module.exports = { getCustomers, getCustomerById, resetCustomers, addCustomer, updateCustomer, deleteCustomerById, isValidApiKey, findCustomers };