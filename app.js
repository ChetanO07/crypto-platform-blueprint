class XtinExchange {
  constructor() {
    this.currentPage = 'homepage';
    this.tradingData = {
      'BTC-USDT': { price: 43250.50, change: 2.35, volume: '2.1B', high: 44120, low: 42380 },
      'ETH-USDT': { price: 2650.75, change: 1.89, volume: '890M', high: 2698, low: 2580 },
      'SOL-USDT': { price: 85.42, change: -0.85, volume: '125M', high: 87.5, low: 84.2 },
      'AVAX-USDT': { price: 24.83, change: 3.21, volume: '67M', high: 25.1, low: 23.9 }
    };
    
    this.orderBook = {
      asks: [
        { price: 43265.00, amount: 3.2, total: 7.5 },
        { price: 43260.00, amount: 1.8, total: 4.3 },
        { price: 43255.00, amount: 2.5, total: 2.5 }
      ],
      bids: [
        { price: 43245.00, amount: 1.9, total: 1.9 },
        { price: 43240.00, amount: 2.7, total: 4.6 },
        { price: 43235.00, amount: 1.4, total: 6.0 }
      ]
    };

    this.positions = [
      { symbol: 'BTC-USDT', size: 2.5, entry: 42850.25, mark: 43250.50, pnl: 1000.63 },
      { symbol: 'ETH-USDT', size: 1.0, entry: 2525.40, mark: 2650.75, pnl: 125.40 }
    ];

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupDropdowns();
    this.setupTabs();
    this.setupTradingInterface();
    this.setupMobileMenu();
    this.startPriceUpdates();
    this.setupOrderBook();
    this.setupFormInteractions();
    
    // Show homepage by default
    this.showPage('homepage');
  }

  setupNavigation() {
    // Handle logo click to go to homepage
    const logo = document.querySelector('.logo');
    if (logo) {
      logo.addEventListener('click', (e) => {
        e.preventDefault();
        this.showPage('homepage');
      });
      logo.style.cursor = 'pointer';
    }

    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const pageAttribute = e.target.getAttribute('data-page');
      if (pageAttribute) {
        e.preventDefault();
        this.showPage(pageAttribute);
      }

      // Handle dropdown menu navigation
      if (e.target.closest('.dropdown-menu a')) {
        e.preventDefault();
        const pageAttr = e.target.getAttribute('data-page');
        if (pageAttr) {
          this.showPage(pageAttr);
        }
      }

      // Handle nav-link clicks
      if (e.target.classList.contains('nav-link') && e.target.getAttribute('data-page')) {
        e.preventDefault();
        this.showPage(e.target.getAttribute('data-page'));
      }

      // Handle market row clicks in futures page
      if (e.target.closest('.table-row[data-symbol]')) {
        const symbol = e.target.closest('.table-row').getAttribute('data-symbol');
        this.showTradingPage(symbol);
      }

      // Handle trade button clicks
      if (e.target.classList.contains('trade-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const symbol = e.target.closest('.table-row').getAttribute('data-symbol');
        this.showTradingPage(symbol);
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.substring(1) || 'homepage';
      this.showPage(hash);
    });
  }

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageId;
      
      // Update URL without page reload
      history.pushState(null, null, `#${pageId}`);
      
      // Close any open dropdowns
      this.closeAllDropdowns();
      
      // Page-specific initialization
      if (pageId === 'trading') {
        this.initTradingPage();
      } else if (pageId === 'portfolio') {
        this.updatePortfolioStats();
      } else if (pageId === 'futures') {
        this.updateMarketsTable();
      }
    }
  }

  showTradingPage(symbol) {
    this.showPage('trading');
    this.updateTradingHeader(symbol);
  }

  setupDropdowns() {
    // Handle Markets dropdown
    const marketsDropdown = document.querySelector('.nav-dropdown');
    if (marketsDropdown) {
      const button = marketsDropdown.querySelector('button');
      const menu = marketsDropdown.querySelector('.dropdown-menu');
      
      if (button && menu) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          
          // Close other dropdowns
          document.querySelectorAll('.nav-dropdown').forEach(other => {
            if (other !== marketsDropdown) {
              other.classList.remove('open');
            }
          });
          
          marketsDropdown.classList.toggle('open');
        });
      }
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  }

  closeAllDropdowns() {
    document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
      dropdown.classList.remove('open');
    });
  }

  setupTabs() {
    document.addEventListener('click', (e) => {
      // Trading tabs
      if (e.target.classList.contains('tab-btn')) {
        const parent = e.target.parentElement;
        parent.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      }

      // Order type tabs (Buy/Sell)
      if (e.target.classList.contains('order-type-btn')) {
        const parent = e.target.parentElement;
        parent.querySelectorAll('.order-type-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Update submit button
        const submitBtn = document.querySelector('.order-submit-btn');
        if (submitBtn) {
          if (e.target.classList.contains('buy-btn')) {
            submitBtn.textContent = 'Buy BTC';
            submitBtn.className = 'order-submit-btn buy';
          } else {
            submitBtn.textContent = 'Sell BTC';
            submitBtn.className = 'order-submit-btn sell';
          }
        }
      }

      // Trading pair tabs
      if (e.target.classList.contains('trading-pair')) {
        document.querySelectorAll('.trading-pair').forEach(pair => pair.classList.remove('active'));
        e.target.classList.add('active');
        
        const symbol = e.target.textContent.replace('-PERP', '');
        this.updateTradingData(symbol);
      }

      // Market filter buttons
      if (e.target.classList.contains('filter-btn')) {
        const parent = e.target.parentElement;
        parent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
      }
    });
  }

  setupTradingInterface() {
    // Order form interactions
    const orderInputs = document.querySelectorAll('.order-inputs input');
    orderInputs.forEach(input => {
      input.addEventListener('input', this.calculateOrderTotal.bind(this));
    });

    // Order submission
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('order-submit-btn')) {
        this.submitOrder();
      }
    });
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenuBtn && navMenu) {
      let isMenuOpen = false;
      
      mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
          // Show mobile menu
          navMenu.style.display = 'flex';
          navMenu.style.position = 'absolute';
          navMenu.style.top = '64px';
          navMenu.style.left = '0';
          navMenu.style.right = '0';
          navMenu.style.background = '#0B0C14';
          navMenu.style.border = '1px solid #2D3748';
          navMenu.style.flexDirection = 'column';
          navMenu.style.padding = '16px';
          navMenu.style.zIndex = '999';
          navMenu.classList.add('mobile-open');
        } else {
          // Hide mobile menu
          navMenu.style.display = '';
          navMenu.style.position = '';
          navMenu.style.top = '';
          navMenu.style.left = '';
          navMenu.style.right = '';
          navMenu.style.background = '';
          navMenu.style.border = '';
          navMenu.style.flexDirection = '';
          navMenu.style.padding = '';
          navMenu.classList.remove('mobile-open');
        }
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', () => {
        if (isMenuOpen) {
          isMenuOpen = false;
          navMenu.style.display = '';
          navMenu.style.position = '';
          navMenu.style.top = '';
          navMenu.style.left = '';
          navMenu.style.right = '';
          navMenu.style.background = '';
          navMenu.style.border = '';
          navMenu.style.flexDirection = '';
          navMenu.style.padding = '';
          navMenu.classList.remove('mobile-open');
        }
      });
    }
  }

  startPriceUpdates() {
    // Simulate real-time price updates
    setInterval(() => {
      this.updatePrices();
      this.updateTicker();
      this.updateOrderBook();
    }, 2000);
  }

  updatePrices() {
    Object.keys(this.tradingData).forEach(symbol => {
      const data = this.tradingData[symbol];
      
      // Random price fluctuation (-0.5% to +0.5%)
      const fluctuation = (Math.random() - 0.5) * 0.01;
      data.price = Math.round((data.price * (1 + fluctuation)) * 100) / 100;
      
      // Update change percentage
      data.change = (Math.random() - 0.5) * 10; // -5% to +5%
    });
  }

  updateTicker() {
    const tickerItems = document.querySelectorAll('.ticker-item');
    
    tickerItems.forEach((item, index) => {
      const symbols = Object.keys(this.tradingData);
      if (symbols[index]) {
        const symbol = symbols[index];
        const data = this.tradingData[symbol];
        
        const priceElement = item.querySelector('.price');
        const changeElement = item.querySelector('.change');
        
        if (priceElement) {
          priceElement.textContent = `$${data.price.toLocaleString()}`;
          priceElement.className = `price ${data.change >= 0 ? 'positive' : 'negative'}`;
        }
        
        if (changeElement) {
          changeElement.textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
          changeElement.className = `change ${data.change >= 0 ? 'positive' : 'negative'}`;
        }
      }
    });
  }

  setupOrderBook() {
    // Update order book with live data
    setInterval(() => {
      this.simulateOrderBookUpdates();
      this.renderOrderBook();
    }, 1000);
  }

  simulateOrderBookUpdates() {
    // Simulate order book changes
    this.orderBook.asks.forEach(order => {
      order.amount += (Math.random() - 0.5) * 0.5;
      order.amount = Math.max(0.1, Math.round(order.amount * 10) / 10);
      order.price += (Math.random() - 0.5) * 2;
      order.price = Math.round(order.price * 100) / 100;
    });

    this.orderBook.bids.forEach(order => {
      order.amount += (Math.random() - 0.5) * 0.5;
      order.amount = Math.max(0.1, Math.round(order.amount * 10) / 10);
      order.price += (Math.random() - 0.5) * 2;
      order.price = Math.round(order.price * 100) / 100;
    });
  }

  renderOrderBook() {
    const asksContainer = document.querySelector('.asks');
    const bidsContainer = document.querySelector('.bids');
    
    if (asksContainer) {
      asksContainer.innerHTML = this.orderBook.asks.map(order => `
        <div class="order-row ask">
          <span class="price">${order.price.toLocaleString()}</span>
          <span class="amount">${order.amount}</span>
          <span class="total">${order.total}</span>
        </div>
      `).join('');
    }

    if (bidsContainer) {
      bidsContainer.innerHTML = this.orderBook.bids.map(order => `
        <div class="order-row bid">
          <span class="price">${order.price.toLocaleString()}</span>
          <span class="amount">${order.amount}</span>
          <span class="total">${order.total}</span>
        </div>
      `).join('');
    }
  }

  calculateOrderTotal() {
    const priceInput = document.querySelector('.order-inputs input[placeholder*="43,250"]');
    const amountInput = document.querySelector('.order-inputs input[placeholder*="0.001"]');
    const totalInput = document.querySelector('.order-inputs input[placeholder*="43.25"]');

    if (priceInput && amountInput && totalInput) {
      const price = parseFloat(priceInput.value) || 0;
      const amount = parseFloat(amountInput.value) || 0;
      const total = price * amount;
      
      if (total > 0) {
        totalInput.value = total.toFixed(2);
      }
    }
  }

  submitOrder() {
    // Simulate order submission
    const isActive = document.querySelector('.order-type-btn.buy-btn.active');
    const side = isActive ? 'Buy' : 'Sell';
    
    // Show success message
    this.showNotification(`${side} order submitted successfully!`, 'success');
    
    // Clear form
    document.querySelectorAll('.order-inputs input').forEach(input => {
      input.value = '';
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: ${type === 'success' ? '#00D4AA' : '#6C5CE7'};
      color: #0B0C14;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  updateTradingHeader(symbol) {
    const tradingPairs = document.querySelectorAll('.trading-pair');
    const tradingStats = document.querySelector('.trading-stats');
    
    // Update active trading pair
    tradingPairs.forEach(pair => pair.classList.remove('active'));
    const targetPair = Array.from(tradingPairs).find(pair => 
      pair.textContent.includes(symbol)
    );
    if (targetPair) {
      targetPair.classList.add('active');
    }
    
    // Update trading stats
    if (tradingStats && this.tradingData[symbol]) {
      const data = this.tradingData[symbol];
      const changeClass = data.change >= 0 ? 'positive' : 'negative';
      tradingStats.innerHTML = `
        <span class="stat">Last: <span class="price ${changeClass}">$${data.price.toLocaleString()}</span></span>
        <span class="stat">24h: <span class="${changeClass}">${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%</span></span>
        <span class="stat">Volume: ${data.volume}</span>
      `;
    }
  }

  updateTradingData(symbol) {
    if (this.tradingData[symbol]) {
      this.updateTradingHeader(symbol);
    }
  }

  initTradingPage() {
    this.renderOrderBook();
    this.updateTradingHeader('BTC-USDT');
    this.updatePositionsTable();
  }

  updatePortfolioStats() {
    // Calculate portfolio statistics
    let totalPnL = 0;
    this.positions.forEach(position => {
      totalPnL += position.pnl;
    });

    const statCards = document.querySelectorAll('.stat-card .value');
    if (statCards.length >= 4) {
      // Update unrealized P&L with calculated value
      statCards[3].textContent = `+$${totalPnL.toFixed(2)}`;
      statCards[3].className = `value ${totalPnL >= 0 ? 'positive' : 'negative'}`;
    }
  }

  updatePositionsTable() {
    const positionsTable = document.querySelector('.positions-table');
    if (positionsTable && this.currentPage === 'trading') {
      // Find table body area (skip header)
      const existingRows = positionsTable.querySelectorAll('.table-row');
      
      // Clear existing rows (keep header)
      existingRows.forEach(row => {
        if (!row.classList.contains('table-header')) {
          row.remove();
        }
      });
      
      // Add position rows
      this.positions.forEach(position => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
          <span>${position.symbol}</span>
          <span>${position.size}</span>
          <span>$${position.entry.toLocaleString()}</span>
          <span>$${position.mark.toLocaleString()}</span>
          <span class="${position.pnl >= 0 ? 'positive' : 'negative'}">
            ${position.pnl >= 0 ? '+' : ''}$${position.pnl.toFixed(2)}
          </span>
        `;
        positionsTable.appendChild(row);
      });
    }
  }

  setupFormInteractions() {
    // KYC form interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('upload-btn')) {
        e.preventDefault();
        this.simulateFileUpload(e.target);
      }
    });

    // Form input validations
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('form-input')) {
        this.validateInput(e.target);
      }
    });
  }

  simulateFileUpload(button) {
    button.textContent = 'Uploading...';
    button.disabled = true;
    
    setTimeout(() => {
      button.textContent = 'Uploaded ✓';
      button.style.background = '#00D4AA';
      this.showNotification('Document uploaded successfully!', 'success');
    }, 2000);
  }

  validateInput(input) {
    // Basic validation for different input types
    let isValid = true;
    
    if (input.type === 'number' && input.value) {
      isValid = !isNaN(parseFloat(input.value)) && isFinite(input.value);
    }
    
    if (input.placeholder && input.placeholder.includes('PAN')) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      isValid = panRegex.test(input.value.toUpperCase());
    }
    
    if (input.placeholder && input.placeholder.includes('IFSC')) {
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      isValid = ifscRegex.test(input.value.toUpperCase());
    }
    
    // Visual feedback
    input.style.borderColor = isValid ? '#2D3748' : '#FF4757';
  }

  // Market data simulation for futures page
  updateMarketsTable() {
    const tableRows = document.querySelectorAll('#futures .table-row');
    
    tableRows.forEach(row => {
      const symbol = row.getAttribute('data-symbol');
      if (this.tradingData[symbol]) {
        const data = this.tradingData[symbol];
        const priceCell = row.querySelector('.price');
        const changeCell = row.querySelector('.change');
        
        if (priceCell) {
          priceCell.textContent = `$${data.price.toLocaleString()}`;
        }
        
        if (changeCell) {
          changeCell.textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
          changeCell.className = `change ${data.change >= 0 ? 'positive' : 'negative'}`;
        }
      }
    });
  }

  // Start markets table updates
  startMarketsUpdates() {
    setInterval(() => {
      if (this.currentPage === 'futures') {
        this.updateMarketsTable();
      }
    }, 3000);
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new XtinExchange();
  
  // Start additional updates
  app.startMarketsUpdates();
  
  // Handle initial page load from URL hash
  const initialHash = window.location.hash.substring(1);
  if (initialHash && initialHash !== 'homepage') {
    app.showPage(initialHash);
  }
});
