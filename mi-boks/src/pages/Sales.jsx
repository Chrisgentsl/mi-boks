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

const Sales = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [products, setProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
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
    fetchSalesData();
    fetchProducts();
  }, [timeRange]);

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
      setSalesData(data || []);

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
    </div>
  );
};

export default Sales; 