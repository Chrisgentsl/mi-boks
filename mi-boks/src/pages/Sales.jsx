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
  Legend
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
  Legend
);

const VAT_RATE = 0.15; // 15% VAT

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [installments, setInstallments] = useState(1);
  const [timeRange, setTimeRange] = useState('week');
  const [recentSales, setRecentSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showSaleDetails, setShowSaleDetails] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    topProduct: { name: '', sales: 0 }
  });

  const [chartData, setChartData] = useState({
    salesTrend: {
      labels: [],
      datasets: [{
        label: 'Sales',
        data: [],
        borderColor: '#4CAF50',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(76, 175, 80, 0.1)'
      }]
    },
    topProducts: {
      labels: [],
      datasets: [{
        label: 'Sales',
        data: [],
        backgroundColor: '#2196F3'
      }]
    }
  });

  useEffect(() => {
    fetchProducts();
    fetchSalesData();
    fetchRecentSales();
  }, [timeRange]);

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id);

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate statistics
      const totalSales = data.length;
      const totalRevenue = data.reduce((sum, sale) => sum + sale.amount, 0);
      const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Find top product
      const productSales = {};
      data.forEach(sale => {
        sale.items.forEach(item => {
          productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
        });
      });

      const topProductId = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
      
      const topProduct = products.find(p => p.id === topProductId) || { name: 'N/A', sales: 0 };

      setStats({
        totalSales,
        totalRevenue,
        averageOrderValue,
        topProduct: {
          name: topProduct.name,
          sales: productSales[topProductId] || 0
        }
      });

      // Update chart data
      const salesByDate = {};
      data.forEach(sale => {
        const date = new Date(sale.created_at).toLocaleDateString();
        salesByDate[date] = (salesByDate[date] || 0) + sale.amount;
      });

      setChartData(prev => ({
        ...prev,
        salesTrend: {
          labels: Object.keys(salesByDate),
          datasets: [{
            ...prev.salesTrend.datasets[0],
            data: Object.values(salesByDate)
          }]
        },
        topProducts: {
          labels: Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([id]) => products.find(p => p.id === id)?.name || 'Unknown'),
          datasets: [{
            ...prev.topProducts.datasets[0],
            data: Object.entries(productSales)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([, sales]) => sales)
          }]
        }
      }));
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSales = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentSales(data || []);
    } catch (err) {
      console.error('Error fetching recent sales:', err);
      setError('Failed to load recent sales');
    }
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

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const vat = subtotal * VAT_RATE;
    const total = subtotal + vat;
    return { subtotal, vat, total };
  };

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };

  const handleCheckout = async () => {
    if (!customerName) {
      setError('Please enter customer name');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { subtotal, vat, total } = calculateTotal();
      const installmentAmount = total / installments;

      const { error } = await supabase
        .from('sales')
        .insert([{
          vendor_id: user.id,
          customer_name: customerName,
          amount: total,
          subtotal,
          vat,
          payment_method: paymentMethod,
          installments: paymentMethod === 'pay_smoll_smoll' ? installments : 1,
          installment_amount: paymentMethod === 'pay_smoll_smoll' ? installmentAmount : total,
          items: cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price: item.price
          }))
        }]);

      if (error) throw error;

      // Update product quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ quantity: item.quantity - item.quantity })
          .eq('id', item.id);

        if (updateError) throw updateError;
      }

      setCart([]);
      setCustomerName('');
      setPaymentMethod('cash');
      setInstallments(1);
      setShowCart(false);
      fetchSalesData();
      fetchRecentSales();
    } catch (err) {
      console.error('Error processing sale:', err);
      setError('Failed to process sale');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sales-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sales-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const { subtotal, vat, total } = calculateTotal();

  return (
    <div className="sales-container">
      <div className="sales-header">
        <h1>Sales Dashboard</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'day' ? 'active' : ''}
            onClick={() => setTimeRange('day')}
          >
            Today
          </button>
          <button 
            className={timeRange === 'week' ? 'active' : ''}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="material-icons">shopping_cart</i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalSales}</span>
            <span className="stat-label">Total Sales</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="material-icons">payments</i>
          </div>
          <div className="stat-info">
            <span className="stat-value">SLL {stats.totalRevenue.toLocaleString()}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="material-icons">trending_up</i>
          </div>
          <div className="stat-info">
            <span className="stat-value">SLL {stats.averageOrderValue.toLocaleString()}</span>
            <span className="stat-label">Average Order Value</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="material-icons">star</i>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.topProduct.name}</span>
            <span className="stat-label">Top Product ({stats.topProduct.sales} sold)</span>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img src={product.image_url} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="product-price">SLL {product.price.toLocaleString()}</p>
            <p className="product-stock">Stock: {product.quantity}</p>
            <button 
              className="add-to-cart-btn"
              onClick={() => addToCart(product)}
              disabled={product.quantity === 0}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <button 
        className="cart-button"
        onClick={() => setShowCart(true)}
      >
        <i className="material-icons">shopping_cart</i>
        Cart ({cart.length})
      </button>

      {showCart && (
        <div className="cart-modal">
          <div className="cart-content">
            <h2>Shopping Cart</h2>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image_url} alt={item.name} />
                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p>SLL {item.price.toLocaleString()}</p>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <i className="material-icons">delete</i>
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>SLL {subtotal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>VAT (15%):</span>
                <span>SLL {vat.toLocaleString()}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>SLL {total.toLocaleString()}</span>
              </div>
            </div>

            <div className="checkout-form">
              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="africell">Africell Money</option>
                  <option value="orange">Orange Money</option>
                  <option value="pay_smoll_smoll">Pay Smoll Smoll</option>
                </select>
              </div>

              {paymentMethod === 'pay_smoll_smoll' && (
                <div className="form-group">
                  <label>Number of Installments</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} installments</option>
                    ))}
                  </select>
                  <p className="installment-info">
                    Each installment: SLL {(total / installments).toLocaleString()}
                  </p>
                </div>
              )}

              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Process Sale
              </button>
            </div>

            <button 
              className="close-cart-btn"
              onClick={() => setShowCart(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Sales Trend</h3>
          <div className="chart-container">
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
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="chart-card">
          <h3>Top Products</h3>
          <div className="chart-container">
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
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div className="recent-sales-section">
        <h2>Recent Sales Transactions</h2>
        <div className="recent-sales-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map(sale => (
                <tr key={sale.id}>
                  <td>{new Date(sale.created_at).toLocaleDateString()}</td>
                  <td>{sale.customer_name}</td>
                  <td>SLL {sale.amount.toLocaleString()}</td>
                  <td>
                    <span className={`payment-method ${sale.payment_method}`}>
                      {sale.payment_method === 'cash' ? 'Cash' :
                       sale.payment_method === 'africell' ? 'Africell Money' :
                       sale.payment_method === 'orange' ? 'Orange Money' :
                       'Pay Smoll Smoll'}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${sale.status || 'completed'}`}>
                      {sale.status || 'Completed'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="view-details-btn"
                      onClick={() => viewSaleDetails(sale)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showSaleDetails && selectedSale && (
        <div className="sale-details-modal">
          <div className="sale-details-content">
            <h2>Sale Details</h2>
            <div className="sale-info">
              <div className="info-row">
                <span>Date:</span>
                <span>{new Date(selectedSale.created_at).toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span>Customer:</span>
                <span>{selectedSale.customer_name}</span>
              </div>
              <div className="info-row">
                <span>Payment Method:</span>
                <span className={`payment-method ${selectedSale.payment_method}`}>
                  {selectedSale.payment_method === 'cash' ? 'Cash' :
                   selectedSale.payment_method === 'africell' ? 'Africell Money' :
                   selectedSale.payment_method === 'orange' ? 'Orange Money' :
                   'Pay Smoll Smoll'}
                </span>
              </div>
              {selectedSale.payment_method === 'pay_smoll_smoll' && (
                <>
                  <div className="info-row">
                    <span>Number of Installments:</span>
                    <span>{selectedSale.installments}</span>
                  </div>
                  <div className="info-row">
                    <span>Installment Amount:</span>
                    <span>SLL {selectedSale.installment_amount.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="info-row">
                <span>Subtotal:</span>
                <span>SLL {selectedSale.subtotal.toLocaleString()}</span>
              </div>
              <div className="info-row">
                <span>VAT (15%):</span>
                <span>SLL {selectedSale.vat.toLocaleString()}</span>
              </div>
              <div className="info-row total">
                <span>Total:</span>
                <span>SLL {selectedSale.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="sale-items">
              <h3>Items Purchased</h3>
              <div className="items-list">
                {selectedSale.items.map((item, index) => (
                  <div key={index} className="sale-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    <span className="item-price">SLL {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="close-details-btn"
              onClick={() => {
                setShowSaleDetails(false);
                setSelectedSale(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales; 