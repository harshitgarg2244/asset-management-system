const dotenv = require('dotenv');
dotenv.config(); // loads variables from .env into process.env - must happen before anything reads them

const connectDB = require('./config/db');
const { startWarrantyScheduler } = require('./utils/warrantyScheduler');
const app = require('./app');

connectDB();
startWarrantyScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
