import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
// Import the API key check middleware
import { apiKeyCheck } from './apiKeyCheck.js';

//import the data access module
import da from './data-access.js';

//Create an instance of express
const app = express();

//Set port to 4000 or use PORT environment variable
const PORT = process.env.PORT || 4000;

//Implement a static file server
const directoryPath = path.join(path.resolve(), 'public');

app.use(bodyParser.json());
app.use(express.static(directoryPath));

//Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(directoryPath, 'index.html'));
});

//This GET must be before the regular /customers route or else it will not be called
app.get("/customers/find/", apiKeyCheck, async (req, res) => {
    if (!req.query.id && !req.query.email && !req.query.password) {
        res.status(404);
        res.send("Query parameter must be of id, email or password, please provide a valid query parameter in your request");
        return;
    }
    let id = +req.query.id;
    console.log("id:", req.query.id);
    let email = req.query.email;
    console.log("email:", email);
    let password = req.query.password;
    let query = null;
    if (id > -1) {
        query = { "id": id };
    } else if (email) {
        query = { "email": email };
    } else if (password) {
        query = { "password": password }
    }
    if (query) {
        const [customers, err] = await da.findCustomers(query);
        if (customers) {
            res.send(customers);
        } else {
            res.status(404);
            res.send(err);
        }
    } else {
        res.status(400);
        res.send("Query parameter value is required");
    }
});

app.get('/customers', apiKeyCheck, async (req, res) => {
    try {
        const [customers, error] = await da.getCustomers();
        res.send(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send(error);
    }
});

app.get("/customers/:id", apiKeyCheck, async (req, res) => {
    const id = req.params.id;
    // return array [customer, errMessage]
    const [cust, err] = await da.getCustomerById(id);
    if (cust) {
        res.send(cust);
    } else {
        res.status(404);
        res.send(err);
    }
});

app.get("/reset", apiKeyCheck, async (req, res) => {
    const [result, err] = await da.resetCustomers();
    if (result) {
        res.send(result);
    } else {
        res.status(500);
        res.send(err);
    }
});

app.post('/customers', apiKeyCheck, async (req, res) => {
    const newCustomer = req.body;
    if (newCustomer === null || req.body == {}) {
        res.status(400);
        res.send("Missing request body");
    } else {
        // return array format [status, id, errMessage]
        const [status, id, errMessage] = await da.addCustomer(newCustomer);
        if (status === "success") {
            res.status(201);
            let response = { ...newCustomer };
            response["_id"] = id;
            res.send(response);
        } else {
            res.status(400);
            res.send(errMessage);
        }
    }
});

app.put('/customers/:id', apiKeyCheck, async (req, res) => {
    const id = req.params.id;
    const updatedCustomer = req.body;
    if (updatedCustomer === null || req.body == {}) {
        res.status(400);
        res.send("missing request body");
    } else {
        if (updatedCustomer._id != null) {
            delete updatedCustomer._id;
        }
        const [message, errMessage] = await da.updateCustomer(id, updatedCustomer);
        if (message) {
            res.send(message);
        } else {
            res.status(400);
            res.send(errMessage);
        }
    }
});

app.delete("/customers/:id", apiKeyCheck, async (req, res) => {
    const id = req.params.id;
    // return array [message, errMessage]
    const [message, errMessage] = await da.deleteCustomerById(id);
    if (message) {
        res.send(message);
    } else {
        res.status(404);
        res.send(errMessage);
    }
});