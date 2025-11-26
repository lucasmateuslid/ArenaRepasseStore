import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  uploadImage 
} from '../services/productService';
import { Car } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FaTrash, FaEdit, FaPlus, FaSave, FaTimes, FaCar, FaDollarSign, FaCloudUploadAlt, FaSearchDollar, FaSync, FaSignOutAlt, FaBoxOpen } from 'react-icons/fa';

export const Admin = ()