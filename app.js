const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv/config');

const API = process.env.API_URL;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.options('*', cors());

// middleware
const bodyParser = require('body-parser');
const morgan = require('morgan');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');

app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt.verify());
app.use(errorHandler);
app.use('/public/uploads', express.static(__dirname + '/public/uploads'))

// routers
const productRoutes = require('./routers/products');
const categoriesRoutes = require('./routers/categories');
const usersRoutes = require('./routers/users');
const ordersRoutes = require('./routers/orders');

app.use(`${API}/products`, productRoutes);
app.use(`${API}/categories`, categoriesRoutes);
app.use(`${API}/users`, usersRoutes);
app.use(`${API}/orders`, ordersRoutes);


mongoose.connect(MONGO_URI)
   .then(() => {
      console.log('Database connection established');
   })
   .catch((err) => {
      console.error(err);
   })


// Development
// app.listen(3000, () => {
//    console.log('server running on http://localhost:3000');
// })

// Production
var server = app.listen(process.env.PORT || 3000, function() {
   var port = server.address().port;
   console.log("Express is working on port " + port)
})