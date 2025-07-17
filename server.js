import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

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

// Reusable middleware function to check API key for API clients, browser access does not require API key
async function apiKeyCheck(req, res, next) {

    // Only extract the API key if the call to /customers is from an api client, if using browser to access do not require API key
    const contentType = req.headers['content-type'] || '';
    const userAgent = req.headers['user-agent'] || '';

    //Most browsers will have a user agent that contains "Mozilla" or "Safari" or "Chrome"
    //API clients like Postman or fetch will not have these strings in the user agent, if the contenttype is application/json, but doesn't contain these strings, we will assume it is an API client
    const isApiClient = (contentType.includes('application/json') && !(
        userAgent.includes('Mozilla') ||
        userAgent.includes('Safari') ||
        userAgent.includes('Chrome')
    ));

    if (isApiClient) {
        // Check for API key on all API client requests (e.g., Postman, fetch, etc.)
        const apiKey = req.header('x-api-key');
        if (!apiKey) {
            return res.status(401).json({ error: 'Unauthorized: API key missing' });
        } else {
            const isValid = await da.isValidApiKey(apiKey);
            console.log('API key check:', isValid);
            if (!isValid) {
                return res.status(403).json({ error: 'Unauthorized: API key invalid' });
            }
        }
    }
    next();  //is required or the request will not continue to the next middleware or route handler
}

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