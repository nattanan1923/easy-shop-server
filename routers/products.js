const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');

const { Product } = require('../models/product');
const { Category } = require('../models/category');

const FILE_TYPE = {
   'image/png': 'png',
   'image/jpeg': 'jpeg',
   'image/jpg': 'jpg',
}


const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      const isValid = FILE_TYPE[file.mimetype]
      let uploadError = new Error('invalid image type')

      if (isValid) {
         uploadError = null
      }
      cb(null, 'public/uploads')
   },
   filename: function (req, file, cb) {
      const fileName = 'IMG';
      // const fileName = file.originalname.split('.').slice(0, 1).join('_');
      const extension = FILE_TYPE[file.mimetype]
      cb(null, `${fileName}_${Date.now()}.${extension}`)
   }
})

const uploadOptions = multer({ storage: storage })

router.get('/', async (req, res) => {
   let filter = {};
   if (req.query.categories) {
      filter = { category: req.query.categories.split(',') };
   }

   const products = await Product.find(filter).populate('category');

   if (!products) {
      res.status(500).json({ success: false })
   }
   res.send(products);
})

router.get('/:id', async (req, res) => {
   const products = await Product.findById(req.params.id).populate('category');

   if (!products) {
      res.status(500).json({ success: false })
   }
   res.send(products);
})

router.post('/', uploadOptions.single('image'), async (req, res) => {
   const category = await Category.findById(req.body.category);
   if (!category) return res.status(400).send('Invalid Category');

   const file = req.file;
   if (!file) return res.status(400).send('No image in the request');
   const fileName = req.file.filename;
   const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

   let product = Product({
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: `${basePath}${fileName}`,
      images: req.body.images,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
   })

   product = await product.save();

   if (!product) return res.status(500).send('the product cannot be created')

   res.send(product);
})

router.put('/:id', async (req, res) => {
   if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send('Invalid Product Id')
   }

   const category = await Category.findById(req.body.category);
   if (!category) return res.status(400).send('Invalid Category');

   const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
         name: req.body.name,
         description: req.body.description,
         richDescription: req.body.richDescription,
         image: req.body.image,
         images: req.body.images,
         brand: req.body.brand,
         price: req.body.price,
         category: req.body.category,
         countInStock: req.body.countInStock,
         rating: req.body.rating,
         numReviews: req.body.numReviews,
         isFeatured: req.body.isFeatured,
      },
      { new: true }
   )

   if (!product) return res.status(404).send('the product cannot be updated');

   res.send(product);
})

router.delete('/:id', (req, res) => {
   Product.findByIdAndRemove(req.params.id)
      .then(product => {
         if (product) {
            return res.status(200).json({ success: true, message: 'product is deleted successfully' })
         } else {
            return res.status(404).json({ success: false, message: 'product not found' })
         }
      })
      .catch(err => {
         return res.status(400).json({ success: false, error: err })
      })
})

router.get(`/get/count`, async (req, res) => {
   const productCount = await Product.countDocuments();

   if (!productCount) {
      res.status(500).json({ success: false })
   }
   res.send({
      count: productCount
   });
})

router.get(`/get/featured/:count`, async (req, res) => {
   const count = req.params.count ? req.params.count : 0;
   const products = await Product.find({ isFeatured: true }).limit(+count);

   if (!products) {
      res.status(500).json({ success: false })
   }
   res.send(products);
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
   if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send('Invalid Product Id')
   }

   const files = req.files;
   let imagePaths = [];
   const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

   if (files) {
      files.map(file => {
         imagePaths.push(`${basePath}${file.filename}`);
      })

   }

   console.log(imagePaths)
   const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
         images: imagePaths,
      },
      { new: true }
   )

   if (!product) return res.status(404).send('the product cannot be updated');

   res.send(product);
})


module.exports = router;