import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

//import the data access module
import da from './data-access.js';

//Create an instance of express
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Set port to 4000 or use PORT environment variable
const PORT = process.env.PORT || 4000;

//Implement a static file server
app.use(express.static(path.join(__dirname, 'public')));

//Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});

app.get('/customers', async (req, res) => {
    try {
        const customers = await da.getCustomers();
        res.send(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send('Internal Server Error');
    }
});