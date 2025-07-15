import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

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