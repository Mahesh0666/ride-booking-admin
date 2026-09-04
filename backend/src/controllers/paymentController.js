const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Ride = require('../models/Ride');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res, next) => {
  const { rideId, tip = 0 } = req.body;

  try {
    const payment = await Payment.findOne({ ride: rideId });

    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    if (payment.paymentStatus === 'succeeded') {
      return res.status(200).json({ success: true, alreadyPaid: true, payment });
    }

    const totalAmount = Math.round((payment.amount + tip) * 100);

    const order = await razorpay.orders.create({
      amount: totalAmount,
      currency: 'INR',
      receipt: `ride_${rideId}`,
      notes: { rideId, riderId: payment.rider.toString(), driverId: payment.driver.toString() },
    });

    payment.razorpayOrderId = order.id;
    payment.tip = tip;
    await payment.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      payment,
    });
  } catch (err) {
    next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rideId } = req.body;

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ error: { message: 'Payment verification failed' } });
    }

    const payment = await Payment.findOne({ ride: rideId });

    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    payment.paymentStatus = 'succeeded';
    payment.paidAt = new Date();
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    await payment.save();

    if (global.io) {
      global.io.to(`user_${payment.rider}`).emit('payment_success', { rideId, payment });
    }

    res.status(200).json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: { message: 'Invalid webhook signature' } });
      }
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const order_id = paymentEntity.order_id;
      const payment = await Payment.findOne({ razorpayOrderId: order_id });
      if (payment && payment.paymentStatus !== 'succeeded') {
        payment.paymentStatus = 'succeeded';
        payment.paidAt = new Date(paymentEntity.created_at * 1000);
        payment.razorpayPaymentId = paymentEntity.id;
        await payment.save();
      }
    }

    if (event === 'payment.failed' && paymentEntity) {
      const order_id = paymentEntity.order_id;
      const payment = await Payment.findOne({ razorpayOrderId: order_id });
      if (payment) {
        payment.paymentStatus = 'failed';
        await payment.save();
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
};

const getPaymentByRide = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ ride: req.params.rideId })
      .populate('rider', 'name email')
      .populate('driver', 'name email');

    if (!payment) {
      return res.status(404).json({ error: { message: 'Payment not found' } });
    }

    res.status(200).json({ success: true, payment });
  } catch (err) {
    next(err);
  }
};

const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({
      [req.user.role === 'driver' ? 'driver' : 'rider']: req.user._id,
    })
      .populate('ride')
      .populate('rider', 'name email')
      .populate('driver', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentByRide,
  getMyPayments,
};
