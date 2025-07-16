import express from 'express';
import path from 'path';

//import the data access module
import da from './data-access.js';

//Create an instance of express
const app = express();

//Set port to 4000 or use PORT environment variable
const PORT = process.env.PORT || 4000;

//Implement a static file server
const directoryPath = path.join(path.resolve(), 'public');
app.use(express.static(directoryPath));

//Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

});

app.get('/customers', async (req, res) => {
    console.log
    try {
       const [customers, error] = await da.getCustomers(); 
       res.send(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).send(error);
    }
});