import axios from 'axios';
import React, { useEffect, useReducer, useState } from 'react'
import { useContext } from 'react'
import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingBox from '../components/LoadingBox';
import MessageBox from '../components/MessageBox';
import { Store } from '../Store'
import { getError } from '../utils';
import { toast } from 'react-toastify';

const reducer = (state, action) => {

    switch(action.type) {
        case 'FETCH_REQUEST':
            return {...state, loading: true};
        case 'FETCH_SUCCESS':
            return {...state, loading: false,};
        case 'FETCH_FAIL':
            return { ...state, loading: false, error: action.payload };
        case 'UPDATE_REQUEST':
            return {...state, loadingUpdate: true };
        case 'UPDATE_SUCCESS':
            return {...state, loadingUpdate: false };
        case 'UPDATE_FAIL':
            return {...state, loadingUpdate: false };
        case 'UPLOAD_REQUEST':
            return {...state, loadingUpload: true, errorUpload: '' };
        case 'UPLOAD_SUCCESS':
            return { ...state, loadingUpload: false, errorUpload: '',};
        case 'UPLOAD_FAIL':
            return { ...state, loadingUpload: false, errorUpload: action.payload }    
        default:
            return state;
    }

};

export default function ProductEditScreen() {
    const navigate = useNavigate();

    const { state} = useContext(Store);

    const { userInfo } = state;

    const params = useParams(); // /product/:id
    const { id: productId } = params;

    const [{ loading, error, loadingUpdate, loadingUpload}, dispatch] = useReducer(reducer, { loading: true, error: ''});

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [countInStock, setCountInStock] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        const fetchData = async () => {

            try {
                dispatch({ type: 'FETCH_REQUEST' });
                const { data } = await axios.get(`/api/products/pid/${productId}`); // we get productId from the url
                setName(data.name);
                setSlug(data.slug);
                setPrice(data.price);
                setImage(data.image);
                setCategory(data.category);
                setCountInStock(data.countInStock);
                setDescription(data.description);
                dispatch({ type: 'FETCH_SUCCESS'});
              
      
            } catch(err){
              dispatch({
                type: 'FETCH_FAIL',
                payload: getError(err),
              })
      
            }
      
          }
          fetchData();

    }, [productId])

    const submitHandler = async (e) => {
        e.preventDefault(); // will not refresh the page when you press the edit the product

        try {
            dispatch({ type: 'UPDATE_REQUEST' });
            await axios.put(
                `/api/products/pid/${productId}`,
                {
                    _id: productId,
                    name,
                    slug,
                    price,
                    image,
                    category,
                    countInStock,
                    description,
                },
                {
                    headers: { Authorization: `Bearer ${userInfo.token}`},
                }
            );
            dispatch({
                type: 'UPDATE_SUCCESS',
            });
            toast.success('Product updated successfully');
            navigate('/admin/products')

        } catch(err) {
            toast.error(getError(err));
            dispatch({ type: 'UPDATE_FAIL' });

        }

    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const bodyFormData = new FormData();
        bodyFormData.append('file', file);

        try {
            dispatch({ type: 'UPLOAD_REQUEST' });

            const { data } = await axios.post('/api/upload', bodyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    authorization: `Bearer ${userInfo.token}`,
                },
            });
            dispatch({ type: 'UPLOAD_SUCCESS' });
            toast.success('Image uploaded successfully. click update to apply images');
            setImage(data.secure_url);
            

        } catch(err) {
            toast.error(getError(err));
            dispatch({ type: 'UPLOAD_FAIL', payload: getError(err) });

        }

    };


  return (
    <Container className="small-container">
        <Helmet>
            <title>Edit Product ${productId}</title>
        </Helmet>

        {loading ? (
        <LoadingBox></LoadingBox>
    ): error ? (
        <MessageBox variant="danger">{error}</MessageBox>

    ):(
        <Form onSubmit={submitHandler}>

            <Form.Group className="mb-3" controlId="name">
                <Form.Label>Name</Form.Label>
                <Form.Control
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3" controlId="slug">
                <Form.Label>Slug</Form.Label>
                <Form.Control
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3" controlId="price">
                <Form.Label>Price</Form.Label>
                <Form.Control
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3" controlId="image">
                <Form.Label>Image File</Form.Label>
                <Form.Control
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    required
                />
            </Form.Group>
            <Form.Group className="mb-3" controlId="imageFile">
                <Form.Label>Upload image</Form.Label>
                <Form.Control type="file" onChange={uploadFileHandler} />
                {loadingUpload && <LoadingBox></LoadingBox>}
            </Form.Group>

            <Form.Group className="mb-3" controlId="category">
                <Form.Label>Category</Form.Label>
                <Form.Control
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="description">
                <Form.Label>Description</Form.Label>
                <Form.Control
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </Form.Group>
            <div className="mb-3">
                <Button disabled={loadingUpdate} type="submit">Update</Button>
                {loadingUpdate && <LoadingBox></LoadingBox>}
            </div>

            

        </Form>
    )}


    </Container>
  )
}
