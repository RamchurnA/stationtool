import axios from 'axios';
import React, { useContext, useEffect, useReducer } from 'react'
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox'
import MessageBox from '../components/MessageBox'
import { Store } from '../Store';
import { getError } from '../utils';
import { toast } from 'react-toastify';

function reducer(state, action) {
    switch (action.type) {
        case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
        case 'FETCH_SUCCESS':
      return { ...state, loading: false, order: action.payload, error: '' };
        case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };
        default:
        return state
    }
}

export default function OrderScreen() {
    const navigate = useNavigate();
    const params = useParams();
    const { id: orderId } = params; // get the id from the url and rename it orderId


    const [{ loading, error, order, }, dispatch] = useReducer(reducer, {
      loading: true,
      order: {},
      error: '',
    });
    const { state, dispatch: ctxDispatch} = useContext(Store);
    const { cart, userInfo } = state;

    // we are going to send a AJax request to get information about the order


    useEffect(() => {
        const fetchOrder = async () => {
            try {
              dispatch({ type: 'FETCH_REQUEST' });
              const { data } = await axios.get(`/api/orders/${orderId}`, {
                headers: { authorization: `Bearer ${userInfo.token}` },
              });
              dispatch({ type: 'FETCH_SUCCESS', payload: data });
            } catch (err) {
              dispatch({ type: 'FETCH_FAIL', payload: getError(err) });
            }
          };



        if (!userInfo) {
            return navigate('/login');
        }
        if (!order._id || (order._id && order._id !== orderId)) { // if order._id is null or order.id does not equal to orderId,
            // this if statement will always run as order set in the use reducer is an empty object
            fetchOrder();
        } 


    }, [userInfo, navigate, orderId, order])


  return loading ? (
    <LoadingBox></LoadingBox>
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <div>
        <Helmet>
            <title>Order {orderId}</title>
        </Helmet>
        <h1 className="my-3">Order {orderId}</h1>
        <Row>
            <Col md={8}>
                <Card className="mb-3">
                    <Card.Body>
                    <Card.Title>{order.dispatchMethod === 'Delivery' ? 'Shipping' : 'Collection'}</Card.Title>
                            <Card.Text>
                            <strong>Name:</strong> {order.dispatchMethod === 'Delivery' ? order.shippingAddress.fullName : userInfo.name} <br />
                            <strong>Address:</strong> {order.dispatchMethod === 'Delivery' ? order.shippingAddress.address : 'Address of Beanery'} <br />
                            <strong>City:</strong> {order.dispatchMethod === 'Delivery' ? order.shippingAddress.city : 'City of Beanery'} <br />
                            <strong>Postcode:</strong> {order.dispatchMethod === 'Delivery' ? order.shippingAddress.postalCode : 'Postal code of Beanery'} <br />
                            {order.dispatchMethod === 'Delivery' ? <strong>Country:</strong> : ''} {order.dispatchMethod === 'Delivery' ? order.shippingAddress.country : ''}
                            </Card.Text>
                            {order.isDelivered ? (
                            <MessageBox variant="success">
                                Delivered at {order.deliveredAt}
                            </MessageBox>
                            ) : (
                            <MessageBox variant="danger">Not Delivered</MessageBox>
                            )}
                    </Card.Body>
                </Card>
                <Card className="mb-3">
                    <Card.Body>
                    <Card.Title>Payment</Card.Title>
                    {order.isPaid ? (
                        <MessageBox variant="success">
                        Paid at {order.paidAt}
                        </MessageBox>
                    ) : (
                        <MessageBox variant="danger">Not Paid</MessageBox>
                    )}
                    </Card.Body>
                </Card>
                <Card className="mb-3">
                    <Card.Body>
                    <Card.Title>Items</Card.Title>
                    <ListGroup variant="flush">
                        {order.orderItems.map((item) => (
                        <ListGroup.Item key={item._id}>
                            <Row className="align-items-center">
                            <Col md={6}>
                                <img
                                src={item.image}
                                alt={item.name}
                                className="img-fluid rounded img-thumbnail"
                                ></img>{' '}
                                <Link to={`/product/${item.slug}`}>{item.name}</Link>
                            </Col>
                            <Col md={3}>
                                <span>{item.quantity}</span>
                            </Col>
                            <Col md={3}>£{item.price}</Col>
                            </Row>
                        </ListGroup.Item>
                        ))}
                    </ListGroup>
                    </Card.Body>
                </Card>
            </Col>
            <Col md={4}>
                <Card className="mb-3">
                    <Card.Body>
                        <Card.Title>Order Summary</Card.Title>
                        <ListGroup variant="flush">
                            <ListGroup.Item>
                                <Row>
                                    <Col>Items</Col>
                                    <Col>£{order.itemsPrice.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Shipping</Col>
                                    <Col>£{order.shippingPrice.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>Tax</Col>
                                    <Col>£{order.taxPrice.toFixed(2)}</Col>
                                </Row>
                            </ListGroup.Item>
                            <ListGroup.Item>
                                <Row>
                                    <Col>
                                    <strong> Order Total</strong>
                                    </Col>
                                    <Col>
                                    <strong>£{order.totalPrice.toFixed(2)}</strong>
                                    </Col>
                                </Row>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card.Body>
                </Card>
            </Col>

        </Row>
    </div>
  );
}