import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

//import the data access module
import da, { addApiKey } from './data-access.js';
import { apiKeyCheck, setApiKey } from './apiKeyCheck.js';

//Create an instance of express
const app = express();

//Set port to 4000 or use PORT environment variable
const PORT = process.env.PORT || 4000;

//Implement a static file server
const directoryPath = path.join(path.resolve(), 'public');

app.use(bodyParser.json());
app.use(express.static(directoryPath));

//Start the server
da.dbStartup().then(() => {
    app.listen(PORT, () => {
        //pass the API key from environment variable or command line argument to setApiKey function
        setApiKey(process);
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});


// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(directoryPath, 'index.html'));
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