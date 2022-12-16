const express = require('express');
const router = express.Router();
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');


router.get('/', async (req, res) => {
   const orders = await Order.find().populate('user', 'name').sort({ 'dateOrdered': -1 });

   if (!orders) {
      res.status(500).json({ success: false });
   }

   res.send(orders);
})

router.get('/:id', async (req, res) => {
   const orders = await Order.findById(req.params.id)
      .populate('user', 'name')
      .populate(
         {
            path: 'orderItems',
            populate:
            {
               path: 'product',
               populate: 'category'
            }
         }
      );

   if (!orders) {
      res.status(500).json({ success: false });
   }

   res.send(orders);
})

router.post('/', async (req, res) => {
   const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
      let newOrderItem = OrderItem({
         quantity: orderItem.quantity,
         product: orderItem.product,
      })

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
   }))

   const orderItemsIdsResolved = await orderItemsIds;

   const totalPrices = await Promise.all(
      orderItemsIdsResolved.map(async (orderItemId) => {
         const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
         const totalPrice = orderItem.product.price * orderItem.quantity;

         return totalPrice;
      })
   )

   console.log(totalPrices);

   const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

   let order = Order({
      orderItems: orderItemsIdsResolved,
      shippingAddress1: req.body.shippingAddress1,
      shippingAddress2: req.body.shippingAddress2,
      city: req.body.city,
      zip: req.body.zip,
      country: req.body.country,
      phone: req.body.phone,
      status: req.body.status,
      totalPrice: totalPrice,
      user: req.body.user,
   })

   order = await order.save();

   if (!order) return res.status(404).send('the order cannot be created');

   res.send(order);
})

router.put('/:id', async (req, res) => {
   const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
         status: req.body.status,
      },
      { new: true }
   )

   if (!order) return res.status(404).send('the order cannot be updated');

   res.send(order);
})

router.delete('/:id', (req, res) => {
   Order.findByIdAndRemove(req.params.id)
      .then(async order => {
         if (order) {
            await order.orderItems.map(async orderItem => {
               await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({ success: true, message: 'order is deleted successfully' })
         } else {
            return res.status(404).json({ success: false, message: 'order not found' })
         }
      })
      .catch(err => {
         return res.status(400).json({ success: false, error: err })
      })
})

router.get(`/get/totalsales`, async (req, res) => {
   const totalSales = await Order.aggregate([
      { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
   ])

   if (!totalSales) {
      return res.status(404).json({ success: false, message: 'order not found' })

   }

   res.send({ totalsales: totalSales.pop().totalsales })
})

router.get(`/get/count`, async (req, res) => {
   const orderCount = await Order.countDocuments();

   if (!orderCount) {
      res.status(500).json({ success: false })
   }
   res.send({
      count: orderCount
   });
})

router.get('/get/userorders/:userId', async (req, res) => {
   const userOrdersList = await Order.find({ user: req.params.userId }).populate(
      {
         path: 'orderItems',
         populate:
         {
            path: 'product',
            populate: 'category'
         }
      }
   ).sort({ 'dateOrdered': -1 });

   if (!userOrdersList) {
      res.status(500).json({ success: false });
   }

   res.send(userOrdersList);
})



module.exports = router;