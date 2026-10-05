import app from './src/app.js';
import connectDB from './src/config/db.js';
import config from './src/config/config.js';
import chalk from 'chalk';

import { seedDiscoverPostsIfEmpty } from './src/utils/seedDiscover.js';

connectDB().then(() => {
    seedDiscoverPostsIfEmpty();
});

const PORT = config.PORT;

app.listen(PORT, () => {
    console.log(chalk.blue(`Server is running at port: ${PORT}`))
})