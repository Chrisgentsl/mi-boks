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

const Sales = () => {
  const [salesData, setSalesData] = useState([]);
  const [products, setProducts] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
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
            <p className="stat-value">SLL {stats.totalSales.toLocaleString()}</p>
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
            <p className="stat-value">SLL {stats.averageOrder.toLocaleString()}</p>
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
                <p className="product-price">SLL {product.price.toLocaleString()}</p>
                <p className="product-quantity">Available: {product.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

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
                  <td>SLL {sale.amount.toLocaleString()}</td>
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