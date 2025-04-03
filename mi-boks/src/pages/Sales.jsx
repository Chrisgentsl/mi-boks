import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './Sales.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const getProductAbbreviation = (name) => {
  if (!name) return '';
  
  // Split the name into words
  const words = name.split(' ');
  
  // If it's a single word, take first two letters
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  
  // If multiple words, take first letter of each word
  return words.map(word => word[0]).join('').toUpperCase();
};

const Sales = () => {
  const [salesData, setSalesData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [stats, setStats] = useState({
    totalSales: 0,
    averageOrder: 0,
    topProduct: '',
    salesTrend: 0
  });

  const [chartData, setChartData] = useState({
    salesTrend: {
      labels: [],
      datasets: [{
        label: 'Sales',
        data: [],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    topProducts: {
      labels: [],
      datasets: [{
        label: 'Revenue',
        data: [],
        backgroundColor: '#2196F3'
      }]
    }
  });

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchSalesData();
    fetchProducts();
    setupRealtimeSubscription();
  }, [timeRange]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('sales_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, 
        () => fetchSalesData()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const fetchProducts = async () => {
    try {
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
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setSalesData(data || []);
      calculateStats(data || []);
      updateChartData(data || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const totalSales = data.reduce((sum, sale) => sum + sale.amount, 0);
    const averageOrder = data.length > 0 ? totalSales / data.length : 0;
    
    // Group products by name and calculate total sales
    const productSales = data.reduce((acc, sale) => {
      acc[sale.product_name] = (acc[sale.product_name] || 0) + sale.amount;
      return acc;
    }, {});

    const topProduct = Object.entries(productSales)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No sales';

    // Calculate sales trend (comparing current period with previous period)
    const currentPeriod = data.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const now = new Date();
      const diff = now - saleDate;
      return diff <= (timeRange === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000;
    });

    const previousPeriod = data.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const now = new Date();
      const diff = now - saleDate;
      return diff > (timeRange === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000 && 
             diff <= (timeRange === 'week' ? 14 : 60) * 24 * 60 * 60 * 1000;
    });

    const currentTotal = currentPeriod.reduce((sum, sale) => sum + sale.amount, 0);
    const previousTotal = previousPeriod.reduce((sum, sale) => sum + sale.amount, 0);
    const salesTrend = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    setStats({
      totalSales,
      averageOrder,
      topProduct,
      salesTrend
    });
  };

  const updateChartData = (data) => {
    // Group sales by date
    const salesByDate = data.reduce((acc, sale) => {
      const date = new Date(sale.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + sale.amount;
      return acc;
    }, {});

    // Group sales by product
    const salesByProduct = data.reduce((acc, sale) => {
      acc[sale.product_name] = (acc[sale.product_name] || 0) + sale.amount;
      return acc;
    }, {});

    // Sort products by sales and take top 5
    const topProducts = Object.entries(salesByProduct)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    setChartData({
      salesTrend: {
        labels: Object.keys(salesByDate),
        datasets: [{
          label: 'Sales',
          data: Object.values(salesByDate),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      topProducts: {
        labels: topProducts.map(([name]) => name),
        datasets: [{
          label: 'Revenue',
          data: topProducts.map(([,amount]) => amount),
          backgroundColor: '#2196F3'
        }]
      }
    });
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create sales records for each item in cart
      const sales = cart.map(item => ({
        vendor_id: user.id,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        amount: item.price * item.quantity,
        status: 'completed'
      }));

      const { error } = await supabase
        .from('sales')
        .insert(sales);

      if (error) throw error;

      // Update product quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: item.quantity - item.quantity })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      // Clear cart and refresh data
      setCart([]);
      fetchSalesData();
      fetchProducts();
      alert('Checkout successful!');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Failed to complete checkout. Please try again.');
    }
  };

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1>Sales Dashboard</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
        </div>
      </div>

      <div className="sales-stats">
        <div className="stat-card">
          <div className="stat-icon total-sales">
            <span className="material-icons">attach_money</span>
          </div>
          <div className="stat-info">
            <h3>Total Sales</h3>
            <p className="stat-value">${stats.totalSales.toFixed(2)}</p>
            <div className={`trend ${stats.salesTrend >= 0 ? 'positive' : 'negative'}`}>
              <span className="material-icons">
                {stats.salesTrend >= 0 ? 'trending_up' : 'trending_down'}
              </span>
              {Math.abs(stats.salesTrend).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon average-order">
            <span className="material-icons">shopping_cart</span>
          </div>
          <div className="stat-info">
            <h3>Average Order</h3>
            <p className="stat-value">${stats.averageOrder.toFixed(2)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon top-product">
            <span className="material-icons">star</span>
          </div>
          <div className="stat-info">
            <h3>Top Product</h3>
            <p className="stat-value">{stats.topProduct}</p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Sales Trend</h3>
          <div className="chart-wrapper">
            <Line 
              data={chartData.salesTrend}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>Top Products</h3>
          <div className="chart-wrapper">
            <Bar 
              data={chartData.topProducts}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.1)'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="products-section">
        <h3>Available Products</h3>
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="product-info">
                <h4>{product.name}</h4>
                <p className="product-price">${product.price}</p>
                <p className="product-quantity">Available: {product.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCart && (
        <div className="cart-modal">
          <div className="cart-content">
            <div className="cart-header">
              <h3>Shopping Cart</h3>
              <button 
                className="close-button"
                onClick={() => setShowCart(false)}
              >
                ×
              </button>
            </div>
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <span className="material-icons">shopping_cart</span>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">SLL {item.price.toLocaleString()}</span>
                    </div>
                    <div className="item-quantity">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.quantity}
                      >
                        +
                      </button>
                    </div>
                    <button 
                      className="remove-button"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  Total: SLL {getCartTotal().toLocaleString()}
                </div>
                <button 
                  className="checkout-button"
                  onClick={handleCheckout}
                >
                  Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="recent-sales">
        <h3>Recent Sales</h3>
        <div className="sales-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {salesData.slice(0, 10).map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td>{sale.product_name}</td>
                  <td>{sale.quantity}</td>
                  <td>${sale.amount.toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${sale.status}`}>
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales; 