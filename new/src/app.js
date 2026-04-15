const express = require('express');
const path = require('path');
const pageRoutes = require('./routes/page.routes');
const apiRoutes = require('./routes/api.routes');
const adminRoutes = require('./routes/admin.routes');
const { payloadLimitHandler } = require('./middlewares/error.middleware');

const app = express();

app.use(express.static(path.join(process.cwd(), 'public')));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs');

app.use('/', pageRoutes);
app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

app.use(payloadLimitHandler);

module.exports = app;
