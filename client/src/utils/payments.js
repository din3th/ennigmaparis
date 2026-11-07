import axios from 'axios';
import { API_BASE_URL } from '../config/api';

/** Online payment methods that hand the customer off to a hosted gateway page. */
export const ONLINE_METHODS = ['Stripe', 'PayHere'];

const submitPayHereForm = ({ action, fields }) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value ?? '';
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};

/**
 * Redirects to the gateway's hosted checkout for an order the server has
 * already priced. The order is only marked paid when the gateway's signed
 * callback reaches the server.
 */
export const startOnlinePayment = async (order) => {
  const orderId = order._id;
  if (order.paymentMethod === 'Stripe') {
    const { data } = await axios.post(`${API_BASE_URL}/payments/stripe/checkout-session`, { orderId });
    window.location.assign(data.url);
    return;
  }
  if (order.paymentMethod === 'PayHere') {
    const { data } = await axios.post(`${API_BASE_URL}/payments/payhere/checkout`, { orderId });
    submitPayHereForm(data);
    return;
  }
  throw new Error(`No online payment for ${order.paymentMethod}`);
};
