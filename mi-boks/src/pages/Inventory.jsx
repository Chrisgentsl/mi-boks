import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './Inventory.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Inventory = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category_id: '',
    image_url: ''
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  });

  const [chartData, setChartData] = useState({
    categoryDistribution: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }]
    },
    stockLevels: {
      labels: [],
      datasets: [{
        label: 'Stock Level',
        data: [],
        backgroundColor: '#4CAF50'
      }]
    }
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();

    // Set up realtime subscriptions
    const productsSubscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, 
        () => fetchProducts()
      )
      .subscribe();

    const categoriesSubscription = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, 
        () => fetchCategories()
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      productsSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    calculateStats();
  }, [products]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const totalCategories = categories.length;
    const totalValue = products.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0);
    const lowStock = products.filter(p => p.quantity < 10).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;

    setStats({
      totalProducts,
      totalCategories,
      totalValue,
      lowStock,
      outOfStock
    });

    // Update chart data
    const categoryCounts = {};
    products.forEach(product => {
      const category = categories.find(c => c.id === product.category_id)?.name || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    setChartData(prev => ({
      ...prev,
      categoryDistribution: {
        labels: Object.keys(categoryCounts),
        datasets: [{
          data: Object.values(categoryCounts),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }]
      },
      stockLevels: {
        labels: products.map(p => p.name),
        datasets: [{
          label: 'Stock Level',
          data: products.map(p => p.quantity),
          backgroundColor: '#4CAF50'
        }]
      }
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      // Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // Update the newProduct state with the image URL
      setNewProduct(prev => ({
        ...prev,
        image_url: publicUrl
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.quantity || !newProduct.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          vendor_id: user.id,
          price: parseFloat(newProduct.price),
          quantity: parseInt(newProduct.quantity)
        }]);

      if (error) throw error;

      setNewProduct({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category_id: '',
        image_url: ''
      });
      setShowProductModal(false);
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) {
      setError('Category name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { error } = await supabase
        .from('categories')
        .insert([newCategory]);

      if (error) throw error;

      setNewCategory({
        name: '',
        description: ''
      });
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    !selectedCategory || product.category_id === selectedCategory
  );

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory Management</h1>
        <div className="header-actions">
          <button 
            className="add-category-btn"
            onClick={() => setShowCategoryModal(true)}
          >
            <span className="material-icons">add</span>
            Add Category
          </button>
          <button 
            className="add-product-btn"
            onClick={() => setShowProductModal(true)}
          >
            <span className="material-icons">add</span>
            Add Product
          </button>
        </div>
      </div>

      <div className="inventory-stats">
        <div className="stat-card">
          <h3>Total Products</h3>
          <p>{stats.totalProducts}</p>
          <div className="trend positive">
            <span className="material-icons">trending_up</span>
            +12% from last month
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Value</h3>
          <p>${stats.totalValue.toFixed(2)}</p>
          <div className="trend positive">
            <span className="material-icons">trending_up</span>
            +8% from last month
          </div>
        </div>
        <div className="stat-card">
          <h3>Low Stock Items</h3>
          <p>{stats.lowStock}</p>
          <div className="trend negative">
            <span className="material-icons">trending_down</span>
            {stats.lowStock > 0 ? 'Needs attention' : 'All good'}
          </div>
        </div>
        <div className="stat-card">
          <h3>Out of Stock</h3>
          <p>{stats.outOfStock}</p>
          <div className="trend negative">
            <span className="material-icons">trending_down</span>
            {stats.outOfStock > 0 ? 'Needs attention' : 'All good'}
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-container">
          <h3>Category Distribution</h3>
          <div className="chart-wrapper">
            <Pie 
              data={chartData.categoryDistribution}
              options={{
                plugins: {
                  legend: {
                    position: 'right'
                  }
                },
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>

        <div className="chart-container">
          <h3>Stock Levels</h3>
          <div className="chart-wrapper">
            <Bar 
              data={chartData.stockLevels}
              options={{
                indexAxis: 'y',
                scales: {
                  x: {
                    beginAtZero: true
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                },
                maintainAspectRatio: false
              }}
            />
          </div>
        </div>
      </div>

      <div className="inventory-filters">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-filter"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="product-category">
                {categories.find(c => c.id === product.category_id)?.name || 'Uncategorized'}
              </p>
              <p className="product-price">${product.price.toFixed(2)}</p>
              <p className="product-quantity">
                Quantity: {product.quantity}
                {product.quantity < 10 && (
                  <span className="low-stock-warning">Low Stock</span>
                )}
              </p>
            </div>
            <div className="product-actions">
              <button 
                className="delete-btn"
                onClick={() => handleDelete(product.id)}
              >
                <span className="material-icons">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Category</h2>
              <form onSubmit={handleAddCategory}>
                <div className="form-group">
                  <label htmlFor="categoryName">Category Name</label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="categoryDescription">Description</label>
                  <textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-content">
              <h2>Add New Product</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Product Name</label>
                    <input
                      type="text"
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">Price</label>
                    <input
                      type="number"
                      id="price"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, quantity: e.target.value }))}
                      required
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      value={newProduct.category_id}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category_id: e.target.value }))}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows="4"
                    />
                  </div>

                  <div className="image-upload-container">
                    <label htmlFor="image">Product Image</label>
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={loading}
                    />
                    {newProduct.image_url && (
                      <div className="image-preview">
                        <img src={newProduct.image_url} alt="Preview" />
                      </div>
                    )}
                    {loading && <div className="loading-text">Uploading image...</div>}
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowProductModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory; 