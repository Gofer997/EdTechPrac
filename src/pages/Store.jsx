import { useState, useEffect } from 'react';
import api from "../api.js";


const Store = () => {
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [balance, setBalance] = useState(null); 
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchItems = async () => {
    try {
      const response = await api.get('/shop/items/');
      setItems(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке товаров:', err);
      setError('Не удалось загрузить товары');
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/shop/my-purchases/');
      setPurchases(response.data);
    } catch (err) {
      console.error('Ошибка при загрузке покупок:', err);
      setError('Не удалось загрузить покупки');
    }
  };

  useEffect(() => {
    fetchItems();
    fetchPurchases();
  }, []);

  const handleBuy = async (itemId) => {
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/shop/buy/${itemId}/`);
      setMessage(response.data.message);
      setBalance(response.data.balance);
      fetchPurchases();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ошибка при покупке');
      }
    }
  };

  const handleActivate = async (purchaseId) => {
    setError('');
    setMessage('');
    try {
      const response = await api.post(`/shop/my-purchases/${purchaseId}/activate/`);
      setMessage(response.data.message);
      fetchPurchases();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Ошибка при активации');
      }
    }
  };

  return (
    <div>
      <h1>Магазин (Тест)</h1>

      {message && <div style={{ color: 'green' }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {balance !== null && <div>Ваш баланс: {balance} кристаллов</div>}

      <h2>Товары</h2>
      {items.length === 0 && <p>Нет доступных товаров</p>}
      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: '10px' }}>
            <strong>{item.name}</strong> ({item.item_type})<br />
            {item.description}<br />
            Цена: {item.price} кристаллов<br />
            Срок действия: {item.validity_days} дн.<br />
            <button onClick={() => handleBuy(item.id)}>Купить</button>
          </li>
        ))}
      </ul>

      <h2>Мои покупки</h2>
      {purchases.length === 0 && <p>У вас пока нет покупок</p>}
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id} style={{ marginBottom: '10px' }}>
            Товар: {purchase.item.name}<br />
            Статус: {purchase.status}<br />
            Код: {purchase.code}<br />
            Создана: {new Date(purchase.created_at).toLocaleString()}<br />
            {purchase.activated_at && <>Активирована: {new Date(purchase.activated_at).toLocaleString()}<br /></>}
            {purchase.expires_at && <>Истекает: {new Date(purchase.expires_at).toLocaleString()}<br /></>}
            {purchase.status === 'pending' && (
              <button onClick={() => handleActivate(purchase.id)}>Активировать</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};


export default Store
