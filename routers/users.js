const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { User } = require('../models/user');

require('dotenv/config');



router.get('/', async (req, res) => {
   const users = await User.find().select('-passwordHash');

   if (!users) {
      res.status(500).json({ success: false });
   }

   res.send(users);
})

router.get('/:id', async (req, res) => {
   const user = await User.findById(req.params.id).select('-passwordHash');

   if (!user) {
      return res.status(500).json({ message: 'the user with the given ID was not found' });
   }
   res.status(200).send(user)
})

router.post('/', async (req, res) => {
   let user = User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
   })

   user = await user.save();

   if (!user) return res.status(404).send('the user cannot be created');

   res.send(user);
})

router.post('/register', async (req, res) => {
   let user = User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
   })

   user = await user.save();

   if (!user) return res.status(404).send('the user cannot be created');

   res.send(user);
})

router.post('/login', async (req, res) => {
   const SECRET = process.env.SECRET;
   const user = await User.findOne({ email: req.body.email });

   if (!user) {
      return res.status(400).send("user not found");
   }

   if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
         {
            userId: user.id,
            isAdmin: user.isAdmin,
         },
         SECRET,
         { expiresIn: '1d' }
      )


      res.status(200).send({ user: user.email, token: token });
   } else {
      res.status(400).send("User is not authenticated");
   }
})

router.get(`/get/count`, async (req, res) => {
   const userCount = await User.countDocuments();

   if (!userCount) {
      res.status(500).json({ success: false })
   }
   res.send({
      count: userCount
   });
})

router.delete('/:id', (req, res) => {
   User.findByIdAndRemove(req.params.id)
      .then(user => {
         if (user) {
            return res.status(200).json({ success: true, message: 'user is deleted successfully' })
         } else {
            return res.status(404).json({ success: false, message: 'user not found' })
         }
      })
      .catch(err => {
         return res.status(400).json({ success: false, error: err })
      })
})


module.exports = router;
