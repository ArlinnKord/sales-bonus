function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;

  const place = index + 1;

  if (place === 1) {
    return profit * 0.15;
  } else if (place === 2 || place === 3) {
    return profit * 0.1;
  } else if (place < total) {
    return profit * 0.05;
  } else {
    return 0;
  }
}

function calculateSimpleRevenue(purchase, _product) {
  const discount = purchase.items[0].discount;
  const sale_price = purchase.items[0].sale_price;
  const quantity = purchase.items[0].quantity;
  const revenue = sale_price * quantity * (1 - discount / 100);
  return revenue;
}

function analyzeSalesData(data, options) {
  if (!data || !data.sellers || !data.products || !data.purchase_records) {
    throw new Error("Invalid data structure");
  }

  if (!options || !options.calculateRevenue || !options.calculateBonus) {
    throw new Error(
      "Options with calculateRevenue and calculateBonus are required"
    );
  }

  const { calculateRevenue, calculateBonus } = options;

  const sellersMap = {};
  data.sellers.forEach((seller) => {
    sellersMap[seller.id] = seller;
  });

  const productsMap = {};
  data.products.forEach((product) => {
    productsMap[product.sku] = product;
  });

  const sellersStats = {};
  data.sellers.forEach((seller) => {
    sellersStats[seller.id] = {
      seller_id: seller.id,
      name: `${seller.first_name} ${seller.last_name}`,
      revenue: 0,
      profit: 0,
      sales_count: 0,
      products_count: {},
    };
  });

  data.purchase_records.forEach((receipt) => {
    const seller = sellersStats[receipt.seller_id];
    if (!seller) return;

    seller.sales_count++;

    receipt.items.forEach((item) => {
      const product = productsMap[item.sku];
      if (!product) return;

      const revenue = calculateRevenue({ items: [item] }, product);
      const profit = revenue - product.purchase_price * item.quantity;

      seller.revenue += revenue;
      seller.profit += profit;

      seller.products_count[item.sku] =
        (seller.products_count[item.sku] || 0) + item.quantity;
    });
  });

  const sortedSellers = Object.values(sellersStats).sort(
    (a, b) => b.profit - a.profit
  );

  const totalSellers = sortedSellers.length;
  sortedSellers.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, totalSellers, seller);

    const topProducts = Object.entries(seller.products_count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sku, quantity]) => ({ sku, quantity }));

    seller.top_products = topProducts;
    delete seller.products_count;
  });

  return sortedSellers;
}
