import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import Product from '../models/productModels.js';
import User from '../models/userModel.js'
import { isAdmin, isAuth, mailgun, payOrderEmailTemplate } from '../utils.js';

const orderRouter = express.Router();

orderRouter.get('/',isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name');
  console.log(orders);

  res.send(orders);

}));



orderRouter.post(
  '/',
  isAuth, // checks the token, then runs next() function to then run expressAsyncHandler
  expressAsyncHandler(async (req, res) => {
    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      dispatchMethod: req.body.dispatchMethod,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id,
      isPaid: true,
      paidAt: Date.now(),
    });
    

    const order = await newOrder.save();
    const user = await User.findById(req.user._id);
    const userName = user.name;
    const userEmail = user.email;
    const userIsGuest = user.isGuest;

    mailgun().messages().send({
      from: 'Amazona <amazona@mg.yourdomain.com>',
      to: `${userName} <${userEmail}>`,
      subject: `New order ${order._id}`,
      html: payOrderEmailTemplate(order, userName, userIsGuest),
    },
    (error, body) => {
      if (error) {
        console.log(error);
      } else {
        console.log(body)
      }
    }  
    );
    
    res.status(201).send({ message: 'New Order Created', order });
  })
);

orderRouter.get( '/summary', isAuth, isAdmin, expressAsyncHandler(async (req, res) => {
  const orders = await Order.aggregate([
    {
      $group: {
        _id: null,
        numOrders: { $sum: 1 },
        totalSales: { $sum: '$totalPrice' },
      }
    }

  ]);

  const users = await User.aggregate([
    {
      $group: {
        _id: null,
        numUsers: {$sum: 1 },
      }
    }
  ]);
  const dailyOrders = await Order.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        sales: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const productCategories = await Product.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
      },
    },
  ]);
  res.send({ users, orders, dailyOrders, productCategories });

})
);



orderRouter.get(
  '/mine',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    //console.log(req.user._id)
    const orders = await Order.find({ user: req.user._id }); // req.user._id is coming from isAuth
    res.send(orders);
  })
);

orderRouter.get(
  '/:id',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    const user = await User.findById(req.user._id);
    const userName = user.name;
    const userEmail = user.email;

    console.log(userEmail);
    console.log(order.deliveryImages);
    if (order) {
      res.send(order);
      //console.log(order.user.name)
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/pay',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();
      //console.log(order);

      setTimeout(()=>{mailgun().messages().send({
        from: 'Beanery <Beanery.com>',
        to: `${order.user.name} <${order.user.email}>`,
        subject: `New order ${order._id}`,
        html: payOrderEmailTemplate(order),
      }, (error, body) => {
        if (error) {
          console.log(error);
        } else {
          console.log(body)
        }
      })}, 3000)
      // mailgun().messages().send({
      //   from: 'Beanery <Beanery.com>',
      //   to: `${order.user.name} <${order.user.email}>`,
      //   subject: `New order ${order._id}`,
      //   html: payOrderEmailTemplate(order),
      // }, (error, body) => {
      //   if (error) {
      //     console.log(error);
      //   } else {
      //     console.log(body)
      //   }
      // })
      res.send({ message: 'Order Paid', order: updatedOrder});
      
    } else {
      res.status(404).send({ message: 'Order Not Found' });
    }
  })
);

orderRouter.put(
  '/:id/deliver',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.deliveryImages = req.body.deliveryImages;
      await order.save();
      res.send({ message: 'Order Delivered' });
    } else {
      res.status(404).send({ message: 'Order not found' });
    }
  })
);

orderRouter.delete('/:id',
isAuth,
isAdmin,
expressAsyncHandler(async (req, res)=> {

  const order = await Order.findById(req.params.id);
  if(order) {
    await order.deleteOne();
    res.send({ message: 'Order Deleted' });
  } else {
    res.status(404).send({ message: 'Order Not Found' });
  }

})
);


export default orderRouter;