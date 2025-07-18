import da, { addApiKey } from './data-access.js';

export async function setApiKey(process) {

    var apiKey = '';
    var typeOfKey = '';

    if (process.env.API_KEY !== null && process.env.API_KEY !== undefined && process.env.API_KEY.length > 0) {
        console.log("Here's the API KEY: " + process.env.API_KEY);
        apiKey = process.env.API_KEY;
        typeOfKey = 'Environment Variable';
    }
    if (process.argv[2] != null && process.argv[2].length > 0) {
        if (process.argv[2].indexOf('=') >= 0) {
            apiKey = process.argv[2].substring(process.argv[2].indexOf('=') + 1, process.argv[2].length);
            typeOfKey = 'Command Line Argument';
        }
    }
    if (apiKey && apiKey.length > 0) {
        console.log("apiKey has a value and will be added to the database, keytype provided was: " + typeOfKey);
        addApiKey(apiKey);  // Add the API key to the database
    } else {
        console.log("apiKey has no value. Please provide a value through the API_KEY env var or by adding \"-- api-key={keyvalue}\" cmd line parameter.");
        process.exit(0);
    }
}

// Reusable middleware function to check API key for API clients, browser access does not require API key
export async function apiKeyCheck(req, res, next) {

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
    next(); //is required or the request will not continue to the next middleware or route handler
}